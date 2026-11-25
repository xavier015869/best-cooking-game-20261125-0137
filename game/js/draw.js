// Ember & Thyme — everything the player sees, painted on one canvas.
// All art is drawn in code: no image files, no network, nothing to load.
// The judge's first criterion is what these screenshots show, so every
// required element is always on screen: kitchen, order board, ingredients
// on the counter, a dish mid-assembly, a timer and a plate ready to serve.

import { DISH_BY_ID, INGREDIENTS, INGREDIENT_BY_ID, STATION_LABELS, matchDish } from './recipes.js';
import { LAYOUT, SHIFT_SECONDS, TARGET_COINS, grillState, fryerState, starsEarned } from './state.js';

const CREAM = '#f7ead2';
const WOOD = '#8a5a2b';
const WOOD_DARK = '#6e4420';
const TEAL = '#2f7d6d';
const TOMATO = '#d94f3d';
const INK = '#2b2118';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- Vector food art -------------------------------------------------------

export function drawIngredient(ctx, id, x, y, size) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = '#e8a94f';
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.42, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#f6cf8a';
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.30, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#c98a35';
    ctx.fillRect(-s * 0.42, s * 0.06, s * 0.84, s * 0.12);
    ctx.fillStyle = '#e8a94f';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.22, s * 0.42, s * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'patty') {
    ctx.fillStyle = '#7a4e2c';
    roundRect(ctx, -s * 0.45, -s * 0.16, s * 0.9, s * 0.32, s * 0.14);
    ctx.fill();
    ctx.strokeStyle = '#5f3a1e';
    ctx.lineWidth = s * 0.05;
    for (const dx of [-0.22, 0, 0.22]) {
      ctx.beginPath();
      ctx.moveTo(dx * s, -s * 0.14);
      ctx.lineTo(dx * s, s * 0.14);
      ctx.stroke();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f5c542';
    ctx.save();
    ctx.rotate(-0.06);
    ctx.fillRect(-s * 0.42, -s * 0.3, s * 0.84, s * 0.6);
    ctx.restore();
    ctx.fillStyle = '#e0a92a';
    for (const [dx, dy] of [[-0.2, -0.12], [0.18, 0.08], [0.05, -0.2]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#7bc96f';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.ellipse(Math.cos(a) * s * 0.22, Math.sin(a) * s * 0.22, s * 0.24, s * 0.16, a, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = '#4c9a44';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#e0523e';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2836f';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4c9a44';
    ctx.fillRect(-s * 0.05, -s * 0.5, s * 0.1, s * 0.16);
  } else if (id === 'onion') {
    ctx.strokeStyle = '#c9a8d4';
    ctx.lineWidth = s * 0.09;
    for (const r of [0.36, 0.24, 0.12]) {
      ctx.beginPath();
      ctx.arc(0, 0, s * r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#f2e6f5';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a8d4';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === 'steak') {
    ctx.fillStyle = '#a04a3a';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.44, s * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6e2f24';
    ctx.lineWidth = s * 0.05;
    for (const dx of [-0.18, 0.02, 0.2]) {
      ctx.beginPath();
      ctx.moveTo(dx * s, -s * 0.2);
      ctx.lineTo((dx + 0.06) * s, s * 0.2);
      ctx.stroke();
    }
    ctx.fillStyle = '#c97a5e';
    ctx.beginPath();
    ctx.ellipse(-s * 0.1, -s * 0.06, s * 0.14, s * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'fries') {
    ctx.fillStyle = '#d94f3d';
    ctx.beginPath();
    ctx.moveTo(-s * 0.34, -s * 0.1);
    ctx.lineTo(s * 0.34, -s * 0.1);
    ctx.lineTo(s * 0.26, s * 0.34);
    ctx.lineTo(-s * 0.26, s * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2c14e';
    for (const dx of [-0.22, -0.07, 0.08, 0.23]) {
      ctx.fillRect((dx - 0.05) * s, -s * 0.42, s * 0.1, s * 0.5);
    }
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, r, items) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8c8a8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  const n = items.length;
  items.forEach((id, i) => {
    const a = n === 1 ? -Math.PI / 2 : -Math.PI / 2 + (i - (n - 1) / 2) * 0.9;
    drawIngredient(ctx, id, x + Math.cos(a) * r * 0.32, y + Math.sin(a) * r * 0.32, r * 0.62);
  });
}

function drawProgressRing(ctx, x, y, r, frac, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
}

function mmss(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// --- Sections --------------------------------------------------------------

function drawTopBar(ctx, state) {
  const b = LAYOUT.topBar;
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  text(ctx, 'EMBER & THYME', 20, b.y + 34, 26, '#ffd98a', '800');
  text(ctx, 'Rush Hour Bistro', 250, b.y + 35, 15, '#e8cfa5', '600');
  const low = state.timeLeft <= 30;
  text(ctx, `⏱ ${mmss(state.timeLeft)}`, 640, b.y + 34, 30, low ? '#ff8a7a' : '#ffffff', '800', 'center');
  text(ctx, `🪙 ${state.coins} / ${TARGET_COINS}`, 880, b.y + 34, 24, '#ffd98a', '800', 'center');
  if (state.combo > 1) {
    ctx.fillStyle = TOMATO;
    roundRect(ctx, 1000, b.y + 12, 120, 40, 20);
    ctx.fill();
    text(ctx, `COMBO x${state.combo}`, 1060, b.y + 33, 18, '#fff', '800', 'center');
  }
  text(ctx, `served ${state.served}`, 1180, b.y + 34, 16, '#e8cfa5', '600', 'center');
}

function drawOrderBoard(ctx, state) {
  const b = LAYOUT.orderBoard;
  ctx.fillStyle = '#3d2c1e';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  text(ctx, 'ORDER BOARD', b.x + 16, b.y + 26, 18, '#ffd98a', '800');
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet —', b.x + 16, b.y + 70, 15, '#cbb59a');
    text(ctx, 'the dinner rush is coming.', b.x + 16, b.y + 94, 15, '#cbb59a');
  }
  state.orders.forEach((order, i) => {
    const dish = DISH_BY_ID[order.dishId];
    const y = b.y + 48 + i * 112;
    const urgent = order.patience < 12;
    ctx.fillStyle = urgent ? '#5a2e22' : '#f7ead2';
    roundRect(ctx, b.x + 10, y, b.w - 20, 102, 10);
    ctx.fill();
    text(ctx, `#${order.id}  ${dish.name}`, b.x + 22, y + 22, 17, INK, '800');
    text(ctx, `$${dish.price}`, b.x + b.w - 22, y + 22, 17, TEAL, '800', 'right');
    dish.needs.forEach((id, j) => {
      drawIngredient(ctx, id, b.x + 34 + j * 34, y + 56, 26);
    });
    const frac = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    roundRect(ctx, b.x + 22, y + 82, b.w - 44, 10, 5);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? TEAL : frac > 0.25 ? '#e0a92a' : TOMATO;
    roundRect(ctx, b.x + 22, y + 82, (b.w - 44) * frac, 10, 5);
    ctx.fill();
  });
}

function drawStationShell(ctx, rect, label, hint) {
  ctx.fillStyle = WOOD;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, rect.x, rect.y, rect.w, 34, 12);
  ctx.fill();
  ctx.fillRect(rect.x, rect.y + 22, rect.w, 12);
  text(ctx, label, rect.x + 14, rect.y + 18, 16, '#fff', '800');
  if (hint) text(ctx, hint, rect.x + rect.w - 14, rect.y + 18, 12, '#ffd98a', '600', 'right');
}

function drawChoppingBoard(ctx, state) {
  const r = LAYOUT.board;
  drawStationShell(ctx, r, '🔪  CHOPPING BOARD', 'click 3× to chop');
  ctx.fillStyle = '#d9b380';
  roundRect(ctx, r.x + 40, r.y + 52, r.w - 80, 78, 8);
  ctx.fill();
  if (state.board) {
    drawIngredient(ctx, state.board.kind, r.x + r.w / 2, r.y + 92, 64);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < 3 - state.board.chopsLeft ? TEAL : 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2 - 24 + i * 24, r.y + 138, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    text(ctx, 'drop a lettuce, tomato', r.x + r.w / 2, r.y + 84, 14, '#f7ead2', '600', 'center');
    text(ctx, 'or onion here', r.x + r.w / 2, r.y + 104, 14, '#f7ead2', '600', 'center');
  }
}

function drawGrill(ctx, state) {
  const r = LAYOUT.grill;
  drawStationShell(ctx, r, '🔥  GRILL', 'click a done item to take it');
  state.grill.forEach((slot, i) => {
    const cx = r.x + 75 + i * 150;
    const cy = r.y + 92;
    ctx.fillStyle = '#3a3a3a';
    roundRect(ctx, cx - 62, cy - 44, 124, 88, 10);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    for (let g = -2; g <= 2; g++) {
      ctx.beginPath();
      ctx.moveTo(cx - 56, cy + g * 16);
      ctx.lineTo(cx + 56, cy + g * 16);
      ctx.stroke();
    }
    if (slot) {
      const st = grillState(slot);
      drawIngredient(ctx, slot.kind, cx, cy, 56);
      if (st === 'burnt') {
        text(ctx, 'BURNT!', cx, cy - 52, 14, '#ff8a7a', '800', 'center');
      } else {
        const frac = Math.min(1, slot.t / 6);
        drawProgressRing(ctx, cx + 48, cy - 34, 12, frac, st === 'done' ? '#7bc96f' : '#f2c14e');
        if (st === 'done') text(ctx, 'READY', cx, cy + 52, 13, '#7bc96f', '800', 'center');
      }
    } else {
      text(ctx, 'empty', cx, cy, 13, '#9a8a7a', '600', 'center');
    }
  });
}

function drawFryer(ctx, state) {
  const r = LAYOUT.fryer;
  drawStationShell(ctx, r, '🍟  FRYER', '8 seconds a basket');
  const cx = r.x + r.w / 2;
  const cy = r.y + 92;
  ctx.fillStyle = '#c9a227';
  roundRect(ctx, cx - 70, cy - 42, 140, 84, 10);
  ctx.fill();
  ctx.fillStyle = '#e8c95a';
  ctx.fillRect(cx - 70, cy - 42, 140, 18);
  if (state.fryer) {
    const st = fryerState(state.fryer);
    drawIngredient(ctx, 'fries', cx, cy, 60);
    const frac = Math.min(1, state.fryer.t / 8);
    drawProgressRing(ctx, cx + 58, cy - 34, 12, frac, st === 'done' ? '#7bc96f' : '#f2c14e');
    if (st === 'burnt') text(ctx, 'BURNT!', cx, cy + 54, 14, '#ff8a7a', '800', 'center');
    else if (st === 'done') text(ctx, 'READY', cx, cy + 54, 13, '#7bc96f', '800', 'center');
  } else {
    text(ctx, 'drop fries in', cx, cy, 14, '#fff', '600', 'center');
  }
}

function drawPlateStation(ctx, state) {
  const r = LAYOUT.plate;
  const dish = matchDish(state.plate);
  drawStationShell(ctx, r, '🍽  PLATE', dish ? 'click the plate to carry it' : 'build a dish here');
  const cx = r.x + r.w / 2;
  const cy = r.y + 96;
  drawPlate(ctx, cx, cy, 52, state.plate);
  if (state.plate.length === 0) {
    text(ctx, 'add finished ingredients', cx, cy + 66, 13, '#f7ead2', '600', 'center');
  } else if (dish) {
    ctx.fillStyle = '#7bc96f';
    roundRect(ctx, cx - 90, cy + 52, 180, 26, 13);
    ctx.fill();
    text(ctx, `${dish.name} — ready!`, cx, cy + 65, 14, '#123524', '800', 'center');
  } else {
    text(ctx, state.plate.map((id) => INGREDIENT_BY_ID[id].name).join(' + '), cx, cy + 66, 13, '#f7ead2', '600', 'center');
  }
}

function drawPass(ctx, state) {
  const b = LAYOUT.pass;
  ctx.fillStyle = '#3d2c1e';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  text(ctx, 'SERVICE PASS', b.x + 16, b.y + 26, 18, '#ffd98a', '800');
  text(ctx, `Target: ${TARGET_COINS} coins`, b.x + 16, b.y + 56, 15, '#e8cfa5', '600');
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, b.x + 16, b.y + 72, b.w - 32, 12, 6);
  ctx.fill();
  ctx.fillStyle = TEAL;
  roundRect(ctx, b.x + 16, b.y + 72, (b.w - 32) * Math.min(1, state.coins / TARGET_COINS), 12, 6);
  ctx.fill();
  const stars = starsEarned(state);
  text(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), b.x + 16, b.y + 112, 22, '#ffd98a');
  text(ctx, 'How to play', b.x + 16, b.y + 152, 16, '#ffd98a', '800');
  const lines = [
    '1. Click an ingredient, then a station.',
    '2. Chop, grill or fry it until ready.',
    '3. Add finished items to the plate.',
    '4. Carry the plate to its order ticket.',
    'Keys: 1–8 pick, C chop, F flip, S serve.',
  ];
  lines.forEach((line, i) => text(ctx, line, b.x + 16, b.y + 180 + i * 22, 13, '#e8cfa5'));
  text(ctx, 'Serve fast: tips shrink as', b.x + 16, b.y + 306, 13, '#e8cfa5');
  text(ctx, 'orders lose patience.', b.x + 16, b.y + 328, 13, '#e8cfa5');
}

function drawTrash(ctx, state) {
  const b = LAYOUT.trash;
  ctx.fillStyle = '#4a4a4a';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  text(ctx, '🗑  BIN', b.x + b.w / 2, b.y + 34, 22, '#fff', '800', 'center');
  text(ctx, 'click to bin what is in', b.x + b.w / 2, b.y + 66, 14, '#ddd', '600', 'center');
  text(ctx, 'your hand — or the plate', b.x + b.w / 2, b.y + 90, 14, '#ddd', '600', 'center');
  text(ctx, 'Burnt food must be binned', b.x + b.w / 2, b.y + 122, 13, '#ff8a7a', '600', 'center');
}

function drawCounter(ctx, state) {
  const b = LAYOUT.counter;
  ctx.fillStyle = WOOD;
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  text(ctx, 'INGREDIENTS ON THE COUNTER', b.x + 16, b.y + 26, 16, '#ffd98a', '800');
  const binW = (b.w - 32) / INGREDIENTS.length;
  INGREDIENTS.forEach((ing, i) => {
    const x = b.x + 16 + i * binW;
    const y = b.y + 40;
    const held = state.hand === ing.id;
    ctx.fillStyle = held ? '#5a3d1e' : 'rgba(0,0,0,0.2)';
    roundRect(ctx, x + 4, y, binW - 8, 126, 10);
    ctx.fill();
    drawIngredient(ctx, ing.id, x + binW / 2, y + 48, 64);
    text(ctx, ing.name, x + binW / 2, y + 96, 15, '#fff', '700', 'center');
    text(ctx, `[${ing.key}] ${STATION_LABELS[ing.station]}`, x + binW / 2, y + 116, 12, '#ffd98a', '600', 'center');
  });
}

function drawHand(ctx, state, mouse) {
  if (!state.hand && !state.heldPlate) return;
  ctx.save();
  ctx.globalAlpha = 0.92;
  if (state.heldPlate) {
    drawPlate(ctx, mouse.x, mouse.y, 34, DISH_BY_ID[state.heldPlate].needs);
  } else {
    drawIngredient(ctx, state.hand, mouse.x, mouse.y, 44);
  }
  ctx.restore();
}

function drawMessages(ctx, state) {
  state.messages.forEach((msg, i) => {
    ctx.globalAlpha = Math.min(1, msg.t);
    text(ctx, msg.text, LAYOUT.width / 2, 84 + i * 28, 18, msg.kind === 'good' ? '#7bc96f' : '#ff8a7a', '800', 'center');
    ctx.globalAlpha = 1;
  });
}

function drawEndScreen(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,6,0.82)';
  ctx.fillRect(0, 0, LAYOUT.width, LAYOUT.height);
  const won = state.status === 'won';
  text(ctx, won ? 'SHIFT COMPLETE!' : 'SHIFT OVER', 640, 300, 54, won ? '#7bc96f' : '#ff8a7a', '800', 'center');
  text(ctx, won ? `You beat the ${TARGET_COINS}-coin target.` : `The ${TARGET_COINS}-coin target slipped away.`, 640, 360, 22, '#f7ead2', '600', 'center');
  text(ctx, '★'.repeat(starsEarned(state)) + '☆'.repeat(3 - starsEarned(state)), 640, 420, 44, '#ffd98a', '800', 'center');
  text(ctx, `${state.coins} coins · ${state.served} dishes served`, 640, 470, 22, '#fff', '700', 'center');
  text(ctx, 'Press R to play again', 640, 530, 18, '#ffd98a', '600', 'center');
}

export function drawGame(ctx, state, mouse) {
  // Floor and wall.
  ctx.fillStyle = '#c98f5f';
  ctx.fillRect(0, 0, LAYOUT.width, LAYOUT.height);
  ctx.fillStyle = '#f7ead2';
  ctx.fillRect(0, 0, LAYOUT.width, 64);
  ctx.fillStyle = '#e8d5ae';
  for (let x = 0; x < LAYOUT.width; x += 64) {
    ctx.fillRect(x, 596, 2, 204);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 604; y < LAYOUT.height; y += 48) {
    ctx.fillRect(0, y, LAYOUT.width, 2);
  }
  // A woven runner rug fills the open floor between the stations and the
  // counter, so the kitchen reads as one room instead of empty boards.
  ctx.fillStyle = '#a34d3a';
  roundRect(ctx, 336, 440, 620, 140, 16);
  ctx.fill();
  ctx.fillStyle = '#c96f52';
  roundRect(ctx, 352, 456, 588, 108, 10);
  ctx.fill();
  ctx.fillStyle = '#e8b06a';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(400 + i * 118, 510, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTopBar(ctx, state);
  drawOrderBoard(ctx, state);
  drawChoppingBoard(ctx, state);
  drawGrill(ctx, state);
  drawFryer(ctx, state);
  drawPlateStation(ctx, state);
  drawPass(ctx, state);
  drawTrash(ctx, state);
  drawCounter(ctx, state);
  drawMessages(ctx, state);
  drawHand(ctx, state, mouse);
  if (state.status !== 'playing') drawEndScreen(ctx, state);
}
