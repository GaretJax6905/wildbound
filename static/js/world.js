// Overworld: tile movement, NPCs, doors/edges, tall grass, trainers' line of sight.
import { W, H, T, input, wait, fadeOut, fadeIn, setScene, frame, chance, pick } from './engine.js';
import { MAPS, SOLID, tileAt, buildingSolid } from './maps.js';
import { tile, person, building, itemBall } from './art.js';
import { G, flag, setFlag, save, addItem } from './state.js';
import { ITEMS } from './data.js';
import { say, box, text } from './ui.js';
import { playMusic, sfx } from './audio.js';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };

export const world = {
  map: null,
  player: { x: 0, y: 0, dir: 'down', off: 0, moving: false, look: 'player', step: 0, isPlayer: true },
  npcs: [],
  busy: 0,
  emote: null,
  banner: null,
  holdTurn: 0,
  hooks: null, // set by story.js: { trigger, interact, trainer, encounter, menu }
  lastSave: 0,
  stepsSinceBattle: 0,
};

function showCond(c) {
  if (!c) return true;
  if (typeof c === 'function') return c();
  return c[0] === '!' ? !flag(c.slice(1)) : flag(c);
}

export function refreshNpcs() {
  const keep = world.npcs.filter((n) => n.spawned);
  world.npcs = world.map.npcs.filter((d) => showCond(d.show)).map((d) => {
    const ex = world.npcs.find((n) => n.id === d.id && !n.spawned);
    return ex || { ...d, home: [d.x, d.y], off: 0, moving: false, step: 0, timer: Math.floor(Math.random() * 120) };
  }).concat(keep);
}

export function loadMap(id, x, y, dir) {
  const m = MAPS[id];
  world.map = m;
  world.player.x = x; world.player.y = y; world.player.dir = dir || world.player.dir;
  world.player.off = 0; world.player.moving = false;
  world.npcs = [];
  refreshNpcs();
  G.pos = { map: id, x, y, dir: world.player.dir };
  if (G.region !== m.region) G.region = m.region;
  playMusic(m.music);
  if (!m.interior) world.banner = { text: m.name, t: 150 };
}

export function enterWorld() {
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
}

