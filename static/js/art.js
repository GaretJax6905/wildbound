// All graphics are generated in code: creatures are drawn with shapes on a
// small canvas, then "pixelized" (hard alpha, palette snap, dark outline) so
// they look like hand-made pixel art. Tiles, buildings and people are drawn
// pixel by pixel.
import { SPECIES } from './data.js';
import { pxText, pxWidth } from './font.js';

const cache = new Map();
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function pixelize(c, palette, outline = '#1c1c2c', volume = false) {
  const g = c.getContext('2d');
  const { width: w, height: h } = c;
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const pal = palette.map(hex);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 110) { d[i + 3] = 0; continue; }
    d[i + 3] = 255;
    if (pal.length) {
      let best = 0, bd = 1e9;
      for (let p = 0; p < pal.length; p++) {
        const dr = d[i] - pal[p][0], dg = d[i + 1] - pal[p][1], db = d[i + 2] - pal[p][2];
        const dd = dr * dr + dg * dg + db * db;
        if (dd < bd) { bd = dd; best = p; }
      }
      d[i] = pal[best][0]; d[i + 1] = pal[best][1]; d[i + 2] = pal[best][2];
    }
  }
  if (volume) {
    // GBA-style volume: light from the upper left, shadow on the lower right
    const src = new Uint8ClampedArray(d);
    const solidAt = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!src[i + 3]) continue;
      const lit = !solidAt(x - 1, y) || !solidAt(x, y - 1) || !solidAt(x - 1, y - 1);
      const dark = !solidAt(x + 1, y) || !solidAt(x, y + 1) || !solidAt(x + 1, y + 1);
      const dark2 = !dark && (!solidAt(x + 2, y + 1) || !solidAt(x + 1, y + 2));
      const dith = !lit && !dark && !dark2 && (!solidAt(x + 3, y + 2) || !solidAt(x + 2, y + 3)) && ((x + y) & 1);
      const k = lit ? 1.14 : dark ? 0.76 : dark2 ? 0.88 : dith ? 0.92 : 1;
      if (k !== 1) for (let c2 = 0; c2 < 3; c2++) d[i + c2] = Math.max(0, Math.min(255, Math.round(src[i + c2] * k)));
    }
  }
  if (outline) {
    const o = hex(outline);
    const src = new Uint8ClampedArray(d);
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (src[i + 3]) continue;
        if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
          d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = 255;
        }
      }
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

function painter(g) {
  const used = new Set(['#202028', '#ffffff']);
  const u = (c) => { used.add(c); return c; };
  return {
    used,
    shaded: false,
    ell(x, y, rx, ry, col, rot = 0) {
      const E = (cx, cy, a, b2, c) => { g.fillStyle = u(c); g.beginPath(); g.ellipse(cx, cy, Math.max(0.5, a), Math.max(0.5, b2), rot, 0, Math.PI * 2); g.fill(); };
      const lum = (() => { const [r, gg, bb] = hex(col); return r * 0.3 + gg * 0.59 + bb * 0.11; })();
      if (!this.shaded || Math.min(rx, ry) < 3.2 || lum < 50) { E(x, y, rx, ry, col); return; }
      E(x, y, rx, ry, shade(col, 0.72));
      E(x - rx * 0.05, y - ry * 0.07, rx * 0.94, ry * 0.92, shade(col, 0.86));
      E(x - rx * 0.12, y - ry * 0.15, rx * 0.84, ry * 0.8, col);
      E(x - rx * 0.32, y - ry * 0.36, rx * 0.42, ry * 0.34, shade(col, 1.1));
      E(x - rx * 0.42, y - ry * 0.46, rx * 0.16, ry * 0.12, shade(col, 1.24));
    },
    circ(x, y, r, col) { this.ell(x, y, r, r, col); },
    rect(x, y, w, h, col) { g.fillStyle = u(col); g.fillRect(x, y, w, h); },
    poly(pts, col) { g.fillStyle = u(col); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); },
    line(pts, col, w = 1.5) { g.strokeStyle = u(col); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); },
    eye(x, y, r = 2.2, mean = false) {
      this.ell(x, y, r * 0.85, r * 1.15, '#202028');
      if (this.res > 1) { this.ell(x, y + r * 0.35, r * 0.5, r * 0.45, '#3a3a5a'); this.ell(x - r * 0.3, y - r * 0.45, r * 0.32, r * 0.32, '#ffffff'); this.rect(x + r * 0.2, y + r * 0.25, 0.6, 0.6, '#ffffff'); }
      else this.rect(Math.round(x - r * 0.5), Math.round(y - r * 0.7), 1, 1, '#ffffff');
      if (mean) this.line([[x - r * 1.4, y - r * 1.9], [x + r * 1.1, y - r * 1.1]], '#202028', 1.2);
    },
    clip(fn, shape) { g.save(); g.beginPath(); shape(g); g.clip(); fn(); g.restore(); },
    g,
  };
}

// ---------------- creature drawers (56x56 space) ----------------
const mirror = (pts) => pts.map(([x, y]) => [56 - x, y]);
const FAM = {
  mole(p, st, back) {
    const big = st >= 2, third = st === 3;
    const body = third ? '#5e5038' : big ? '#7c6a48' : '#a68459', belly = '#f0dcb0', leaf = '#58b848', leafD = third ? '#2a7a3a' : '#3a8a3a';
    if (third) { p.ell(10, 20, 6, 10, '#2f8a3a', -0.4); p.ell(46, 20, 6, 10, '#2f8a3a', 0.4); p.circ(10, 14, 3, '#f0d040'); p.circ(46, 14, 3, '#f088b8'); }
    if (big) {
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (0.15 + i * 0.117);
        const bx = 28 - Math.cos(a) * 19, by = 36 - Math.sin(a) * 14;
        p.poly([[bx - 3, by + 2], [28 - Math.cos(a) * 26, 36 - Math.sin(a) * 21], [bx + 3, by + 2]], leafD);
      }
    }
    p.ell(28, big ? 37 : 39, big ? 20 : 15, big ? 15 : 12, body);
    if (!back) {
      p.ell(28, big ? 43 : 44, big ? 12 : 9, big ? 8 : 6, belly);
      p.eye(big ? 21 : 22, big ? 31 : 34, big ? 2 : 2, big);
      p.eye(big ? 35 : 34, big ? 31 : 34, big ? 2 : 2, big);
      p.ell(28, big ? 37 : 39, 4, 3, '#f09898');
      p.circ(28, big ? 36 : 38, 1.3, '#602828');
    }
    const cy = big ? 50 : 50;
    for (const sx of [-1, 1]) {
      const cx = 28 + sx * (big ? 17 : 12);
      p.ell(cx, cy, big ? 7 : 5, 3, belly);
      if (big) { p.poly([[cx - 5, cy + 1], [cx - 7, cy + 5], [cx - 3, cy + 2]], '#ffffff'); p.poly([[cx + 5, cy + 1], [cx + 7, cy + 5], [cx + 3, cy + 2]], '#ffffff'); }
    }
    const top = big ? 22 : 27;
    p.line([[28, top], [28, top - 7]], leafD, 2);
    p.poly([[28, top - 6], [18, top - 12], [21, top - 4]], leaf);
    p.poly([[28, top - 6], [38, top - 12], [35, top - 4]], leaf);
    if (big) { p.circ(28, top - 9, 3.5, '#f088b8'); p.circ(28, top - 9, 1.5, '#f8e060'); }
  },
  fox(p, st, back) {
    const big = st >= 2, third = st === 3;
    const o = third ? '#403048' : '#f08838', oD = third ? '#281c30' : '#c85a20', cream = third ? '#b8a0c8' : '#fff0d8', fy = third ? '#f070f0' : '#f8d030', fr = third ? '#8030c0' : '#e04020';
    // tail + flame
    p.ell(big ? 43 : 41, big ? 40 : 40, big ? 10 : 8, 4, o, -0.6);
    p.ell(big ? 50 : 47, big ? 28 : 31, big ? 6 : 4.5, big ? 9 : 6.5, fr);
    p.ell(big ? 50 : 47, big ? 30 : 32, big ? 3.5 : 2.5, big ? 5.5 : 4, fy);
    if (big) {
      p.rect(19, 44, 5, 10, oD); p.rect(32, 44, 5, 10, oD);
      p.ell(28, 40, 12, 10, o);
      // flame mane
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (0.9 + i * 0.15);
        p.poly([[28 + Math.cos(a) * 9, 31 + Math.sin(a) * 6], [28 + Math.cos(a) * 18, 31 + Math.sin(a) * 13], [28 + Math.cos(a + 0.2) * 9, 31 + Math.sin(a + 0.2) * 6]], i % 2 ? fy : fr);
      }
      p.poly([[17, 17], [14, 2], [25, 12]], o); p.poly(mirror([[17, 17], [14, 2], [25, 12]]), o);
      p.rect(14, 1, 2, 3, '#202028'); p.rect(40, 1, 2, 3, '#202028');
      p.circ(28, 21, 11, o);
      if (!back) {
        p.poly([[18, 14], [16, 6], [22, 12]], '#803820'); p.poly(mirror([[18, 14], [16, 6], [22, 12]]), '#803820');
        p.ell(28, 41, 6, 6, cream);
        p.ell(28, 26, 6, 4, cream);
        p.eye(23, 20, 2.1, true); p.eye(33, 20, 2.1, true);
        p.circ(28, 24, 1.4, '#401818');
      }
    } else {
      p.rect(22, 47, 4, 6, oD); p.rect(30, 47, 4, 6, oD);
      p.ell(28, 42, 10, 9, o);
      p.poly([[19, 23], [16, 8], [26, 18]], o); p.poly(mirror([[19, 23], [16, 8], [26, 18]]), o);
      p.circ(28, 28, 11, o);
      if (!back) {
        p.poly([[19, 19], [18, 11], [23, 17]], '#803820'); p.poly(mirror([[19, 19], [18, 11], [23, 17]]), '#803820');
        p.ell(28, 45, 6, 6, cream);
        p.ell(28, 33, 6, 4, cream);
        p.eye(23, 27, 2.4); p.eye(33, 27, 2.4);
        p.circ(28, 31, 1.4, '#401818');
      }
    }
  },
  axolotl(p, st, back) {
    const big = st >= 2, third = st === 3;
    const b = third ? '#284890' : big ? '#3a78d0' : '#68a8f0', bl = third ? '#5078c8' : big ? '#6aa0e8' : '#a0d0f8', belly = '#d8f0ff', gill = third ? '#f0d040' : '#f0a0c8';
    if (third) { p.poly([[10, 30], [4, 14], [14, 24]], '#f0d040'); p.poly(mirror([[10, 30], [4, 14], [14, 24]]), '#f0d040'); }
    p.ell(big ? 42 : 40, 45, big ? 13 : 10, big ? 6 : 5, b, -0.2);
    p.ell(big ? 46 : 43, 44, big ? 9 : 7, big ? 3 : 2.5, bl, -0.2);
    if (big) {
      p.poly([[16, 34], [20, 22], [24, 30], [28, 18], [32, 30], [36, 22], [40, 34]], '#a8d8f8');
    }
    p.ell(28, big ? 42 : 43, big ? 15 : 12, big ? 10 : 8, b);
    for (const s of [-1, 1]) {
      const gx = 28 + s * (big ? 17 : 14);
      [[0, -6], [-1, 0], [1, 6]].forEach(([dx, dy], i) => p.ell(gx + s * dx, (big ? 26 : 28) + dy, big ? 4 : 3, big ? 2.5 : 2, gill, s * (0.6 - i * 0.6)));
    }
    p.ell(28, big ? 27 : 29, big ? 15 : 13, big ? 11 : 10, b);
    if (!back) {
      p.ell(28, big ? 45 : 46, big ? 9 : 7, big ? 5 : 4, belly);
      p.eye(big ? 20 : 21, big ? 26 : 28, 2.2, big); p.eye(big ? 36 : 35, big ? 26 : 28, 2.2, big);
      p.line([[24, big ? 32 : 33], [28, big ? 34 : 35], [32, big ? 32 : 33]], '#284878', 1.2);
    }
    p.ell(20, 51, 4, 2.5, b); p.ell(36, 51, 4, 2.5, b);
  },
  rabbit(p, st, back) {
    const big = st === 2;
    const fur = big ? '#c8a070' : '#e0c090', cream = '#fff4e0', pink = '#f0b0b0';
    const ey = big ? 4 : 10;
    p.ell(21, ey + 4, 3.5, big ? 12 : 10, fur, -0.15); p.ell(35, ey + 4, 3.5, big ? 12 : 10, fur, 0.15);
    if (!back) { p.ell(21, ey + 5, 1.6, big ? 9 : 7, pink, -0.15); p.ell(35, ey + 5, 1.6, big ? 9 : 7, pink, 0.15); }
    p.circ(big ? 44 : 41, big ? 42 : 44, 4, cream);
    if (big) {
      p.ell(17, 45, 7, 9, fur); p.ell(39, 45, 7, 9, fur);
      p.ell(28, 37, 11, 13, fur);
      p.ell(15, 53, 8, 3, fur); p.ell(41, 53, 8, 3, fur);
      p.circ(28, 21, 10, fur);
      p.rect(19, 28, 18, 4, '#d04040'); p.rect(32, 30, 4, 8, '#d04040');
      if (!back) { p.ell(28, 39, 7, 9, cream); p.eye(24, 19, 2, true); p.eye(32, 19, 2, true); p.circ(28, 24, 1.3, '#d07070'); }
    } else {
      p.ell(28, 42, 11, 10, fur);
      p.ell(20, 51, 6, 3, fur); p.ell(36, 51, 6, 3, fur);
      p.circ(28, 28, 10, fur);
      if (!back) { p.ell(28, 44, 7, 6, cream); p.eye(24, 27, 2.3); p.eye(32, 27, 2.3); p.circ(28, 31, 1.3, '#d07070'); p.circ(20, 31, 1.6, pink); p.circ(36, 31, 1.6, pink); }
    }
  },
  bird(p, st, back) {
    const big = st >= 2, third = st === 3;
    const br = third ? '#58607a' : big ? '#8a5a30' : '#b88858', brD = third ? '#363c50' : big ? '#5a3818' : '#8a6038', cream = third ? '#e0e8f8' : '#f8e8c8', beak = '#f8c030';
    if (third) { p.poly([[30, 0], [26, 8], [30, 8], [27, 14], [34, 5], [30, 5]], '#f8e040'); }
    if (big) {
      p.poly([[22, 26], [2, 14], [4, 22], [1, 28], [8, 32], [4, 38], [20, 40]], brD);
      p.poly(mirror([[22, 26], [2, 14], [4, 22], [1, 28], [8, 32], [4, 38], [20, 40]]), brD);
      p.poly([[8, 18], [2, 14], [4, 22]], cream); p.poly(mirror([[8, 18], [2, 14], [4, 22]]), cream);
      p.poly([[22, 44], [28, 54], [34, 44]], brD);
      p.ell(28, 33, 10, 13, br);
      p.poly([[24, 12], [22, 2], [28, 9], [32, 1], [32, 12]], '#c04030');
      p.circ(28, 17, 8, br);
      if (!back) {
        p.ell(28, 36, 6, 9, cream);
        p.eye(24, 16, 1.9, true); p.eye(32, 16, 1.9, true);
        p.poly([[25, 19], [31, 19], [28, 25]], beak);
      }
      p.line([[24, 45], [23, 50]], beak, 2); p.line([[32, 45], [33, 50]], beak, 2);
    } else {
      p.ell(14, 38, 5, 8, brD, 0.3); p.ell(42, 38, 5, 8, brD, -0.3);
      p.circ(28, 36, 12, br);
      p.poly([[26, 24], [28, 18], [30, 24]], brD);
      if (!back) {
        p.ell(28, 41, 8, 7, cream);
        p.eye(23, 32, 2.2); p.eye(33, 32, 2.2);
        p.poly([[25, 35], [31, 35], [28, 40]], beak);
      }
      p.line([[24, 47], [24, 52]], beak, 1.8); p.line([[32, 47], [32, 52]], beak, 1.8);
    }
  },
  stick(p, st, back) {
    const big = st === 2;
    const g1 = big ? '#78a040' : '#9aa850', bark = big ? '#8a6a40' : '#6a5a30', leaf = '#58b848';
    if (big) {
      p.line([[22, 40], [12, 50]], bark, 2); p.line([[34, 40], [44, 50]], bark, 2);
      p.line([[22, 44], [16, 54]], bark, 2); p.line([[34, 44], [40, 54]], bark, 2);
      p.ell(28, 42, 8, 11, g1);
      p.ell(28, 27, 5, 6, g1);
      p.poly([[24, 24], [10, 6], [14, 16], [22, 28]], bark); p.poly(mirror([[24, 24], [10, 6], [14, 16], [22, 28]]), bark);
      p.poly([[10, 6], [8, 14], [14, 16]], '#d8c8a0'); p.poly(mirror([[10, 6], [8, 14], [14, 16]]), '#d8c8a0');
      p.poly([[20, 12], [28, 20], [36, 12], [28, 9]], g1);
      if (!back) { p.ell(22, 12, 3, 3.5, '#f8e048'); p.ell(34, 12, 3, 3.5, '#f8e048'); p.circ(22, 12, 1.2, '#202028'); p.circ(34, 12, 1.2, '#202028'); p.ell(28, 44, 4, 7, '#a8c868'); }
      p.poly([[26, 9], [22, 2], [28, 6]], leaf); p.poly([[30, 9], [34, 2], [28, 6]], leaf);
    } else {
      [[30, 18, 22], [32, 15, 25], [34, 18, 30], [36, 15, 35], [38, 19, 40], [40, 16, 45]].forEach(([y, x1]) => { p.line([[x1, y], [56 - x1, y]], bark, 1.4); });
      p.line([[17, 36], [14, 44]], bark, 1.4); p.line([[39, 36], [42, 44]], bark, 1.4);
      p.line([[20, 46], [16, 53]], bark, 1.4); p.line([[36, 46], [40, 53]], bark, 1.4);
      p.ell(28, 46, 4, 6, g1); p.ell(28, 36, 4.5, 6, g1);
      p.circ(28, 24, 7, g1);
      p.poly([[28, 17], [20, 8], [27, 11]], leaf);
      if (!back) { p.eye(25, 23, 2); p.eye(31, 23, 2); }
    }
  },
  bee(p, st, back) {
    const big = st === 2;
    const y = '#f8d030', k = '#302820', wing = '#d0f0ff';
    if (big) {
      p.poly([[24, 24], [2, 8], [6, 24]], wing); p.poly(mirror([[24, 24], [2, 8], [6, 24]]), wing);
      p.poly([[24, 28], [4, 30], [10, 38]], wing); p.poly(mirror([[24, 28], [4, 30], [10, 38]]), wing);
      p.poly([[25, 50], [28, 56], [31, 50]], '#f8f8a0');
      p.ell(28, 42, 7, 11, y);
      p.clip(() => { p.rect(18, 37, 20, 3, k); p.rect(18, 43, 20, 3, k); p.rect(18, 49, 20, 3, k); }, (g) => g.ellipse(28, 42, 7, 11, 0, 0, 7));
      p.ell(28, 27, 8, 6, k);
      p.circ(28, 17, 7, y);
      p.line([[25, 11], [22, 6], [25, 5], [21, 0]], '#f8f8a0', 1.5); p.line([[31, 11], [34, 6], [31, 5], [35, 0]], '#f8f8a0', 1.5);
      if (!back) { p.ell(24, 17, 2.6, 3, k); p.ell(32, 17, 2.6, 3, k); p.rect(23, 15, 1, 1, '#ffffff'); p.rect(31, 15, 1, 1, '#ffffff'); }
      p.line([[22, 30], [14, 36]], k, 1.6); p.line([[34, 30], [42, 36]], k, 1.6);
    } else {
      p.ell(17, 25, 8, 6, wing, -0.4); p.ell(39, 25, 8, 6, wing, 0.4);
      p.poly([[25, 45], [28, 52], [31, 45]], k);
      p.circ(28, 35, 12, y);
      p.clip(() => { p.rect(14, 34, 28, 3, k); p.rect(14, 40, 28, 3, k); }, (g) => g.ellipse(28, 35, 12, 12, 0, 0, 7));
      p.line([[24, 24], [21, 18], [24, 16], [21, 11]], k, 1.4); p.line([[32, 24], [35, 18], [32, 16], [35, 11]], k, 1.4);
      p.circ(21, 11, 1.6, '#f8f8a0'); p.circ(35, 11, 1.6, '#f8f8a0');
      if (!back) { p.ell(23, 29, 2.6, 3, k); p.ell(33, 29, 2.6, 3, k); p.rect(22, 27, 1, 1, '#ffffff'); p.rect(32, 27, 1, 1, '#ffffff'); p.circ(19, 33, 1.6, '#f0a070'); p.circ(37, 33, 1.6, '#f0a070'); }
    }
  },
  rock(p, st, back) {
    const big = st >= 2, third = st === 3;
    const r = third ? '#6c7060' : big ? '#8a8070' : '#9a9a9a', rl = third ? '#90a080' : big ? '#b0a890' : '#c0c0c0', rd = big ? '#605848' : '#6a6a6a';
    if (third) { p.rect(25, 0, 3, 8, '#7a5030'); p.circ(26, 2, 5, '#3a9a3a'); p.circ(32, 4, 4, '#48b048'); p.circ(20, 4, 3, '#48b048'); }
    if (big) {
      p.rect(12, 44, 7, 9, rd); p.rect(37, 44, 7, 9, rd);
      p.ell(28, 40, 21, 12, r);
      p.poly([[12, 32], [18, 22], [26, 28]], rl); p.poly([[28, 28], [34, 20], [42, 30]], rl);
      p.poly([[19, 26], [4, 14], [6, 6], [10, 16], [22, 22]], rl); p.poly(mirror([[19, 26], [4, 14], [6, 6], [10, 16], [22, 22]]), rl);
      p.circ(28, 30, 10, r);
      if (!back) { p.eye(23, 28, 2, true); p.eye(33, 28, 2, true); p.ell(28, 35, 5, 3, rl); p.circ(26, 35, 0.9, rd); p.circ(30, 35, 0.9, rd); }
      p.line([[16, 42], [20, 38], [19, 34]], rd, 1); p.line([[38, 44], [36, 40]], rd, 1);
    } else {
      p.ell(14, 40, 4, 3, r); p.ell(42, 40, 4, 3, r);
      p.poly([[14, 46], [12, 34], [18, 24], [28, 20], [38, 23], [44, 34], [42, 46], [34, 51], [22, 51]], r);
      p.poly([[18, 26], [28, 21], [34, 23], [24, 30]], rl);
      p.line([[36, 30], [40, 36], [38, 42]], rd, 1);
      if (!back) { p.eye(23, 36, 2.2, true); p.eye(33, 36, 2.2, true); p.line([[25, 43], [31, 43]], '#303030', 1.2); }
      p.ell(22, 52, 5, 2, rd); p.ell(34, 52, 5, 2, rd);
    }
  },
  dog(p, st, back) {
    const big = st === 2;
    const f = big ? '#c06838' : '#e0b068', fd = big ? '#8a4020' : '#b07838', m = big ? '#f0c090' : '#f8e0b0';
    if (big) {
      p.line([[44, 34], [52, 22]], f, 4);
      p.rect(16, 44, 6, 10, fd); p.rect(34, 44, 6, 10, fd);
      p.ell(28, 40, 15, 10, f);
      p.poly([[16, 32], [18, 26], [26, 26], [27, 32]], '#a04828'); p.poly([[29, 32], [30, 25], [38, 25], [40, 32]], '#a04828');
      p.rect(18, 25, 8, 2, '#d89060'); p.rect(30, 24, 8, 2, '#d89060');
      p.poly([[17, 16], [14, 3], [24, 11]], f); p.poly(mirror([[17, 16], [14, 3], [24, 11]]), f);
      p.circ(28, 19, 11, f);
      if (!back) { p.ell(28, 25, 7, 5, m); p.eye(23, 17, 2, true); p.eye(33, 17, 2, true); p.circ(28, 22, 1.8, '#202028'); p.ell(28, 42, 7, 5, m); }
    } else {
      p.line([[38, 40], [46, 30]], f, 3.5);
      p.rect(21, 47, 4, 6, fd); p.rect(31, 47, 4, 6, fd);
      p.ell(28, 43, 11, 8, f);
      p.ell(17, 25, 5, 8, fd, 0.4); p.ell(39, 25, 5, 8, fd, -0.4);
      p.circ(28, 28, 11, f);
      p.circ(35, 24, 3, fd);
      if (!back) { p.ell(28, 33, 6, 4, m); p.eye(23, 26, 2.3); p.eye(33, 26, 2.3); p.circ(28, 31, 1.7, '#202028'); p.rect(27, 35, 2, 2, '#f07080'); }
    }
  },
};


