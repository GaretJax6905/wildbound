// Overworld: tile movement, NPCs, doors/edges, tall grass, trainers' line of sight,
// and field moves (Slash bushes, Shatter rocks, Wave Ride water, Heave boulders, Glow dark caves).
import { settings } from './state.js';
import { W, H, T, input, wait, fadeOut, fadeIn, setScene, frame, chance, pick } from './engine.js';
import { MAPS, SOLID, GRASSY, buildingSolid, GYMS } from './maps.js';
import { tile, prop, person, building, itemBall, creature, setPlayerLook, pathEdge, drawPerson } from './art.js';
const LAWN = new Set(['grass', 'flower', 'tall', 'sign', 'tree', 'rock', 'palm', 'stump', 'fence', 'bush', 'mapletree', 'goldtree', 'pillar', 'grave', 'reeds']);
const SNOWY = new Set(['snow', 'pine', 'snowgrass']);
const SHORE = new Set(['reeds', 'mapletree', 'goldtree', 'cactus', 'drygrass', 'grass', 'flower', 'tall', 'sign', 'tree', 'rock', 'palm', 'stump', 'fence', 'bush', 'sand', 'path', 'snow', 'pine', 'snowgrass', 'ash', 'dock', 'cavefloor', 'cavepath', 'dirt']);
// the ground a map is mostly made of: painted props (trees, signs, furniture) stand on it
const GROUNDS = ['grass', 'snow', 'ash', 'sand', 'cavefloor', 'gymfloor', 'dkfloor', 'floor', 'icefloor', 'carpet'];
const WET = new Set(['water']);
// props stand on the map's usual ground, except on a beach where most neighbours are sand
function localGround(m, x, y) {
  const gr = groundOf(m);
  if (gr !== 'grass') return gr;
  let n = 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (tileAt(x + dx, y + dy) === 'sand') n++;
  return n >= 2 ? 'sand' : gr;
}
function groundOf(m) {
  if (m._ground) return m._ground;
  const n = {};
  for (const row of m.tiles) for (const t0 of row) { const t = t0 === 'tall' || t0 === 'flower' ? 'grass' : t0 === 'snowgrass' ? 'snow' : t0; if (GROUNDS.includes(t)) n[t] = (n[t] || 0) + 1; }
  let best = m.interior ? 'floor' : 'grass';
  for (const t of GROUNDS) if ((n[t] || 0) > (n[best] || 0)) best = t;
  m._ground = best === 'floor' ? floorOf(m) : best;
  return m._ground;
}
// ---- climate: falling rain, snow or volcanic ash over the outdoor maps that call for it ----
const RAINY = new Set(['route4', 'route6']);
// soft contact shadow under people, trees and rocks
const TALL_PROPS = new Set(['tree', 'jungle', 'tpalm', 'palm', 'pine', 'mapletree', 'goldtree', 'deadtree', 'rock', 'shellrock', 'cactus', 'barrelcactus', 'statue', 'pillar', 'hibiscus', 'bush', 'crystal', 'crystal2', 'stalagmite']);
function groundShadow(g, x, y, rx, ry) {
  g.fillStyle = 'rgba(16, 24, 32, 0.22)';
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
}
// Day and night follow the real clock outdoors: a pink dawn, golden sunset, violet dusk and a
// blue night with fireflies over the grass. Can be turned off in OPTIONS.
function skyTint() {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h >= 5 && h < 7) return ['rgba(255, 168, 140, 0.12)', false];
  if (h >= 7 && h < 17) return null;
  if (h >= 17 && h < 19) return ['rgba(255, 140, 50, 0.18)', false];
  if (h >= 19 && h < 21) return ['rgba(90, 60, 150, 0.22)', true];
  return ['rgba(18, 30, 90, 0.34)', true];
}
const FLIES = Array.from({ length: 14 }, (_, i) => ({ x: (i * 53 + 17) % 240, y: (i * 89 + 31) % 160, p: i * 1.7 }));
function drawDaylight(g, m, cx, cy) {
  if (settings.daylight === false || m.interior || m.cave || m.dark) return;
  const t = skyTint();
  if (!t) return;
  g.fillStyle = t[0]; g.fillRect(0, 0, W, H);
  if (!t[1] || !['grass', 'forest', 'route', 'town', 'coast', 'autumn', 'ruins', 'swamp'].includes(m.style)) return;
  for (const f of FLIES) {
    const x = wrap(f.x - cx * 0.3 + Math.sin(frame / 70 + f.p) * 12, W), y = wrap(f.y - cy * 0.3 + Math.cos(frame / 55 + f.p) * 8, H);
    const glow = 0.5 + 0.5 * Math.sin(frame / 18 + f.p * 3);
    g.fillStyle = `rgba(230, 255, 140, ${0.35 * glow})`; g.fillRect(x - 1, y - 1, 3, 3);
    g.fillStyle = `rgba(250, 255, 200, ${0.6 + 0.4 * glow})`; g.fillRect(x, y, 1, 1);
  }
}
function weatherOf(m) {
  if (m.interior || m.cave) return null;
  if (m.weather !== undefined) return m.weather;
  if (m.style === 'desert') return 'sand';
  if (m.style === 'snow') return 'snow';
  if (m.style === 'ash') return 'ash';
  if (RAINY.has(m.id) || (m.style === 'sea' && m.region !== 'azurine')) return 'rain';
  return null;
}
const FLAKES = Array.from({ length: 80 }, (_, i) => ({ x: (i * 97 + 13) % 240, y: (i * 61 + 7) % 160, s: 0.6 + ((i * 37) % 10) / 12, i }));
const wrap = (v, n) => ((v % n) + n) % n;
function drawWeather(g, kind, cx, cy) {
  if (kind === 'rain') {
    g.fillStyle = 'rgba(24,36,72,0.20)'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(206,224,255,0.7)';
    for (const p of FLAKES) {
      const t = frame * 3.2 * p.s;
      const x = Math.floor(wrap(p.x - cx - t * 0.3, W)), y = Math.floor(wrap(p.y - cy + t, H));
      g.fillRect(x, y, 1, 3); g.fillRect(x - 1, y + 3, 1, 2);
    }
    // the odd splash on the ground
    g.fillStyle = 'rgba(220,235,255,0.6)';
    for (let k = 0; k < 6; k++) { const p = FLAKES[(Math.floor(frame / 6) * 7 + k * 13) % FLAKES.length]; g.fillRect(wrap(p.x * 3 - cx, W) | 0, wrap(p.y * 5 - cy, H) | 0, 3, 1); }
  } else if (kind === 'snow') {
    g.fillStyle = 'rgba(150,175,220,0.14)'; g.fillRect(0, 0, W, H);
    for (const p of FLAKES) {
      const t = frame * 0.45 * p.s;
      const x = Math.floor(wrap(p.x - cx + Math.sin((frame + p.i * 23) / 28) * 5, W)), y = Math.floor(wrap(p.y - cy + t, H));
      const big = p.s > 1.05;
      // a soft blue shadow keeps the flakes visible against white ground
      g.fillStyle = 'rgba(90,120,170,0.45)'; g.fillRect(x + 1, y + 1, big ? 2 : 1, big ? 2 : 1);
      g.fillStyle = '#ffffff'; g.fillRect(x, y, big ? 2 : 1, big ? 2 : 1);
    }
  } else if (kind === 'sand') {
    // sandstorm: a warm haze and grit streaking sideways
    g.fillStyle = 'rgba(190,130,60,0.24)'; g.fillRect(0, 0, W, H);
    for (const p of FLAKES) for (const o of [0, 90]) {
      const t = frame * 2.6 * p.s;
      const x = Math.floor(wrap(p.x + o - cx + t, W)), y = Math.floor(wrap(p.y + o * 0.6 - cy + Math.sin((frame + p.i * 11) / 18) * 3 + t * 0.15, H));
      g.fillStyle = p.i % 3 ? 'rgba(130,84,36,0.7)' : 'rgba(250,226,170,0.85)';
      g.fillRect(x, y, p.s > 1 ? 4 : 2, 1);
    }
  } else if (kind === 'fog') {
    // drifting mist banks
    g.fillStyle = 'rgba(220,226,236,0.18)'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 7; k++) {
      const x = wrap(k * 61 - cx * 0.6 + frame * 0.15 * (1 + (k % 3) * 0.3), W + 120) - 60, y = wrap(k * 37 - cy * 0.6, H + 40) - 20;
      g.fillStyle = 'rgba(235,240,248,0.22)'; g.beginPath(); g.ellipse(x, y, 48, 12, 0, 0, 7); g.fill();
    }
  } else if (kind === 'storm') {
    // thunderstorm: heavy slanted rain, a dark sky and the odd lightning flash
    const flash = (frame % 420) < 6 || ((frame % 420) > 12 && (frame % 420) < 16);
    g.fillStyle = flash ? 'rgba(240,244,255,0.55)' : 'rgba(16,20,48,0.32)'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(200,214,250,0.75)';
    for (const p of FLAKES) for (const o of [0, 120]) {
      const t = frame * 4.2 * p.s;
      const x = Math.floor(wrap(p.x + o - cx - t * 0.5, W)), y = Math.floor(wrap(p.y + o * 0.4 - cy + t, H));
      g.fillRect(x, y, 1, 3); g.fillRect(x - 1, y + 3, 1, 2);
    }
  } else if (kind === 'ash') {
    g.fillStyle = 'rgba(120,70,40,0.10)'; g.fillRect(0, 0, W, H);
    for (const p of FLAKES) {
      const t = frame * 0.3 * p.s;
      const x = Math.floor(wrap(p.x - cx + t * 0.6 + Math.sin((frame + p.i * 17) / 40) * 3, W)), y = Math.floor(wrap(p.y - cy + t, H));
      g.fillStyle = p.i % 9 === 0 ? (Math.floor(frame / 8 + p.i) % 3 ? '#f08a3c' : '#f8c060') : 'rgba(70,62,58,0.75)';
      g.fillRect(x, y, 1, 1);
    }
  }
}
// homes have wooden floors; the healing centre, mart and lab are tiled; the league is marble
function floorOf(m) { return /^(center|mart|lab)/.test(m.id) ? 'tilefloor' : /^(league|e4_|champ|halloffame)/.test(m.id) ? 'marble' : 'floor'; }
// gyms have stone walls, the Eclipse base steel, the league marble; everywhere else wallpaper
function wallOf(m) { return m.gym ? 'stone' : m.id === 'eclipsehq' ? 'metal' : /^(league|e4_|champ|halloffame)/.test(m.id) ? 'marble' : ''; }
const CAVEFLOOR = new Set(['cavefloor', 'rock', 'crack']);
function hasLava(m) { if (m._lava === undefined) m._lava = m.tiles.some((r) => r.includes('lava')); return m._lava; }
const LAVA_BANK = new Set(['ash', 'cavefloor', 'cavepath', 'rock', 'path', 'gymfloor', 'cavewall']);
import { G, flag, setFlag, save, addItem } from './state.js';
import { ITEMS, FIELD, SPECIES } from './data.js';
import { say, box, text, yesNo } from './ui.js';
import { playMusic, sfx } from './audio.js';
import { name as monName } from './mon.js';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };

