// Drawing helpers and the reusable dialog / menu widgets.
import { W, H, input, open, frame } from './engine.js';
import { sfx } from './audio.js';
import { settings } from './state.js';

export const FONT = '600 11px Pixelify, monospace';
export const FONT_SMALL = '600 9px Pixelify, monospace';
export const FONT_BIG = '700 15px Pixelify, monospace';

// the pixel font has f-ligatures ("fi", "fl"); a zero-width non-joiner keeps letters separate
const noLig = (s) => String(s).replace(/f(?=[filt])/g, 'f\u200c');
export function text(g, s, x, y, col = '#282830', shadow = '#cfcfc6', font = FONT, align = 'left') {
  s = noLig(s);
  g.font = font;
  g.textBaseline = 'top';
  g.textAlign = align;
  if (shadow) { g.fillStyle = shadow; g.fillText(s, x + 1, y + 1); }
  g.fillStyle = col;
  g.fillText(s, x, y);
  g.textAlign = 'left';
}

export function box(g, x, y, w, h, style = 'white') {
  const pal = style === 'dark'
    ? ['#101828', '#283850', '#5070a0']
    : style === 'red' ? ['#502020', '#f8f0e8', '#d07060'] : ['#283048', '#f8f8f8', '#98b0d8'];
  g.fillStyle = pal[0];
  g.fillRect(x + 1, y, w - 2, h);
  g.fillRect(x, y + 1, w, h - 2);
  g.fillStyle = pal[1];
  g.fillRect(x + 2, y + 2, w - 4, h - 4);
  g.strokeStyle = pal[2];
  g.lineWidth = 1;
  g.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
}

export function hpBar(g, x, y, w, frac) {
  frac = Math.max(0, Math.min(1, frac));
  g.fillStyle = '#304030'; g.fillRect(x - 1, y - 1, w + 2, 5);
  g.fillStyle = '#506858'; g.fillRect(x, y, w, 3);
  g.fillStyle = frac > 0.5 ? '#40d870' : frac > 0.2 ? '#f8c830' : '#f04838';
  g.fillRect(x, y, Math.ceil(w * frac), 3);
}

export function bar(g, x, y, w, frac, col = '#40a8f8') {
  g.fillStyle = '#304050'; g.fillRect(x, y, w, 2);
  g.fillStyle = col; g.fillRect(x, y, Math.floor(w * Math.max(0, Math.min(1, frac))), 2);
}

export function wrap(g, str, maxW, font = FONT) {
  g.font = font;
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (g.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t;
    }
    out.push(line);
  }
  return out;
}

export function cursor(g, x, y) {
  g.fillStyle = '#383840';
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + 5, y + 4); g.lineTo(x, y + 8); g.closePath(); g.fill();
}

const measure = document.createElement('canvas').getContext('2d');

// ---------- text box ----------
export class TextBox {
  constructor(str, opts = {}) {
    const lines = wrap(measure, str, W - 26);
    this.pages = [];
    for (let i = 0; i < lines.length; i += 2) this.pages.push(lines.slice(i, i + 2));
    this.page = 0;
    this.chars = 0;
    this.opts = opts;
    this.timer = 0;
  }
  get pageLen() { return this.pages[this.page].join('').length; }
  get typed() { return this.chars >= this.pageLen; }
  update() {
    const speed = [0.35, 0.6, 1.1][settings.textSpeed ?? 1];
    if (!this.typed) {
      this.chars += input.held('b') ? Math.max(2, speed * 4) : speed; // only B / Backspace speeds text up
      if (frame % 4 === 0) sfx('blip');
      if (this.typed && this.opts.instantClose && this.page === this.pages.length - 1) this.close();
      return;
    }
    if (this.opts.auto) {
      if (++this.timer >= this.opts.auto) this.next();
      return;
    }
    if (input.pressed('a') || input.pressed('b')) this.next();
  }
  next() {
    if (this.page < this.pages.length - 1) { this.page++; this.chars = 0; this.timer = 0; sfx('select'); } else { if (!this.opts.auto) sfx('select'); this.close(); }
  }
  draw(g) {
    box(g, 0, 112, W, 48);
    let left = this.chars;
    this.pages[this.page].forEach((ln, i) => {
      const s = ln.slice(0, Math.max(0, Math.floor(left)));
      left -= ln.length;
      text(g, s, 11, 119 + i * 17);
    });
    if (this.typed && !this.opts.auto && !this.opts.instantClose && (frame >> 4) % 2) {
      g.fillStyle = '#e04030';
      g.beginPath(); g.moveTo(222, 146); g.lineTo(230, 146); g.lineTo(226, 151); g.closePath(); g.fill();
    }
  }
}

export async function say(...msgs) {
  for (const m of msgs) {
    if (m == null) continue;
    await open(new TextBox(m));
  }
}

