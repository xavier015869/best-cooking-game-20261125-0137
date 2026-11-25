// Ember & Thyme — game state and the rules that move it.
// One shift lasts 180 seconds. Orders arrive on the board, lose patience,
// and pay coins plus a tip that shrinks as they wait. Reach the coin target
// before the shift timer runs out to win the shift.

import { DISHES, DISH_BY_ID, INGREDIENT_BY_ID, matchDish } from './recipes.js';

export const SHIFT_SECONDS = 180;
export const TARGET_COINS = 120;
export const STAR_THRESHOLDS = [120, 160, 200];
export const MAX_ORDERS = 4;
export const CHOPS_PER_ITEM = 3;
export const GRILL_COOK_SECONDS = 6;
export const GRILL_BURN_SECONDS = 12;
export const FRY_COOK_SECONDS = 8;
export const FRY_BURN_SECONDS = 12;
export const COMBO_WINDOW_SECONDS = 8;

// Fixed layout of the 1280x800 kitchen, in canvas pixels. draw.js paints
// from these rects and input.js hit-tests against them.
export const LAYOUT = {
  width: 1280,
  height: 800,
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  orderBoard: { x: 16, y: 80, w: 288, h: 500 },
  board: { x: 336, y: 92, w: 300, h: 150 },
  grill: { x: 656, y: 92, w: 300, h: 150 },
  fryer: { x: 336, y: 262, w: 300, h: 150 },
  plate: { x: 656, y: 262, w: 300, h: 150 },
  pass: { x: 992, y: 80, w: 272, h: 332 },
  trash: { x: 992, y: 428, w: 272, h: 152 },
  counter: { x: 16, y: 604, w: 1248, h: 180 },
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGame(seed = 1) {
  const rand = mulberry32(seed);
  return {
    seed,
    rand,
    status: 'playing', // 'playing' | 'won' | 'lost'
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    served: 0,
    combo: 0,
    comboTimer: 0,
    nextOrderIn: 2,
    orderSeq: 0,
    orders: [],
    board: null, // { kind, chopsLeft } on the chopping board
    grill: [null, null], // { kind, t } per slot
    fryer: null, // { kind, t }
    plate: [], // finished ingredient ids on the plating counter
    hand: null, // ingredient id in the player's hand, or null
    handReady: false, // true once the held item finished its prep (chopped,
    // grilled or fried) — only a ready item can go on a plate, and a ready
    // item can never be prepped a second time
    heldPlate: null, // dish id of a finished plate being carried, or null
    messages: [], // { text, t } floating notices
    rush: 1,
  };
}

export function spawnOrder(state) {
  const dish = DISHES[Math.floor(state.rand() * DISHES.length)];
  const patience = 45 + state.rand() * 10;
  state.orderSeq += 1;
  state.orders.push({
    id: state.orderSeq,
    dishId: dish.id,
    patience,
    maxPatience: patience,
  });
}

function orderInterval(state) {
  // Orders arrive faster as the shift wears on: 14s early, ~8s in the rush.
  const progress = 1 - state.timeLeft / SHIFT_SECONDS;
  return 14 - 6 * progress;
}

export function update(state, dt) {
  if (state.status !== 'playing') return;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, state.timeLeft - dt);
  state.rush = 1 + (1 - state.timeLeft / SHIFT_SECONDS) * 2;

  // Orders arrive, up to the board's capacity. None spawns in the last
  // ten seconds: a fresh order could never be served before the shift ends.
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0 && state.orders.length < MAX_ORDERS && state.timeLeft > 10) {
    spawnOrder(state);
    state.nextOrderIn = orderInterval(state);
  }

  // Patience drains; an order that runs out walks out unpaid.
  for (const order of [...state.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) {
      state.orders = state.orders.filter((o) => o !== order);
      state.combo = 0;
      state.messages.push({ text: `Order #${order.id} walked out!`, t: 2, kind: 'bad' });
    }
  }

  // Grill and fryer cook while they hold something.
  for (const slot of state.grill) {
    if (slot) slot.t += dt;
  }
  if (state.fryer) state.fryer.t += dt;

  // The combo window decays between serves.
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }

  for (const msg of state.messages) msg.t -= dt;
  state.messages = state.messages.filter((m) => m.t > 0);

  if (state.timeLeft <= 0) {
    state.status = state.coins >= TARGET_COINS ? 'won' : 'lost';
  }
}

export function grillState(slot) {
  if (!slot) return 'empty';
  if (slot.t >= GRILL_BURN_SECONDS) return 'burnt';
  if (slot.t >= GRILL_COOK_SECONDS) return 'done';
  return 'cooking';
}

export function fryerState(fryer) {
  if (!fryer) return 'empty';
  if (fryer.t >= FRY_BURN_SECONDS) return 'burnt';
  if (fryer.t >= FRY_COOK_SECONDS) return 'done';
  return 'cooking';
}

// --- Player actions. Each returns true when it did something. -----------

export function pickIngredient(state, id) {
  if (state.hand || state.heldPlate) return false;
  if (!INGREDIENT_BY_ID[id]) return false;
  state.hand = id;
  // An ingredient that needs no prep is ready the moment it is picked up.
  state.handReady = INGREDIENT_BY_ID[id].prep === 'none';
  return true;
}

