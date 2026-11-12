// Overworld: tile movement, NPCs, doors/edges, tall grass, trainers' line of sight,
// and field moves (Slash bushes, Shatter rocks, Wave Ride water, Heave boulders, Glow dark caves).
import { W, H, T, input, wait, fadeOut, fadeIn, setScene, frame, chance, pick } from './engine.js';
import { MAPS, SOLID, GRASSY, buildingSolid } from './maps.js';
import { tile, person, building, itemBall, creature } from './art.js';
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
  world.npcs = [];
  refreshNpcs();
  G.pos = { map: id, x, y, dir: world.player.dir };
  G.region = m.region;
  if (m.town) { G.visited = G.visited || {}; G.visited[id] = true; }
  playMusic(world.player.surf ? 'sea' : m.music);
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
  if (world.map.dark && !world.glow) {
    const u = fieldUser('glow');
    world.busy++;
    try {
      if (u && (await yesNo(`It's pitch dark in here. Use Glow to light the way?`))) { world.glow = true; sfx('evolve'); await say(`${monName(u)} used Glow! The cave lit up!`); }
      else if (!u) await say('It\'s pitch dark in here... A creature that knows Glow would help.');
    } finally { world.busy--; }
  }
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
  if (p.surf) return m.surfEnc;
  const t = tileAt(p.x, p.y);
  if (GRASSY.has(t)) return m.encounters;
  if (m.cave && (t === 'cavefloor' || t === 'cavepath')) return m.encounters;
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
    if (!n.trainer || flag('beat_' + n.trainer)) continue;
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
  if (t === 'bush') { if (await fieldPrompt('slash', 'A thorny bush blocks the way.')) { sfx('hit'); world.cleared.add(`${x},${y}`); } return; }
  if (t === 'crack') { if (await fieldPrompt('shatter', 'A cracked boulder blocks the way.')) { sfx('superhit'); world.cleared.add(`${x},${y}`); } return; }
  if (t === 'water' && !p.surf) {
    const u = await fieldPrompt('waveride', 'The water is a deep, calm blue.');
    if (u) { p.surf = true; playMusic('sea'); await stepActor(p, p.dir, 1); G.pos = { map: m.id, x: p.x, y: p.y, dir: p.dir }; }
    return;
  }
  const flavor = { tv: 'A show about creature trainers traveling to faraway regions is on.', shelf: 'It\'s crammed with books about creatures.', bed: 'A comfy-looking bed.', healer: 'A machine that heals creatures in seconds.', console: 'Screens full of maps of Aldermoor... and an eclipse symbol.', lava: 'Bubbling hot lava! Better not touch it.', plant: 'A well-watered plant.' };
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
    for (let ty = y0; ty < y0 + H / T + 3; ty++) {
      for (let tx = x0; tx < x0 + W / T + 3; tx++) {
        g.drawImage(tile(tileAt(tx, ty), (tx * 7 + ty * 13) & 3, af), tx * T - cx, ty * T - cy);
      }
    }
    for (const b of m.buildings) g.drawImage(building(b.kind, b.w, b.h, b.door), b.x * T - cx, b.y * T - cy);
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
        g.drawImage(person(a.look, a.dir, 0), ax, ay - 7);
        continue;
      }
      const stepF = a.moving && a.off > 3 && a.off < 13 ? (a.walkPhase % 2 ? 1 : 2) : 0;
      g.drawImage(person(a.look, a.dir, stepF), ax, ay - 3);
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
