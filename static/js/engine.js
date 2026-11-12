// Core engine: screen, input (keyboard + touch pad), fixed-step loop,
// a layer stack for menus/dialogs, timers and fades.
export const W = 240, H = 160, T = 16;

export const canvas = document.getElementById('screen');
export const ctx = canvas.getContext('2d');
let scale = 1;

export function resize() {
  const w = canvas.clientWidth || W;
  const dpr = window.devicePixelRatio || 1;
  scale = Math.max(1, Math.round((w * dpr) / W));
  if (canvas.width !== W * scale) {
    canvas.width = W * scale;
    canvas.height = H * scale;
  }
}

// ---------- input ----------
const BTN = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select'];
const kbd = new Set();
const touch = new Map(); // pointerId -> button or dpad dir
const latch = {};
const heldFrames = {};
BTN.forEach((b) => { latch[b] = false; heldFrames[b] = 0; });

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', KeyJ: 'a', Space: 'a', Enter: 'a', NumpadEnter: 'a',
  KeyX: 'b', KeyK: 'b', Backspace: 'b', ShiftLeft: 'b', ShiftRight: 'b',
  Escape: 'start', KeyM: 'start', Tab: 'start', KeyQ: 'select',
};

let onFirstInput = null;
export function setFirstInputHandler(fn) { onFirstInput = fn; }
function first() { if (onFirstInput) { const f = onFirstInput; onFirstInput = null; f(); } }

export let inputBlocked = false; // true while an HTML overlay (name entry) has focus
export function blockInput(v) { inputBlocked = v; kbd.clear(); }

window.addEventListener('keydown', (e) => {
  if (inputBlocked) return;
  const b = KEYMAP[e.code];
  if (!b) return;
  e.preventDefault();
  first();
  if (!kbd.has(b)) latch[b] = true;
  kbd.add(b);
});
window.addEventListener('keyup', (e) => { const b = KEYMAP[e.code]; if (b) kbd.delete(b); });
window.addEventListener('blur', () => { kbd.clear(); touch.clear(); });

function isDown(b) {
  if (kbd.has(b)) return true;
  for (const v of touch.values()) if (v === b) return true;
  return false;
}

function vibrate() { try { navigator.vibrate && navigator.vibrate(6); } catch (e) { /* ignore */ } }

export function bindTouchPad() {
  const dpad = document.getElementById('dpad');
  if (dpad) {
    const dirFor = (e) => {
      const r = dpad.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < r.width * 0.12) return null;
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    };
    const setDir = (e) => {
      const d = dirFor(e);
      const prev = touch.get(e.pointerId);
      if (d === prev) return;
      if (d) { if (!isDown(d)) latch[d] = true; touch.set(e.pointerId, d); vibrate(); } else touch.delete(e.pointerId);
      dpad.dataset.dir = d || '';
    };
    dpad.addEventListener('pointerdown', (e) => { e.preventDefault(); first(); dpad.setPointerCapture(e.pointerId); setDir(e); });
    dpad.addEventListener('pointermove', (e) => { if (touch.has(e.pointerId) || e.buttons) setDir(e); });
    const end = (e) => { touch.delete(e.pointerId); dpad.dataset.dir = ''; };
    dpad.addEventListener('pointerup', end);
    dpad.addEventListener('pointercancel', end);
  }
  document.querySelectorAll('[data-btn]').forEach((el) => {
    const b = el.dataset.btn;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); first();
      el.setPointerCapture(e.pointerId);
      if (!isDown(b)) latch[b] = true;
      touch.set(e.pointerId, b); el.classList.add('down'); vibrate();
    });
    const end = (e) => { touch.delete(e.pointerId); el.classList.remove('down'); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  });
}

export const input = {
  held: (b) => !inputBlocked && isDown(b),
  pressed: (b) => !inputBlocked && latch[b],
  // menu-style auto repeat for directions
  repeat: (b) => !inputBlocked && (latch[b] || (heldFrames[b] > 16 && heldFrames[b] % 5 === 0)),
  consume: (b) => { latch[b] = false; },
  dir() {
    for (const d of ['up', 'down', 'left', 'right']) if (this.held(d)) return d;
    return null;
  },
};

function endInputFrame() {
  BTN.forEach((b) => { latch[b] = false; heldFrames[b] = isDown(b) ? heldFrames[b] + 1 : 0; });
}

// ---------- timers, layers, scenes ----------
export let frame = 0;
const waiters = [];
export function wait(n = 1) { return new Promise((res) => waiters.push({ n, res })); }

export const layers = [];
export function open(widget) {
  return new Promise((res) => {
    widget.close = (v) => {
      const i = layers.indexOf(widget);
      if (i >= 0) layers.splice(i, 1);
      res(v);
    };
    layers.push(widget);
  });
}

let scene = null;
export function setScene(s) { scene = s; }
export function getScene() { return scene; }

export const fx = { fade: 0, flash: 0, flashColor: '#fff' };
export async function fadeOut(n = 12) { for (let i = 1; i <= n; i++) { fx.fade = i / n; await wait(1); } }
export async function fadeIn(n = 12) { for (let i = n - 1; i >= 0; i--) { fx.fade = i / n; await wait(1); } }

const hooks = [];
export function everyFrame(fn) { hooks.push(fn); }

function update() {
  frame++;
  for (let i = waiters.length - 1; i >= 0; i--) {
    if (--waiters[i].n <= 0) { const w = waiters[i]; waiters.splice(i, 1); w.res(); }
  }
  hooks.forEach((h) => h());
  if (scene && scene.animate) scene.animate();
  if (layers.length) layers[layers.length - 1].update();
  else if (scene && scene.update) scene.update();
  endInputFrame();
}

function draw() {
  resize();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  if (scene && scene.draw) scene.draw(ctx);
  for (const l of layers) if (l.draw) l.draw(ctx);
  if (fx.flash > 0) { ctx.globalAlpha = fx.flash; ctx.fillStyle = fx.flashColor; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; fx.flash = Math.max(0, fx.flash - 0.08); }
  if (fx.fade > 0) { ctx.globalAlpha = fx.fade; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

export function start() {
  let last = performance.now();
  let acc = 0;
  const step = 1000 / 60;
  function tick(now) {
    acc += Math.min(200, now - last);
    last = now;
    let n = 0;
    while (acc >= step && n < 8) { update(); acc -= step; n++; }
    draw();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// small seeded RNG helpers
export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const chance = (p) => Math.random() < p;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