export function placeOnBoard(state) {
  if (!state.hand || state.handReady || state.board) return false;
  const prep = INGREDIENT_BY_ID[state.hand].prep;
  if (prep !== 'chop') return false;
  state.board = { kind: state.hand, chopsLeft: CHOPS_PER_ITEM };
  state.hand = null;
  state.handReady = false;
  return true;
}

export function chopBoard(state) {
  if (!state.board) return false;
  state.board.chopsLeft -= 1;
  if (state.board.chopsLeft <= 0) {
    state.hand = state.board.kind;
    state.handReady = true;
    state.board = null;
  }
  return true;
}

export function placeOnGrill(state) {
  if (!state.hand || state.handReady) return false;
  if (INGREDIENT_BY_ID[state.hand].prep !== 'grill') return false;
  const slot = state.grill.findIndex((s) => s === null);
  if (slot < 0) return false;
  state.grill[slot] = { kind: state.hand, t: 0 };
  state.hand = null;
  state.handReady = false;
  return true;
}

export function takeFromGrill(state, slotIndex) {
  const slot = state.grill[slotIndex];
  if (!slot || state.hand || state.heldPlate) return false;
  if (grillState(slot) === 'burnt') return false;
  if (grillState(slot) !== 'done') return false;
  state.hand = slot.kind;
  state.handReady = true;
  state.grill[slotIndex] = null;
  return true;
}

export function flipGrill(state, slotIndex) {
  // Flipping is pure theatre with a purpose: it resets the burn clock a
  // little, so a watched patty survives the rush. Only a cooking item flips.
  const slot = state.grill[slotIndex];
  if (!slot || grillState(slot) !== 'cooking') return false;
  slot.t = Math.max(0, slot.t - 2);
  return true;
}

export function placeInFryer(state) {
  if (!state.hand || state.handReady || state.fryer) return false;
  if (INGREDIENT_BY_ID[state.hand].prep !== 'fry') return false;
  state.fryer = { kind: state.hand, t: 0 };
  state.hand = null;
  state.handReady = false;
  return true;
}

export function takeFromFryer(state) {
  if (!state.fryer || state.hand || state.heldPlate) return false;
  if (fryerState(state.fryer) !== 'done') return false;
  state.hand = state.fryer.kind;
  state.handReady = true;
  state.fryer = null;
  return true;
}

export function addToPlate(state) {
  if (!state.hand || !state.handReady) return false;
  // Only a finished item goes on a plate: raw grill/fry items and
  // unchopped items are refused here, never silently plated raw.
  if (state.plate.includes(state.hand)) return false;
  state.plate.push(state.hand);
  state.hand = null;
  state.handReady = false;
  return true;
}

export function liftPlate(state) {
  // Pick up a finished plate to carry it to an order.
  const dish = matchDish(state.plate);
  if (!dish || state.hand || state.heldPlate) return false;
  state.heldPlate = dish.id;
  state.plate = [];
  return true;
}

export function serveOrder(state, orderId) {
  if (!state.heldPlate) return false;
  const order = state.orders.find((o) => o.id === orderId);
  if (!order || order.dishId !== state.heldPlate) return false;
  const dish = DISH_BY_ID[order.dishId];
  const tip = Math.round(dish.price * 0.5 * (order.patience / order.maxPatience));
  const comboBonus = state.combo > 0 ? state.combo * 2 : 0;
  const earned = dish.price + tip + comboBonus;
  state.coins += earned;
  state.served += 1;
  state.combo += 1;
  state.comboTimer = COMBO_WINDOW_SECONDS;
  state.orders = state.orders.filter((o) => o !== order);
  state.heldPlate = null;
  state.messages.push({ text: `+${earned} coins — ${dish.name}!`, t: 2, kind: 'good' });
  return true;
}

export function trashHand(state) {
  if (!state.hand && !state.heldPlate) return false;
  if (state.hand) {
    state.hand = null;
    state.handReady = false;
  }
  if (state.heldPlate) {
    state.heldPlate = null;
    state.messages.push({ text: 'Plate binned. Ouch.', t: 2, kind: 'bad' });
  }
  return true;
}

export function trashPlate(state) {
  if (state.plate.length === 0) return false;
  state.plate = [];
  state.messages.push({ text: 'Plate cleared.', t: 2, kind: 'bad' });
  return true;
}

export function clearStation(state, which) {
  if (which === 'board') {
    if (!state.board) return false;
    state.board = null;
    return true;
  }
  if (which === 'grill') {
    let cleared = false;
    state.grill = state.grill.map((slot) => {
      if (slot && grillState(slot) === 'burnt') { cleared = true; return null; }
      return slot;
    });
    return cleared;
  }
  if (which === 'fryer') {
    if (!state.fryer || fryerState(state.fryer) !== 'burnt') return false;
    state.fryer = null;
    return true;
  }
  return false;
}

export function starsEarned(state) {
  return STAR_THRESHOLDS.filter((t) => state.coins >= t).length;
}
