// All graphics are generated in code: creatures are drawn with shapes on a
// small canvas, then "pixelized" (hard alpha, palette snap, dark outline) so
// they look like hand-made pixel art. Tiles, buildings and people are drawn
// pixel by pixel.
import { SPECIES } from './data.js';

const cache = new Map();
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function pixelize(c, palette, outline = '#1c1c2c') {
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
    ell(x, y, rx, ry, col, rot = 0) { g.fillStyle = u(col); g.beginPath(); g.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, Math.PI * 2); g.fill(); },
    circ(x, y, r, col) { this.ell(x, y, r, r, col); },
    rect(x, y, w, h, col) { g.fillStyle = u(col); g.fillRect(x, y, w, h); },
    poly(pts, col) { g.fillStyle = u(col); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); },
    line(pts, col, w = 1.5) { g.strokeStyle = u(col); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); },
    eye(x, y, r = 2.2, mean = false) {
      this.ell(x, y, r * 0.85, r * 1.15, '#202028');
      this.rect(Math.round(x - r * 0.5), Math.round(y - r * 0.7), 1, 1, '#ffffff');
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
    const big = st === 2;
    const body = big ? '#7c6a48' : '#a68459', belly = '#f0dcb0', leaf = '#58b848', leafD = '#3a8a3a';
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
    const big = st === 2;
    const o = '#f08838', oD = '#c85a20', cream = '#fff0d8', fy = '#f8d030', fr = '#e04020';
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
    const big = st === 2;
    const b = big ? '#3a78d0' : '#68a8f0', bl = big ? '#6aa0e8' : '#a0d0f8', belly = '#d8f0ff', gill = '#f0a0c8';
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
    const big = st === 2;
    const br = big ? '#8a5a30' : '#b88858', brD = big ? '#5a3818' : '#8a6038', cream = '#f8e8c8', beak = '#f8c030';
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
    const big = st === 2;
    const r = big ? '#8a8070' : '#9a9a9a', rl = big ? '#b0a890' : '#c0c0c0', rd = big ? '#605848' : '#6a6a6a';
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

export function creature(sp, size = 56, back = false) {
  const key = `c:${sp}:${size}:${back}`;
  if (cache.has(key)) return cache.get(key);
  const s = SPECIES[sp];
  const c = mk(size, size);
  const g = c.getContext('2d');
  g.scale(size / 56, size / 56);
  const p = painter(g);
  FAM[s.family](p, s.stage, back);
  pixelize(c, [...p.used], '#1c1c2c');
  cache.set(key, c);
  return c;
}

// silhouette for unseen / evolution flash
export function silhouette(sp, size = 56, col = '#ffffff') {
  const key = `s:${sp}:${size}:${col}`;
  if (cache.has(key)) return cache.get(key);
  const src = creature(sp, size);
  const c = mk(size, size); const g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, size, size);
  cache.set(key, c);
  return c;
}

// ---------------- people (16x24) ----------------
export const LOOKS = {
  player: { skin: '#f8d0a8', hair: '#503018', shirt: '#d84838', pants: '#384870', hat: '#d84838', hatB: '#f8f8f8' },
  kai: { skin: '#f0c8a0', hair: '#283858', shirt: '#3870c8', pants: '#303040', spiky: true },
  juno: { skin: '#e8b890', hair: '#e07830', shirt: '#38a868', pants: '#584038', long: true },
  maple: { skin: '#f8d8b8', hair: '#a07850', shirt: '#f8f8f0', pants: '#787890', coat: true, long: true },
  mom: { skin: '#f8d0a8', hair: '#704020', shirt: '#e890a0', pants: '#6070a0', long: true },
  nurse: { skin: '#f8d8c0', hair: '#f090b0', shirt: '#f8f8f8', pants: '#f8f8f8', long: true, hat: '#f8f8f8', hatB: '#f06080' },
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
};