// ---------- collision ----------
function npcAt(x, y, except) {
  return world.npcs.find((n) => n !== except && ((n.x === x && n.y === y) || (n.moving && n.tx === x && n.ty === y)));
}
function itemAt(x, y) { return world.map.items.find((it) => it.x === x && it.y === y && !flag('item_' + it.id)); }
export function blocked(x, y, actor) {
  const m = world.map;
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
  if (SOLID.has(m.tiles[y][x]) || buildingSolid(m, x, y)) return true;
  if (itemAt(x, y)) return true;
  if (npcAt(x, y, actor)) return true;
  const p = world.player;
  if (actor !== p && ((p.x === x && p.y === y) || (p.moving && p.tx === x && p.ty === y))) return true;
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

export async function walk(a, dirs, speed = 1) {
  for (const d of dirs) await stepActor(a, d, speed);
}

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

// path toward a target tile (straight lines, x first then y)
export function pathTo(a, tx, ty) {
  const dirs = [];
  let x = a.x, y = a.y;
  while (x !== tx) { dirs.push(x < tx ? 'right' : 'left'); x += x < tx ? 1 : -1; }
  while (y !== ty) { dirs.push(y < ty ? 'down' : 'up'); y += y < ty ? 1 : -1; }
  return dirs;
}

// ---------- player turn ----------
async function tryMove(dir) {
  const p = world.player;
  const m = world.map;
  const [dx, dy] = DIRS[dir];
  const nx = p.x + dx, ny = p.y + dy;
  p.dir = dir;
  // leaving an interior via the mat
  if (m.interior && dir === 'down' && m.tiles[p.y][p.x] === 'mat' && m.exitTo) {
    const e = m.exitTo;
    await warp(e.map, e.x, e.y, e.dir);
    return;
  }
  const w = m.warps[`${nx},${ny}`];
  if (w) { await warp(w.map, w.x, w.y, w.dir); return; }
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
  if (blocked(nx, ny, p)) {
    if (frame - (p.lastBump || 0) > 20) { sfx('bump'); p.lastBump = frame; }
    return;
  }
  const running = input.held('b');
  await stepActor(p, dir, running ? 2 : 1);
  G.pos = { map: m.id, x: p.x, y: p.y, dir: p.dir };
  G.steps++;
  world.stepsSinceBattle++;
  world.busy++;
  try { await afterStep(); } finally { world.busy--; }
}

async function afterStep() {
  const p = world.player, m = world.map;
  for (const t of m.triggers) {
    if (p.x >= t.x && p.x < t.x + t.w && p.y >= t.y && p.y < t.y + t.h) {
      const r = await world.hooks.trigger(t.script);
      if (r) return;
    }
  }
  // trainers
  for (const n of world.npcs) {
    if (!n.trainer || flag('beat_' + n.trainer)) continue;
    if (seesPlayer(n)) { await world.hooks.trainer(n); return; }
  }
  if (m.tiles[p.y][p.x] === 'tall' && m.encounters && world.stepsSinceBattle > 2 && chance(1 / 10)) {
    const total = m.encounters.reduce((s, e) => s + e[3], 0);
    let r = Math.random() * total;
    let e = m.encounters[0];
    for (const x of m.encounters) { r -= x[3]; if (r <= 0) { e = x; break; } }
    const lvl = e[1] + Math.floor(Math.random() * (e[2] - e[1] + 1));
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
    const t = tileAt(world.map, x, y);
    if (SOLID.has(t) || buildingSolid(world.map, x, y) || npcAt(x, y, n)) return false;
  }
  return false;
}

async function interact() {
  const p = world.player, m = world.map;
  const [dx, dy] = DIRS[p.dir];
  let x = p.x + dx, y = p.y + dy;
  let n = npcAt(x, y);
  const t = tileAt(m, x, y);
  if (!n && t === 'counter') { n = npcAt(x + dx, y + dy); }
  if (n) { await world.hooks.interact(n); return; }
  const it = itemAt(x, y);
  if (it) {
    setFlag('item_' + it.id);
    addItem(it.item, it.n);
    sfx('item');
    await say(`${G.name} found ${it.n > 1 ? it.n + ' ' : ''}${ITEMS[it.item].name}${it.n > 1 ? 's' : ''}!`, `${G.name} put it in the BAG.`);
    return;
  }
  if (m.signs[`${x},${y}`]) { await say(m.signs[`${x},${y}`]); return; }
  if (t === 'pc') { await world.hooks.pc(); return; }
  const flavor = { tv: 'A show about creature trainers traveling to faraway regions is on.', shelf: 'It\'s crammed with books about creatures.', bed: 'A comfy-looking bed.', healer: 'A machine that heals creatures in seconds.', statue: 'PEBBLETON GYM\nBadge holders: ' + (G.badges.includes('stone') ? G.name : 'none yet!'), plant: 'A well-watered plant.' };
  if (flavor[t]) await say(flavor[t]);
}

// ---------- npc idle behaviour ----------
function idleNpcs() {
  for (const n of world.npcs) {
    if (n.moving || n.busy) continue;
    if (--n.timer > 0) continue;
    n.timer = 90 + Math.floor(Math.random() * 120);
    if (n.move === 'look') n.dir = pick(['up', 'down', 'left', 'right']);
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
  animate() {
    if (world.banner && --world.banner.t <= 0) world.banner = null;
  },
  update() {
    const p = world.player;
    if (!world.busy) idleNpcs();
    if (world.busy || world.walking || p.moving) return;
    if (performance.now() - world.lastSave > 30000) { world.lastSave = performance.now(); save(); }
    if (input.pressed('start')) { run(() => world.hooks.menu()); return; }
    if (input.pressed('a')) { run(interact); return; }
    const d = input.dir();
    if (!d) { world.holdTurn = 0; return; }
    if (d !== p.dir) {
      p.dir = d;
      if (!p.justMoved) { world.holdTurn = 6; return; } // tap = turn in place
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
    for (let ty = y0; ty < y0 + H / T + 3; ty++) {
      for (let tx = x0; tx < x0 + W / T + 3; tx++) {
        const name = tileAt(m, tx, ty);
        g.drawImage(tile(name, (tx * 7 + ty * 13) & 3, af), tx * T - cx, ty * T - cy);
      }
    }
    for (const b of m.buildings) g.drawImage(building(b.kind, b.w, b.h, b.door), b.x * T - cx, b.y * T - cy);
    for (const it of m.items) if (!flag('item_' + it.id)) g.drawImage(itemBall(), it.x * T - cx, it.y * T - cy);
    const actors = [...world.npcs, p].sort((a, b) => (a.y + (a.moving ? DIRS[a.dir][1] * a.off / T : 0)) - (b.y + (b.moving ? DIRS[b.dir][1] * b.off / T : 0)));
    for (const a of actors) {
      const [dx, dy] = DIRS[a.dir];
      const ax = a.x * T + (a.moving ? dx * a.off : 0) - cx;
      const ay = a.y * T + (a.moving ? dy * a.off : 0) - cy;
      const stepF = a.moving && a.off > 3 && a.off < 13 ? (a.walkPhase % 2 ? 1 : 2) : 0;
      g.drawImage(person(a.look, a.dir, stepF), ax, ay - 8);
      // tall grass covers feet
      const tx = a.moving && a.off > 8 ? a.tx : a.x, ty = a.moving && a.off > 8 ? a.ty : a.y;
      if (tileAt(m, tx, ty) === 'tall' && !(a.moving && a.off <= 8 && tileAt(m, a.x, a.y) !== 'tall')) {
        g.drawImage(tile('tall'), 0, 9, 16, 7, tx * T - cx, ty * T - cy + 9, 16, 7);
      }
      if (world.emote && world.emote.a === a) {
        box(g, ax + 1, ay - 24, 14, 15);
        text(g, world.emote.kind, ax + 8, ay - 21, '#e03030', null, '600 10px Pixelify, monospace', 'center');
      }
    }
    if (world.banner) {
      const yy = world.banner.t > 130 ? -24 + (150 - world.banner.t) * 1.4 : world.banner.t < 20 ? -24 + world.banner.t * 1.4 : 4;
      box(g, 4, yy, 110, 22, 'white');
      text(g, world.banner.text, 12, yy + 6);
    }
  },
};