export const world = {
  map: null,
  player: { x: 0, y: 0, dir: 'down', off: 0, moving: false, look: 'player', step: 0, isPlayer: true, surf: false },
  npcs: [],
  boulders: [],
  cleared: new Set(),
  glow: false,
  heave: false,
  busy: 0,
  emote: null,
  banner: null,
  holdTurn: 0,
  hooks: null, // set by story.js: { trigger, interact, trainer, encounter, menu, pc }
  lastSave: 0,
  stepsSinceBattle: 0,
};

function showCond(c) {
  if (!c) return true;
  if (typeof c === 'function') return c();
  return c[0] === '!' ? !flag(c.slice(1)) : flag(c);
}

// tile lookup that respects cut bushes / smashed rocks
// what to draw at a spot: past the edge of a seaside map the sea keeps going (drawing only)
function viewTile(m, x, y) {
  if ((x < 0 || y < 0 || x >= m.w || y >= m.h) && !m.interior && m.tiles[Math.min(m.h - 1, Math.max(0, y))][Math.min(m.w - 1, Math.max(0, x))] === 'water') return 'water';
  return tileAt(x, y);
}
export function tileAt(x, y) {
  const m = world.map;
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return y < 0 && m.borderNorth ? m.borderNorth : m.border;
  const t = m.tiles[y][x];
  if ((t === 'bush' || t === 'crack') && world.cleared.has(`${x},${y}`)) return t === 'bush' ? (m.style === 'snow' ? 'snow' : 'grass') : (m.cave ? 'cavefloor' : 'path');
  return t;
}

