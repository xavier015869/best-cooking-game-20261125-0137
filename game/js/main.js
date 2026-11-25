// Ember & Thyme — boot, game loop and screenshot staging.
// The game runs on one canvas. `?shot=cover|serve|rush&seed=1` stages a
// fixed mid-game scene so the maker's screenshots are real renders of the
// game's own code, taken at a moment that shows the whole kitchen.

import { createGame, spawnOrder, update } from './state.js';
import { drawGame } from './draw.js';
import { handleClick, handleKey } from './input.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') ?? '1') || 1;
const shot = params.get('shot');

let state = createGame(seed);
let paused = false;
const mouse = { x: 640, y: 400 };

function toCanvasCoords(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 1280,
    y: ((event.clientY - rect.top) / rect.height) * 800,
  };
}

canvas.addEventListener('mousemove', (event) => {
  const p = toCanvasCoords(event);
  mouse.x = p.x;
  mouse.y = p.y;
});

canvas.addEventListener('click', (event) => {
  const p = toCanvasCoords(event);
  mouse.x = p.x;
  mouse.y = p.y;
  if (state.status !== 'playing') return;
  handleClick(state, p.x, p.y, sfx);
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'p') {
    paused = !paused;
    return;
  }
  if (key === 'r' && state.status !== 'playing') {
    state = createGame(seed);
    return;
  }
  if (paused || state.status !== 'playing') return;
  handleKey(state, key, sfx);
});

// --- Screenshot staging ----------------------------------------------------
// A staged scene is a real game state, built by the same rules as play:
// orders on the board, food on the stations, a plate mid-assembly.
function stageShot(state, shot) {
  if (shot === 'cover') {
    state.timeLeft = 151;
    state.coins = 34;
    state.served = 2;
    spawnOrder(state);
    state.orders[0].dishId = 'burger';
    spawnOrder(state);
    state.orders[1].dishId = 'salad';
    spawnOrder(state);
    state.orders[2].dishId = 'steakfrites';
    state.plate = ['bun', 'patty', 'cheese'];
    state.grill[0] = { kind: 'steak', t: 4 };
    state.fryer = { kind: 'fries', t: 5 };
    state.board = { kind: 'lettuce', chopsLeft: 1 };
  } else if (shot === 'serve') {
    state.timeLeft = 96;
    state.coins = 58;
    state.served = 4;
    state.combo = 2;
    state.comboTimer = 6;
    spawnOrder(state);
    state.orders[0].dishId = 'steakfrites';
    state.plate = ['steak', 'fries'];
    state.grill[0] = { kind: 'patty', t: 7 };
    state.board = { kind: 'tomato', chopsLeft: 2 };
  } else if (shot === 'rush') {
    state.timeLeft = 47;
    state.coins = 96;
    state.served = 7;
    state.combo = 3;
    state.comboTimer = 5;
    spawnOrder(state);
    state.orders[0].dishId = 'burger';
    spawnOrder(state);
    state.orders[1].dishId = 'salad';
    spawnOrder(state);
    state.orders[2].dishId = 'steakfrites';
    spawnOrder(state);
    state.orders[3].dishId = 'burger';
    state.grill[0] = { kind: 'patty', t: 3 };
    state.grill[1] = { kind: 'steak', t: 8 };
    state.fryer = { kind: 'fries', t: 2 };
    state.board = { kind: 'onion', chopsLeft: 3 };
    state.plate = ['bun', 'patty'];
  }
}

if (shot) {
  stageShot(state, shot);
  state.status = 'playing';
}

let last = performance.now();
let lastStatus = '';

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!paused && !shot) update(state, dt);
  if (shot) update(state, 0); // staged scenes hold still for the camera
  drawGame(ctx, state, mouse);
  const line = state.status === 'playing'
    ? `Shift timer ${Math.ceil(state.timeLeft)} seconds, ${state.coins} coins, ${state.orders.length} orders waiting.`
    : state.status === 'won'
      ? `Shift complete. ${state.coins} coins, ${state.served} dishes served.`
      : `Shift over. ${state.coins} coins, ${state.served} dishes served.`;
  if (line !== lastStatus) {
    // The shift just ended: one jingle, then the end screen holds still.
    if (lastStatus !== '' && state.status === 'won') sfx('win');
    if (lastStatus !== '' && state.status === 'lost') sfx('lose');
    statusLine.textContent = line;
    lastStatus = line;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