export function person(lookId, dir = 'down', step = 0) {
  const key = `p:${lookId}:${dir}:${step}`;
  if (cache.has(key)) return cache.get(key);
  const L = LOOKS[lookId] || LOOKS.boy;
  const c = mk(16, 24); const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const side = dir === 'left' || dir === 'right';
  const shoe = '#383838';
  // legs
  const lu = step === 1 ? 1 : 0, ru = step === 2 ? 1 : 0;
  if (side) {
    const off = step ? 1 : 0;
    px(6 - off, 18, 2, 4, L.pants); px(8 + off, 18, 2, 4, L.pants);
    px(6 - off, 21, 2, 2, shoe); px(8 + off, 21, 2, 2, shoe);
  } else {
    px(5, 18, 2, 4 - lu, L.pants); px(9, 18, 2, 4 - ru, L.pants);
    px(5, 21 - lu, 3, 2, shoe); px(8, 21 - ru, 3, 2, shoe);
  }
  // body
  px(4, 12, 8, 7, L.shirt);
  if (L.coat) { px(3, 12, 10, 8, L.shirt); px(7, 12, 2, 7, '#c8c8d0'); }
  if (L.emblem && dir !== 'up') { px(7, 14, 2, 2, '#f8d030'); px(6, 15, 1, 1, '#f8d030'); }
  // arms
  if (side) { px(7, 13, 2, 4, L.shirt); px(7, 17, 2, 1, L.skin); } else {
    const sw = step === 1 ? -1 : step === 2 ? 1 : 0;
    px(3, 12 + Math.max(0, sw), 1, 5, L.shirt); px(12, 12 + Math.max(0, -sw), 1, 5, L.shirt);
    px(3, 17 + Math.max(0, sw), 1, 1, L.skin); px(12, 17 + Math.max(0, -sw), 1, 1, L.skin);
  }
  // head
  px(4, 3, 8, 9, L.skin); px(5, 2, 6, 1, L.skin);
  // hair
  if (dir === 'up') {
    px(4, 2, 8, 9, L.hair); px(5, 1, 6, 1, L.hair);
    if (L.long) px(4, 10, 8, 3, L.hair);
  } else if (side) {
    px(4, 2, 8, 3, L.hair); px(5, 1, 6, 1, L.hair); px(8, 5, 4, 5, L.hair);
    if (L.long) px(8, 5, 4, 8, L.hair);
    px(5, 7, 1, 2, '#202030');
    if (L.beard) px(4, 9, 4, 3, L.hair);
  } else {
    px(4, 2, 8, 3, L.hair); px(5, 1, 6, 1, L.hair); px(4, 5, 1, 3, L.hair); px(11, 5, 1, 3, L.hair);
    if (L.long) { px(3, 5, 2, 8, L.hair); px(11, 5, 2, 8, L.hair); }
    px(6, 7, 1, 2, '#202030'); px(9, 7, 1, 2, '#202030');
    if (L.beard) px(5, 9, 6, 3, L.hair);
  }
  if (L.spiky) { px(4, 0, 2, 2, L.hair); px(7, 0, 2, 1, L.hair); px(10, 0, 2, 2, L.hair); }
  if (L.hat) {
    px(4, 1, 8, 3, L.hat); px(5, 0, 6, 1, L.hat);
    if (dir === 'down') px(4, 4, 8, 1, L.hatB);
    else if (side) px(1, 4, 6, 1, L.hatB);
    if (L.hatB && dir !== 'up' && !side) px(7, 2, 2, 1, L.hatB);
  }
  if (dir === 'right') {
    const t = mk(16, 24); const tg = t.getContext('2d');
    tg.translate(16, 0); tg.scale(-1, 1); tg.drawImage(c, 0, 0);
    g.clearRect(0, 0, 16, 24); g.drawImage(t, 0, 0);
  }
  pixelize(c, [], '#202030');
  cache.set(key, c);
  return c;
}