export function refreshNpcs() {
  const keep = world.npcs.filter((n) => n.spawned);
  world.npcs = world.map.npcs.filter((d) => showCond(d.show)).map((d) => {
    const ex = world.npcs.find((n) => n.id === d.id && !n.spawned);
    return ex || { ...d, look: d.look || world.hooks?.lookFor?.(d) || 'boy', home: [d.x, d.y], off: 0, moving: false, step: 0, timer: Math.floor(Math.random() * 120) };
  }).concat(keep);
}

export function loadMap(id, x, y, dir) {
  const m = MAPS[id];
  const sameMap = world.map === m;
  world.map = m;
  world.player.x = x; world.player.y = y; world.player.dir = dir || world.player.dir;
  world.player.off = 0; world.player.moving = false;
  world.player.surf = m.tiles[y] && m.tiles[y][x] === 'water';
  if (!sameMap) { world.cleared = new Set(); world.glow = false; world.heave = false; world.boulders = m.boulders.map((b) => ({ ...b })); }
  if (world.hooks && world.hooks.mapLoad) world.hooks.mapLoad(m);
  world.npcs = [];
  refreshNpcs();
  G.pos = { map: id, x, y, dir: world.player.dir };
  // Valor Isle is a side trip: you stay in the region you sailed from
  if (m.region !== 'valor') G.region = m.region;
  G.inValor = m.region === 'valor';
  if (m.town) { G.visited = G.visited || {}; G.visited[id] = true; }
  playMusic(world.player.surf ? 'sea' : m.music);
  if (!m.interior) world.banner = { text: m.name, t: 150 };
}

export function enterWorld() {
  setPlayerLook(G.gender);
  setScene(worldScene);
  loadMap(G.pos.map, G.pos.x, G.pos.y, G.pos.dir);
}