// ---------------- generated body plans ----------------
// spec: {plan, c:[main, accent, belly], f:'ears=pointy tail=flame eyes=mean mane ...'}
function feats(f) {
  const o = {};
  for (const t of (f || '').split(/\s+/).filter(Boolean)) { const [k, v] = t.split('='); o[k] = v ?? true; }
  return o;
}
function shade(hexc, k) {
  const [r, g, b] = hex(hexc);
  const f = (x) => Math.max(0, Math.min(255, Math.round(x * k))).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}
function drawEyes(p, x1, x2, y, F, r = 2.3) {
  const style = F.eyes || 'cute';
  if (style === 'one') { p.ell((x1 + x2) / 2, y, r * 1.6, r * 1.6, '#f8f8f8'); p.circ((x1 + x2) / 2, y, r * 0.9, '#202028'); return; }
  for (const x of [x1, x2]) {
    if (style === 'sleepy') { p.line([[x - r, y], [x + r, y + 0.5]], '#202028', 1.3); continue; }
    if (style === 'big') { p.ell(x, y, r * 1.2, r * 1.5, '#202028'); p.rect(Math.round(x - r * 0.6), Math.round(y - r), 2, 2, '#ffffff'); continue; }
    p.eye(x, y, r, style === 'mean');
  }
}
function drawEars(p, cx, cy, R, F, C) {
  const k = F.ears; if (!k) return;
  const inner = shade(C[0], 0.7);
  if (k === 'pointy') { for (const s of [-1, 1]) { p.poly([[cx + s * R * 0.35, cy - R * 0.6], [cx + s * R * 0.95, cy - R * 1.55], [cx + s * R * 0.95, cy - R * 0.35]], C[0]); p.poly([[cx + s * R * 0.55, cy - R * 0.65], [cx + s * R * 0.88, cy - R * 1.25], [cx + s * R * 0.88, cy - R * 0.6]], inner); } }
  if (k === 'round') for (const s of [-1, 1]) { p.circ(cx + s * R * 0.8, cy - R * 0.8, R * 0.42, C[0]); p.circ(cx + s * R * 0.8, cy - R * 0.8, R * 0.22, inner); }
  if (k === 'long') for (const s of [-1, 1]) { p.ell(cx + s * R * 0.45, cy - R * 1.4, R * 0.28, R * 0.85, C[0], s * 0.15); p.ell(cx + s * R * 0.45, cy - R * 1.35, R * 0.13, R * 0.6, inner, s * 0.15); }
  if (k === 'floppy') for (const s of [-1, 1]) p.ell(cx + s * R * 1.0, cy - R * 0.1, R * 0.35, R * 0.7, inner, s * -0.4);
}
function drawHorns(p, cx, top, F, col) {
  const k = F.horn; if (!k) return;
  if (k === 'one') p.poly([[cx - 3, top + 3], [cx, top - 9], [cx + 3, top + 3]], col);
  if (k === 'two') for (const s of [-1, 1]) p.poly([[cx + s * 4, top + 3], [cx + s * 9, top - 7], [cx + s * 8, top + 4]], col);
  if (k === 'antler') for (const s of [-1, 1]) { p.line([[cx + s * 4, top + 2], [cx + s * 10, top - 8], [cx + s * 16, top - 12]], col, 2); p.line([[cx + s * 8, top - 5], [cx + s * 7, top - 13]], col, 2); p.line([[cx + s * 12, top - 10], [cx + s * 15, top - 17]], col, 2); }
}
function drawTail(p, x, y, F, C) {
  const k = F.tail; if (!k) return;
  if (k === 'thin') p.line([[x, y], [x + 8, y - 4], [x + 11, y - 12], [x + 9, y - 16]], shade(C[0], 0.85), 2);
  if (k === 'fluffy') p.ell(x + 7, y - 6, 6, 9, C[2], -0.5);
  if (k === 'flame') { p.ell(x + 7, y - 7, 5, 8, '#e04020', -0.3); p.ell(x + 7, y - 5, 3, 5, '#f8d030', -0.3); }
  if (k === 'spike') p.poly([[x, y], [x + 6, y - 10], [x + 4, y - 4], [x + 12, y - 8], [x + 5, y + 2]], C[1]);
  if (k === 'leaf') p.ell(x + 7, y - 6, 4, 8, '#58b848', -0.6);
}
function drawWings(p, F, C, cy = 30) {
  const k = F.wings; if (!k) return;
  const w = shade(C[1], 1.1);
  if (k === 'small') for (const s of [-1, 1]) p.ell(28 + s * 13, cy, 7, 5, w, s * 0.5);
  if (k === 'big' || k === 'spread') for (const s of [-1, 1]) p.poly([[28 + s * 6, cy - 2], [28 + s * 27, cy - 14], [28 + s * 25, cy], [28 + s * 27, cy + 8], [28 + s * 8, cy + 8]].map(([x, y2]) => [x, y2]), w);
  if (k === 'bat') for (const s of [-1, 1]) p.poly([[28 + s * 6, cy - 4], [28 + s * 26, cy - 12], [28 + s * 23, cy + 2], [28 + s * 18, cy - 2], [28 + s * 15, cy + 6], [28 + s * 10, cy + 2]], w);
}
function drawExtrasHead(p, cx, top, F, C, back) {
  if (F.crest) p.poly([[cx - 5, top + 3], [cx - 3, top - 6], [cx, top + 1], [cx + 2, top - 8], [cx + 4, top + 1], [cx + 7, top - 5], [cx + 6, top + 4]], C[1]);
  if (F.crown) { p.poly([[cx - 7, top + 1], [cx - 7, top - 6], [cx - 3, top - 2], [cx, top - 8], [cx + 3, top - 2], [cx + 7, top - 6], [cx + 7, top + 1]], '#f0c830'); }
  if (F.tuft) p.line([[cx, top + 2], [cx - 1, top - 4], [cx + 4, top - 6], [cx + 3, top - 2]], C[1], 2);
  if (F.cap) { p.ell(cx, top + 3, 12, 6, shade(C[0], 0.65)); p.line([[cx, top - 2], [cx + 2, top - 7]], '#6a4020', 2); }
  if (F.leaves) { p.ell(cx - 6, top, 6, 4, C[1], -0.5); p.ell(cx + 6, top, 6, 4, C[1], 0.5); p.ell(cx, top - 3, 5, 4, C[1]); }
  if (F.petals) for (let i = 0; i < 6; i++) { const a = Math.PI + (i / 5) * Math.PI; p.ell(cx + Math.cos(a) * 9, top + 4 + Math.sin(a) * 6, 4, 6, C[1], a + Math.PI / 2); }
  if (F.star) p.poly([[cx, top - 8], [cx + 2, top - 3], [cx + 7, top - 3], [cx + 3, top], [cx + 5, top + 5], [cx, top + 2], [cx - 5, top + 5], [cx - 3, top], [cx - 7, top - 3], [cx - 2, top - 3]], '#f8e040');
  if (F.antenna) for (const s of [-1, 1]) { p.line([[cx + s * 3, top + 2], [cx + s * 7, top - 7]], '#302828', 1.3); p.circ(cx + s * 7, top - 7, 1.8, C[1]); }
  if (F.stem) p.rect(cx - 1, top - 6, 3, 7, '#58a040');
}
function drawFace(p, cx, cy, R, F, C, back) {
  if (back) return;
  drawEyes(p, cx - R * 0.42, cx + R * 0.42, cy - R * 0.05, F, Math.max(1.8, R * 0.22));
  if (F.fangs) { p.poly([[cx - 3, cy + R * 0.4], [cx - 1.5, cy + R * 0.75], [cx - 0.5, cy + R * 0.4]], '#ffffff'); p.poly([[cx + 0.5, cy + R * 0.4], [cx + 1.5, cy + R * 0.75], [cx + 3, cy + R * 0.4]], '#ffffff'); }
  else p.line([[cx - 2, cy + R * 0.42], [cx, cy + R * 0.52], [cx + 2, cy + R * 0.42]], shade(C[0], 0.45), 1.1);
}
function pattern(p, F, C, shapeFn, box) {
  if (!F.pat) return;
  const [x, y, w, h] = box;
  const col = shade(C[0], 0.72);
  p.clip(() => {
    if (F.pat === 'spots') for (let i = 0; i < 5; i++) p.circ(x + ((i * 37) % w), y + ((i * 23) % h), 2.2, col);
    if (F.pat === 'stripes') for (let i = 0; i < w; i += 6) p.rect(x + i, y, 2, h, col);
  }, shapeFn);
}