// ---------------- tiles (16x16) ----------------
function srand(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

const TILE_DRAW = {
  grass(px, r) {
    px(0, 0, 16, 16, '#88d070');
    for (let i = 0; i < 5; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); px(x, y, 1, 2, '#68b050'); px(x + 1, y + 1, 1, 1, '#68b050'); }
  },
  tall(px) {
    px(0, 0, 16, 16, '#58b048');
    for (const [x, y] of [[1, 2], [6, 0], [11, 3], [3, 8], [9, 9], [13, 10]]) {
      px(x, y + 2, 1, 5, '#2f7a2a'); px(x + 1, y, 1, 7, '#3c8c34'); px(x + 2, y + 2, 1, 5, '#2f7a2a'); px(x + 1, y, 1, 2, '#90d878');
    }
  },
  path(px, r) {
    px(0, 0, 16, 16, '#e8d098');
    for (let i = 0; i < 4; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#d0b478');
  },
  sand(px, r) { px(0, 0, 16, 16, '#f0e0a8'); for (let i = 0; i < 5; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#d8c488'); },
  tree(px) {
    TILE_DRAW.grass(px, srand(3));
    px(6, 11, 4, 5, '#7a5030'); px(7, 11, 1, 5, '#9a6840');
    px(2, 3, 12, 9, '#2f8a3a'); px(1, 5, 14, 5, '#2f8a3a'); px(4, 1, 8, 2, '#2f8a3a');
    px(3, 3, 6, 4, '#48a848'); px(4, 2, 4, 1, '#48a848'); px(4, 3, 2, 2, '#78c868'); px(9, 7, 4, 3, '#287830');
  },
  water(px, r, f) {
    px(0, 0, 16, 16, '#5898f0');
    const o = f % 2 ? 4 : 0;
    px((2 + o) % 16, 4, 5, 1, '#90c8f8'); px((10 + o) % 16, 10, 4, 1, '#90c8f8'); px((5 + o) % 16, 13, 3, 1, '#90c8f8');
  },
  flower(px, r, f) {
    TILE_DRAW.grass(px, srand(7));
    const o = f % 2;
    for (const [x, y, c] of [[3, 3, '#f05858'], [10, 9, '#f8f8f8'], [11, 2, '#f8d030'], [4, 11, '#f8f8f8']]) {
      px(x + o, y, 3, 1, c); px(x + 1 + o, y - 1, 1, 3, c); px(x + 1 + o, y, 1, 1, '#f8c020'); px(x + 1, y + 2, 1, 2, '#3c8c34');
    }
  },
  fence(px) {
    TILE_DRAW.grass(px, srand(5));
    px(0, 5, 16, 2, '#c09060'); px(0, 10, 16, 2, '#c09060');
    px(2, 3, 3, 11, '#d8a870'); px(11, 3, 3, 11, '#d8a870'); px(2, 13, 3, 1, '#8a6038'); px(11, 13, 3, 1, '#8a6038');
  },
  sign(px) {
    TILE_DRAW.grass(px, srand(9));
    px(7, 9, 2, 6, '#8a6038'); px(2, 3, 12, 7, '#c89058'); px(3, 4, 10, 5, '#e8b878'); px(4, 5, 8, 1, '#8a6038'); px(4, 7, 6, 1, '#8a6038');
  },
  rock(px) {
    TILE_DRAW.grass(px, srand(11));
    px(2, 4, 12, 10, '#9a9a9a'); px(3, 3, 9, 1, '#9a9a9a'); px(3, 5, 5, 3, '#c0c0c0'); px(8, 10, 6, 4, '#707070');
  },
  dock(px) { px(0, 0, 16, 16, '#b08050'); for (let y = 3; y < 16; y += 4) px(0, y, 16, 1, '#806030'); px(4, 0, 1, 3, '#806030'); px(11, 4, 1, 3, '#806030'); px(6, 8, 1, 3, '#806030'); px(13, 12, 1, 3, '#806030'); },
  floor(px) { px(0, 0, 16, 16, '#e0c090'); px(0, 7, 16, 1, '#c8a070'); px(0, 15, 16, 1, '#c8a070'); px(5, 0, 1, 7, '#c8a070'); px(11, 8, 1, 7, '#c8a070'); },
  wall(px) { px(0, 0, 16, 16, '#e8e0f0'); for (let x = 1; x < 16; x += 4) px(x, 0, 1, 13, '#d0c8e0'); px(0, 13, 16, 3, '#8890a8'); px(0, 13, 16, 1, '#a8b0c8'); },
  counter(px) { px(0, 0, 16, 16, '#c07848'); px(0, 0, 16, 5, '#e8a868'); px(0, 5, 16, 1, '#8a4828'); px(0, 15, 16, 1, '#8a4828'); },
  shelf(px) { px(0, 0, 16, 16, '#8a5a30'); px(1, 1, 14, 6, '#5a3818'); px(1, 9, 14, 6, '#5a3818'); ['#d04040', '#4070d0', '#40a050', '#e0c040', '#a060c0', '#e08030', '#4070d0'].forEach((c, i) => { px(1 + i * 2, 2, 2, 5, c); px(15 - (i + 1) * 2, 10, 2, 5, c); }); },
  table(px) { TILE_DRAW.floor(px); px(1, 3, 14, 8, '#a87040'); px(1, 3, 14, 2, '#c89060'); px(2, 11, 2, 4, '#7a4820'); px(12, 11, 2, 4, '#7a4820'); },
  pc(px) { TILE_DRAW.floor(px); px(2, 2, 12, 9, '#9098a8'); px(3, 3, 10, 6, '#40c0f0'); px(4, 4, 3, 1, '#c0f0ff'); px(5, 11, 6, 3, '#9098a8'); px(3, 14, 10, 1, '#606878'); },
  healer(px) { px(0, 0, 16, 16, '#e8a868'); px(1, 2, 14, 10, '#f8f8f8'); for (let i = 0; i < 3; i++) { px(2 + i * 4, 4, 3, 3, '#f05050'); px(2 + i * 4, 7, 3, 3, '#f8f8f8'); } px(1, 12, 14, 4, '#c07848'); },
  mat(px) { TILE_DRAW.floor(px); px(1, 3, 14, 11, '#d05050'); px(3, 5, 10, 7, '#e87070'); },
  carpet(px) { px(0, 0, 16, 16, '#c05858'); px(0, 0, 16, 1, '#a04040'); px(2, 2, 12, 12, '#d06868'); },
  plant(px) { TILE_DRAW.floor(px); px(4, 10, 8, 5, '#c06030'); px(3, 9, 10, 2, '#d87848'); px(3, 2, 10, 7, '#38a048'); px(5, 1, 6, 2, '#58c060'); px(2, 5, 2, 3, '#38a048'); px(12, 5, 2, 3, '#38a048'); },
  bed(px) { TILE_DRAW.floor(px); px(1, 1, 14, 15, '#8a6038'); px(2, 2, 12, 4, '#f8f8f8'); px(2, 6, 12, 9, '#4878c8'); px(2, 6, 12, 1, '#88a8e0'); },
  tv(px) { TILE_DRAW.floor(px); px(2, 3, 12, 10, '#404048'); px(3, 4, 10, 7, '#60a0c0'); px(4, 5, 3, 2, '#a0d8f0'); px(5, 13, 6, 2, '#404048'); },
  gymfloor(px) { px(0, 0, 16, 16, '#c8c0b0'); px(0, 0, 16, 1, '#a8a090'); px(0, 0, 1, 16, '#a8a090'); px(4, 5, 2, 1, '#b0a898'); px(10, 11, 3, 1, '#b0a898'); },
  statue(px) { TILE_DRAW.gymfloor(px); px(3, 12, 10, 4, '#787878'); px(4, 3, 8, 9, '#a0a0a0'); px(5, 2, 6, 1, '#a0a0a0'); px(5, 4, 3, 3, '#c8c8c8'); px(9, 8, 3, 4, '#787878'); },
  boulder(px) { TILE_DRAW.gymfloor(px); px(2, 4, 12, 10, '#8a8070'); px(3, 3, 9, 1, '#8a8070'); px(3, 5, 5, 3, '#b0a890'); px(8, 10, 6, 4, '#605848'); },
  void(px) { px(0, 0, 16, 16, '#101018'); },
  ledge(px) { TILE_DRAW.grass(px, srand(13)); px(0, 10, 16, 3, '#609848'); px(0, 13, 16, 1, '#407030'); },
};
export const TILE_FRAMES = { water: 2, flower: 2 };

export function tile(name, variant = 0, f = 0) {
  const frames = TILE_FRAMES[name] || 1;
  const ff = f % frames;
  const v = name === 'grass' || name === 'path' || name === 'sand' ? variant % 4 : 0;
  const key = `t:${name}:${v}:${ff}`;
  if (cache.has(key)) return cache.get(key);
  const c = mk(16, 16); const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  (TILE_DRAW[name] || TILE_DRAW.void)(px, srand(v + 1), ff);
  cache.set(key, c);
  return c;
}

// ---------------- buildings ----------------
const BUILD = {
  house: { roof: '#c05038', roofD: '#8a3020', wall: '#f0e8d8' },
  house2: { roof: '#4878c0', roofD: '#305890', wall: '#f0e8d8' },
  lab: { roof: '#888898', roofD: '#606070', wall: '#f8f8f0' },
  center: { roof: '#e05050', roofD: '#a83030', wall: '#f8f0f0', label: 'HEAL' },
  mart: { roof: '#4080e0', roofD: '#2858a8', wall: '#f0f0f8', label: 'MART' },
  gym: { roof: '#a07840', roofD: '#705020', wall: '#c8c0b0', label: 'GYM' },
};
export function building(kind, w, h, doorX) {
  const key = `b:${kind}:${w}:${h}:${doorX}`;
  if (cache.has(key)) return cache.get(key);
  const B = BUILD[kind];
  const c = mk(w * 16, h * 16); const g = c.getContext('2d');
  const px = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); };
  const roofH = (h - 2) * 16 + 4;
  const W2 = w * 16;
  px(0, roofH - 4, W2, h * 16 - roofH + 4, B.wall);
  px(0, h * 16 - 3, W2, 3, '#a09888');
  px(0, 2, W2, roofH - 2, B.roof);
  for (let y = 6; y < roofH; y += 5) px(0, y, W2, 1, B.roofD);
  px(0, 2, W2, 2, '#f8f8f8'); px(0, roofH - 2, W2, 2, B.roofD);
  // windows
  for (let i = 0; i < w; i++) {
    if (i === doorX) continue;
    if (kind === 'gym' && i % 2) continue;
    px(i * 16 + 3, roofH + 3, 10, 9, '#606878'); px(i * 16 + 4, roofH + 4, 8, 7, '#88c8f0'); px(i * 16 + 5, roofH + 5, 3, 2, '#d0f0ff');
  }
  // door
  const dx = doorX * 16;
  px(dx + 2, h * 16 - 15, 12, 15, '#5a3818'); px(dx + 3, h * 16 - 14, 10, 14, '#8a5a30'); px(dx + 3, h * 16 - 14, 10, 6, '#b0d8f0');
  if (B.label) {
    g.font = 'bold 7px Pixelify, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = Math.max(26, g.measureText(B.label).width + 8);
    px(dx + 8 - tw / 2, roofH - 12, tw, 10, '#f8f8f8'); px(dx + 9 - tw / 2, roofH - 11, tw - 2, 8, B.roofD);
    g.fillStyle = '#f8f8f8'; g.fillText(B.label, dx + 8, roofH - 7);
  }
  if (kind === 'center') { px(dx + 6, 6, 4, 10, '#f8f8f8'); px(dx + 3, 9, 10, 4, '#f8f8f8'); }
  cache.set(key, c);
  return c;
}

export function itemBall() {
  if (cache.has('ball')) return cache.get('ball');
  const c = mk(16, 16); const g = c.getContext('2d');
  const p = painter(g);
  p.circ(8, 9, 5.5, '#f8f8f8');
  p.clip(() => p.rect(0, 0, 16, 9, '#e03838'), (gg) => gg.arc(8, 9, 5.5, 0, 7));
  p.rect(2, 8, 12, 1, '#202028'); p.circ(8, 9, 1.8, '#f8f8f8');
  pixelize(c, [...p.used, '#e03838'], '#202028');
  cache.set('ball', c);
  return c;
}

export function orb(kind = 'orb') {
  const key = 'orb:' + kind;
  if (cache.has(key)) return cache.get(key);
  const c = mk(12, 12); const g = c.getContext('2d');
  const p = painter(g);
  const top = kind === 'greatorb' ? '#3870e0' : '#e03838';
  p.circ(6, 6, 5, '#f8f8f8');
  p.clip(() => p.rect(0, 0, 12, 6, top), (gg) => gg.arc(6, 6, 5, 0, 7));
  p.rect(1, 5, 10, 1, '#202028'); p.circ(6, 6, 1.4, '#f8f8f8');
  pixelize(c, [...p.used, top], '#202028');
  cache.set(key, c);
  return c;
}

// Big trainer portrait for battle intros: person sprite scaled 3x.
export function trainerPortrait(look) {
  const key = 'tp:' + look;
  if (cache.has(key)) return cache.get(key);
  const c = mk(48, 72); const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(person(look, 'down', 0), 0, 0, 48, 72);
  cache.set(key, c);
  return c;
}