export async function warp(mapId, x, y, dir, o = {}) {
  if (o.sound !== false) sfx('door');
  await fadeOut(10);
  loadMap(mapId, x, y, dir);
  save();
  await wait(4);
  await fadeIn(10);
  if (world.map.dark && !world.glow) {
    const u = fieldUser('glow');
    world.busy++;
    try {
      if (u && (await yesNo(`It's pitch dark in here. Use Glow to light the way?`))) { world.glow = true; sfx('evolve'); await say(`${monName(u)} used Glow! The cave lit up!`); }
      else if (!u) await say('It\'s pitch dark in here... A creature that knows Glow would help.');
    } finally { world.busy--; }
  }
  if (world.hooks && world.hooks.arrive) { world.busy++; try { await world.hooks.arrive(); } finally { world.busy--; } }
}

// ---------- collision ----------
function npcAt(x, y, except) {
  return world.npcs.find((n) => n !== except && ((n.x === x && n.y === y) || (n.moving && n.tx === x && n.ty === y)));
}
function itemAt(x, y) { return world.map.items.find((it) => it.x === x && it.y === y && !flag('item_' + it.id)); }
const boulderAt = (x, y) => world.boulders.find((b) => b.x === x && b.y === y);
export function blocked(x, y, actor) {
  const m = world.map;
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
  const t = tileAt(x, y);
  const isPlayer = actor === world.player;
  if (t === 'water') { if (!(isPlayer && world.player.surf) && !(actor && actor.swim)) return true; } else if (SOLID.has(t)) return true;
  if (buildingSolid(m, x, y)) return true;
  if (itemAt(x, y) || boulderAt(x, y)) return true;
  if (npcAt(x, y, actor)) return true;
  const p = world.player;
  if (!isPlayer && ((p.x === x && p.y === y) || (p.moving && p.tx === x && p.ty === y))) return true;
  return false;
}

// Moves an actor one tile with a tween. speed = pixels per frame.
export async function stepActor(a, dir, speed = 1) {
  a.dir = dir;
  const [dx, dy] = DIRS[dir];
  a.tx = a.x + dx; a.ty = a.y + dy;
  a.moving = true;
  a.walkPhase = (a.walkPhase || 0) + 1;
  for (let o = speed; o <= T; o += speed) { a.off = o; await wait(1); }
  a.x = a.tx; a.y = a.ty; a.off = 0; a.moving = false;
}
export async function walk(a, dirs, speed = 1) { for (const d of dirs) await stepActor(a, d, speed); }
export function face(a, dir) { a.dir = dir; }
export function faceEachOther(npc) {
  const p = world.player;
  if (npc.x < p.x) npc.dir = 'right'; else if (npc.x > p.x) npc.dir = 'left';
  else if (npc.y < p.y) npc.dir = 'down'; else npc.dir = 'up';
  p.dir = opposite[npc.dir];
}
export async function showEmote(a, kind = '!') {
  world.emote = { a, kind };
  sfx('select');
  await wait(36);
  world.emote = null;
}
export function spawn(def) {
  const n = { ...def, home: [def.x, def.y], off: 0, moving: false, step: 0, spawned: true, timer: 0, move: def.move || 'static' };
  world.npcs.push(n);
  return n;
}
export function despawn(id) { world.npcs = world.npcs.filter((n) => n.id !== id); }
export const npcById = (id) => world.npcs.find((n) => n.id === id);

export async function run(fn) {
  world.busy++;
  try { await fn(); } catch (e) { console.error(e); } finally { world.busy--; }
  if (!world.busy) save();
}
export function pathTo(a, tx, ty) {
  const dirs = [];
  let x = a.x, y = a.y;
  while (x !== tx) { dirs.push(x < tx ? 'right' : 'left'); x += x < tx ? 1 : -1; }
  while (y !== ty) { dirs.push(y < ty ? 'down' : 'up'); y += y < ty ? 1 : -1; }
  return dirs;
}

// ---------- field moves ----------
export function fieldUser(move) {
  if (G.badges.length < FIELD[move].badges) return null;
  return G.party.find((m) => m.moves.some((mv) => mv.id === move)) || null;
}
async function fieldPrompt(move, intro) {
  const m = fieldUser(move);
  if (!m) {
    const need = FIELD[move].badges;
    const hint = G.badges.length < need ? ` (Using it outside battle needs ${need} badges.)` : '';
    await say(intro + (G.bag[FIELD[move].item] || G.party.some((x) => x.moves.some((mv) => mv.id === move)) ? ` A creature that knows ${move === 'waveride' ? 'Wave Ride' : move[0].toUpperCase() + move.slice(1)} could ${FIELD[move].verb}.${hint}` : ''));
    return null;
  }
  const label = move === 'waveride' ? 'Wave Ride' : move[0].toUpperCase() + move.slice(1);
  if (!(await yesNo(`${intro} Would you like to use ${label}?`))) return null;
  await say(`${monName(m)} used ${label}!`);
  return m;
}