const PLAN = {
  quad(p, C, F, back) {
    const dark = shade(C[0], 0.75);
    if (F.glow) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.rect(28 + Math.cos(a) * 26, 32 + Math.sin(a) * 22, 2, 2, C[1]); }
    drawTail(p, 40, 38, F, C);
    p.rect(15, 42, 5, 10, dark); p.rect(36, 42, 5, 10, dark);
    p.ell(28, 40, 15, 10, C[0]);
    if (F.shell) p.ell(28, 37, 14, 8, C[1]);
    if (F.spikes) for (let i = 0; i < 4; i++) p.poly([[18 + i * 6, 32], [21 + i * 6, 25], [24 + i * 6, 32]], C[1]);
    pattern(p, F, C, (g) => g.ellipse(28, 40, 15, 10, 0, 0, 7), [13, 30, 30, 20]);
    for (const [fx, fy] of [[17, 36], [21, 33], [36, 35], [39, 39], [16, 42], [34, 31]]) p.line([[fx, fy], [fx + 1.2, fy + 1.6]], shade(C[0], 0.78), 0.5);
    p.rect(20, 44, 5, 9, C[0]); p.rect(31, 44, 5, 9, C[0]);
    if (!back) { p.rect(20, 51, 5, 2, C[2]); p.rect(31, 51, 5, 2, C[2]); p.ell(28, 45, 7, 4, C[2]); for (const fx of [21.6, 23.4, 32.6, 34.4]) p.rect(fx, 51.2, 0.5, 1.6, shade(C[0], 0.5)); }
    if (F.mane) for (let i = 0; i < 10; i++) { const a = Math.PI * (0.85 + i * 0.145); p.poly([[28 + Math.cos(a) * 8, 25 + Math.sin(a) * 7], [28 + Math.cos(a) * 15, 25 + Math.sin(a) * 13], [28 + Math.cos(a + 0.25) * 8, 25 + Math.sin(a + 0.25) * 7]], C[1]); }
    drawEars(p, 28, 24, 10, F, C);
    drawHorns(p, 28, 15, F, F.horn === 'antler' ? '#c8a070' : C[2]);
    p.circ(28, 25, 10, C[0]);
    if (!back) p.ell(28, 29, 5.5, 3.5, C[2]);
    drawExtrasHead(p, 28, 15, F, C, back);
    drawFace(p, 28, 24, 10, F, C, back);
  },
  biped(p, C, F, back) {
    const dark = shade(C[0], 0.75);
    if (F.glow) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.rect(28 + Math.cos(a) * 25, 30 + Math.sin(a) * 24, 2, 2, C[1]); }
    drawWings(p, F, C, 30);
    drawTail(p, 36, 44, F, C);
    p.rect(21, 44, 5, 9, dark); p.rect(30, 44, 5, 9, dark);
    p.ell(28, 38, 10, 11, C[0]);
    for (const [fx, fy] of [[21, 31], [35, 32], [20, 42], [36, 41]]) p.line([[fx, fy], [fx + 1, fy + 1.6]], shade(C[0], 0.78), 0.5);
    if (!back) p.ell(28, 40, 6, 7, C[2]);
    if (F.belt) p.rect(18, 42, 20, 3, C[1]);
    for (const s of [-1, 1]) {
      p.ell(28 + s * 12, 37, 3.5, 7, C[0], s * -0.4);
      if (F.gloves) p.circ(28 + s * 14, 43, 4, C[1]);
      if (F.claws) p.poly([[28 + s * 13, 42], [28 + s * 17, 47], [28 + s * 12, 45]], '#f8f8f8');
    }
    if (F.mane) for (let i = 0; i < 10; i++) { const a = Math.PI * (0.85 + i * 0.145); p.poly([[28 + Math.cos(a) * 8, 20 + Math.sin(a) * 7], [28 + Math.cos(a) * 15, 20 + Math.sin(a) * 13], [28 + Math.cos(a + 0.25) * 8, 20 + Math.sin(a + 0.25) * 7]], C[1]); }
    drawEars(p, 28, 19, 10, F, C);
    drawHorns(p, 28, 10, F, C[2]);
    if (F.petals) drawExtrasHead(p, 28, 12, { petals: true }, C, back);
    p.circ(28, 20, 10, C[0]);
    drawExtrasHead(p, 28, 10, { ...F, petals: false }, C, back);
    drawFace(p, 28, 20, 10, F, C, back);
  },
  bird(p, C, F, back) {
    const wingC = shade(C[0], 0.72);
    if (F.wings === 'spread' || F.wings === 'big') for (const s of [-1, 1]) p.poly([[28 + s * 6, 28], [28 + s * 27, 14], [28 + s * 25, 26], [28 + s * 27, 34], [28 + s * 8, 40]], wingC);
    else if (F.wings === 'bat') drawWings(p, F, [C[0], wingC, C[2]], 30);
    else { p.ell(15, 38, 5, 9, wingC, 0.3); p.ell(41, 38, 5, 9, wingC, -0.3); }
    drawTail(p, 36, 48, F, C);
    p.circ(28, 36, 12, C[0]);
    if (F.crown) drawExtrasHead(p, 28, 25, { crown: true }, C, back);
    if (F.crest) p.poly([[25, 25], [24, 16], [28, 22], [32, 15], [31, 25]], C[1]);
    drawEars(p, 28, 33, 11, F, C);
    if (!back) {
      p.ell(28, 41, 7.5, 7, C[2]);
      drawEyes(p, 23, 33, 32, F, 2.2);
      if (F.beak === 'long') p.poly([[25, 35], [31, 35], [28, 46]], '#f8b030');
      else p.poly([[25, 35], [31, 35], [28, 40]], '#f8c030');
      if (F.fangs) { p.rect(25, 38, 1, 2, '#fff'); p.rect(31, 38, 1, 2, '#fff'); }
    }
    p.line([[24, 47], [24, 52]], '#f8a030', 1.8); p.line([[32, 47], [32, 52]], '#f8a030', 1.8);
  },
  fish(p, C, F, back) {
    p.poly([[40, 32], [53, 22], [50, 32], [53, 44]], C[1]);
    if (F.fin) p.poly([[20, 24], [30, 14], [34, 25]], C[1]); else p.poly([[22, 24], [28, 18], [32, 24]], C[1]);
    p.ell(26, 33, 17, 11, C[0]);
    pattern(p, F, C, (g) => g.ellipse(26, 33, 17, 11, 0, 0, 7), [10, 22, 34, 22]);
    if (!back) {
      p.ell(24, 38, 11, 4, C[2]);
      drawEyes(p, 15, 15, 30, { eyes: F.eyes === 'mean' ? 'mean' : F.eyes === 'big' ? 'big' : 'cute' }, 2.4);
      p.line([[9, 35], [12, 36]], shade(C[0], 0.5), 1.2);
    }
    p.poly([[24, 42], [28, 50], [32, 42]], C[1]);
  },
  serpent(p, C, F, back) {
    if (F.glow) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.rect(28 + Math.cos(a) * 26, 32 + Math.sin(a) * 22, 2, 2, C[1]); }
    const pts = [[44, 50], [36, 51], [27, 50], [20, 46], [18, 39], [23, 33], [29, 29]];
    pts.forEach(([x, y], i) => {
      const r = 5 + i * 0.6;
      if (F.fin && i > 1) p.poly([[x - 2, y - r + 1], [x + 1, y - r - 5], [x + 3, y - r + 1]], C[1]);
      if (F.spikes && i > 1) p.poly([[x - 2, y - r + 1], [x, y - r - 4], [x + 2, y - r + 1]], C[1]);
      p.circ(x, y, r, C[0]);
      if (!back && i > 0) p.circ(x - 1, y + 1, r * 0.55, C[2]);
      if (F.pat === 'spots' && i % 2) p.circ(x + 1, y - r * 0.4, 1.8, shade(C[0], 0.7));
      if (F.pat === 'stripes') p.rect(x - 1, y - r, 2, r * 2, shade(C[0], 0.72));
    });
    p.ell(30, 19, 10, 8.5, C[0]);
    drawEars(p, 30, 19, 9, F, C);
    drawHorns(p, 30, 11, F, C[2]);
    drawExtrasHead(p, 30, 11, F, C, back);
    if (!back) { p.ell(30, 23, 6, 3.5, C[2]); }
    drawFace(p, 30, 18, 9, F, C, back);
  },
  bug(p, C, F, back) {
    const dark = '#302828';
    if (F.wings === 'big') for (const s of [-1, 1]) { p.ell(28 + s * 15, 24, 11, 9, C[1], s * 0.5); p.ell(28 + s * 13, 38, 8, 6, shade(C[1], 0.85), s * -0.4); }
    else drawWings(p, F, [C[0], '#d8f0ff', C[2]], 28);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) p.line([[28 + s * 5, 34 + i * 5], [28 + s * 13, 38 + i * 6], [28 + s * 15, 44 + i * 4]], dark, 1.4);
    if (F.claws) for (const s of [-1, 1]) { p.line([[28 + s * 6, 30], [28 + s * 14, 26]], C[0], 3); p.ell(28 + s * 17, 22, 6, 5, C[0], s * 0.4); p.poly([[28 + s * 17, 18], [28 + s * 22, 14], [28 + s * 20, 21]], C[2]); }
    if (F.stinger) p.poly([[25, 50], [28, 56], [31, 50]], dark);
    p.ell(28, 42, 9, 9, C[0]);
    if (F.shell) { p.ell(28, 40, 10, 10, C[1]); p.line([[28, 31], [28, 50]], dark, 1); }
    if (F.pat === 'stripes') p.clip(() => { p.rect(18, 39, 22, 3, dark); p.rect(18, 45, 22, 3, dark); }, (g) => g.ellipse(28, 42, 9, 9, 0, 0, 7));
    p.ell(28, 31, 7, 6, shade(C[0], 0.85));
    drawHorns(p, 28, 17, F, C[1]);
    drawExtrasHead(p, 28, 18, F, C, back);
    p.circ(28, 23, 7.5, C[0]);
    if (!back) drawEyes(p, 25, 31, 23, F, 2.2);
  },
  blob(p, C, F, back) {
    if (F.shell) { p.circ(40, 30, 11, C[1]); p.line([[40, 30], [44, 30], [44, 25], [37, 24], [34, 31], [40, 37], [48, 33]], shade(C[1], 0.6), 1.3); }
    if (F.tentacles) for (let i = 0; i < 4; i++) p.line([[18 + i * 7, 46], [16 + i * 7, 53]], C[0], 3);
    if (F.drips) for (const x of [14, 26, 40]) p.ell(x, 51, 2.5, 3.5, C[1]);
    if (F.spikes) for (let i = 0; i < 5; i++) p.poly([[14 + i * 7, 28], [17 + i * 7, 18], [20 + i * 7, 28]], C[1]);
    drawEars(p, 28, 34, 14, F, C);
    if (F.petals) drawExtrasHead(p, 28, 22, { petals: true }, C, back);
    p.ell(28, 38, 16, 14, C[0]);
    if (!back) p.ell(28, 43, 10, 7, C[2]);
    if (F.feet) { p.ell(18, 51, 6, 3, C[1]); p.ell(38, 51, 6, 3, C[1]); } else { p.ell(20, 51, 4, 2.5, shade(C[0], 0.75)); p.ell(36, 51, 4, 2.5, shade(C[0], 0.75)); }
    drawExtrasHead(p, 28, 24, { ...F, petals: false, spikes: false }, C, back);
    drawFace(p, 28, 36, 12, F, C, back);
  },
  plant(p, C, F, back) {
    for (const s of [-1, 1]) p.ell(28 + s * 15, 40, 9, 4.5, C[0], s * 0.5);
    if (F.spikes) for (const s of [-1, 1]) p.poly([[28 + s * 10, 30], [28 + s * 18, 22], [28 + s * 14, 32]], C[1]);
    p.ell(28, 40, 13, 12, F.stem ? C[0] : C[1]);
    if (F.stem) for (let i = -2; i <= 2; i++) p.line([[28 + i * 5, 30], [28 + i * 5.5, 50]], shade(C[0], 0.8), 1);
    if (!F.stem) p.ell(28, 43, 9, 7, C[0]);
    if (F.petals) for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; p.ell(28 + Math.cos(a) * 11, 28 + Math.sin(a) * 8, 4.5, 7, C[1], a + Math.PI / 2); }
    else if (!F.stem) { p.ell(22, 24, 4, 8, C[0], -0.4); p.ell(34, 24, 4, 8, C[0], 0.4); }
    if (F.stem) drawExtrasHead(p, 28, 28, { stem: true }, C, back);
    p.ell(22, 51, 4, 2, shade(C[0], 0.7)); p.ell(34, 51, 4, 2, shade(C[0], 0.7));
    drawFace(p, 28, 39, 11, F, C, back);
  },
  golem(p, C, F, back) {
    const dark = shade(C[0], 0.7);
    p.rect(17, 44, 8, 9, dark); p.rect(31, 44, 8, 9, dark);
    for (const s of [-1, 1]) p.rect(s < 0 ? 6 : 42, 26, 8, 16, C[0]);
    if (F.spikes) for (const s of [-1, 1]) p.poly([[28 + s * 14, 26], [28 + s * 20, 18], [28 + s * 18, 28]], C[1]);
    p.poly([[14, 26], [42, 26], [44, 46], [12, 46]], C[0]);
    if (F.gear && !back) { p.circ(28, 36, 7, C[1]); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; p.rect(27 + Math.cos(a) * 8, 35 + Math.sin(a) * 8, 3, 3, C[1]); } p.circ(28, 36, 2.5, dark); }
    else if (!back) p.rect(20, 32, 16, 10, C[2]);
    if (F.leaves) { p.circ(28, 8, 8, C[1]); p.circ(20, 11, 6, C[1]); p.circ(36, 11, 6, C[1]); }
    p.rect(19, 12, 18, 14, C[0]); p.rect(20, 11, 16, 1, C[0]);
    drawExtrasHead(p, 28, 11, { crown: F.crown }, C, back);
    if (!back) drawEyes(p, 24, 32, 19, F, 2.2);
  },
  floater(p, C, F, back) {
    if (F.glow) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.rect(28 + Math.cos(a) * 25, 30 + Math.sin(a) * 23, 2, 2, C[1]); }
    drawWings(p, F, C, 28);
    if (F.spikes) for (let i = 0; i < 7; i++) { const a = Math.PI * (1 + i / 6); p.poly([[28 + Math.cos(a) * 11, 26 + Math.sin(a) * 11], [28 + Math.cos(a + 0.2) * 19, 26 + Math.sin(a + 0.2) * 19], [28 + Math.cos(a + 0.4) * 11, 26 + Math.sin(a + 0.4) * 11]], C[1]); }
    p.circ(28, 26, 13, C[0]);
    p.poly([[15, 26], [41, 26], [41, 44], [37, 40], [33, 46], [28, 41], [23, 46], [19, 40], [15, 44]], C[0]);
    for (const s of [-1, 1]) p.ell(28 + s * 15, 32, 3, 5, C[0], s * 0.6);
    if (!back) p.ell(28, 34, 7, 6, C[2]);
    drawExtrasHead(p, 28, 13, F, C, back);
    if (!back) { drawEyes(p, 23, 33, 24, F, 2.6); p.line([[25, 30], [28, 32], [31, 30]], shade(C[0], 0.5), 1.1); }
  },
  dragon(p, C, F, back) {
    if (F.glow) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.rect(28 + Math.cos(a) * 26, 30 + Math.sin(a) * 24, 2, 2, C[1]); }
    drawWings(p, F, C, 28);
    p.line([[36, 46], [46, 48], [52, 42]], C[0], 5); p.poly([[50, 38], [56, 40], [52, 45]], C[1]);
    p.rect(19, 44, 6, 9, shade(C[0], 0.75)); p.rect(31, 44, 6, 9, shade(C[0], 0.75));
    p.ell(28, 39, 11, 11, C[0]);
    if (!back) p.ell(28, 41, 6, 8, C[2]);
    for (const s of [-1, 1]) p.ell(28 + s * 11, 36, 3, 5, C[0], s * -0.5);
    drawHorns(p, 28, 11, F, C[2]);
    if (F.crest) p.poly([[24, 13], [28, 4], [32, 13]], C[1]);
    p.ell(28, 20, 11, 9, C[0]);
    if (!back) p.ell(28, 24, 6, 4, C[2]);
    drawFace(p, 28, 19, 9, F, C, back);
  },
};

// Battle / DEX sized sprites (48px+) are rendered at 2x resolution for extra detail:
// draw them with an explicit width and height (drawCreature does this).
// Hand-drawn concept art: static/art/creatures/<id>_front.webp and <id>_back.webp,
// listed in static/art/creatures/index.json. Creatures without art keep the
// procedural sprite. Big sizes (battle, Dex) use it; small icons stay pixel art.
const CUSTOM = {};
export function loadCustomArt() {
  return fetch('/static/art/creatures/index.json').then((r) => (r.ok ? r.json() : [])).then((list) => Promise.all(list.map((id) =>
    Promise.all(['front', 'back'].map((side) => new Promise((done) => {
      const im = new Image();
      im.onload = () => { (CUSTOM[id] ||= {})[side] = im; for (const k of [...cache.keys()]) if (k.split(':')[1] === id) cache.delete(k); done(); };
      im.onerror = done;
      im.src = `/static/art/creatures/${id}_${side}.webp`;
    })))))).catch(() => {});
}
export const hasCustomArt = (sp) => !!CUSTOM[sp];
// A thin dark rim around hand-drawn art, so pale or white parts never melt into a light
// battle backdrop (snow, sky, sand). Art that already has a dark outline barely changes.
function addRim(c, w = 3, color = 'rgba(24, 22, 40, 0.92)') {
  const t = mk(c.width, c.height), g = t.getContext('2d');
  for (let dy = -w; dy <= w; dy++) for (let dx = -w; dx <= w; dx++) {
    if (dx * dx + dy * dy > w * w + 1 || (!dx && !dy)) continue;
    g.drawImage(c, dx, dy);
  }
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color; g.fillRect(0, 0, t.width, t.height);
  g.globalCompositeOperation = 'source-over';
  g.drawImage(c, 0, 0);
  const cg = c.getContext('2d');
  cg.clearRect(0, 0, c.width, c.height); cg.drawImage(t, 0, 0);
  return c;
}

export function creature(sp, size = 56, back = false) {
  const key = `c:${sp}:${size}:${back}`;
  if (cache.has(key)) return cache.get(key);
  const s = SPECIES[sp];
  const art = size >= 40 && CUSTOM[sp] && (CUSTOM[sp][back ? 'back' : 'front'] || CUSTOM[sp].front);
  if (art) {
    const R = 6, n = size * R;
    const c = mk(n, n); const g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    const st = (s.art && s.art.stage) || s.stage || 1;
    const k = st === 1 ? 0.82 : st === 2 ? 0.92 : 1;
    const d = n * k;
    g.drawImage(art, (n - d) / 2, n - d - 3, d, d);
    addRim(c);
    c.hd = true;
    cache.set(key, c);
    return c;
  }
  const res = size >= 48 ? 2 : 1;
  const c = mk(size * res, size * res);
  const g = c.getContext('2d');
  g.scale((size * res) / 56, (size * res) / 56);
  const p = painter(g);
  p.shaded = size >= 40;
  p.res = res;
  if (s.family === 'plan') {
    const k = s.art.stage === 1 ? 0.8 : s.art.stage === 2 ? 0.92 : 1;
    g.translate(28, 54); g.scale(k, k); g.translate(-28, -54);
    PLAN[s.art.plan](p, s.art.c, feats(s.art.f), back);
  } else FAM[s.family](p, s.stage, back);
  pixelize(c, [...p.used], '#1c1c2c', size >= 40);
  if (res > 1) thickenOutline(c, '#1c1c2c');
  cache.set(key, c);
  return c;
}
// draw a creature canvas; hand-drawn art is smoothed, pixel art stays crisp
export function blit(g, img, x, y, w, h) {
  const prev = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = !!img.hd;
  if (img.hd) g.imageSmoothingQuality = 'high';
  g.drawImage(img, x, y, w, h);
  g.imageSmoothingEnabled = prev;
}
export function drawCreature(g, sp, size, x, y, back = false) {
  blit(g, creature(sp, size, back), Math.round(x), Math.round(y), size, size);
}
// grow the dark outline by one more pixel so hi-res sprites keep a bold edge
function thickenOutline(c, outline) {
  const g = c.getContext('2d');
  const { width: w, height: h } = c;
  const img = g.getImageData(0, 0, w, h); const d = img.data; const src = new Uint8ClampedArray(d);
  const o = hex(outline);
  const isO = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return false; const i = (y * w + x) * 4; return src[i + 3] && src[i] === o[0] && src[i + 1] === o[1] && src[i + 2] === o[2]; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (src[i + 3]) continue;
    if (isO(x - 1, y) || isO(x + 1, y) || isO(x, y - 1) || isO(x, y + 1)) { d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = 255; }
  }
  g.putImageData(img, 0, 0);
}

