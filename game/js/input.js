// Ember & Thyme — mouse and keyboard.
// The game is played with clicks first: pick an ingredient, drop it on a
// station, chop, grill, plate, serve. Keys 1-8, C, F, S and T do the same
// for players who prefer the keyboard.

import { INGREDIENTS } from './recipes.js';
import { LAYOUT, addToPlate, chopBoard, clearStation, flipGrill, grillState, liftPlate, pickIngredient, placeInFryer, placeOnBoard, placeOnGrill, serveOrder, takeFromFryer, takeFromGrill, trashHand, trashPlate } from './state.js';

function inside(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function orderTicketAt(state, x, y) {
  const b = LAYOUT.orderBoard;
  for (let i = 0; i < state.orders.length; i++) {
    const ty = b.y + 48 + i * 112;
    if (inside(x, y, { x: b.x + 10, y: ty, w: b.w - 20, h: 102 })) {
      return state.orders[i];
    }
  }
  return null;
}

export function handleClick(state, x, y, sfx) {
  if (state.status !== 'playing') return;

  // An order ticket is the serve target when carrying a finished plate.
  const ticket = orderTicketAt(state, x, y);
  if (ticket) {
    if (serveOrder(state, ticket.id)) sfx('serve');
    else if (state.heldPlate) sfx('error');
    return;
  }

  if (inside(x, y, LAYOUT.board)) {
    if (state.board) {
      if (chopBoard(state)) sfx('chop');
    } else if (placeOnBoard(state)) {
      sfx('pick');
    } else {
      sfx('error');
    }
    return;
  }

  if (inside(x, y, LAYOUT.grill)) {
    const r = LAYOUT.grill;
    const slotIndex = x < r.x + r.w / 2 ? 0 : 1;
    if (state.hand) {
      if (placeOnGrill(state)) sfx('sizzle');
      else sfx('error');
    } else if (state.grill[slotIndex]) {
      // A burnt item is binned with one click instead of a key press.
      if (grillState(state.grill[slotIndex]) === 'burnt' && clearStation(state, 'grill')) {
        sfx('bin');
      } else if (takeFromGrill(state, slotIndex)) {
        sfx('pick');
      } else if (flipGrill(state, slotIndex)) {
        sfx('flip');
      } else {
        sfx('error');
      }
    }
    return;
  }

  if (inside(x, y, LAYOUT.fryer)) {
    if (state.hand) {
      if (placeInFryer(state)) sfx('sizzle');
      else sfx('error');
    } else if (takeFromFryer(state)) {
      sfx('pick');
    } else if (state.fryer && clearStation(state, 'fryer')) {
      // A burnt basket is binned with one click, like a burnt grill item.
      sfx('bin');
    } else {
      sfx('error');
    }
    return;
  }

  if (inside(x, y, LAYOUT.plate)) {
    if (state.heldPlate) {
      sfx('error');
    } else if (state.hand) {
      if (addToPlate(state)) sfx('pick');
      else sfx('error');
    } else if (liftPlate(state)) {
      sfx('pick');
    } else {
      sfx('error');
    }
    return;
  }

  if (inside(x, y, LAYOUT.trash)) {
    if (trashHand(state) || trashPlate(state)) sfx('bin');
    else sfx('error');
    return;
  }

  if (inside(x, y, LAYOUT.counter)) {
    const b = LAYOUT.counter;
    const binW = (b.w - 32) / INGREDIENTS.length;
    const i = Math.floor((x - b.x - 16) / binW);
    if (i >= 0 && i < INGREDIENTS.length) {
      if (pickIngredient(state, INGREDIENTS[i].id)) sfx('pick');
      else sfx('error');
    }
    return;
  }
}

export function handleKey(state, key, sfx) {
  if (state.status !== 'playing') return;
  const lower = key.toLowerCase();
  const byKey = INGREDIENTS.find((ing) => ing.key === lower);
  if (byKey) {
    if (pickIngredient(state, byKey.id)) sfx('pick');
    else sfx('error');
    return;
  }
  if (lower === 'c') {
    if (chopBoard(state)) sfx('chop');
    else sfx('error');
  } else if (lower === 'f') {
    const idx = state.grill.findIndex((s) => s !== null);
    if (idx >= 0 && flipGrill(state, idx)) sfx('flip');
    else sfx('error');
  } else if (lower === 's') {
    if (!state.heldPlate && liftPlate(state)) {
      sfx('pick');
      return;
    }
    const order = state.orders.find((o) => o.dishId === state.heldPlate);
    if (order && serveOrder(state, order.id)) sfx('serve');
    else sfx('error');
  } else if (lower === 't') {
    if (trashHand(state) || trashPlate(state)) sfx('bin');
    else sfx('error');
  } else if (lower === 'b') {
    if (clearStation(state, 'board') || clearStation(state, 'grill') || clearStation(state, 'fryer')) sfx('bin');
    else sfx('error');
  }
}