// ---------- player turn ----------
async function tryMove(dir) {
  const p = world.player;
  const m = world.map;
  const [dx, dy] = DIRS[dir];
  const nx = p.x + dx, ny = p.y + dy;
  p.dir = dir;
  if (m.interior && dir === 'down' && m.tiles[p.y][p.x] === 'mat' && m.exitTo) {
    if (m.hideout && world.hooks.confirmLeave) { world.busy++; let ok; try { ok = await world.hooks.confirmLeave(); } finally { world.busy--; } if (!ok) return; }
    const e = m.exitTo;
    await warp(e.map, e.x, e.y, e.dir);
    return;
  }
  const w = m.warps[`${nx},${ny}`];
  if (w) {
    if (w.cond && !flag(w.cond)) { sfx('bump'); world.busy++; try { await say(w.lockedMsg || 'It\'s locked.'); } finally { world.busy--; } return; }
    await warp(w.map, w.x, w.y, w.dir);
    return;
  }
  if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) {
    const side = nx < 0 ? 'west' : nx >= m.w ? 'east' : ny < 0 ? 'north' : 'south';
    const c = m.connections[side];
    if (c) {
      const t = MAPS[c.map];
      let tx = nx, ty = ny;
      if (side === 'north') { ty = t.h - 1; tx = nx + c.offset; }
      if (side === 'south') { ty = 0; tx = nx + c.offset; }
      if (side === 'west') { tx = t.w - 1; ty = ny + c.offset; }
      if (side === 'east') { tx = 0; ty = ny + c.offset; }
      await warp(c.map, tx, ty, dir, { sound: false });
      return;
    }
  }
  // push a boulder with Heave
  const bo = boulderAt(nx, ny);
  if (bo) {
    if (!world.heave) {
      world.busy++;
      try { const u = await fieldPrompt('heave', 'It\'s a huge boulder.'); if (u) { world.heave = true; await say(`${monName(u)} can push boulders now!`); } } finally { world.busy--; }
      return;
    }
    const bx = nx + dx, by = ny + dy;
    if (bx < 0 || by < 0 || bx >= m.w || by >= m.h || blocked(bx, by, world.player) || tileAt(bx, by) === 'water') { sfx('bump'); return; }
    sfx('hit');
    for (let i = 1; i <= 16; i++) { bo.off = { x: dx * i, y: dy * i }; await wait(1); }
    bo.x = bx; bo.y = by; bo.off = null;
    return;
  }
  const nt = tileAt(nx, ny);
  // leaving the water
  if (p.surf && nt !== 'water' && !blocked(nx, ny, p)) {
    p.surf = false;
    playMusic(m.music);
  }
  if (blocked(nx, ny, p)) {
    if (nt === 'water' && !p.surf && nx >= 0 && ny >= 0 && nx < m.w && ny < m.h && !npcAt(nx, ny)) {
      world.busy++;
      try {
        const u = await fieldPrompt('waveride', 'The water is a deep, calm blue.');
        if (u) { p.surf = true; playMusic('sea'); await stepActor(p, dir, 1); G.pos = { map: m.id, x: p.x, y: p.y, dir: p.dir }; }
      } finally { world.busy--; }
      return;
    }
    if (frame - (p.lastBump || 0) > 20) { sfx('bump'); p.lastBump = frame; }
    return;
  }
  const running = input.held('b') && !p.surf;
  await stepActor(p, dir, running || p.surf ? 2 : 1);
  G.pos = { map: m.id, x: p.x, y: p.y, dir: p.dir };
  G.steps++;
  world.stepsSinceBattle++;
  world.busy++;
  try { await afterStep(); } finally { world.busy--; }
}

function encounterTable() {
  const m = world.map, p = world.player;
  const k = p.y * m.w + p.x;
  if (p.surf) return m.rareSurfZone && m.rareSurfZone.has(k) ? m.rareSurfEnc : m.surfEnc;
  const t = tileAt(p.x, p.y);
  const land = m.rareZone && m.rareZone.has(k) ? m.rareEnc : m.encounters;
  if (GRASSY.has(t)) return land;
  if (m.cave && (t === 'cavefloor' || t === 'cavepath')) return land;
  return null;
}

async function afterStep() {
  const p = world.player, m = world.map;
  if (G.repel > 0) { G.repel--; if (G.repel === 0) await say('The Repel wore off.'); }
  for (const t of m.triggers) {
    if (p.x >= t.x && p.x < t.x + t.w && p.y >= t.y && p.y < t.y + t.h) {
      const r = await world.hooks.trigger(t.script);
      if (r) return;
    }
  }
  for (const n of world.npcs) {
    // pending trainers (Meridia, until its creatures exist) don't challenge anyone yet
    if (!n.trainer || n.pending || flag('beat_' + n.trainer)) continue;
    if (seesPlayer(n)) { await world.hooks.trainer(n); return; }
  }
  const table = encounterTable();
  const rate = m.cave ? 1 / 14 : p.surf ? 1 / 16 : 1 / 10;
  if (table && table.length && world.stepsSinceBattle > 2 && chance(rate)) {
    const total = table.reduce((s, e) => s + e[3], 0);
    let r = Math.random() * total;
    let e = table[0];
    for (const x of table) { r -= x[3]; if (r <= 0) { e = x; break; } }
    const lvl = e[1] + Math.floor(Math.random() * (e[2] - e[1] + 1));
    const lead = G.party.find((x) => x.hp > 0);
    if (G.repel > 0 && lead && lvl < lead.level) return;
    world.stepsSinceBattle = 0;
    await world.hooks.encounter(e[0], lvl);
  }
}