// silhouette for unseen / evolution flash
export function silhouette(sp, size = 56, col = '#ffffff') {
  const key = `s:${sp}:${size}:${col}`;
  if (cache.has(key)) return cache.get(key);
  const src = creature(sp, size);
  const c = mk(src.width, src.height); const g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, src.width, src.height);
  c.hd = src.hd;
  cache.set(key, c);
  return c;
}

// ---------------- people (16x24) ----------------
export const LOOKS = {
  gymace: { skin: '#f8d0a8', hair: '#3a9a50', shirt: '#e8f0e8', pants: '#f0f0f0', long: false },
  gymswim: { skin: '#c88858', hair: '#2858c8', shirt: '#3870e0', pants: '#3870e0', long: true },
  gymbelt: { skin: '#c89070', hair: '#202020', shirt: '#2848a8', pants: '#2848a8' },
  player: { skin: '#f8d0a8', hair: '#503018', shirt: '#f09030', pants: '#384870', hat: '#3a7ac8', hatB: '#f8f8f8' },
  kai: { skin: '#f0c8a0', hair: '#283858', shirt: '#3870c8', pants: '#303040', spiky: true },
  juno: { skin: '#e8b890', hair: '#e07830', shirt: '#38a868', pants: '#584038', long: true },
  maple: { skin: '#f8d8b8', hair: '#a07850', shirt: '#f8f8f0', pants: '#787890', coat: true, long: true },
  mom: { skin: '#f8d0a8', hair: '#704020', shirt: '#e890a0', pants: '#6070a0', long: true },
  nurse: { skin: '#f8d8c0', hair: '#5a9ad8', shirt: '#f8f8f8', pants: '#88c8a8', long: true, hat: '#f8f8f8', hatB: '#48b080' },
  clerk: { skin: '#e8c098', hair: '#302820', shirt: '#4878d0', pants: '#384050' },
  bugkid: { skin: '#f8d0a8', hair: '#906030', shirt: '#e8d040', pants: '#507838', hat: '#58a040', hatB: '#407828' },
  lass: { skin: '#f8d8b8', hair: '#c05868', shirt: '#f8a8c0', pants: '#f8f8f8', long: true },
  hiker: { skin: '#d8a070', hair: '#5a3818', shirt: '#a87040', pants: '#706040', hat: '#c09050', hatB: '#806030', beard: true },
  birdkeeper: { skin: '#f0c8a0', hair: '#202028', shirt: '#80c0e0', pants: '#405878', hat: '#f8f8f8', hatB: '#80c0e0' },
  shale: { skin: '#c89068', hair: '#383838', shirt: '#807060', pants: '#503828', spiky: true, beard: true },
  nyx: { skin: '#f0d0c0', hair: '#9858d8', shirt: '#282838', pants: '#282838', long: true, emblem: true },
  corvo: { skin: '#e8c0a0', hair: '#2878c8', shirt: '#282838', pants: '#282838', spiky: true, emblem: true },
  grunt: { skin: '#e8c0a0', hair: '#282838', shirt: '#282838', pants: '#282838', hat: '#282838', hatB: '#f8d030', emblem: true },
  oldman: { skin: '#e8c098', hair: '#d8d8d8', shirt: '#70906a', pants: '#605040', beard: true },
  sailor: { skin: '#e0b088', hair: '#383028', shirt: '#f8f8f8', pants: '#304890', hat: '#f8f8f8', hatB: '#304890' },
  girl: { skin: '#f8d0a8', hair: '#f0c040', shirt: '#a070e0', pants: '#584878', long: true },
  boy: { skin: '#d8a078', hair: '#382010', shirt: '#f09030', pants: '#405068' },
  guide: { skin: '#f0c8a0', hair: '#583018', shirt: '#f8f8f8', pants: '#383848', hat: '#f05050', hatB: '#c03030' },
  aide: { skin: '#f8d8b8', hair: '#383838', shirt: '#f8f8f0', pants: '#606880', coat: true },
  briar: { skin: '#e8c098', hair: '#3a8a3a', shirt: '#88c048', pants: '#5a4030', long: true },
  jolt: { skin: '#f0c8a0', hair: '#f0d030', shirt: '#303848', pants: '#202830', spiky: true },
  marina: { skin: '#d8a078', hair: '#2858a8', shirt: '#58b0e8', pants: '#f8f8f8', long: true },
  kenta: { skin: '#c88858', hair: '#202020', shirt: '#f8f8f8', pants: '#f8f8f8', beard: true },
  sable: { skin: '#f8e0d0', hair: '#202030', shirt: '#c04080', pants: '#402040', long: true },
  ignis: { skin: '#d89068', hair: '#e04020', shirt: '#583020', pants: '#302020', spiky: true },
  vesper: { skin: '#e8c8b0', hair: '#6040c0', shirt: '#3828a0', pants: '#201850', long: true, coat: true },
  frida: { skin: '#f8e8e0', hair: '#c8e8f8', shirt: '#78c8d8', pants: '#f8f8f8', long: true },
  morrow: { skin: '#d8d0e0', hair: '#583878', shirt: '#382848', pants: '#201828', coat: true },
  raze: { skin: '#c89070', hair: '#181818', shirt: '#481818', pants: '#202020', spiky: true },
  ferrum: { skin: '#e0b090', hair: '#909098', shirt: '#7880a0', pants: '#404858', beard: true },
  vex: { skin: '#f0d8c8', hair: '#f8f8f8', shirt: '#181828', pants: '#181828', coat: true, emblem: true },
  scientist: { skin: '#f0c8a0', hair: '#606060', shirt: '#f8f8f8', pants: '#5878a8', coat: true },
  swimmer: { skin: '#e0a878', hair: '#f0c040', shirt: '#3870e0', pants: '#3870e0' },
  blackbelt: { skin: '#d09060', hair: '#202020', shirt: '#f8f8f8', pants: '#f8f8f8', hat: '#202020', hatB: '#202020' },
  psychic: { skin: '#f8d8c8', hair: '#a050a0', shirt: '#6030a0', pants: '#301850', long: true },
  acetrainer: { skin: '#f0c8a0', hair: '#5a3018', shirt: '#2858c0', pants: '#f8f8f8', hat: '#f8f8f8', hatB: '#2858c0' },
  fisher: { skin: '#d8a070', hair: '#504030', shirt: '#80a050', pants: '#405068', hat: '#e0c060', hatB: '#a08040' },
  skier: { skin: '#f8d8c0', hair: '#e07040', shirt: '#e04060', pants: '#284080', hat: '#f8f8f8', hatB: '#e04060' },
  beauty: { skin: '#f8d8c0', hair: '#e8b040', shirt: '#f070a0', pants: '#f070a0', long: true },
  mystic: { skin: '#e0d8e8', hair: '#383050', shirt: '#4a3a70', pants: '#2a2040', long: true, coat: true },
  biker: { skin: '#d8a070', hair: '#c03030', shirt: '#303030', pants: '#405068', spiky: true },
  tamer: { skin: '#e8b890', hair: '#383838', shirt: '#a03838', pants: '#383838', coat: true },
  // Meridia: Professor Cedar, the eight Leaders and the Elite Four
  cedar: { skin: '#d8a880', hair: '#3a5a2a', shirt: '#f8f8f0', pants: '#6a5038', coat: true, long: true },
  tansy: { skin: '#f8d0a8', hair: '#f0c030', shirt: '#f0d040', pants: '#584020', long: true },
  sahar: { skin: '#b07850', hair: '#282018', shirt: '#e0c890', pants: '#a07848', hat: '#f0e0c0', hatB: '#c0a070' },
  aeron: { skin: '#f0c8a0', hair: '#c06830', shirt: '#80b8e0', pants: '#584838', spiky: true },
  fennick: { skin: '#e0c0a8', hair: '#70c040', shirt: '#383040', pants: '#584878', spiky: true },
  ysolde: { skin: '#f0e8f0', hair: '#c8c0e0', shirt: '#584870', pants: '#302840', long: true, coat: true },
  bram: { skin: '#c88858', hair: '#a04020', shirt: '#706050', pants: '#383028', beard: true },
  nevia: { skin: '#f8e0d8', hair: '#f0f0f8', shirt: '#a8d8f0', pants: '#f8f8f8', long: true },
  corwin: { skin: '#d8b090', hair: '#181820', shirt: '#282838', pants: '#181828', coat: true },
  calla: { skin: '#c89070', hair: '#30a0b0', shirt: '#58c8d0', pants: '#f8f8f8', long: true },
  dorran: { skin: '#a87048', hair: '#504030', shirt: '#a06838', pants: '#584028', beard: true },
  lyra: { skin: '#f8d8b8', hair: '#58a048', shirt: '#a8d070', pants: '#605030', long: true },
  voss: { skin: '#e8c8a8', hair: '#f8f0a0', shirt: '#383870', pants: '#202040', spiky: true, coat: true },
  // Azurine Isles: Professor Marlowe, the eight Leaders and the Elite Four
  marlowe: { skin: '#c88860', hair: '#e8e0d0', shirt: '#f8f8f0', pants: '#3878a0', coat: true, long: true },
  kalea: { skin: '#c89068', hair: '#302018', shirt: '#e85878', pants: '#58a048', long: true },
  marlin: { skin: '#e0b088', hair: '#2858a0', shirt: '#204870', pants: '#183050', spiky: true },
  cinda: { skin: '#b87850', hair: '#e04820', shirt: '#f0a030', pants: '#a02818', long: true },
  skye: { skin: '#f0d0b0', hair: '#f0f0f0', shirt: '#58b8e8', pants: '#e8e8f0', hat: '#e8d040', hatB: '#a08020' },
  perla: { skin: '#f8e0d0', hair: '#f0a8c8', shirt: '#b83860', pants: '#30a0a0', long: true },
  arc: { skin: '#c89070', hair: '#383838', shirt: '#f0c830', pants: '#304060', long: true, hat: '#f8f8f8', hatB: '#c0c0c8' },
  basalt: { skin: '#a06840', hair: '#585858', shirt: '#808078', pants: '#484038', beard: true },
  wyneth: { skin: '#e0c0a0', hair: '#c8c8d0', shirt: '#583878', pants: '#302040', long: true, coat: true },
  nalu: { skin: '#a87048', hair: '#181818', shirt: '#38a0c0', pants: '#f0e8d0', spiky: true },
  coralie: { skin: '#f0d0c0', hair: '#f07860', shirt: '#f8b0a0', pants: '#f8f0e8', long: true },
  haku: { skin: '#b88058', hair: '#201818', shirt: '#c03020', pants: '#302020', spiky: true, coat: true },
  mira: { skin: '#e8d8e8', hair: '#283858', shirt: '#2a3050', pants: '#181828', long: true, coat: true },
};

// The player can be a boy or a girl. LOOKS.player is swapped in place so every
// sprite and portrait that asks for 'player' follows the choice.
const PLAYER_LOOKS = {
  boy: { ...LOOKS.player },
  girl: { skin: '#f8d0a8', hair: '#7a4a28', shirt: '#38a8a0', pants: '#4a3a68', hat: '#d84848', hatB: '#f8f8f8', long: true },
};
let PLAYER_GENDER = 'boy';
export function setPlayerLook(gender) {
  PLAYER_GENDER = gender === 'girl' ? 'girl' : 'boy';
  for (const k of Object.keys(LOOKS.player)) delete LOOKS.player[k];
  Object.assign(LOOKS.player, PLAYER_LOOKS[gender === 'girl' ? 'girl' : 'boy']);
  for (const k of [...cache.keys()]) if (k.startsWith('p:player:') || k.startsWith('tp:player:')) cache.delete(k);
}