// ---------- menus ----------
export class Menu {
  constructor(o) {
    this.items = o.items.map((it) => (typeof it === 'string' ? { label: it } : it));
    this.x = o.x ?? 150; this.y = o.y; this.w = o.w ?? 86;
    this.cols = o.cols ?? 1; this.lineH = o.lineH ?? 15;
    this.cancel = o.cancel ?? true;
    this.index = Math.min(o.index ?? 0, this.items.length - 1);
    this.onMove = o.onMove; this.extra = o.extra; this.style = o.style;
    const rows = Math.ceil(this.items.length / this.cols);
    this.h = o.h ?? rows * this.lineH + 14;
    if (this.y == null) this.y = 112 - this.h;
    if (this.onMove) this.onMove(this.index);
  }
  handle() {
    const n = this.items.length, c = this.cols;
    let i = this.index;
    if (input.repeat('down')) i = i + c < n ? i + c : (c === 1 ? 0 : i);
    if (input.repeat('up')) i = i - c >= 0 ? i - c : (c === 1 ? n - 1 : i);
    if (c > 1 && input.repeat('right') && i % c < c - 1 && i + 1 < n) i++;
    if (c > 1 && input.repeat('left') && i % c > 0) i--;
    if (i !== this.index) { this.index = i; sfx('move'); if (this.onMove) this.onMove(i); }
    if (input.pressed('a')) {
      if (this.items[i].disabled) { sfx('bump'); return undefined; }
      sfx('select'); return i;
    }
    if (input.pressed('b') && this.cancel) { sfx('back'); return -1; }
    return undefined;
  }
  update() { const r = this.handle(); if (r !== undefined) this.close(r); }
  draw(g) {
    box(g, this.x, this.y, this.w, this.h, this.style);
    const colW = (this.w - 16) / this.cols;
    this.items.forEach((it, i) => {
      const cx = this.x + 14 + (i % this.cols) * colW;
      const cy = this.y + 8 + Math.floor(i / this.cols) * this.lineH;
      text(g, it.label, cx, cy, it.disabled ? '#a0a0a8' : '#383840');
      if (it.right) text(g, it.right, this.x + this.w - 9, cy, '#383840', '#d0d0c8', FONT, 'right');
      if (i === this.index) cursor(g, cx - 9, cy + 1);
    });
    if (this.extra) this.extra(g, this.index);
  }
}

export function menu(o) { return open(new Menu(o)); }

// Text box + a choice menu above its right edge.
class Prompt {
  constructor(str, items, o) {
    this.tb = new TextBox(str);
    this.tb.page = this.tb.pages.length - 1;
    this.tb.chars = 999;
    this.menu = new Menu({ items, cancel: o.cancel ?? true, x: o.x, w: o.w, index: o.index });
  }
  update() { const r = this.menu.handle(); if (r !== undefined) this.close(r); }
  draw(g) { this.tb.draw(g); this.menu.draw(g); }
}

// Shows the text (typed out), then asks. Returns index, or -1 if cancelled.
export async function choose(str, items, o = {}) {
  const tb = new TextBox(str, { instantClose: true });
  if (tb.pages.length > 1) {
    const head = tb.pages.slice(0, -1).map((p) => p.join(' ')).join(' ');
    await say(head);
  }
  await open(new TextBox(tb.pages[tb.pages.length - 1].join(' '), { instantClose: true }));
  const r = await open(new Prompt(str, items, o));
  return r;
}

export async function yesNo(str) { return (await choose(str, ['YES', 'NO'], { w: 56, x: 178 })) === 0; }

export class QtyPicker {
  constructor(max, unitPrice) { this.max = Math.max(1, max); this.n = 1; this.price = unitPrice; }
  update() {
    if (input.repeat('up')) { this.n = this.n >= this.max ? 1 : this.n + 1; sfx('move'); }
    if (input.repeat('down')) { this.n = this.n <= 1 ? this.max : this.n - 1; sfx('move'); }
    if (input.repeat('right')) { this.n = Math.min(this.max, this.n + 10); sfx('move'); }
    if (input.repeat('left')) { this.n = Math.max(1, this.n - 10); sfx('move'); }
    if (input.pressed('a')) { sfx('select'); this.close(this.n); }
    if (input.pressed('b')) { sfx('back'); this.close(0); }
  }
  draw(g) {
    box(g, 120, 82, 116, 30);
    text(g, 'x' + String(this.n).padStart(2, '0'), 132, 92);
    if (this.price != null) text(g, '$' + this.n * this.price, 228, 92, '#383840', '#d0d0c8', FONT, 'right');
  }
}

// HTML text input overlay (works with phone keyboards).
export function askName(title, def) {
  return new Promise((res) => {
    const wrapEl = document.getElementById('name-entry');
    const inp = document.getElementById('name-input');
    const lab = document.getElementById('name-title');
    const ok = document.getElementById('name-ok');
    lab.textContent = title;
    inp.value = def;
    wrapEl.hidden = false;
    import('./engine.js').then((e) => e.blockInput(true));
    setTimeout(() => { inp.focus(); inp.select(); }, 50);
    const done = () => {
      const v = (inp.value || def).toUpperCase().replace(/[^\w .'-]/g, '').trim().slice(0, 10) || def;
      wrapEl.hidden = true;
      ok.onclick = null; inp.onkeydown = null;
      inp.blur();
      import('./engine.js').then((e) => e.blockInput(false));
      res(v);
    };
    ok.onclick = done;
    inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); done(); } };
  });
}

export { W, H };