function seesPlayer(n) {
  const p = world.player;
  const [dx, dy] = DIRS[n.dir];
  for (let i = 1; i <= (n.sight || 3); i++) {
    const x = n.x + dx * i, y = n.y + dy * i;
    if (x === p.x && y === p.y) return true;
    const t = tileAt(x, y);
    if ((SOLID.has(t) && t !== 'water') || buildingSolid(world.map, x, y) || npcAt(x, y, n) || boulderAt(x, y)) return false;
  }
  return false;
}

async function interact() {
  const p = world.player, m = world.map;
  const [dx, dy] = DIRS[p.dir];
  const x = p.x + dx, y = p.y + dy;
  let n = npcAt(x, y);
  const t = tileAt(x, y);
  if (!n && t === 'counter') n = npcAt(x + dx, y + dy);
  if (n) { await world.hooks.interact(n); return; }
  const it = itemAt(x, y);
  if (it) {
    setFlag('item_' + it.id);
    addItem(it.item, it.n);
    sfx('item');
    await say(`${G.name} found ${it.n > 1 ? it.n + ' ' : ''}${ITEMS[it.item].name}${it.n > 1 ? 's' : ''}!`, `${G.name} put it in the BAG.`);
    return;
  }
  const hid = m.hidden.find((h) => h.x === x && h.y === y && !flag('item_' + h.id)) || m.hidden.find((h) => h.x === p.x && h.y === p.y && !flag('item_' + h.id));
  if (hid) {
    setFlag('item_' + hid.id); addItem(hid.item); sfx('item');
    await say(`Oh! ${G.name} found a hidden ${ITEMS[hid.item].name}!`);
    return;
  }
  if (m.signs[`${x},${y}`]) { await say(m.signs[`${x},${y}`]); return; }
  if (t === 'pc') { await world.hooks.pc(); return; }
  if (t === 'spring' && world.hooks.spring) { await world.hooks.spring(); return; }
  if (t === 'bush') { if (await fieldPrompt('slash', 'A thorny bush blocks the way.')) { sfx('hit'); world.cleared.add(`${x},${y}`); } return; }
  if (t === 'crack') { if (await fieldPrompt('shatter', 'A cracked boulder blocks the way.')) { sfx('superhit'); world.cleared.add(`${x},${y}`); } return; }
  if (t === 'water' && !p.surf) {
    const u = await fieldPrompt('waveride', 'The water is a deep, calm blue.');
    if (u) { p.surf = true; playMusic('sea'); await stepActor(p, p.dir, 1); G.pos = { map: m.id, x: p.x, y: p.y, dir: p.dir }; }
    return;
  }
  const flavor = { tv: 'A show about creature trainers traveling to faraway regions is on.', shelf: 'It\'s crammed with books about creatures.', bed: 'A comfy-looking bed.', healer: 'A machine that heals creatures in seconds.', console: 'Screens full of maps and readings... and an eclipse symbol in the corner.', lava: 'Bubbling hot lava! Better not touch it.', plant: 'A well-watered plant.' };
  if (t === 'statue') { await say(`${m.name.toUpperCase()}\nBadge holders: ${G.badges.length ? G.name : 'none yet!'}`); return; }
  if (flavor[t]) await say(flavor[t]);
}

// ---------- npc idle behaviour ----------
function idleNpcs() {
  for (const n of world.npcs) {
    if (n.moving || n.busy) continue;
    if (--n.timer > 0) continue;
    n.timer = 90 + Math.floor(Math.random() * 120);
    if (n.move === 'look' || (n.trainer && !n.move && Math.random() < 0.3 && !n.gen)) n.dir = pick(['up', 'down', 'left', 'right']);
    if (n.move === 'wander') {
      const d = pick(['up', 'down', 'left', 'right']);
      const [dx, dy] = DIRS[d];
      const nx = n.x + dx, ny = n.y + dy;
      if (Math.abs(nx - n.home[0]) > 2 || Math.abs(ny - n.home[1]) > 2) continue;
      if (blocked(nx, ny, n) || world.map.warps[`${nx},${ny}`]) { n.dir = d; continue; }
      if (world.map.tiles[ny][nx] === 'mat') continue;
      stepActor(n, d, 1);
    }
  }
}