// Overworld people: small GBA-scale sprites (about 12x17 inside a 16x19 canvas). The body
// sits inside the tile and only the very top of the head pokes above it (drawn 3px up).
// Hand-made pixel sprites for the player: static/art/player/<gender>_<down|up|right0|right1>.png
const PLAYER_PIX = {};
// overworld pixel frames: a standing pose plus two steps (left foot, right foot) per direction;
// sheets without walk frames fall back to down/up/right0/right1
const PIX_FRAMES = ['down', 'up', 'right0', 'right1', 'down0', 'down1', 'down2', 'up0', 'up1', 'up2', 'right2'];
export function loadPlayerSprites() {
  for (const gd of ['boy', 'girl']) for (const f of PIX_FRAMES) {
    const im = new Image();
    im.onload = () => { (PLAYER_PIX[gd] ||= {})[f] = im; for (const k of [...cache.keys()]) if (k.startsWith('p:player:')) cache.delete(k); };
    im.src = `/static/art/player/${gd}_${f}.png`;
  }
}
// Hand-made pixel sprites for townspeople and trainers: static/art/npc/<look>_<dir>.png,
// listed in static/art/npc/index.json. Looks without sprites keep the generated ones.
const NPC_PIX = {};
export function loadNpcSprites() {
  return fetch('/static/art/npc/index.json').then((r) => (r.ok ? r.json() : {})).then((idx) => {
    // looks marked walk:true in index.json also ship the 3-frame walk cycle for every direction
    for (const look of Object.keys(idx)) for (const f of (idx[look].walk ? PIX_FRAMES : ['down', 'up', 'right0', 'right1'])) {
      const im = new Image();
      im.onload = () => { (NPC_PIX[look] ||= {})[f] = im; for (const k of [...cache.keys()]) if (k.startsWith(`p:${look}:`)) cache.delete(k); };
      im.src = `/static/art/npc/${look}_${f}.png`;
    }
  }).catch(() => {});
}
// every sheet is drawn at its own pixel size, so each is scaled to a common on-screen height:
// about 21 px for adults (a tile and a bit), 18 for kids; the hero sits between the two
const PLAYER_TALL = 20;
const KID_LOOKS = new Set(['lass', 'girl', 'boy', 'bugkid', 'kai', 'juno']);
function pixFrame(P, dir, step) {
  const side = dir === 'left' || dir === 'right';
  if (side) return step === 2 ? (P.right2 || P.right1 || P.right0) : step ? (P.right1 || P.right0) : P.right0;
  const d = dir === 'up' ? 'up' : 'down';
  return (step && P[d + step]) || P[d + '0'] || P[d];
}
function pixSprite(P, dir, step, scale) {
  if (!P || !P.down || !P.up || !P.right0) return null;
  const side = dir === 'left' || dir === 'right';
  const src = pixFrame(P, dir, step);
  const walking = side ? !!P.right1 : !!P[(dir === 'up' ? 'up' : 'down') + '1'];
  const U = 4;
  const c = mk(src.width * U, src.height * U); const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  if (dir === 'left') { g.translate(c.width, 0); g.scale(-1, 1); }
  g.drawImage(src, 0, 0, c.width, c.height);
  c.lw = src.width * scale; c.lh = src.height * scale;
  c.ox = (16 - c.lw) / 2;
  // sheets with no walk frames for this direction bob a pixel instead
  c.oy = 19 - c.lh - (!walking && step ? 1 : 0);
  return c;
}
function playerPixel(dir, step) {
  const P = PLAYER_PIX[PLAYER_GENDER];
  return P && P.down ? pixSprite(P, dir, step, PLAYER_TALL / P.down.height) : null;
}
export function person(lookId, dir = 'down', step = 0) {
  const key = `p:${lookId}:${dir}:${step}`;
  if (cache.has(key)) return cache.get(key);
  if (lookId === 'player') { const pc = playerPixel(dir, step); if (pc) { cache.set(key, pc); return pc; } }
  else if (NPC_PIX[lookId] && NPC_PIX[lookId].down) {
    // every sheet is drawn at its own pixel size: scale each to a common height (kids a little shorter)
    const tall = KID_LOOKS.has(lookId) ? 18 : 21;
    const pc = pixSprite(NPC_PIX[lookId], dir, step, tall / NPC_PIX[lookId].down.height);
    if (pc) { cache.set(key, pc); return pc; }
  }
  const L = LOOKS[lookId] || LOOKS.boy;
  const c = mk(16, 19); const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const sk = L.skin, skS = shade(sk, 0.82), hr = L.hair, hrS = shade(hr, 0.72), hrH = shade(hr, 1.3);
  const sh = L.shirt, shS = shade(sh, 0.75), shH = shade(sh, 1.18), pa = L.pants, paS = shade(pa, 0.72);
  const shoe = '#3a3040', sole = '#201828';
  const side = dir === 'left' || dir === 'right';
  const by = step ? -1 : 0;
  const hy = 2 + by;          // top of head
  const tTop = hy + 8;        // top of torso
  // ---- legs & shoes ----
  if (side) {
    const st2 = step === 1 ? -1 : step === 2 ? 1 : 0;
    px(6 - st2, 14, 2, 2, paS); px(8 + st2, 14, 2, 2, pa);
    px(5 - st2, 16, 3, 1, shoe); px(8 + st2, 16, 3, 1, shoe); px(5 - st2, 17, 3, 1, sole); px(8 + st2, 17, 3, 1, sole);
  } else {
    const lu = step === 1 ? 1 : 0, ru = step === 2 ? 1 : 0;
    px(5, 14, 3, 2 - lu, pa); px(8, 14, 3, 2 - ru, pa); px(7, 14, 1, 2 - lu, paS); px(10, 14, 1, 2 - ru, paS);
    px(5, 16 - lu, 3, 1, shoe); px(8, 16 - ru, 3, 1, shoe); px(5, 17 - lu, 3, 1, sole); px(8, 17 - ru, 3, 1, sole);
  }
  // ---- long hair behind ----
  if (L.long && dir !== 'up') { if (side) px(8, hy + 5, 3, 5, hrS); else { px(4, hy + 5, 1, 5, hrS); px(11, hy + 5, 1, 5, hrS); } }
  // ---- torso ----
  const tH = L.coat ? 4 : 3;
  if (side) { px(6, tTop, 4, tH, sh); px(dir === 'left' ? 9 : 6, tTop, 1, tH, shS); }
  else {
    px(5, tTop, 6, tH, sh); px(5, tTop, 1, tH, shH); px(10, tTop, 1, tH, shS);
    if (dir === 'down') px(7, tTop, 2, 1, skS);
    if (L.coat && dir === 'down') px(7, tTop + 1, 2, tH - 1, shade(sh, 0.62));
    if (L.emblem && dir === 'down') px(7, tTop + 1, 2, 1, '#f8d030');
  }
  if (!L.coat) px(side ? 6 : 5, tTop + tH, side ? 4 : 6, 1, shade(pa, 0.8));
  // ---- arms ----
  if (side) {
    const sw = step === 1 ? 1 : step === 2 ? -1 : 0;
    const ax = (dir === 'left' ? 7 : 8) + (dir === 'left' ? sw : -sw);
    px(ax, tTop, 1, 2, shS); px(ax, tTop + 2, 1, 1, sk);
  } else {
    const sw = step === 1 ? -1 : step === 2 ? 1 : 0;
    const la = tTop + Math.max(0, sw), ra = tTop + Math.max(0, -sw);
    px(4, la, 1, 1, sh); px(4, la + 1, 1, 2, sk); px(11, ra, 1, 1, sh); px(11, ra + 1, 1, 2, sk);
  }
  // ---- head (8 x 8) ----
  const head = (col) => { px(6, hy, 4, 1, col); px(5, hy + 1, 6, 1, col); px(4, hy + 2, 8, 4, col); px(5, hy + 6, 6, 1, col); px(6, hy + 7, 4, 1, col); };
  head(sk);
  px(5, hy + 6, 6, 1, skS);
  if (dir === 'up') {
    head(hr); px(6, hy + 1, 3, 1, hrH); px(4, hy + 5, 8, 1, hrS);
    if (L.long) px(4, hy + 6, 8, 3, hr);
  } else if (side) {
    const f = dir === 'left';
    px(6, hy, 4, 1, hr); px(5, hy + 1, 6, 1, hr); px(4, hy + 2, 8, 1, hr); px(f ? 8 : 4, hy + 3, 4, 3, hr); px(f ? 9 : 4, hy + 6, 3, 1, hrS);
    px(6, hy + 1, 2, 1, hrH);
    px(f ? 5 : 10, hy + 4, 1, 2, '#202030');
    px(f ? 3 : 12, hy + 5, 1, 1, sk);
    if (L.beard) px(f ? 4 : 8, hy + 5, 4, 2, hr);
  } else {
    px(6, hy, 4, 1, hr); px(5, hy + 1, 6, 1, hr); px(4, hy + 2, 8, 1, hr); px(4, hy + 3, 1, 2, hr); px(11, hy + 3, 1, 2, hr);
    px(5, hy + 3, 2, 1, hr); px(9, hy + 3, 1, 1, hr); px(6, hy + 1, 2, 1, hrH);
    px(6, hy + 4, 1, 2, '#202030'); px(9, hy + 4, 1, 2, '#202030');
    px(5, hy + 5, 1, 1, '#f0a8a0'); px(10, hy + 5, 1, 1, '#f0a8a0');
    if (L.beard) px(5, hy + 5, 6, 2, hr);
  }
  if (L.spiky && !L.hat) { px(5, hy - 1, 1, 1, hr); px(7, hy - 1, 2, 1, hr); px(10, hy - 1, 1, 1, hr); }
  if (L.hat) {
    const hc = L.hat, hcS = shade(hc, 0.75), hb = L.hatB || hcS;
    px(5, hy - 1, 6, 1, hc); px(4, hy, 8, 2, hc); px(5, hy, 2, 1, shade(hc, 1.2)); px(4, hy + 2, 8, 1, hcS);
    if (dir === 'down') { px(4, hy + 3, 8, 1, hb); px(7, hy, 2, 1, hb); }
    else if (side) px(dir === 'left' ? 2 : 8, hy + 3, 6, 1, hb);
  }
  pixelize(c, [], '#202030');
  cache.set(key, c);
  return c;
}

// Battle portraits: a bigger, shaded trainer drawn with shapes and then pixelized.
// pose: 'ready' (facing you, battle stance, pointing), or for your own trainer seen
// from behind: 'throw0' (winding up with an orb) and 'throw1' (orb thrown, arm forward).
// Hand-drawn trainer art: static/art/trainers/<look>_<pose>.webp (pose: ready | defeat),
// listed in static/art/trainers/index.json. Looks without art keep the pixel portrait.
const CUSTOM_TR = {};
export function loadTrainerArt() {
  return fetch('/static/art/trainers/index.json').then((r) => (r.ok ? r.json() : [])).then((list) => Promise.all(list.map((key) => new Promise((done) => {
    const [look, pose] = key.split('_');
    const im = new Image();
    im.onload = () => { (CUSTOM_TR[look] ||= {})[pose] = im; for (const k of [...cache.keys()]) if (k.startsWith(`tp:${look}:`)) cache.delete(k); done(); };
    im.onerror = done;
    im.src = `/static/art/trainers/${key}.webp`;
  })))).catch(() => {});
}
export function trainerPortrait(lookId, pose = 'ready') {
  const key = `tp:${lookId}:${pose}`;
  if (cache.has(key)) return cache.get(key);
  if (lookId === 'player') {
    const P = CUSTOM_TR['player' + PLAYER_GENDER];
    const pic = P && (pose === 'ready' ? P.ready : P.back);
    if (pic) {
      const R = 6, c = mk(56 * R, 76 * R), g = c.getContext('2d');
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(pic, 0, 0, c.width, c.height);
      c.hd = true;
      cache.set(key, c);
      return c;
    }
  }
  const T = CUSTOM_TR[{ gymswim: 'swimmer', gymbelt: 'blackbelt', gymace: 'acetrainer' }[lookId] || lookId];
  const art = T && (pose === 'defeat' ? T.defeat || T.ready : pose === 'ready' ? T.ready : null);
  if (art) {
    const R = 6, c = mk(56 * R, 76 * R), g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(art, 3, 0, c.width - 6, c.height - 3);
    addRim(c);
    c.hd = true;
    cache.set(key, c);
    return c;
  }
  if (pose === 'defeat') return trainerPortrait(lookId, 'ready');
  const L = LOOKS[lookId] || LOOKS.boy;
  const back = pose !== 'ready';
  const c = mk(112, 152); const g = c.getContext('2d');
  g.scale(2, 2); g.translate(4, 2);
  const p = painter(g);
  p.shaded = true; p.res = 2;
  const sk = L.skin, skS = shade(sk, 0.85), hr = L.hair, sh = L.shirt, shS = shade(sh, 0.78), pa = L.pants, paS = shade(pa, 0.8);
  const hrS = shade(hr, 0.75), hrH = shade(hr, 1.3);
  // legs in a wide stance
  p.poly([[16, 52], [22, 52], [17, 68], [10, 68]], pa); p.poly([[26, 52], [32, 52], [38, 68], [31, 68]], paS);
  p.ell(12, 69, 6, 3, '#3a3040'); p.ell(36, 69, 6, 3, '#3a3040'); p.rect(8, 67, 4, 1, '#7a7080'); p.rect(33, 67, 4, 1, '#7a7080');
  if (L.long && !back) p.ell(24, 30, 15, 17, shade(hr, 0.8));
  if (L.long && back) p.ell(24, 30, 14, 18, hr);
  // torso
  const coatLen = L.coat ? 60 : 54;
  p.poly([[12, 32], [36, 32], [38, coatLen], [10, coatLen]], sh);
  p.poly([[29, 32], [36, 32], [38, coatLen], [31, coatLen]], shS);
  p.rect(12, 32, 24, 2, shade(sh, 1.15));
  p.poly([[13, 34], [17, 34], [16, coatLen - 2], [12, coatLen - 2]], shade(sh, 1.08));
  p.line([[12.5, coatLen - 1], [37.5, coatLen - 1]], shade(sh, 0.6), 0.8);
  if (!back) {
    if (L.coat) { p.poly([[21, 33], [24, 33], [24, coatLen], [21, coatLen]], shade(sh, 0.6)); p.poly([[19, 33], [22, 40], [21, 33]], '#f8f8f8'); }
    else { p.rect(12, 50, 24, 3, shade(pa, 0.9)); p.rect(22, 50, 4, 3, '#e0c050'); }
    if (L.emblem) { p.circ(19, 40, 3, '#f8d030'); p.circ(20, 39, 1.5, '#282838'); }
  } else if (!L.coat) p.rect(12, 50, 24, 3, shade(pa, 0.9));
  // clothing details: folds, seams, shoe laces
  p.line([[16, 56], [18, 64]], shade(pa, 0.7), 0.6); p.line([[34, 56], [33, 63]], shade(pa, 0.6), 0.6);
  p.line([[15, 38], [19, 44]], shade(sh, 0.72), 0.6); p.line([[33, 37], [30, 45]], shade(sh, 0.66), 0.6);
  p.rect(10, 66.5, 3, 0.6, '#d8d0e0'); p.rect(34, 66.5, 3, 0.6, '#d8d0e0');
  if (back && lookId === 'player') {
    p.poly([[14, 35], [34, 35], [35, 52], [13, 52]], '#c8743a'); p.poly([[14, 35], [34, 35], [33, 41], [15, 41]], '#e0904a');
    p.rect(22, 40, 4, 3, '#f0d040'); p.rect(15, 46, 18, 1, '#9a5420');
    p.rect(15, 32, 2, 6, '#9a5420'); p.rect(31, 32, 2, 6, '#9a5420');
  } else if (!back && lookId === 'player') {
    p.rect(13, 33, 2, 16, '#9a5420'); p.rect(33, 33, 2, 16, '#9a5420');
  }
  // arms
  if (pose === 'ready') {
    // left fist on hip
    p.ell(9, 39, 3.6, 7, sh, 0.5); p.ell(12, 47, 3.2, 5, shS, -0.8); p.circ(15, 49, 3, sk);
    // right arm pointing at the foe
    p.ell(40, 30, 3.8, 9, sh, -0.95); p.ell(43.5, 26.5, 2.4, 1.4, shade(sh, 0.7), -0.95); p.circ(47, 23, 3.4, sk); p.rect(48, 19, 3, 2, sk);
    p.line([[45.5, 24.5], [48, 24.5]], shade(sk, 0.7), 0.5); p.line([[45.5, 22.5], [47.5, 22]], shade(sk, 0.7), 0.5);
  } else if (pose === 'throw0') {
    p.ell(9, 41, 4, 9, shS, 0.15);  p.circ(8, 50, 3.4, skS);
    p.ell(40, 26, 3.8, 9, sh, 0.5); p.circ(44, 17, 3.6, sk);
    p.circ(46, 13, 3.6, '#2aa89a'); p.rect(43, 13, 7, 1, '#e0b030');
  } else {
    p.ell(9, 41, 4, 9, shS, 0.15); p.circ(8, 50, 3.4, skS);
    p.ell(36, 26, 3.8, 9, sh, -0.6); p.circ(30, 17, 3.6, sk);
  }
  // neck + head
  p.rect(20, 27, 8, 6, skS);
  p.ell(24, 18, 11, 12, back ? hr : sk);
  if (back) {
    p.ell(13, 19, 2, 3, skS); p.ell(35, 19, 2, 3, skS);
    p.ell(24, 22, 10, 9, hrS); p.ell(21, 12, 5, 3, hrH);
    if (L.spiky && !L.hat) for (let i = 0; i < 5; i++) p.poly([[14 + i * 5, 8], [16 + i * 5, -1 + (i % 2) * 3], [19 + i * 5, 8]], hr);
    if (L.hat) { p.ell(24, 10, 12, 7, L.hat); p.rect(12, 10, 24, 4, L.hat); p.rect(20, 12, 8, 2, shade(L.hat, 0.7)); }
  } else {
    p.ell(14, 19, 2, 3, skS); p.ell(34, 19, 2, 3, skS);
    if (!L.hat) {
      p.ell(24, 11, 12, 8, hr);
      p.poly([[12, 12], [14, 22], [17, 13]], hr); p.poly([[36, 12], [34, 22], [31, 13]], hr);
      p.poly([[17, 12], [21, 17], [24, 12], [27, 17], [31, 12]], hr);
      p.ell(20, 8, 4, 2, hrH);
      for (const [x1, x2] of [[16, 19], [22, 23], [28, 27], [32, 30]]) p.line([[x1, 6], [x2, 15]], hrS, 0.6);
      p.line([[18, 5], [21, 9]], hrH, 0.6);
      if (L.spiky) for (let i = 0; i < 5; i++) p.poly([[14 + i * 5, 8], [16 + i * 5, -1 + (i % 2) * 3], [19 + i * 5, 8]], hr);
    } else {
      p.ell(24, 10, 12, 7, L.hat); p.rect(12, 10, 24, 4, L.hat); p.ell(20, 7, 4, 2, shade(L.hat, 1.2));
      p.ell(24, 14, 15, 2.5, L.hatB || shade(L.hat, 0.7));
      p.poly([[13, 14], [15, 20], [18, 15]], hr); p.poly([[35, 14], [33, 20], [30, 15]], hr);
    }
    if (L.long) { p.ell(13, 24, 3, 9, hr); p.ell(35, 24, 3, 9, hrS); }
    // determined battle face
    for (const ex of [19, 29]) {
      p.ell(ex, 19.5, 2.4, 2.7, '#ffffff');
      p.ell(ex + (ex < 24 ? 0.4 : -0.4), 19.8, 1.7, 2.3, L.eyes || '#3a4a78');
      p.ell(ex + (ex < 24 ? 0.4 : -0.4), 20, 0.9, 1.3, '#141420');
      p.rect(ex - 0.6, 18.2, 0.8, 0.8, '#ffffff');
      p.line([[ex - 2.6, 17], [ex + 2.6, 17]], '#202030', 0.8);
    }
    p.line([[23.6, 21], [23.2, 23], [24.2, 23.2]], shade(sk, 0.7), 0.6);
    p.line([[16, 15.5], [21.5, 16.8]], hrS, 1.2); p.line([[26.5, 16.8], [32, 15.5]], hrS, 1.2);
    if (L.beard) { p.poly([[15, 22], [33, 22], [30, 30], [24, 32], [18, 30]], hr); p.rect(21, 25, 6, 1, shade(sk, 0.6)); }
    else { p.line([[21.5, 25], [24, 26.2], [26.5, 25]], shade(sk, 0.5), 1.1); }
  }
  pixelize(c, [...p.used], '#202030');
  thickenOutline(c, '#202030');
  cache.set(key, c);
  return c;
}

// ---------------- tiles (16x16) ----------------
function srand(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

// ---- painted world art (static/art/world): whole-building sprites and one-tile props ----
const WORLD = { b: {}, t: {} };
export function loadWorldArt() {
  return fetch('/static/art/world/index.json').then((r) => (r.ok ? r.json() : null)).then((idx) => {
    if (!idx) return;
    const load = (src, put) => {
      const im = new Image();
      im.onload = () => { put(im); for (const k of [...cache.keys()]) if (k.startsWith('t:') || k.startsWith('b:')) cache.delete(k); };
      im.src = src;
    };
    for (const k of Object.keys(idx.buildings || {})) load(`/static/art/world/b_${k}.png`, (im) => { WORLD.b[k] = im; });
    for (const k of Object.keys(idx.tiles || {})) load(`/static/art/world/t_${k}.png`, (im) => { WORLD.t[k] = im; });
  }).catch(() => {});
}
// tile name -> [ground drawn underneath, painted prop on top]
const PROP_TILES = {
  tree: ['grass', 'tree'], pine: ['snow', 'pine'], palm: ['grass', 'palm'], deadtree: ['ash', 'deadtree'], stump: ['grass', 'stump'],
  bush: ['grass', 'bush'], rock: ['grass', 'rock'], crack: ['path', 'crack'], pushrock: [null, 'pushrock'],
  fence: ['grass', 'fence'], sign: ['grass', 'sign'],
  bed: ['floor', 'bed'], tv: ['floor', 'tv'], shelf: ['floor', 'shelf'], table: ['floor', 'table'], pc: ['floor', 'pc'],
  plant: ['floor', 'plant'], healer: ['floor', 'healer'], mat: ['floor', 'mat'],
  statue: ['gymfloor', 'statue'], console: ['dkfloor', 'console'], stove: ['floor', 'stove'], fridge: ['floor', 'fridge'],
  chair: ['floor', 'chair'], crate: ['floor', 'crate'], armchair: ['floor', 'armchair'],
  stalagmite: ['cavefloor', 'stalagmite'], caveboulder: ['cavefloor', 'caveboulder'], rockpile: ['cavefloor', 'rockpile'],
  magmarock: ['cavefloor', 'magmarock'], cavecrack: ['cavefloor', 'cavecrack'], boulder: ['gymfloor', 'caveboulder'],
  cactus: ['sand', 'cactus'], barrelcactus: ['sand', 'barrelcactus'], mapletree: ['grass', 'mapletree'], goldtree: ['grass', 'goldtree'],
  pillar: ['grass', 'pillar'], grave: ['grass', 'grave'], lamp: ['path', 'lamp'], barrel: ['path', 'barrel'],
  crystal: ['cavefloor', 'crystal'], crystal2: ['cavefloor', 'crystal2'], mushroom: ['cavefloor', 'mushroom'], redshroom: ['cavefloor', 'redshroom'], pebbles: ['cavefloor', 'pebbles'],
};
const CENTERED_PROPS = new Set(['mat', 'crack', 'pushrock', 'table', 'cavecrack', 'pebbles', 'mushroom', 'redshroom']);

const TILE_DRAW = {
  grass(px, r) {
    // olive meadow grass with soft tufts; some tiles get a little clover
    px(0, 0, 16, 16, '#8ab45c');
    for (let i = 0; i < 6; i++) { const x = Math.floor(r() * 14) + 1, y = Math.floor(r() * 13) + 2; px(x, y, 1, 2, '#729c4a'); px(x + 1, y - 1, 1, 2, '#9cc46c'); }
    for (let i = 0; i < 3; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#b4d482');
    for (let i = 0; i < 2; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 2, 1, '#7ea852');
    if (r() < 0.35) { const x = Math.floor(r() * 10) + 3, y = Math.floor(r() * 9) + 4; px(x, y, 2, 2, '#5c9446'); px(x + 2, y, 2, 2, '#5c9446'); px(x + 1, y - 2, 2, 2, '#5c9446'); px(x + 1, y + 2, 1, 2, '#4a7c38'); px(x, y, 1, 1, '#7cb85a'); px(x + 2, y, 1, 1, '#7cb85a'); px(x + 1, y - 2, 1, 1, '#7cb85a'); }
  },
  tall(px, r) {
    // wild grass: leafy tufts fanning out of dark roots, staggered so the field reads as one mass
    px(0, 0, 16, 16, '#4c8c3e');
    px(0, 6, 16, 2, '#447f38'); px(0, 14, 16, 2, '#447f38');
    const TUFT = ['...h....', '..hm..h.', '.lm.hml.', '.mm.mml.', 'lmmdmmm.', 'mmddmdml', 'dmdddmmd', '.dddddd.'];
    const C = { d: '#2c6228', m: '#5aa346', l: '#7cc25a', h: '#bce68c' };
    const tuft = (x0, y0) => TUFT.forEach((row, y) => [...row].forEach((ch, x) => { if (C[ch]) px(x0 + x, y0 + y, 1, 1, C[ch]); }));
    for (const [x, y] of [[0, 0], [8, 0], [-4, 8], [4, 8], [12, 8]]) tuft(x, y);
  },
  path(px, r) {
    // cobblestones: irregular stones set in mossy mortar
    px(0, 0, 16, 16, '#8a866a');
    const rows = [[0, 8], [8, 8]];
    rows.forEach(([y0, hh], ri) => {
      let x = -Math.floor(r() * 4) - (ri % 2) * 4;
      while (x < 16) {
        const w = 6 + Math.floor(r() * 4);
        const x0 = Math.max(0, x + 1), x1 = Math.min(16, x + w), y1 = y0 + hh;
        if (x1 - x0 >= 2) {
          const tone = r() < 0.3 ? ['#b8b092', '#c8c1a4', '#9a9276'] : r() < 0.5 ? ['#aca486', '#bcb598', '#8e866a'] : ['#b2aa8c', '#c4bd9e', '#948c70'];
          px(x0, y0 + 1, x1 - x0, hh - 1, tone[0]);
          px(x0 + 1, y0 + 1, x1 - x0 - 2, 1, tone[1]);
          px(x0, y1 - 1, x1 - x0, 1, tone[2]); px(x1 - 1, y0 + 1, 1, hh - 1, tone[2]);
          px(x0, y0 + 1, 1, 1, '#8a866a'); px(x1 - 1, y1 - 1, 1, 1, '#8a866a'); px(x0, y1 - 1, 1, 1, '#8a866a'); px(x1 - 1, y0 + 1, 1, 1, '#8a866a');
        }
        x += w;
      }
    });
    for (let i = 0; i < 3; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#7c9c50');
  },
  dirt(px, r) {
    // packed-earth trail for routes
    px(0, 0, 16, 16, '#d8be86');
    for (let i = 0; i < 5; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#c0a46c');
    for (let i = 0; i < 2; i++) { const x = Math.floor(r() * 13), y = Math.floor(r() * 13); px(x, y, 2, 1, '#e8d4a0'); px(x, y + 1, 2, 1, '#a88c58'); }
  },
  sand(px, r) {
    px(0, 0, 16, 16, '#ecd8a0');
    for (let i = 0; i < 2; i++) { const x = Math.floor(r() * 10), y = 3 + Math.floor(r() * 10); px(x, y, 5, 1, '#d8c084'); px(x + 1, y - 1, 3, 1, '#f6e8c0'); }
    for (let i = 0; i < 4; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#d4bc80');
    if (r() < 0.2) { const x = 3 + Math.floor(r() * 9), y = 3 + Math.floor(r() * 9); px(x, y, 2, 1, '#f8f0e8'); px(x, y + 1, 2, 1, '#e8b8a0'); }
  },
  tree(px) {
    TILE_DRAW.grass(px, srand(3));
    px(2, 13, 12, 3, '#5a9a48'); // ground shadow
    px(6, 11, 4, 5, '#7a4e2a'); px(6, 11, 1, 5, '#9a6a3a'); px(9, 11, 1, 5, '#5a3818'); px(5, 15, 1, 1, '#5a3818'); px(10, 15, 1, 1, '#5a3818');
    const rows = [[5, 10], [3, 12], [2, 13], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [2, 13], [2, 13], [3, 12], [5, 10]];
    rows.forEach(([a, b], y) => px(a, y, b - a + 1, 1, '#3d8f3c'));
    rows.forEach(([a, b], y) => { if (y > 5) { px(b - 2, y, 3, 1, '#2a6e32'); } if (y > 8) px(a, y, b - a + 1, 1, '#2a6e32'); });
    for (const [x, y] of [[3, 3], [7, 2], [10, 4], [4, 7], [8, 6], [11, 8], [6, 9]]) { px(x, y, 3, 2, '#55a948'); px(x, y, 1, 1, '#88cc66'); }
    px(4, 2, 3, 1, '#9ad874'); px(3, 3, 1, 2, '#9ad874');
    rows.forEach(([a, b], y) => { px(a, y, 1, 1, '#1e5228'); px(b, y, 1, 1, '#1e5228'); });
    px(5, 0, 6, 1, '#1e5228'); px(5, 11, 6, 1, '#1e5228');
  },
  water(px, r, f) {
    // deep blue with drifting light crests (two frames)
    px(0, 0, 16, 16, '#3f86d8');
    px(0, 0, 16, 2, '#4a92e0'); px(0, 8, 16, 2, '#4a92e0');
    px(0, 5, 16, 1, '#3676c4'); px(0, 13, 16, 1, '#3676c4');
    const o = f % 2 ? 3 : 0;
    const crest = (x, y) => { px((x + o) % 16, y, 4, 1, '#9cd0f8'); px((x + o + 1) % 16, y - 1, 2, 1, '#d8f0ff'); };
    crest(2, 3); crest(10, 7); crest(5, 12);
  },
  flower(px, r, f) {
    // a little flower bed: dark soil, a leafy bush and blossoms that sway
    TILE_DRAW.grass(px, srand(7));
    px(2, 10, 12, 5, '#6a4a30'); px(1, 11, 14, 3, '#6a4a30'); px(2, 14, 12, 1, '#4e3420'); px(3, 10, 10, 1, '#82603e');
    px(3, 4, 10, 8, '#3f8a3a'); px(2, 6, 12, 5, '#3f8a3a'); px(4, 3, 8, 2, '#4f9c44');
    px(3, 10, 10, 1, '#2c6a2c'); px(5, 5, 2, 1, '#6cb85a'); px(9, 4, 2, 1, '#6cb85a');
    const o = f % 2;
    const pal = [['#f06070', '#f8c0c8'], ['#f8d040', '#fff0a0'], ['#f8f8f8', '#f8d030'], ['#c070e0', '#f0c0f8']][Math.floor(r() * 4)];
    for (const [x, y] of [[4, 5], [9, 4], [6, 8], [11, 7], [3, 9]]) { px(x + o, y, 2, 2, pal[0]); px(x + o, y, 1, 1, pal[1]); }
  },
  fence(px) {
    TILE_DRAW.grass(px, srand(5));
    px(0, 5, 16, 2, '#c09060'); px(0, 10, 16, 2, '#c09060');
    px(2, 3, 3, 11, '#d8a870'); px(11, 3, 3, 11, '#d8a870'); px(2, 13, 3, 1, '#8a6038'); px(11, 13, 3, 1, '#8a6038');
  },
  sign(px) {
    // white board on two stone posts
    TILE_DRAW.grass(px, srand(9));
    px(3, 10, 2, 5, '#7c7870'); px(11, 10, 2, 5, '#7c7870'); px(3, 14, 2, 1, '#5c5850'); px(11, 14, 2, 1, '#5c5850');
    px(1, 2, 14, 9, '#5c5850'); px(2, 3, 12, 7, '#a8a498'); px(3, 4, 10, 5, '#f0ece0');
    px(4, 5, 8, 1, '#6a6458'); px(4, 7, 6, 1, '#6a6458'); px(2, 3, 12, 1, '#c8c4b8');
  },
  rock(px) {
    TILE_DRAW.grass(px, srand(11));
    px(2, 4, 12, 10, '#9a9a9a'); px(3, 3, 9, 1, '#9a9a9a'); px(3, 5, 5, 3, '#c0c0c0'); px(8, 10, 6, 4, '#707070');
  },
  floor(px) {
    // honey-coloured wooden planks, ends staggered
    const tones = ['#c09468', '#b98d61', '#c59a6e', '#bc9064'];
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      px(0, y, 16, 4, tones[row]); px(0, y + 3, 16, 1, '#94693f'); px(0, y, 16, 1, shade(tones[row], 1.06));
      const j = (row * 9 + 4) % 16; px(j, y, 1, 3, '#94693f');
    }
  },
  tilefloor(px) {
    // polished cream tiles with soft grout
    px(0, 0, 16, 16, '#f0ead8');
    px(0, 7, 16, 1, '#d4ccb4'); px(7, 0, 1, 16, '#d4ccb4'); px(0, 15, 16, 1, '#d4ccb4'); px(15, 0, 1, 16, '#d4ccb4');
    px(1, 1, 3, 1, '#ffffff'); px(9, 9, 3, 1, '#ffffff'); px(1, 1, 1, 2, '#ffffff'); px(9, 9, 1, 2, '#ffffff');
  },
  wall(px) {
    // upper wall: cream wallpaper with a faint stripe and crown moulding
    px(0, 0, 16, 16, '#efe2c8');
    for (let x = 1; x < 16; x += 4) px(x, 3, 1, 13, '#e4d4b4');
    px(0, 0, 16, 3, '#8a5a34'); px(0, 2, 16, 1, '#6a4226'); px(0, 0, 16, 1, '#a8744a');
  },
  wallwin(px) {
    TILE_DRAW.wall(px);
    px(2, 4, 12, 11, '#6a4226'); px(3, 5, 10, 9, '#9ed4f4'); px(3, 5, 10, 3, '#c4e8fc');
    px(7, 5, 2, 9, '#6a4226'); px(3, 9, 10, 1, '#6a4226'); px(4, 6, 2, 1, '#ffffff');
    px(1, 4, 2, 11, '#c85c50'); px(13, 4, 2, 11, '#c85c50'); px(1, 14, 14, 1, '#8a5a34');
  },
  walllow(px) {
    // lower wall: wooden wainscot and a dark skirting board
    px(0, 0, 16, 16, '#efe2c8');
    for (let x = 1; x < 16; x += 4) px(x, 0, 1, 4, '#e4d4b4');
    px(0, 4, 16, 2, '#8a5a34'); px(0, 4, 16, 1, '#a8744a');
    px(0, 6, 16, 8, '#a06a3e'); for (let x = 0; x < 16; x += 8) { px(x + 1, 7, 6, 6, '#b07a4a'); px(x + 1, 7, 6, 1, '#c08a58'); }
    px(0, 14, 16, 2, '#5a3a20');
  },
  counter(px) {
    // shop counter: polished top, panelled front
    px(0, 0, 16, 16, '#8a5a34');
    px(0, 0, 16, 6, '#d8a870'); px(0, 0, 16, 1, '#f0c890'); px(0, 5, 16, 1, '#a87442');
    px(0, 6, 16, 9, '#9a6a3e'); px(2, 8, 5, 5, '#ac7a4a'); px(9, 8, 5, 5, '#ac7a4a'); px(2, 8, 5, 1, '#bc8a58'); px(9, 8, 5, 1, '#bc8a58');
    px(0, 15, 16, 1, '#5a3a20');
  },
  shelf(px) { px(0, 0, 16, 16, '#8a5a30'); px(1, 1, 14, 6, '#5a3818'); px(1, 9, 14, 6, '#5a3818'); ['#d04040', '#4070d0', '#40a050', '#e0c040', '#a060c0', '#e08030', '#4070d0'].forEach((c, i) => { px(1 + i * 2, 2, 2, 5, c); px(15 - (i + 1) * 2, 10, 2, 5, c); }); },
  table(px) { TILE_DRAW.floor(px); px(1, 3, 14, 8, '#a87040'); px(1, 3, 14, 2, '#c89060'); px(2, 11, 2, 4, '#7a4820'); px(12, 11, 2, 4, '#7a4820'); },
  pc(px) { TILE_DRAW.floor(px); px(2, 2, 12, 9, '#9098a8'); px(3, 3, 10, 6, '#40c0f0'); px(4, 4, 3, 1, '#c0f0ff'); px(5, 11, 6, 3, '#9098a8'); px(3, 14, 10, 1, '#606878'); },
  healer(px) { px(0, 0, 16, 16, '#e8a868'); px(1, 2, 14, 10, '#f8f8f8'); for (let i = 0; i < 3; i++) { px(2 + i * 4, 4, 3, 3, '#f05050'); px(2 + i * 4, 7, 3, 3, '#f8f8f8'); } px(1, 12, 14, 4, '#c07848'); },
  mat(px) { TILE_DRAW.floor(px); px(1, 3, 14, 11, '#d05050'); px(3, 5, 10, 7, '#e87070'); },
  carpet(px) {
    // red rug with a small gold diamond motif that repeats seamlessly
    px(0, 0, 16, 16, '#b84848');
    px(0, 0, 16, 1, '#a63c3c'); px(0, 8, 16, 1, '#a63c3c');
    for (const [x, y] of [[4, 4], [12, 12]]) { px(x - 1, y, 3, 1, '#e8b860'); px(x, y - 1, 1, 3, '#e8b860'); px(x, y, 1, 1, '#f8e0a0'); }
  },
  plant(px) { TILE_DRAW.floor(px); px(4, 10, 8, 5, '#c06030'); px(3, 9, 10, 2, '#d87848'); px(3, 2, 10, 7, '#38a048'); px(5, 1, 6, 2, '#58c060'); px(2, 5, 2, 3, '#38a048'); px(12, 5, 2, 3, '#38a048'); },
  bed(px) { TILE_DRAW.floor(px); px(1, 1, 14, 15, '#8a6038'); px(2, 2, 12, 4, '#f8f8f8'); px(2, 6, 12, 9, '#4878c8'); px(2, 6, 12, 1, '#88a8e0'); },
  tv(px) { TILE_DRAW.floor(px); px(2, 3, 12, 10, '#404048'); px(3, 4, 10, 7, '#60a0c0'); px(4, 5, 3, 2, '#a0d8f0'); px(5, 13, 6, 2, '#404048'); },
  cavefloor(px, r) {
    // earthy cave floor: darker patches, loose pebbles, a hairline crack now and then
    px(0, 0, 16, 16, '#8a6e52');
    for (let i = 0; i < 2; i++) { const x = Math.floor(r() * 12), y = Math.floor(r() * 13); px(x, y, 4, 2, '#7e6248'); px(x + 1, y + 2, 2, 1, '#7e6248'); }
    for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); px(x, y, 2, 1, '#a88a6a'); px(x, y + 1, 2, 1, '#5e4a36'); }
    if (r() < 0.4) { const x = 2 + Math.floor(r() * 10), y = 2 + Math.floor(r() * 10); px(x, y, 3, 1, '#5e4a36'); px(x + 3, y + 1, 2, 1, '#5e4a36'); }
  },
  cavepath(px, r) {
    // packed, lighter dirt where feet have worn a trail
    px(0, 0, 16, 16, '#b0916c');
    for (let i = 0; i < 5; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#9a7c5c');
    for (let i = 0; i < 3; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 2, 1, '#c4a580');
  },
  cavewall(px, r) {
    // solid rock from above: a jumble of boulders of different sizes in deep shadow
    px(0, 0, 16, 16, '#3e2e22');
    const lump = (x, y, w, h) => {
      px(x + 1, y, w - 2, h, '#634a36'); px(x, y + 1, w, h - 2, '#634a36');
      px(x + 1, y, w - 3, 1, '#7e644a'); px(x, y + 1, 1, h - 3, '#7e644a'); px(x + 1, y + 1, 2, 1, '#9a7e5e');
      px(x + 2, y + h - 1, w - 3, 1, '#3a2a1e'); px(x + w - 1, y + 2, 1, h - 3, '#4a3828');
    };
    const sets = [
      [[0, 0, 8, 7], [8, 0, 8, 6], [-2, 7, 7, 9], [5, 6, 7, 7], [11, 6, 6, 10], [4, 12, 7, 5]],
      [[-1, -1, 7, 8], [6, 0, 10, 7], [0, 7, 9, 9], [9, 7, 8, 6], [10, 12, 6, 5]],
      [[0, 0, 6, 6], [6, -1, 6, 8], [12, 1, 5, 7], [-1, 6, 8, 6], [7, 7, 9, 9], [0, 12, 7, 5]],
      [[1, 0, 9, 8], [10, 0, 7, 7], [-2, 8, 6, 8], [4, 8, 6, 8], [10, 7, 7, 9]],
    ];
    sets[Math.floor(r() * 4)].forEach(([x, y, w, h]) => lump(x, y, w, h));
  },
  cliff(px, r) {
    // rock face where a wall meets walkable floor: boulder rim, layered face, deep shadow at the foot
    TILE_DRAW.cavewall(px, r);
    px(0, 7, 16, 9, '#6e543c');
    px(0, 7, 16, 1, '#94785a'); px(0, 8, 16, 1, '#82684c');
    px(0, 11, 16, 1, '#5e4632');
    for (const x of [3, 9, 13]) px(x, 9, 1, 5, '#4a3626');
    px(5, 12, 2, 1, '#8a6e52'); px(11, 10, 1, 1, '#8a6e52');
    px(0, 14, 16, 2, '#2e2218');
  },
  lava(px, r, f) {
    // molten rock: glowing veins that drift, with a few cooling crust islands
    px(0, 0, 16, 16, '#d0401a');
    const o = f % 2 ? 2 : 0;
    const vein = (x, y, w, c) => px((x + o) % 16, y, w, 1, c);
    vein(1, 2, 6, '#f07a28'); vein(9, 3, 5, '#f07a28'); vein(3, 7, 7, '#f8a838'); vein(11, 9, 4, '#f07a28'); vein(0, 12, 5, '#f8a838'); vein(7, 13, 6, '#f07a28');
    vein(4, 7, 3, '#ffe070'); vein(1, 12, 2, '#ffe070');
    px(12, 5, 3, 2, '#6a2a18'); px(5, 10, 2, 2, '#6a2a18'); px(12, 5, 1, 1, '#8a3a20');
  },
  dkfloor(px, r) {
    // Eclipse steel: dark plates and rivets, with a faint cyan seam light here and there
    px(0, 0, 16, 16, '#3a3c4e');
    px(0, 0, 16, 1, '#4a4e64'); px(0, 0, 1, 16, '#4a4e64'); px(0, 15, 16, 1, '#26283a'); px(15, 0, 1, 16, '#26283a');
    for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) px(x, y, 1, 1, '#6a6e88');
    if (r() < 0.3) { px(5, 8, 6, 1, '#2e6e90'); px(7, 8, 2, 1, '#5ab8d8'); }
  },
  icefloor(px, r) {
    // polished ice: pale blue, a sheen on some tiles, faint cracks on others
    px(0, 0, 16, 16, '#cfeaf8');
    const k = Math.floor(r() * 4);
    if (k === 0) for (let i = 0; i < 5; i++) px(3 + i, 9 - i, 2, 1, '#eef8ff');
    if (k === 1) { px(2, 4, 3, 1, '#a8d0e8'); px(5, 5, 2, 1, '#a8d0e8'); px(7, 6, 1, 2, '#a8d0e8'); }
    if (k === 2) px(10, 11, 3, 1, '#ffffff');
    px(0, 15, 16, 1, '#bfe0f2'); px(15, 0, 1, 16, '#bfe0f2');
  },
  marble(px) {
    // league marble: alternating cream squares, grey veining, gold studs at the joins
    px(0, 0, 16, 16, '#ece6da'); px(8, 0, 8, 8, '#e0d8c8'); px(0, 8, 8, 8, '#e0d8c8');
    px(1, 3, 4, 1, '#cfc6b4'); px(4, 4, 2, 1, '#cfc6b4'); px(10, 11, 4, 1, '#cfc6b4');
    px(0, 0, 1, 1, '#c8a040'); px(8, 8, 1, 1, '#c8a040'); px(8, 0, 1, 1, '#d8b858'); px(0, 8, 1, 1, '#d8b858');
  },
  dock(px) {
    // pier: weathered planks across, a dark gap between each, posts at the ends
    px(0, 0, 16, 16, '#a87a4c');
    for (let y = 0; y < 16; y += 4) { px(0, y, 16, 3, y % 8 ? '#b4865a' : '#a87a4c'); px(0, y + 3, 16, 1, '#5e3e22'); px(0, y, 16, 1, '#c89a6a'); }
    px(3, 1, 1, 1, '#5e3e22'); px(12, 5, 1, 1, '#5e3e22'); px(6, 9, 1, 1, '#5e3e22'); px(10, 13, 1, 1, '#5e3e22');
  },
  // ---- themed gym floors (one per gym type) ----
  gf_Rock(px) { px(0, 0, 16, 16, '#c8b48c'); px(0, 7, 16, 1, '#9c8662'); px(0, 15, 16, 1, '#9c8662'); px(5, 0, 1, 7, '#9c8662'); px(12, 8, 1, 7, '#9c8662'); px(1, 1, 3, 1, '#dccaa4'); px(7, 9, 4, 1, '#dccaa4'); px(9, 3, 2, 1, '#b09a72'); },
  gf_Grass(px) { TILE_DRAW.gf_Rock(px); px(0, 0, 16, 16, 'rgba(0,0,0,0)'); px(0, 0, 16, 16, '#a8bc8c'); px(0, 7, 16, 1, '#6f8c5a'); px(0, 15, 16, 1, '#6f8c5a'); px(5, 0, 1, 7, '#6f8c5a'); px(12, 8, 1, 7, '#6f8c5a'); px(4, 6, 3, 1, '#5f9a4a'); px(5, 5, 1, 1, '#7cc05a'); px(11, 14, 3, 1, '#5f9a4a'); px(12, 13, 1, 1, '#7cc05a'); px(1, 1, 3, 1, '#c0d4a4'); },
  gf_Electric(px, r) { px(0, 0, 16, 16, '#a4acb8'); px(0, 0, 16, 1, '#c4ccd8'); px(0, 0, 1, 16, '#c4ccd8'); px(0, 15, 16, 1, '#6c7480'); px(15, 0, 1, 16, '#6c7480'); for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) px(x, y, 1, 1, '#5c6470'); if (r() < 0.25) { px(5, 7, 6, 2, '#2c3038'); px(6, 7, 1, 2, '#f0c838'); px(9, 7, 1, 2, '#f0c838'); } },
  gf_Water(px) { px(0, 0, 16, 16, '#d8f0f8'); px(0, 0, 8, 8, '#b8e0f0'); px(8, 8, 8, 8, '#b8e0f0'); px(0, 15, 16, 1, '#98c8e0'); px(15, 0, 1, 16, '#98c8e0'); px(2, 2, 2, 1, '#ffffff'); px(10, 10, 2, 1, '#ffffff'); },
  gf_Brawl(px) { px(0, 0, 16, 16, '#d8cc8c'); for (let y = 0; y < 16; y += 2) px(0, y, 16, 1, '#ccc080'); px(0, 0, 16, 1, '#4e5e34'); px(0, 8, 16, 1, '#4e5e34'); px(0, 0, 1, 8, '#4e5e34'); px(8, 8, 1, 8, '#4e5e34'); },
  gf_Mind(px) { px(0, 0, 16, 16, '#8a6aa8'); px(8, 0, 8, 8, '#7e5e9c'); px(0, 8, 8, 8, '#7e5e9c'); px(1, 4, 4, 1, '#b8a0d0'); px(5, 5, 2, 1, '#b8a0d0'); px(10, 12, 4, 1, '#b8a0d0'); px(8, 8, 1, 1, '#f0d070'); },
  gf_Fire(px) { px(0, 0, 16, 16, '#5a3a34'); px(1, 1, 6, 6, '#644440'); px(9, 9, 6, 6, '#644440'); px(0, 7, 16, 1, '#3a2420'); px(7, 0, 1, 16, '#3a2420'); px(0, 15, 16, 1, '#3a2420'); px(15, 0, 1, 16, '#3a2420'); px(6, 7, 3, 1, '#c8542a'); px(7, 6, 1, 3, '#c8542a'); px(7, 7, 1, 1, '#ffb040'); },
  gf_Dragon(px) { px(0, 0, 16, 16, '#4a5468'); px(0, 0, 16, 1, '#5c6880'); px(0, 0, 1, 16, '#5c6880'); px(0, 15, 16, 1, '#343c4c'); px(15, 0, 1, 16, '#343c4c'); px(6, 6, 4, 4, '#3c4456'); px(7, 5, 2, 6, '#c8a040'); px(5, 7, 6, 2, '#c8a040'); px(7, 7, 2, 2, '#f0d070'); },
  gf_Bug(px) { px(0, 0, 16, 16, '#a8b860'); px(0, 0, 16, 1, '#8a9a48'); px(0, 0, 1, 16, '#8a9a48'); for (const [x, y] of [[4, 4], [11, 10]]) { px(x - 2, y, 5, 1, '#c8d880'); px(x, y - 2, 1, 5, '#c8d880'); } px(8, 2, 2, 2, '#6a7a30'); },
  gf_Ground(px) { px(0, 0, 16, 16, '#c8a070'); px(0, 5, 16, 1, '#a88050'); px(0, 11, 16, 1, '#a88050'); px(3, 2, 3, 1, '#dcb888'); px(10, 8, 4, 1, '#dcb888'); px(6, 13, 2, 1, '#9a7448'); },
  gf_Flying(px) { px(0, 0, 16, 16, '#d8e8f4'); px(0, 15, 16, 1, '#a8c0d8'); px(15, 0, 1, 16, '#a8c0d8'); px(3, 6, 6, 1, '#ffffff'); px(5, 5, 4, 1, '#ffffff'); px(9, 11, 5, 1, '#ffffff'); },
  gf_Toxic(px) { px(0, 0, 16, 16, '#6a5a7a'); px(1, 1, 6, 6, '#76668a'); px(9, 9, 6, 6, '#76668a'); px(0, 7, 16, 1, '#4a3e5a'); px(7, 0, 1, 16, '#4a3e5a'); px(3, 11, 2, 2, '#9ad048'); px(11, 3, 1, 1, '#9ad048'); },
  gf_Spirit(px) { px(0, 0, 16, 16, '#5e5a70'); px(0, 0, 16, 1, '#6e6a82'); px(0, 0, 1, 16, '#6e6a82'); px(0, 15, 16, 1, '#46425a'); px(15, 0, 1, 16, '#46425a'); px(5, 6, 6, 1, '#7a76a0'); px(7, 4, 2, 5, '#7a76a0'); px(7, 6, 2, 1, '#b8b0e8'); },
  gf_Metal(px) { px(0, 0, 16, 16, '#9098a4'); px(0, 0, 16, 1, '#b0b8c4'); px(0, 0, 1, 16, '#b0b8c4'); px(0, 15, 16, 1, '#646c78'); px(15, 0, 1, 16, '#646c78'); for (let i = 2; i < 14; i += 3) px(i, i, 2, 1, '#a4acb8'); for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) px(x, y, 1, 1, '#545c68'); },
  gf_Ice(px) { TILE_DRAW.icefloor(px, srand(3)); px(0, 0, 16, 1, '#e8f6ff'); px(0, 0, 1, 16, '#e8f6ff'); },
  gf_Fae(px) { px(0, 0, 16, 16, '#f4d8e4'); px(0, 0, 8, 8, '#ecc8da'); px(8, 8, 8, 8, '#ecc8da'); px(0, 15, 16, 1, '#d8a8c0'); px(15, 0, 1, 16, '#d8a8c0'); px(3, 3, 2, 2, '#fff8fc'); px(3, 3, 1, 1, '#ffffff'); px(11, 11, 2, 2, '#fff8fc'); px(11, 11, 1, 1, '#ffffff'); },
  gf_Shadow(px) { px(0, 0, 16, 16, '#2e2a3a'); px(8, 0, 8, 8, '#363246'); px(0, 8, 8, 8, '#363246'); px(7, 7, 2, 2, '#8a48c8'); px(0, 0, 1, 1, '#5a3a88'); },
  // ---- interior wall styles ----
  stonewall(px) { px(0, 0, 16, 16, '#8c8a86'); for (let y = 3, row = 0; y < 16; y += 4, row++) { px(0, y, 16, 1, '#6a6864'); for (let x = (row % 2) * 4; x < 16; x += 8) px(x, y, 1, 4, '#6a6864'); px((row % 2) * 4 + 2, y + 1, 3, 1, '#a4a29c'); } px(0, 0, 16, 3, '#55524e'); px(0, 0, 16, 1, '#76736e'); },
  stonewalllow(px) { TILE_DRAW.stonewall(px); px(0, 0, 16, 3, '#8c8a86'); px(0, 0, 16, 1, '#6a6864'); px(0, 12, 16, 4, '#55524e'); px(0, 12, 16, 1, '#a4a29c'); },
  metalwall(px) { px(0, 0, 16, 16, '#3a3c4c'); px(0, 0, 16, 2, '#24263a'); px(1, 3, 6, 11, '#44465a'); px(9, 3, 6, 11, '#44465a'); px(1, 3, 6, 1, '#56586e'); px(9, 3, 6, 1, '#56586e'); px(7, 2, 2, 14, '#2a2c3c'); px(3, 7, 2, 1, '#6ad0f0'); },
  metalwalllow(px) { TILE_DRAW.metalwall(px); px(0, 12, 16, 4, '#24263a'); px(0, 12, 16, 1, '#3a8ab0'); },
  marblewall(px) { px(0, 0, 16, 16, '#ece6da'); px(0, 0, 16, 3, '#c8a040'); px(0, 2, 16, 1, '#a07c28'); px(1, 3, 3, 13, '#f8f4ec'); px(4, 3, 1, 13, '#cfc6b4'); px(9, 6, 4, 1, '#ddd4c2'); },
  marblewalllow(px) { TILE_DRAW.marblewall(px); px(0, 0, 16, 3, '#ece6da'); px(0, 11, 16, 5, '#b8ae98'); px(0, 11, 16, 1, '#c8a040'); px(0, 15, 16, 1, '#8a8270'); },
  gymfloor(px) { px(0, 0, 16, 16, '#c8c0b0'); px(0, 0, 16, 1, '#a8a090'); px(0, 0, 1, 16, '#a8a090'); px(4, 5, 2, 1, '#b0a898'); px(10, 11, 3, 1, '#b0a898'); },
  statue(px) { TILE_DRAW.gymfloor(px); px(3, 12, 10, 4, '#787878'); px(4, 3, 8, 9, '#a0a0a0'); px(5, 2, 6, 1, '#a0a0a0'); px(5, 4, 3, 3, '#c8c8c8'); px(9, 8, 3, 4, '#787878'); },
  boulder(px) { TILE_DRAW.gymfloor(px); px(2, 4, 12, 10, '#8a8070'); px(3, 3, 9, 1, '#8a8070'); px(3, 5, 5, 3, '#b0a890'); px(8, 10, 6, 4, '#605848'); },
  void(px) { px(0, 0, 16, 16, '#101018'); },
  bush(px) {
    // a small, skinny sapling that can be cut with Slash
    TILE_DRAW.grass(px, srand(17));
    px(5, 14, 6, 2, '#5a9a48');
    px(7, 10, 2, 5, '#8a5a30'); px(8, 10, 1, 5, '#5a3818');
    const rows = [[7, 8], [6, 9], [5, 10], [5, 10], [4, 11], [4, 11], [4, 11], [5, 10], [5, 10], [6, 9]];
    rows.forEach(([a, b], y) => px(a, y + 1, b - a + 1, 1, '#6cc05a'));
    rows.forEach(([a, b], y) => { if (y > 3) px(b - 1, y + 1, 2, 1, '#3c8a3c'); });
    for (const [x, y] of [[5, 3], [8, 5], [6, 7], [9, 8]]) { px(x, y, 2, 1, '#a0e080'); }
    px(4, 6, 1, 1, '#3c8a3c'); px(11, 6, 1, 1, '#3c8a3c'); px(6, 4, 1, 1, '#3c8a3c'); px(9, 3, 1, 1, '#3c8a3c');
    rows.forEach(([a, b], y) => { px(a, y + 1, 1, 1, '#245a28'); px(b, y + 1, 1, 1, '#245a28'); });
    px(7, 0, 2, 1, '#245a28'); px(6, 11, 4, 1, '#245a28');
  },
  crack(px) { TILE_DRAW.path(px, srand(19)); px(1, 2, 14, 13, '#8a8478'); px(2, 1, 11, 1, '#8a8478'); px(3, 3, 5, 3, '#aca698'); px(7, 2, 1, 5, '#504840'); px(8, 6, 4, 1, '#504840'); px(5, 8, 1, 5, '#504840'); px(10, 9, 3, 4, '#686258'); },
  snow(px, r) {
    px(0, 0, 16, 16, '#f2f6fb');
    for (let i = 0; i < 2; i++) { const x = Math.floor(r() * 11), y = 2 + Math.floor(r() * 11); px(x, y, 6, 1, '#dce6f2'); px(x + 1, y + 1, 4, 1, '#e6eef8'); }
    for (let i = 0; i < 3; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#c8d6e8');
    for (let i = 0; i < 2; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#ffffff');
  },
  snowpath(px, r) {
    // trodden snow: greyer, with a few boot prints
    px(0, 0, 16, 16, '#dbe3ec');
    for (let i = 0; i < 4; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 2, 1, '#cbd5e1');
    if (r() < 0.6) { const x = 3 + Math.floor(r() * 8), y = 2 + Math.floor(r() * 8); px(x, y, 2, 3, '#bcc8d6'); px(x + 3, y + 3, 2, 3, '#bcc8d6'); }
  },
  drygrass(px) {
    // desert scrub: the same tufts, sun-bleached and straw-coloured, on sand
    px(0, 0, 16, 16, '#d8c088');
    const TUFT = ['...h....', '..hm..h.', '.lm.hml.', '.mm.mml.', 'lmmdmmm.', 'mmddmdml', 'dmdddmmd', '.dddddd.'];
    const C = { d: '#8a6a34', m: '#b8944c', l: '#d4b468', h: '#f0dc98' };
    const tuft = (x0, y0) => TUFT.forEach((row, y) => [...row].forEach((ch, x) => { if (C[ch]) px(x0 + x, y0 + y, 1, 1, C[ch]); }));
    for (const [x, y] of [[0, 0], [8, 0], [-4, 8], [4, 8], [12, 8]]) tuft(x, y);
  },
  reeds(px) {
    // marsh reeds standing in shallow water, cattail heads on top
    px(0, 0, 16, 16, '#4a7a6a');
    px(0, 13, 16, 3, '#3c6a7e'); px(2, 14, 4, 1, '#6a9ab0'); px(10, 15, 3, 1, '#6a9ab0');
    for (const [x, h] of [[1, 11], [3, 13], [5, 9], [7, 12], [9, 10], [11, 13], [13, 11], [15, 9]]) {
      px(x, 14 - h, 1, h, '#5e9a4a'); px(x, 14 - h, 1, 1, '#8cc06a');
      if (x % 4 === 1) { px(x, 14 - h - 3, 1, 3, '#7a4a28'); px(x, 14 - h - 3, 1, 1, '#9a6a3c'); }
    }
  },
  snowgrass(px) {
    // the same wild-grass tufts, frosted and half buried in snow
    px(0, 0, 16, 16, '#e4edf6');
    const TUFT = ['...h....', '..hm..h.', '.lm.hml.', '.mm.mml.', 'lmmdmmm.', 'mmddmdml', 'dmdddmmd', '.ssssss.'];
    const C = { d: '#3c6a5a', m: '#5e9480', l: '#8ab8a4', h: '#ffffff', s: '#f6f9fc' };
    const tuft = (x0, y0) => TUFT.forEach((row, y) => [...row].forEach((ch, x) => { if (C[ch]) px(x0 + x, y0 + y, 1, 1, C[ch]); }));
    for (const [x, y] of [[0, 0], [8, 0], [-4, 8], [4, 8], [12, 8]]) tuft(x, y);
  },
  pine(px) { TILE_DRAW.snow(px, srand(21)); px(7, 12, 2, 4, '#6a4a2a'); px(6, 1, 4, 3, '#2a6a4a'); px(4, 4, 8, 4, '#2a6a4a'); px(2, 8, 12, 4, '#2a6a4a'); px(6, 1, 2, 1, '#ffffff'); px(4, 4, 3, 1, '#ffffff'); px(2, 8, 4, 1, '#ffffff'); },
  ash(px, r) {
    px(0, 0, 16, 16, '#8e8682');
    for (let i = 0; i < 2; i++) { const x = Math.floor(r() * 12), y = 2 + Math.floor(r() * 12); px(x, y, 3, 1, '#6e6662'); px(x + 3, y + 1, 2, 1, '#6e6662'); }
    for (let i = 0; i < 4; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#a49c96');
    if (r() < 0.25) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#e07838');
  },
  console(px) { px(0, 0, 16, 16, '#383848'); px(1, 2, 14, 8, '#202028'); px(2, 3, 12, 6, '#30a070'); px(3, 4, 5, 1, '#70f0b0'); px(3, 6, 8, 1, '#70f0b0'); px(1, 11, 14, 4, '#585868'); px(3, 12, 2, 2, '#e04040'); px(7, 12, 2, 2, '#f0d040'); },
  pushrock(px) { px(2, 3, 12, 12, '#7a6e5e'); px(3, 2, 10, 1, '#7a6e5e'); px(1, 5, 14, 8, '#7a6e5e'); px(3, 4, 5, 4, '#a09482'); px(9, 10, 4, 3, '#584e40'); px(2, 14, 12, 1, '#3e3628'); },
  ledge(px) { TILE_DRAW.grass(px, srand(13)); px(0, 10, 16, 3, '#609848'); px(0, 13, 16, 1, '#407030'); },
};
export const TILE_FRAMES = { water: 2, lava: 2 };

// a painted prop on a transparent tile, so the map can put its own ground underneath
// (snow, ash, sand, wood...). Returns null when there is no painted art for it.
export function prop(name, variant = 0) {
  const v = name === 'flower' ? variant % 2 : 0;
  const P = name === 'flower' ? [null, v ? 'flower_y' : 'flower_r'] : PROP_TILES[name];
  const art = P && WORLD.t[P[1]];
  if (!art) return null;
  const key = `t:prop:${name}:${v}`;
  if (cache.has(key)) return cache.get(key);
  const c = mk(16, 16);
  const oy = CENTERED_PROPS.has(name) ? Math.round((16 - art.height) / 2) : 16 - art.height;
  c.getContext('2d').drawImage(art, Math.round((16 - art.width) / 2), oy);
  cache.set(key, c);
  return c;
}

export function tile(name, variant = 0, f = 0) {
  const frames = TILE_FRAMES[name] || 1;
  const ff = f % frames;
  const v = ['grass', 'path', 'dirt', 'sand', 'cavefloor', 'cavepath', 'snow', 'snowpath', 'ash', 'flower', 'tall', 'cavewall', 'cliff', 'icefloor', 'dkfloor', 'gf_Electric'].includes(name) ? variant % 4 : 0;
  const key = `t:${name}:${v}:${ff}`;
  if (cache.has(key)) return cache.get(key);
  const c = mk(16, 16); const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const P = name === 'flower' ? ['grass', v % 2 ? 'flower_y' : 'flower_r'] : PROP_TILES[name];
  const art = P && WORLD.t[P[1]];
  if (art) {
    if (P[0]) TILE_DRAW[P[0]](px, srand(v + 1), 0);
    const ox = Math.round((16 - art.width) / 2);
    const oy = CENTERED_PROPS.has(name) ? Math.round((16 - art.height) / 2) : 16 - art.height;
    g.drawImage(art, ox, oy);
  } else (TILE_DRAW[name] || TILE_DRAW.void)(px, srand(v + 1), ff);
  cache.set(key, c);
  return c;
}

export function drawPerson(g, c, x, y) {
  if (c.lw) { const prev = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(c, x + c.ox, y + c.oy, c.lw, c.lh); g.imageSmoothingEnabled = prev; }
  else g.drawImage(c, x, y);
}

// grassy fringe drawn over a path tile on the sides that touch grass
// (bits: 1 = north, 2 = east, 4 = south, 8 = west)
export function pathEdge(bits, kind = 'grass') {
  const key = 'pe:' + kind + ':' + bits;
  if (cache.has(key)) return cache.get(key);
  const c = mk(16, 16); const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const r = srand(bits + 40);
  const side = (horiz, at, inward) => {
    for (let i = 0; i < 16; i++) {
      const d = kind === 'shore' || kind === 'lava' ? 2 : 1 + (r() < 0.45 ? 1 : 0) + (r() < 0.15 ? 1 : 0);
      for (let k = 0; k < d; k++) {
        const col = kind === 'cave' ? (k === d - 1 ? '#9a7e60' : '#8a6e52') : kind === 'lava' ? (k === 0 ? '#3a2a24' : '#6a3420') : kind === 'snow' ? (k === d - 1 ? '#ffffff' : '#f2f6fb') : kind === 'shore' ? (k === 0 ? '#d4ecfc' : '#78b6ea') : (k === d - 1 ? '#a6c878' : '#8ab45c');
        const o = at + inward * k;
        if (horiz) px(i, o, 1, 1, col); else px(o, i, 1, 1, col);
      }
      const sh = at + inward * d;
      if (kind !== 'grass') continue;
      if (horiz) px(i, sh, 1, 1, 'rgba(60,70,40,0.25)'); else px(sh, i, 1, 1, 'rgba(60,70,40,0.25)');
    }
  };
  if (bits & 1) side(true, 0, 1);
  if (bits & 4) side(true, 15, -1);
  if (bits & 8) side(false, 0, 1);
  if (bits & 2) side(false, 15, -1);
  cache.set(key, c);
  return c;
}

// ---------------- buildings ----------------
const BUILD = {
  house: { roof: '#c4583a', roofD: '#86321e', wall: '#f0e2c4', style: 'timber' },
  house2: { roof: '#4c78b8', roofD: '#2e5088', wall: '#efe4cc', style: 'timber' },
  lab: { roof: '#8a8c98', roofD: '#5e6070', wall: '#f4f0e6', style: 'stone' },
  center: { roof: '#d85048', roofD: '#9a2e28', wall: '#f2d890', label: 'HEAL', style: 'brick' },
  mart: { roof: '#4a80d8', roofD: '#2a58a0', wall: '#d08860', label: 'MART', style: 'brick' },
  gym: { roof: '#a07840', roofD: '#6c4c1e', wall: '#b8b0a0', label: 'GYM', style: 'stone' },
  tower: { roof: '#3c3c54', roofD: '#22223a', wall: '#6c6c84', label: 'TOWER', style: 'stone' },
  league: { roof: '#c8a030', roofD: '#8a6a18', wall: '#ece2cc', label: 'LEAGUE', style: 'stone' },
};
export function building(kind, w, h, doorX, snow = false) {
  const art = (snow && WORLD.b[kind + '_snow']) || WORLD.b[kind];
  const key = `b:${kind}:${w}:${h}:${doorX}:${art ? (snow ? 'snow' : 'art') : 'px'}`;
  if (cache.has(key)) return cache.get(key);
  if (art) {
    // painted building: centred on its footprint, standing on the bottom edge; a tall roof
    // may rise up to ~a tile above it (c.over says how far)
    const over = Math.max(0, art.height - h * 16);
    const c = mk(w * 16, h * 16 + over);
    c.getContext('2d').drawImage(art, Math.round((w * 16 - art.width) / 2), c.height - art.height);
    c.over = over;
    cache.set(key, c);
    return c;
  }
  const B = BUILD[kind];
  const c = mk(w * 16, h * 16); const g = c.getContext('2d');
  const px = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); };
  const roofH = (h - 2) * 16 + 4;
  const W2 = w * 16, H2 = h * 16;
  const wallTop = roofH - 2;
  // ---- walls ----
  const style = B.style || 'plain';
  px(0, wallTop, W2, H2 - wallTop, B.wall);
  if (style === 'timber') {
    const beam = '#6a4628', beamL = '#8a603a';
    px(0, wallTop, W2, 2, beam); px(0, H2 - 8, W2, 2, beam);
    for (let i = 0; i <= w; i++) { const x = Math.min(W2 - 2, i * 16); px(x, wallTop, 2, H2 - wallTop - 6, beam); px(x, wallTop, 1, H2 - wallTop - 6, beamL); }
    for (let i = 0; i < w; i++) {
      if (i === doorX) continue;
      // diagonal brace under the window
      for (let k = 0; k < 6; k++) px(i * 16 + 3 + k * 2, H2 - 9 - k, 2, 1, beam);
    }
  } else if (style === 'brick') {
    for (let y = wallTop + 2, row = 0; y < H2 - 4; y += 4, row++) {
      px(0, y, W2, 1, shade(B.wall, 0.78));
      for (let x = (row % 2) * 4; x < W2; x += 8) px(x, y, 1, 4, shade(B.wall, 0.8));
      for (let x = (row % 2) * 4 + 2; x < W2; x += 16) px(x, y + 1, 3, 1, shade(B.wall, 1.08));
    }
  } else if (style === 'stone') {
    for (let y = wallTop + 2, row = 0; y < H2 - 4; y += 6, row++) {
      px(0, y, W2, 1, shade(B.wall, 0.75));
      for (let x = (row % 2) * 6; x < W2; x += 12) px(x, y, 1, 6, shade(B.wall, 0.75));
      for (let x = (row % 2) * 6 + 2; x < W2; x += 12) px(x, y + 1, 6, 1, shade(B.wall, 1.1));
    }
  }
  // stone foundation
  px(0, H2 - 6, W2, 6, '#9a9484'); px(0, H2 - 6, W2, 1, '#b8b2a2'); px(0, H2 - 1, W2, 1, '#6e6a5e');
  for (let x = 3; x < W2; x += 9) px(x, H2 - 5, 1, 4, '#7e786a');
  // ---- roof: overlapping clay tiles ----
  px(0, 2, W2, roofH - 2, B.roof);
  for (let y = 4, row = 0; y < roofH - 1; y += 4, row++) {
    px(0, y + 3, W2, 1, B.roofD);
    for (let x = (row % 2) * 3; x < W2; x += 6) { px(x, y, 1, 3, shade(B.roof, 0.82)); px(x + 1, y, 3, 1, shade(B.roof, 1.14)); }
  }
  px(0, 2, W2, 2, shade(B.roof, 1.25)); px(0, 2, W2, 1, B.roofD);
  px(0, roofH - 2, W2, 2, B.roofD); px(0, roofH, W2, 1, 'rgba(0,0,0,0.25)');
  px(0, 2, 1, roofH - 2, B.roofD); px(W2 - 1, 2, 1, roofH - 2, B.roofD);
  // ---- windows: wooden frame, cross bars, sill ----
  for (let i = 0; i < w; i++) {
    if (i === doorX) continue;
    if (kind === 'gym' && i % 2) continue;
    const wx = i * 16 + 3, wy = roofH + 2;
    px(wx - 1, wy - 1, 12, 11, '#5a3c22'); px(wx, wy, 10, 9, '#7ab8e0'); px(wx + 1, wy + 1, 3, 3, '#c8ecff');
    px(wx + 4, wy, 1, 9, '#5a3c22'); px(wx, wy + 4, 10, 1, '#5a3c22');
    px(wx - 2, wy + 9, 14, 2, '#8a6a48'); px(wx - 2, wy + 9, 14, 1, '#a88a62');
  }
  // ---- door: planks in a frame, with a step ----
  const dx = doorX * 16;
  px(dx + 1, H2 - 17, 14, 17, '#4a3020');
  px(dx + 3, H2 - 15, 10, 15, '#8a5a30');
  for (let x = dx + 5; x < dx + 13; x += 3) px(x, H2 - 15, 1, 15, '#6e4626');
  px(dx + 4, H2 - 13, 8, 4, '#a8d4ee'); px(dx + 4, H2 - 13, 8, 1, '#6e4626');
  px(dx + 11, H2 - 7, 1, 2, '#e8c860');
  px(dx, H2 - 2, 16, 2, '#b0aa98');
  if (B.label) {
    const tw = Math.max(26, pxWidth(B.label) + 8);
    px(dx + 8 - tw / 2, roofH - 13, tw, 11, '#f8f8f8'); px(dx + 9 - tw / 2, roofH - 12, tw - 2, 9, B.roofD);
    pxText(g, B.label, dx + 8, roofH - 11, '#f8f8f8', null, 1, 'center');
  }
  if (kind === 'center') { px(dx + 6, 6, 4, 10, '#f8f8f8'); px(dx + 3, 9, 10, 4, '#f8f8f8'); }
  cache.set(key, c);
  return c;
}

// Capture orbs: an original teal shell with a gold ring and a gem in the middle.
function drawOrb(p, cx, cy, r, top) {
  p.circ(cx, cy, r, '#f0e6c8');
  p.clip(() => p.rect(0, 0, 64, cy + 0.5, top), (gg) => gg.arc(cx, cy, r, 0, 7));
  p.rect(cx - r, cy - 0.5, r * 2, 1.5, '#e0b030');
  p.poly([[cx, cy - 2.5], [cx + 2.5, cy], [cx, cy + 2.5], [cx - 2.5, cy]], '#e0b030');
  p.rect(cx - 0.5, cy - 1, 1, 1, '#fff8c0');
  p.rect(cx - r * 0.5, cy - r * 0.6, 2, 1, '#ffffff');
}
export function itemBall() {
  if (cache.has('ball')) return cache.get('ball');
  const c = mk(16, 16); const g = c.getContext('2d');
  const p = painter(g);
  drawOrb(p, 8, 9, 5.5, '#2aa89a');
  pixelize(c, [...p.used], '#202028');
  cache.set('ball', c);
  return c;
}

export function orb(kind = 'orb') {
  const key = 'orb:' + kind;
  if (cache.has(key)) return cache.get(key);
  const c = mk(12, 12); const g = c.getContext('2d');
  const p = painter(g);
  const top = kind === 'greatorb' ? '#3870e0' : kind === 'ultraorb' ? '#303038' : kind === 'masterorb' ? '#9040c0' : '#2aa89a';
  drawOrb(p, 6, 6, 5, top);
  pixelize(c, [...p.used], '#202028');
  cache.set(key, c);
  return c;
}