// ---------- scene ----------
export const worldScene = {
  animate() { if (world.banner && --world.banner.t <= 0) world.banner = null; },
  update() {
    const p = world.player;
    if (!world.busy) idleNpcs();
    if (world.busy || world.walking || p.moving) return;
    if (performance.now() - world.lastSave > 30000) { world.lastSave = performance.now(); save(); }
    if (input.pressed('start')) { run(() => world.hooks.menu()); return; }
    if (input.pressed('select') && G.bag.townmap) { run(() => world.hooks.townMap()); return; }
    if (input.pressed('a')) { run(interact); return; }
    const d = input.dir();
    if (!d) { world.holdTurn = 0; return; }
    if (d !== p.dir) {
      p.dir = d;
      if (!p.justMoved) { world.holdTurn = 6; return; }
    }
    if (world.holdTurn > 0) { world.holdTurn--; return; }
    world.walking = true;
    tryMove(d).catch((e) => console.error(e)).finally(() => { world.walking = false; p.justMoved = true; setTimeout(() => { p.justMoved = false; }, 60); });
  },
  draw(g) {
    const m = world.map, p = world.player;
    const [pdx, pdy] = DIRS[p.dir];
    const ppx = p.x * T + (p.moving ? pdx * p.off : 0);
    const ppy = p.y * T + (p.moving ? pdy * p.off : 0);
    const cx = Math.round(ppx - (W / 2 - 8)), cy = Math.round(ppy - (H / 2 - 8));
    const x0 = Math.floor(cx / T) - 1, y0 = Math.floor(cy / T) - 1;
    const af = Math.floor(frame / 32);
    const town = m.music === 'town';
    for (let ty = y0; ty < y0 + H / T + 3; ty++) {
      for (let tx = x0; tx < x0 + W / T + 3; tx++) {
        const tn = viewTile(m, tx, ty);
        const vr = (tx * 7 + ty * 13) & 3;
        const X = tx * T - cx, Y = ty * T - cy;
        // towns are paved with cobblestones; routes keep a dirt trail
        let shown = tn === 'path' && !town ? 'dirt' : tn;
        if (m.region === 'azurine') {
          // the Isles swap in tropical plants: jungle trees, coconut palms, hibiscus, shells on the rocks
          if (tn === 'tree') shown = ((tx * 5 + ty * 3) % 7 === 0) ? 'tpalm' : 'jungle';
          else if (tn === 'palm') shown = 'tpalm';
          else if (tn === 'stump') shown = 'hibiscus';
          else if (tn === 'rock' && !m.cave && localGround(m, tx, ty) === 'sand') shown = 'shellrock';
        }
        if (tn === 'floor') shown = floorOf(m);
        else if (tn === 'gymfloor' && m.gym && GYMS[m.gym]) shown = 'gf_' + GYMS[m.gym].type;
        else if (tn === 'wall') {
          const ws = wallOf(m), low = tileAt(tx, ty + 1) !== 'wall';
          shown = ws + (low ? 'walllow' : !ws && (tx + 2) % 5 === 0 ? 'wallwin' : 'wall');
        } else if (tn === 'cavewall' && !SOLID.has(tileAt(tx, ty + 1)) && ty + 1 < m.h) shown = 'cliff';
        if (m.cave || m.id === 'seacave') {
          // caves swap in their own rocks; Ember Tunnel's glow with magma
          if (tn === 'rock') shown = hasLava(m) ? 'magmarock' : ['stalagmite', 'caveboulder', 'rockpile', 'stalagmite'][(tx * 3 + ty * 5) & 3];
          else if (tn === 'crack') shown = 'cavecrack';
        }
        const pr = prop(shown, vr);
        if (pr) { const gr = localGround(m, tx, ty); g.drawImage(tile(gr === 'gymfloor' && m.gym && GYMS[m.gym] ? 'gf_' + GYMS[m.gym].type : gr, vr, af), X, Y); if (TALL_PROPS.has(shown)) groundShadow(g, X + 8, Y + 15, 7, 2.5); g.drawImage(pr, X, Y); }
        else {
          g.drawImage(tile(shown, vr, af), X, Y);
          // round off the outside corners of tall-grass patches so they don't look like cut-out blocks
          if (tn === 'tall') {
            const gt = tile(groundOf(m), vr, af);
            const open = (dx, dy) => viewTile(m, tx + dx, ty + dy) !== 'tall';
            for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
              if (!open(dx, 0) || !open(0, dy)) continue;
              for (let k = 0; k < 3; k++) {
                const w = 3 - k, sy = dy < 0 ? k : 15 - k, sx = dx < 0 ? 0 : 16 - w;
                g.drawImage(gt, sx, sy, w, 1, X + sx, Y + sy, w, 1);
              }
            }
          }
          // a sprinkle of walk-over decoration on cave floors
          if (tn === 'cavefloor') {
            const h = (tx * 73856093 ^ ty * 19349663) >>> 0;
            if (h % 29 === 0) { const d = prop(hasLava(m) ? 'pebbles' : ['pebbles', 'mushroom', 'redshroom', 'crystal2'][(h >>> 5) & 3]); if (d) g.drawImage(d, X, Y); }
          }
        }
        const edge = (set, kind) => {
          const bits = (set.has(viewTile(m, tx, ty - 1)) ? 1 : 0) | (set.has(viewTile(m, tx + 1, ty)) ? 2 : 0) | (set.has(viewTile(m, tx, ty + 1)) ? 4 : 0) | (set.has(viewTile(m, tx - 1, ty)) ? 8 : 0);
          if (bits) g.drawImage(pathEdge(bits, kind), X, Y);
        };
        if ((tn === 'path' || (tn === 'sand' && m.region === 'azurine')) && groundOf(m) === 'grass') edge(LAWN, 'grass');
        if (tn === 'sand') edge(WET, 'wetsand');
        else if (tn === 'snowpath') edge(SNOWY, 'snow');
        else if (tn === 'water') { const bits = (SHORE.has(viewTile(m, tx, ty - 1)) ? 1 : 0) | (SHORE.has(viewTile(m, tx + 1, ty)) ? 2 : 0) | (SHORE.has(viewTile(m, tx, ty + 1)) ? 4 : 0) | (SHORE.has(viewTile(m, tx - 1, ty)) ? 8 : 0); if (bits) g.drawImage(pathEdge(bits, af % 2 ? 'surf1' : 'surf0'), X, Y); }
        else if (tn === 'cavepath') edge(CAVEFLOOR, 'cave');
        else if (tn === 'lava') edge(LAVA_BANK, 'lava');
      }
    }
    for (const b of m.buildings) { g.fillStyle = 'rgba(16, 24, 32, 0.20)'; g.fillRect(b.x * T - cx + 4, (b.y + b.h) * T - cy - 3, b.w * T - 2, 4); g.fillRect((b.x + b.w) * T - cx - 2, b.y * T - cy + 10, 4, b.h * T - 12); }
    for (const b of m.buildings) { const bi = building(b.kind, b.w, b.h, b.door, m.style === 'snow'); g.drawImage(bi, b.x * T - cx, b.y * T - cy - (bi.over || 0)); }
    for (const it of m.items) if (!flag('item_' + it.id)) g.drawImage(itemBall(), it.x * T - cx, it.y * T - cy);
    for (const b of world.boulders) g.drawImage(tile('pushrock'), b.x * T - cx + (b.off ? b.off.x : 0), b.y * T - cy + (b.off ? b.off.y : 0));
    const yOf = (a) => a.y + (a.moving ? DIRS[a.dir][1] * a.off / T : 0);
    const actors = [...world.npcs, p].sort((a, b) => yOf(a) - yOf(b));
    for (const a of actors) {
      const [dx, dy] = DIRS[a.dir];
      const ax = a.x * T + (a.moving ? dx * a.off : 0) - cx;
      const ay = a.y * T + (a.moving ? dy * a.off : 0) - cy;
      if (a.creature) {
        const bob = Math.round(Math.sin(frame / 20) * 1.5);
        g.drawImage(creature(a.creature, 28), ax - 6, ay - 12 + bob);
        continue;
      }
      if (a.isPlayer && p.surf) {
        g.fillStyle = '#3870c8'; g.beginPath(); g.ellipse(ax + 8, ay + 12, 9, 5, 0, 0, 7); g.fill();
        g.fillStyle = '#88c0f8'; g.fillRect(ax + 2, ay + 9, 12, 2);
        drawPerson(g, person(a.look, a.dir, 0), ax, ay - 7);
        continue;
      }
      const stepF = a.moving && a.off > 3 && a.off < 13 ? (a.walkPhase % 2 ? 1 : 2) : 0;
      if (!GRASSY.has(tileAt(a.x, a.y)) && tileAt(a.x, a.y) !== 'water') groundShadow(g, ax + 8, ay + 14, 6, 2);
      drawPerson(g, person(a.look, a.dir, stepF), ax, ay - 3);
      const tx = a.moving && a.off > 8 ? a.tx : a.x, ty = a.moving && a.off > 8 ? a.ty : a.y;
      const under = tileAt(tx, ty);
      if (GRASSY.has(under) && !(a.moving && a.off <= 8 && !GRASSY.has(tileAt(a.x, a.y)))) {
        g.drawImage(tile(under), 0, 9, 16, 7, tx * T - cx, ty * T - cy + 9, 16, 7);
      }
      if (under === 'water') g.drawImage(tile('water', 0, af), 0, 8, 16, 8, tx * T - cx, ty * T - cy + 8, 16, 8);
      if (world.emote && world.emote.a === a) {
        box(g, ax + 1, ay - 19, 14, 15);
        text(g, world.emote.kind, ax + 8, ay - 16, '#e03030', null, '600 10px Pixelify, monospace', 'center');
      }
    }
    const wx = weatherOf(m);
    if (wx) drawWeather(g, wx, cx, cy);
    drawDaylight(g, m, cx, cy);
    if (m.dark) {
      const r = world.glow ? 88 : 26;
      g.fillStyle = '#05050c';
      g.beginPath(); g.rect(0, 0, W, H); g.arc(ppx - cx + 8, ppy - cy + 4, r, 0, Math.PI * 2, true); g.fill('evenodd');
    }
    if (world.banner) {
      const yy = world.banner.t > 130 ? -24 + (150 - world.banner.t) * 1.4 : world.banner.t < 20 ? -24 + world.banner.t * 1.4 : 4;
      box(g, 4, yy, 118, 22, 'white');
      text(g, world.banner.text, 12, yy + 6);
    }
  },
};
