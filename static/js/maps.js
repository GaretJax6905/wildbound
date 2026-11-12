// Region 1: Aldermoor. Maps are painted with rectangles so they're easy to
// edit: fill(map, x, y, w, h, tile).
import { SPECIES } from './data.js';
import { flag } from './state.js';
export const SOLID = new Set(['tree', 'water', 'fence', 'sign', 'rock', 'wall', 'counter', 'shelf', 'table', 'pc', 'healer', 'plant', 'bed', 'tv', 'statue', 'boulder', 'void',
  'bush', 'crack', 'cavewall', 'pine', 'lava', 'shrine', 'console']);
// tiles where wild creatures appear
export const GRASSY = new Set(['tall', 'snowgrass']);

function M(id, o) {
  const m = {
    id, name: o.name, w: o.w, h: o.h, region: 'aldermoor', music: o.music || 'route',
    interior: !!o.interior, border: o.border || (o.interior ? 'void' : 'tree'), borderNorth: o.borderNorth,
    tiles: Array.from({ length: o.h }, () => Array(o.w).fill(o.base || (o.interior ? 'floor' : 'grass'))),
    buildings: [], warps: {}, connections: o.connections || {}, npcs: [], signs: {}, items: [], triggers: [],
    encounters: null, surfEnc: null, heal: o.heal || null, exitTo: null, lv: o.lv || null, hidden: [], boulders: [],
  };
  if (!o.interior) { fill(m, 0, 0, o.w, 1, 'tree'); fill(m, 0, o.h - 1, o.w, 1, 'tree'); fill(m, 0, 0, 1, o.h, 'tree'); fill(m, o.w - 1, 0, 1, o.h, 'tree'); } else fill(m, 0, 0, o.w, 2, 'wall');
  return m;
}
function fill(m, x, y, w, h, t) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && i >= 0 && j < m.h && i < m.w) m.tiles[j][i] = t;
}
function dots(m, t, pts) { pts.forEach(([x, y]) => fill(m, x, y, 1, 1, t)); }
function bld(m, kind, x, y, w, h, door, to) { m.buildings.push({ kind, x, y, w, h, door, to }); }
function sign(m, x, y, text) { fill(m, x, y, 1, 1, 'sign'); m.signs[`${x},${y}`] = text; }
function npc(m, o) { m.npcs.push(o); }
function item(m, id, x, y, itemId, n = 1) { m.items.push({ id, x, y, item: itemId, n }); }
function trig(m, x, y, w, h, script) { m.triggers.push({ x, y, w, h, script }); }

export const MAPS = {};
const add = (m) => { MAPS[m.id] = m; return m; };

// ---------------- Brookhollow ----------------
{
  const m = add(M('brookhollow', { name: 'Brookhollow', w: 20, h: 18, music: 'town', connections: { north: { map: 'route1', offset: 0 } } }));
  fill(m, 9, 0, 2, 15, 'path');
  fill(m, 3, 6, 14, 1, 'path');
  fill(m, 10, 13, 5, 1, 'path');
  fill(m, 2, 10, 5, 4, 'water');
  fill(m, 2, 14, 5, 1, 'sand');
  dots(m, 'flower', [[7, 2], [8, 3], [17, 1], [1, 15], [5, 15], [6, 16], [12, 15], [13, 16], [16, 7], [17, 8]]);
  fill(m, 12, 16, 6, 1, 'fence');
  bld(m, 'house', 2, 2, 5, 4, 2, 'house_player');
  bld(m, 'house2', 13, 2, 5, 4, 2, 'house_juno');
  bld(m, 'lab', 11, 9, 7, 4, 3, 'lab');
  sign(m, 8, 7, 'BROOKHOLLOW\nA quiet town where great journeys begin.');
  sign(m, 16, 13, 'MAPLE CREATURE LAB');
  trig(m, 9, 1, 2, 1, 'needStarter');
  npc(m, { id: 'bh_girl', look: 'girl', x: 6, y: 8, dir: 'down', move: 'wander', text: ['Tall grass is full of wild creatures!', 'Without a partner of your own, it\'s way too dangerous to go in there.'] });
  npc(m, { id: 'bh_old', look: 'oldman', x: 16, y: 15, dir: 'left', move: 'look', text: ['Kai and Juno have been racing each other since they could walk.', 'With you around, it\'s a three-way race now!'] });
}

// ---------------- Route 1 ----------------
{
  const m = add(M('route1', {
    name: 'Route 1', w: 20, h: 30, music: 'route', lv: [3, 5],
    connections: { south: { map: 'brookhollow', offset: 0 }, north: { map: 'pebbleton', offset: 0 } },
  }));
  fill(m, 9, 20, 2, 10, 'path');
  fill(m, 5, 19, 6, 2, 'path');
  fill(m, 5, 10, 2, 11, 'path');
  fill(m, 5, 9, 10, 2, 'path');
  fill(m, 13, 0, 2, 11, 'path');
  fill(m, 11, 22, 6, 6, 'tall');
  fill(m, 8, 24, 4, 2, 'tall');
  fill(m, 2, 11, 3, 8, 'tall');
  fill(m, 7, 13, 6, 5, 'tall');
  fill(m, 2, 2, 9, 6, 'tall');
  fill(m, 15, 2, 3, 5, 'tall');
  fill(m, 14, 12, 5, 6, 'tree');
  fill(m, 1, 21, 3, 2, 'tree');
  fill(m, 16, 9, 3, 2, 'tree');
  dots(m, 'flower', [[3, 26], [4, 27], [6, 22], [15, 20], [17, 21], [11, 1]]);
  sign(m, 11, 28, 'ROUTE 1\nNorth: Pebbleton   South: Brookhollow');
  npc(m, { id: 'leo', look: 'bugkid', x: 12, y: 21, dir: 'left', trainer: 'leo', sight: 3 });
  npc(m, { id: 'mia', look: 'lass', x: 7, y: 12, dir: 'left', trainer: 'mia', sight: 2 });
  item(m, 'r1_potion', 3, 24, 'potion');
  item(m, 'r1_orbs', 16, 3, 'orb', 3);
  item(m, 'r1_super', 2, 13, 'superpotion');
  trig(m, 1, 8, 18, 1, 'eclipse1');
  trig(m, 1, 1, 18, 1, 'junoRoute1');
}

// ---------------- Pebbleton ----------------
{
  const m = add(M('pebbleton', {
    name: 'Pebbleton', w: 26, h: 22, music: 'town', borderNorth: 'water',
    connections: { south: { map: 'route1', offset: 0 }, east: { map: 'route2', offset: -4 } },
  }));
  fill(m, 0, 0, 26, 3, 'water');
  fill(m, 1, 3, 24, 1, 'sand');
  fill(m, 12, 0, 2, 3, 'dock');
  fill(m, 2, 4, 22, 1, 'path');
  fill(m, 14, 4, 2, 7, 'path');
  fill(m, 2, 10, 24, 2, 'path');
  fill(m, 13, 12, 2, 10, 'path');
  fill(m, 5, 17, 16, 1, 'path');
  bld(m, 'center', 3, 6, 5, 4, 2, 'center_peb');
  bld(m, 'mart', 9, 6, 5, 4, 2, 'mart_peb');
  bld(m, 'gym', 16, 5, 7, 5, 3, 'gym_peb');
  bld(m, 'house', 3, 13, 5, 4, 2, 'house_trade');
  bld(m, 'house2', 18, 13, 5, 4, 2, 'house_peb');
  dots(m, 'flower', [[9, 13], [10, 14], [9, 15], [16, 19], [17, 20], [2, 19], [23, 19], [24, 7]]);
  fill(m, 1, 19, 3, 2, 'tree');
  fill(m, 21, 19, 4, 2, 'tree');
  sign(m, 11, 12, 'PEBBLETON\nWhere the land meets the sea.');
  sign(m, 23, 9, 'PEBBLETON GYM\nLeader: SHALE\nThe rock-solid wall!');
  sign(m, 15, 3, 'PEBBLETON HARBOR\nFerries to other regions depart here.');
  trig(m, 12, 2, 2, 1, 'tagBattle');
  npc(m, { id: 'sailor', look: 'sailor', x: 12, y: 0, dir: 'down', move: 'static', script: 'sailor' });
  npc(m, { id: 'peb_old', look: 'oldman', x: 6, y: 3, dir: 'down', move: 'look', text: ['Back in my day I sailed to every region.', 'Most trainers only bring one or two partners with them. The rest wait back home until they return.'] });
  npc(m, { id: 'peb_girl', look: 'girl', x: 8, y: 12, dir: 'down', move: 'wander', text: ['The Healing Center heals your creatures for free!', 'The PC in there lets you store creatures you catch.'] });
  npc(m, { id: 'peb_boy', look: 'boy', x: 20, y: 11, dir: 'left', move: 'wander', text: ['Shale uses Rock types. Water and Grass moves crush rocks!', 'Fire and Flying moves barely scratch them though.'] });
}

// ---------------- Route 2 ----------------
{
  const m = add(M('route2', {
    name: 'Route 2', w: 32, h: 14, music: 'route', lv: [7, 10],
    connections: { west: { map: 'pebbleton', offset: 4 }, east: { map: 'hollowgrove', offset: 1 } },
  }));
  fill(m, 0, 6, 32, 2, 'path');
  fill(m, 3, 1, 7, 4, 'tall');
  fill(m, 12, 9, 9, 4, 'tall');
  fill(m, 22, 1, 6, 4, 'tall');
  fill(m, 17, 6, 3, 2, 'tall');
  fill(m, 10, 1, 2, 4, 'tree');
  fill(m, 1, 9, 4, 4, 'tree');
  fill(m, 28, 8, 3, 5, 'tree');
  fill(m, 28, 1, 3, 5, 'tree');
  dots(m, 'rock', [[14, 3], [15, 2], [23, 10], [7, 10]]);
  dots(m, 'flower', [[6, 9], [8, 11], [25, 11], [21, 9]]);
  sign(m, 2, 5, 'ROUTE 2\nWest: Pebbleton   East: Hollow Grove');
  npc(m, { id: 'dale', look: 'hiker', x: 13, y: 5, dir: 'down', trainer: 'dale', sight: 2 });
  npc(m, { id: 'ana', look: 'birdkeeper', x: 24, y: 8, dir: 'up', trainer: 'ana', sight: 2 });
  npc(m, { id: 'nyx2', look: 'nyx', x: 29, y: 6, dir: 'left', move: 'static', show: '!eclipse2', text: ['...'] });
  npc(m, { id: 'corvo2', look: 'corvo', x: 29, y: 7, dir: 'left', move: 'static', show: '!eclipse2', text: ['...'] });
  item(m, 'r2_super', 5, 2, 'superpotion');
  item(m, 'r2_orbs', 26, 2, 'orb', 3);
  trig(m, 27, 6, 1, 2, 'eclipse2');
}

// ---------------- Hollow Grove ----------------
{
  const m = add(M('hollowgrove', {
    name: 'Hollow Grove', w: 18, h: 16, music: 'route', base: 'tall', lv: [8, 12],
    connections: { west: { map: 'route2', offset: -1 }, east: { map: 'thistlewood', offset: 1 } },
  }));
  fill(m, 0, 7, 18, 2, 'path');
  fill(m, 12, 2, 4, 3, 'water');
  fill(m, 1, 1, 4, 4, 'tree'); fill(m, 2, 2, 2, 2, 'grass'); fill(m, 3, 4, 1, 1, 'bush');
  npc(m, { id: 'legend_verdantaur', creature: 'verdantaur', level: 50, x: 2, y: 2, dir: 'down', move: 'static', script: 'legend', show: '!caught_verdantaur' });
  fill(m, 11, 5, 6, 1, 'grass');
  fill(m, 5, 2, 2, 3, 'tree');
  fill(m, 8, 10, 3, 2, 'tree');
  fill(m, 14, 8, 2, 2, 'tree');
  dots(m, 'flower', [[12, 6], [16, 6], [3, 12], [9, 14]]);
  sign(m, 3, 6, 'HOLLOW GROVE\nRare creatures are said to gather here, even ones that partner new trainers.');
  item(m, 'grove_spark', 15, 12, 'sparkstone');
  item(m, 'grove_revive', 2, 13, 'revive');
  npc(m, { id: 'grove_maple', look: 'aide', x: 6, y: 8, dir: 'left', move: 'look', text: ['I\'m one of Professor Maple\'s aides.', 'Every creature in Aldermoor can be found somewhere. Even the three starters live wild in this grove, though they\'re rare!', 'They say a forest guardian sleeps behind the thorny bush up north. Someone who can use Slash could reach it...'] });
}

// ---------------- interiors ----------------
function interior(id, name, w, h, mats, o = {}) {
  const m = add(M(id, { name, w, h, interior: true, music: o.music || 'indoor', base: o.base, heal: o.heal }));
  m.mats = mats;
  mats.forEach(([x, y]) => fill(m, x, y, 1, 1, 'mat'));
  return m;
}
{
  const m = interior('house_player', 'Your House', 10, 8, [[4, 7]], { heal: true });
  dots(m, 'tv', [[2, 2]]); dots(m, 'bed', [[8, 2]]); dots(m, 'shelf', [[5, 2]]); dots(m, 'table', [[3, 4]]); dots(m, 'plant', [[1, 6], [8, 6]]);
  npc(m, { id: 'mom', look: 'mom', x: 6, y: 4, dir: 'left', move: 'look', script: 'mom' });
}
{
  const m = interior('house_juno', 'Juno\'s House', 8, 7, [[3, 6]]);
  dots(m, 'shelf', [[1, 2]]); dots(m, 'table', [[2, 4]]); dots(m, 'plant', [[6, 2]]);
  npc(m, { id: 'junomom', look: 'mom', x: 5, y: 3, dir: 'down', move: 'look', text: ['Juno talks about nothing but creatures!', 'She and Kai want to see every region there is. I hope you three look out for each other.'] });
}
{
  const m = interior('lab', 'Maple Lab', 12, 10, [[5, 9]]);
  dots(m, 'shelf', [[1, 2], [2, 2], [3, 2], [8, 2], [9, 2], [10, 2]]);
  dots(m, 'table', [[4, 5], [5, 5], [6, 5]]);
  dots(m, 'pc', [[10, 4]]); dots(m, 'plant', [[1, 8], [10, 8]]);
  npc(m, { id: 'maple', look: 'maple', x: 5, y: 3, dir: 'down', move: 'static', script: 'maple' });
  npc(m, { id: 'aide', look: 'aide', x: 9, y: 6, dir: 'left', move: 'wander', text: ['The professor studies how creatures bond with their trainers.', 'She says a partner who travels with you through many regions grows a special bond.'] });
  npc(m, { id: 'lab_kai', look: 'kai', x: 3, y: 4, dir: 'right', move: 'static', show: 'labRivals', text: ['Hurry up and pick already!'] });
  npc(m, { id: 'lab_juno', look: 'juno', x: 7, y: 4, dir: 'left', move: 'static', show: 'labRivals', text: ['I can\'t wait to see which one you choose!'] });
}
{
  const m = interior('center_peb', 'Healing Center', 12, 8, [[5, 7], [6, 7]], { heal: true });
  fill(m, 3, 3, 6, 1, 'counter');
  dots(m, 'healer', [[7, 2]]); dots(m, 'pc', [[10, 3]]); dots(m, 'plant', [[0, 2], [11, 6]]);
  fill(m, 4, 5, 4, 2, 'carpet');
  npc(m, { id: 'nurse', look: 'nurse', x: 5, y: 2, dir: 'down', move: 'static', script: 'nurse' });
  npc(m, { id: 'center_boy', look: 'boy', x: 2, y: 5, dir: 'right', move: 'look', text: ['You can save anytime from the START menu.', 'The game also saves by itself constantly, so nothing gets lost!'] });
}
{
  const m = interior('mart_peb', 'Pebbleton Mart', 10, 8, [[4, 7]]);
  fill(m, 2, 2, 1, 3, 'counter');
  dots(m, 'shelf', [[6, 2], [7, 2], [8, 2], [6, 5], [7, 5], [8, 5]]);
  npc(m, { id: 'clerk', look: 'clerk', x: 1, y: 3, dir: 'right', move: 'static', script: 'mart' });
  npc(m, { id: 'mart_girl', look: 'lass', x: 5, y: 4, dir: 'down', move: 'wander', text: ['A Spark Stone makes a Buzzlet evolve. They\'re pricey, but maybe one is hidden somewhere...'] });
}
{
  const m = interior('gym_peb', 'Pebbleton Gym', 12, 14, [[5, 13], [6, 13]], { base: 'gymfloor', music: 'indoor' });
  dots(m, 'statue', [[3, 12], [8, 12]]);
  fill(m, 1, 9, 4, 1, 'boulder'); fill(m, 7, 9, 4, 1, 'boulder');
  fill(m, 3, 6, 6, 1, 'boulder');
  dots(m, 'boulder', [[1, 4], [10, 4]]);
  npc(m, { id: 'shale', look: 'shale', x: 5, y: 2, dir: 'down', move: 'static', script: 'shale' });
  npc(m, { id: 'rocco', look: 'hiker', x: 9, y: 8, dir: 'left', trainer: 'rocco', sight: 4 });
  npc(m, { id: 'gymguide', look: 'guide', x: 9, y: 11, dir: 'left', move: 'static', text: ['Hey, future champ! Shale is a Rock-type Leader.', 'Water, Grass and Ground moves are super effective on rock. Fire, Flying and Bug moves are not!', 'Rock types are tough, so bring Potions!'] });
}
{
  const m = interior('house_trade', 'Seaside House', 8, 7, [[3, 6]]);
  dots(m, 'table', [[1, 3]]); dots(m, 'plant', [[6, 2]]); dots(m, 'tv', [[1, 2]]);
  npc(m, { id: 'trader', look: 'oldman', x: 4, y: 3, dir: 'down', move: 'static', script: 'trader' });
}
{
  const m = interior('house_peb', 'Fisher\'s House', 8, 7, [[3, 6]]);
  dots(m, 'shelf', [[1, 2], [2, 2]]); dots(m, 'bed', [[6, 2]]);
  npc(m, { id: 'peb_wife', look: 'girl', x: 3, y: 3, dir: 'down', move: 'wander', text: ['Two strange people in dark uniforms went east toward Route 2.', 'They called themselves Team Eclipse. They said something about "rare creatures in the grove"...'] });
}

// =====================================================================
// The rest of Aldermoor: generated routes, templated towns & interiors
// =====================================================================
const OPP = { north: 'south', south: 'north', east: 'west', west: 'east' };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (str) => [...str].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));

const STYLE = {
  grass: { base: 'grass', path: 'path', border: 'tree', tall: 'tall', tree: 'tree' },
  forest: { base: 'tall', path: 'path', border: 'tree', tall: 'tall', tree: 'tree' },
  coast: { base: 'grass', path: 'sand', border: 'tree', tall: 'tall', tree: 'tree' },
  snow: { base: 'snow', path: 'snowpath', border: 'pine', tall: 'snowgrass', tree: 'pine' },
  ash: { base: 'ash', path: 'path', border: 'rock', tall: 'tall', tree: 'rock' },
  cave: { base: 'cavefloor', path: 'cavepath', border: 'cavewall', tall: null, tree: 'cavewall' },
  sea: { base: 'water', path: 'water', border: 'water', tall: null, tree: 'tree' },
};

function carve(m, side, at, t) {
  for (let k = 0; k < 2; k++) {
    if (side === 'north') fill(m, at + k, 0, 1, 1, t);
    if (side === 'south') fill(m, at + k, m.h - 1, 1, 1, t);
    if (side === 'west') fill(m, 0, at + k, 1, 1, t);
    if (side === 'east') fill(m, m.w - 1, at + k, 1, 1, t);
  }
}
function link(a, side, pa, b, pb) {
  MAPS[a].connections[side] = { map: b, offset: pb - pa };
  MAPS[b].connections[OPP[side]] = { map: a, offset: pa - pb };
}
const walkLand = (t) => !SOLID.has(t);
const passable = (t) => !SOLID.has(t) || t === 'bush' || t === 'crack' || t === 'water';

function reach(m, start, blockedSet) {
  const seen = new Set();
  const q = [start];
  const key = (x, y) => y * m.w + x;
  seen.add(key(...start));
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
      const k = key(nx, ny);
      if (seen.has(k) || blockedSet.has(k) || !passable(m.tiles[ny][nx])) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}

const ITEM_TIERS = [
  ['potion', 'potion', 'orb', 'orb', 'repel', 'fullheal'],
  ['superpotion', 'superpotion', 'greatorb', 'repel', 'fullheal', 'revive', 'tonic'],
  ['hyperpotion', 'greatorb', 'ultraorb', 'revive', 'maxrepel', 'tonic', 'lvcandy'],
  ['maxpotion', 'hyperpotion', 'ultraorb', 'ultraorb', 'revive', 'lvcandy', 'tonic', 'maxrepel'],
];
const tierFor = (lv) => (lv < 12 ? 0 : lv < 25 ? 1 : lv < 40 ? 2 : 3);

// Places trainers, items and hidden items so they never cut off part of the map.
function populate(m, R, o, P) {
  const occupied = new Set();
  const k = (x, y) => y * m.w + x;
  const start = o.start;
  const npcKeys = () => new Set([...occupied, ...m.npcs.map((n) => k(n.x, n.y)), ...m.items.map((i) => k(i.x, i.y))]);
  const baseCount = reach(m, start, npcKeys()).size;
  let have = baseCount;
  const tryPlace = (cands, fn, n) => {
    let placed = 0, tries = 0;
    while (placed < n && tries < 400 && cands.length) {
      tries++;
      const [x, y] = cands.splice(Math.floor(R() * cands.length), 1)[0];
      const blk = npcKeys(); blk.add(k(x, y));
      const c = reach(m, start, blk).size;
      if (c !== have - 1) continue;
      if (Math.abs(x - start[0]) + Math.abs(y - start[1]) < 4) continue;
      have = c; occupied.add(k(x, y)); fn(x, y, placed); placed++;
    }
  };
  const reachable = reach(m, start, npcKeys());
  const cells = [];
  for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) if (reachable.has(k(x, y))) cells.push([x, y]);
  const isP = (x, y) => P.has(k(x, y));
  const nearPath = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => isP(x + dx, y + dy));
  const sea = m.style === 'sea';
  // trainers stand beside the path, facing it
  const tc = cells.filter(([x, y]) => !isP(x, y) && nearPath(x, y) && (sea ? true : m.tiles[y][x] !== 'water') && walkLand(m.tiles[y][x]) || (sea && !isP(x, y) && nearPath(x, y) && m.tiles[y][x] === 'water'));
  tryPlace(tc, (x, y, i) => {
    const [dx, dy] = nearPath(x, y);
    const dir = dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up';
    m.npcs.push({ id: `${m.id}_t${i}`, gen: true, x, y, dir, sight: 3, trainer: `gen:${m.id}:${i}`, swim: m.tiles[y][x] === 'water' });
  }, o.trainers || 0);
  // items on land, off the path
  const tier = ITEM_TIERS[tierFor(m.lv ? m.lv[0] : 5)];
  const ic = cells.filter(([x, y]) => !isP(x, y) && walkLand(m.tiles[y][x]));
  tryPlace(ic, (x, y, i) => m.items.push({ id: `${m.id}_i${i}`, x, y, item: tier[Math.floor(R() * tier.length)], n: 1 }), o.items || 0);
  // hidden items: invisible, found by pressing A on the spot
  const hc = cells.filter(([x, y]) => walkLand(m.tiles[y][x]) && !occupied.has(k(x, y)));
  for (let i = 0; i < (o.hidden || 0) && hc.length; i++) {
    const [x, y] = hc.splice(Math.floor(R() * hc.length), 1)[0];
    m.hidden.push({ id: `${m.id}_h${i}`, x, y, item: tier[Math.floor(R() * tier.length)] });
  }
  for (const it of o.fixedItems || []) m.items.push(it);
}

// Generic route builder. o.open: [[side, at], ...] 2-wide openings. Paths join every opening to a hub.
function genRoute(id, o) {
  const st = STYLE[o.style || 'grass'];
  const m = add(M(id, { name: o.name, w: o.w, h: o.h, base: st.base, music: o.music || (o.style === 'cave' ? 'cave' : o.style === 'sea' ? 'sea' : 'route'), lv: o.lv }));
  m.style = o.style || 'grass'; m.dark = !!o.dark; m.cave = m.style === 'cave'; m.border = st.border;
  fill(m, 0, 0, o.w, 1, st.border); fill(m, 0, o.h - 1, o.w, 1, st.border); fill(m, 0, 0, 1, o.h, st.border); fill(m, o.w - 1, 0, 1, o.h, st.border);
  const R = rng(hash(id));
  const P = new Set();
  const K = (x, y) => y * m.w + x;
  const brush = (x, y) => { for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const xx = x + i, yy = y + j; if (xx > 0 && yy > 0 && xx < m.w - 1 && yy < m.h - 1) { m.tiles[yy][xx] = st.path; P.add(K(xx, yy)); } } };
  const line = (x0, y0, x1, y1) => { let x = x0, y = y0; brush(x, y); while (x !== x1) { x += Math.sign(x1 - x); brush(x, y); } while (y !== y1) { y += Math.sign(y1 - y); brush(x, y); } };
  const hub = o.hub || [Math.floor(o.w / 2) - 1, Math.floor(o.h / 2) - 1];
  let start = null;
  for (const [side, at] of o.open) {
    carve(m, side, at, st.path);
    const ex = side === 'west' ? 1 : side === 'east' ? o.w - 3 : at;
    const ey = side === 'north' ? 1 : side === 'south' ? o.h - 3 : at;
    if (!start) start = [side === 'east' ? o.w - 1 : side === 'west' ? 0 : at, side === 'south' ? o.h - 1 : side === 'north' ? 0 : at];
    P.add(K(...start));
    if (side === 'north' || side === 'south') {
      const ym = ri(R, Math.min(ey, hub[1]), Math.max(ey, hub[1]));
      line(ex, ey, ex, ym); line(ex, ym, hub[0], ym); line(hub[0], ym, hub[0], hub[1]);
    } else {
      const xm = ri(R, Math.min(ex, hub[0]), Math.max(ex, hub[0]));
      line(ex, ey, xm, ey); line(xm, ey, xm, hub[1]); line(xm, hub[1], hub[0], hub[1]);
    }
  }
  for (const [side, at] of o.open) {
    for (let kk = 0; kk < 2; kk++) {
      const x = side === 'west' ? 0 : side === 'east' ? o.w - 1 : at + kk;
      const y = side === 'north' ? 0 : side === 'south' ? o.h - 1 : at + kk;
      P.add(K(x, y));
    }
  }
  const nearP = (x, y, d = 1) => { for (let j = -d; j <= d; j++) for (let i = -d; i <= d; i++) if (P.has(K(x + i, y + j))) return true; return false; };
  const stamp = (x, y, w, h, t, cond) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i > 0 && j > 0 && i < m.w - 1 && j < m.h - 1 && cond(i, j)) m.tiles[j][i] = t; };
  const area = o.w * o.h;
  if (m.style === 'sea') {
    for (let n = 0; n < (o.islands ?? 4); n++) {
      const w = ri(R, 3, 6), h = ri(R, 3, 5), x = ri(R, 1, o.w - w - 1), y = ri(R, 1, o.h - h - 1);
      stamp(x, y, w, h, 'sand', (i, j) => !nearP(i, j, 1));
      if (w > 3 && h > 3) stamp(x + 1, y + 1, 1, 1, 'tree', (i, j) => !nearP(i, j, 1));
    }
  } else {
    if (st.tall) for (let n = 0; n < Math.round(area / (o.style === 'forest' ? 200 : 55)); n++) {
      const w = ri(R, 3, 7), h = ri(R, 2, 5);
      stamp(ri(R, 1, o.w - 2), ri(R, 1, o.h - 2), w, h, st.tall, (i, j) => m.tiles[j][i] === st.base);
    }
    for (let n = 0; n < Math.round(area / (o.style === 'forest' ? 22 : o.style === 'cave' ? 30 : 42)); n++) {
      const w = ri(R, 1, 3), h = ri(R, 1, 3);
      stamp(ri(R, 1, o.w - 2), ri(R, 1, o.h - 2), w, h, st.tree, (i, j) => !nearP(i, j, 1));
    }
    if (o.style === 'grass' || o.style === 'coast') for (let n = 0; n < area / 50; n++) { const x = ri(R, 1, o.w - 2), y = ri(R, 1, o.h - 2); if (m.tiles[y][x] === 'grass') m.tiles[y][x] = 'flower'; }
    if (o.style === 'cave') for (let n = 0; n < area / 60; n++) { const x = ri(R, 1, o.w - 2), y = ri(R, 1, o.h - 2); if (m.tiles[y][x] === 'cavefloor' && !nearP(x, y, 1)) m.tiles[y][x] = 'rock'; }
  }
  if (o.post) o.post(m, { R, P, K, fill: (x, y, w, h, t) => fill(m, x, y, w, h, t), stamp, nearP });
  populate(m, R, { ...o, start }, P);
  return m;
}

// gate helpers: block a whole row/column, leaving an obstacle where the path crosses
function gateRow(m, y, P, K, obstacle, wall) {
  for (let x = 1; x < m.w - 1; x++) m.tiles[y][x] = P.has(K(x, y)) ? obstacle : wall;
}
function gateCol(m, x, P, K, obstacle, wall) {
  for (let y = 1; y < m.h - 1; y++) m.tiles[y][x] = P.has(K(x, y)) ? obstacle : wall;
}

// ---------- towns ----------
const SIZES = { center: [5, 4, 2], mart: [5, 4, 2], house: [5, 4, 2], house2: [5, 4, 2], gym: [7, 5, 3], lab: [7, 4, 3], tower: [7, 6, 3], league: [9, 6, 4] };
function mkTown(id, name, w, h, o) {
  const m = add(M(id, { name, w, h, music: o.music || 'town', base: o.base }));
  m.town = true; m.style = o.style || 'grass';
  if (o.border) { fill(m, 0, 0, w, 1, o.border); fill(m, 0, h - 1, w, 1, o.border); fill(m, 0, 0, 1, h, o.border); fill(m, w - 1, 0, 1, h, o.border); m.border = o.border; }
  const pathT = o.path || 'path';
  for (const [y, x0, x1] of o.streets) fill(m, x0, y, x1 - x0 + 1, 2, pathT);
  for (const [x, y0, y1] of o.vstreets || []) fill(m, x, y0, 2, y1 - y0 + 1, pathT);
  for (const [side, at] of o.open) carve(m, side, at, pathT);
  if (o.pre) o.pre(m);
  for (const b of o.b) {
    const [kind, x, streetY, extra = {}] = b;
    const [bw, bh, door] = SIZES[kind];
    const y = streetY - bh;
    const to = extra.to || `${kind}_${id}${extra.n || ''}`;
    bld(m, kind, x, y, bw, bh, door, to);
    if (kind === 'center') { centerInterior(to, m); m.fly = { x: x + door, y: streetY, dir: 'down' }; }
    if (kind === 'mart') martInterior(to, o.stock);
    if (kind === 'gym') gymInterior(to, extra.gym);
    if (kind === 'house' || kind === 'house2') houseInterior(to, extra.name || 'House', extra.npcs || []);
  }
  const R = rng(hash(id));
  for (let n = 0; n < (w * h) / 30; n++) {
    const x = ri(R, 1, w - 2), y = ri(R, 1, h - 2);
    if (m.tiles[y][x] !== m.tiles[1][1] || buildingSolid(m, x, y)) continue;
    if (o.style === 'snow') { if (R() < 0.3) m.tiles[y][x] = 'pine'; continue; }
    if (o.style === 'ash') { if (R() < 0.2) m.tiles[y][x] = 'rock'; continue; }
    m.tiles[y][x] = R() < 0.75 ? 'flower' : 'tree';
  }
  // keep a free tile in front of every door
  for (const b of m.buildings) { const dx = b.x + b.door, dy = b.y + b.h; if (dy < h && SOLID.has(m.tiles[dy][dx])) m.tiles[dy][dx] = pathT; }
  if (o.post) o.post(m);
  return m;
}

function centerInterior(id, town) {
  const m = interior(id, 'Healing Center', 12, 8, [[5, 7], [6, 7]], { heal: true });
  fill(m, 3, 3, 6, 1, 'counter');
  dots(m, 'healer', [[7, 2]]); dots(m, 'pc', [[10, 3]]); dots(m, 'plant', [[0, 2], [11, 6]]);
  fill(m, 4, 5, 4, 2, 'carpet');
  npc(m, { id: 'nurse', look: 'nurse', x: 5, y: 2, dir: 'down', move: 'static', script: 'nurse' });
  return m;
}
function martInterior(id, stock) {
  const m = interior(id, 'Mart', 10, 8, [[4, 7]]);
  fill(m, 2, 2, 1, 3, 'counter');
  dots(m, 'shelf', [[6, 2], [7, 2], [8, 2], [6, 5], [7, 5], [8, 5]]);
  m.stock = stock;
  npc(m, { id: 'clerk', look: 'clerk', x: 1, y: 3, dir: 'right', move: 'static', script: 'mart' });
  return m;
}
const GYM_DECOR = { Grass: 'plant', Electric: 'console', Water: 'water', Brawl: 'statue', Mind: 'plant', Fire: 'lava', Dragon: 'statue', Rock: 'boulder' };
function gymInterior(id, gym) {
  const m = interior(id, 'Gym', 12, 14, [[5, 13], [6, 13]], { base: 'gymfloor', music: 'indoor' });
  const d = GYM_DECOR[gym.type] || 'statue';
  dots(m, 'statue', [[3, 12], [8, 12]]);
  if (gym.layout === 1) { fill(m, 1, 9, 4, 1, d); fill(m, 7, 9, 4, 1, d); fill(m, 3, 6, 6, 1, d); }
  else if (gym.layout === 2) { fill(m, 1, 4, 1, 7, d); fill(m, 10, 4, 1, 7, d); fill(m, 4, 8, 4, 1, d); }
  else { fill(m, 1, 10, 3, 1, d); fill(m, 8, 10, 3, 1, d); fill(m, 4, 7, 4, 1, d); fill(m, 1, 4, 2, 1, d); fill(m, 9, 4, 2, 1, d); }
  m.gym = gym.id;
  npc(m, { id: 'leader', look: gym.look, x: 5, y: 2, dir: 'down', move: 'static', script: 'gym' });
  npc(m, { id: id + '_g0', look: gym.tlook || 'guide', x: 9, y: 8, dir: 'left', trainer: `gym:${gym.id}:0`, sight: 4 });
  npc(m, { id: id + '_g1', look: gym.tlook || 'guide', x: 2, y: 5, dir: 'right', trainer: `gym:${gym.id}:1`, sight: 4 });
  npc(m, { id: id + '_guide', look: 'guide', x: 9, y: 12, dir: 'left', move: 'static', text: [`This is a ${gym.type}-type Gym, future champ!`, gym.tip] });
  return m;
}
function houseInterior(id, name, npcs) {
  const m = interior(id, name, 8, 7, [[3, 6]]);
  dots(m, 'shelf', [[1, 2]]); dots(m, 'table', [[2, 4]]); dots(m, 'plant', [[6, 2]]);
  npcs.forEach((n, i) => npc(m, { id: `${id}_n${i}`, x: 5 - i * 2, y: 3, dir: 'down', move: 'look', ...n }));
  return m;
}

export const GYMS = {
  stone: { id: 'stone', type: 'Rock', look: 'shale' },
  thistle: { id: 'thistle', type: 'Grass', look: 'briar', tlook: 'lass', layout: 1, tip: 'Fire, Ice, Flying, Bug and Toxic moves wilt grass!' },
  volt: { id: 'volt', type: 'Electric', look: 'jolt', tlook: 'scientist', layout: 2, tip: 'Ground types are completely immune to electricity!' },
  tide: { id: 'tide', type: 'Water', look: 'marina', tlook: 'swimmer', layout: 3, tip: 'Grass and Electric moves make waves crash!' },
  grit: { id: 'grit', type: 'Brawl', look: 'kenta', tlook: 'blackbelt', layout: 1, tip: 'Flying, Mind and Fae moves beat brawlers.' },
  lumen: { id: 'lumen', type: 'Mind', look: 'sable', tlook: 'psychic', layout: 2, tip: 'Bug, Spirit and Shadow moves break the mind\'s focus.' },
  ember: { id: 'ember', type: 'Fire', look: 'ignis', tlook: 'hiker', layout: 3, tip: 'Water, Rock and Ground moves douse flames!' },
  wyrm: { id: 'wyrm', type: 'Dragon', look: 'vesper', tlook: 'acetrainer', layout: 1, tip: 'Ice, Dragon and Fae moves are the bane of dragons.' },
};

// ---------- Thistlewood (Gym 2: Grass) ----------
mkTown('thistlewood', 'Thistlewood', 26, 20, {
  streets: [[8, 1, 24], [15, 3, 21]], vstreets: [[12, 0, 16]], open: [['west', 8], ['north', 12]],
  stock: ['orb', 'greatorb', 'potion', 'superpotion', 'fullheal', 'repel'],
  b: [['center', 2, 8], ['mart', 7, 8], ['house', 15, 8, { name: 'Ranger\'s Cabin', npcs: [{ look: 'hiker', script: 'td_slash' }] }],
    ['house2', 20, 8, { name: 'Cottage', npcs: [{ look: 'girl', text: ['Thorny bushes block the path north to Route 3.', 'If you had a creature that knew Slash, you could cut right through!'] }] }],
    ['gym', 4, 15, { gym: GYMS.thistle }], ['house', 15, 15, { name: 'Herbalist', npcs: [{ look: 'oldman', text: ['A Leaf Stone makes some plant creatures bloom into their final form.', 'There\'s one hidden on Route 4, I hear.'] }] }]],
});
sign(MAPS.thistlewood, 10, 10, 'THISTLEWOOD\nA village grown into the forest.');
npc(MAPS.thistlewood, { id: 'tw_boy', look: 'bugkid', x: 18, y: 12, dir: 'down', move: 'wander', text: ['Leader Briar\'s Grass creatures are tough, but Fire burns right through them!'] });

// ---------- Route 3 (Slash gate) ----------
genRoute('route3', {
  name: 'Route 3', w: 22, h: 34, lv: [12, 15], open: [['south', 12], ['north', 9]], trainers: 4, items: 3, hidden: 2,
  post(m, { P, K, fill: f }) { gateRow(m, m.h - 5, P, K, 'bush', 'tree'); f(14, 3, 5, 4, 'water'); },
});
link('thistlewood', 'north', 12, 'route3', 12);
sign(MAPS.route3, 15, 30, 'ROUTE 3\nNorth: Cinder Cave');
MAPS.route3.tiles[30][15] = 'sign';

// ---------- Cinder Cave ----------
genRoute('cindercave', {
  name: 'Cinder Cave', w: 26, h: 20, style: 'cave', lv: [14, 17], open: [['south', 11], ['north', 13]], trainers: 2, items: 3, hidden: 2,
  fixedItems: [{ id: 'cc_moon', x: 0, y: 0, item: 'moonshard', n: 1 }],
  post(m) {
    npc(m, { id: 'cc_grunt1', look: 'grunt', x: 12, y: 9, dir: 'down', trainer: 'eclipse_cc1', sight: 3 });
    npc(m, { id: 'cc_grunt2', look: 'grunt', x: 14, y: 6, dir: 'left', trainer: 'eclipse_cc2', sight: 3 });
  },
});
link('route3', 'north', 9, 'cindercave', 11);
{ // drop the moon shard somewhere reachable
  const m = MAPS.cindercave; const it = m.items.find((i) => i.id === 'cc_moon');
  outer: for (let y = 2; y < m.h - 2; y++) for (let x = 2; x < m.w - 2; x++) if (m.tiles[y][x] === 'cavefloor' && !m.npcs.some((n) => n.x === x && n.y === y) && !m.items.some((i) => i !== it && i.x === x && i.y === y)) { it.x = x; it.y = y; break outer; }
}

// ---------- Route 4 ----------
genRoute('route4', {
  name: 'Route 4', w: 22, h: 28, lv: [16, 19], open: [['south', 13], ['north', 10]], trainers: 4, items: 3, hidden: 2,
  fixedItems: [{ id: 'r4_leaf', x: 2, y: 2, item: 'leafstone', n: 1 }],
  post(m, { fill: f }) { f(1, 1, 4, 3, 'grass'); f(5, 1, 1, 4, 'tree'); f(1, 4, 4, 1, 'tree'); f(3, 4, 1, 1, 'bush'); },
});
link('cindercave', 'north', 13, 'route4', 13);

// ---------- Voltara (Gym 3: Electric) ----------
mkTown('voltara', 'Voltara City', 28, 20, {
  streets: [[8, 1, 26], [15, 3, 24]], vstreets: [[10, 8, 19], [20, 8, 16]], open: [['south', 10], ['east', 8]],
  stock: ['orb', 'greatorb', 'superpotion', 'hyperpotion', 'fullheal', 'revive', 'repel', 'sparkstone'],
  b: [['center', 3, 8], ['mart', 13, 8], ['house', 21, 8, { name: 'Power Lab', npcs: [{ look: 'scientist', text: ['Electric creatures love our power plant.', 'Boltnut evolves on its own, but Voltpup needs a Spark Stone. We sell them at the Mart!'] }] }],
    ['gym', 3, 15, { gym: GYMS.volt }], ['house2', 13, 15, { name: 'Apartment', npcs: [{ look: 'girl', text: ['Cracked boulders block Route 5 east of here.', 'Leader Jolt can teach you how to Shatter them!'] }] }]],
});
sign(MAPS.voltara, 8, 10, 'VOLTARA CITY\nThe city that never powers down.');
link('route4', 'north', 10, 'voltara', 10);

// ---------- Route 5 (Shatter gate) ----------
genRoute('route5', {
  name: 'Route 5', w: 36, h: 18, lv: [20, 24], open: [['west', 8], ['east', 8]], trainers: 5, items: 3, hidden: 3,
  post(m, { P, K, fill: f }) { gateCol(m, 8, P, K, 'crack', 'rock'); f(20, 2, 7, 4, 'water'); f(4, 12, 4, 3, 'water'); },
});
link('voltara', 'east', 8, 'route5', 8);

// ---------- Coralport (Gym 4: Water) ----------
mkTown('coralport', 'Coralport', 26, 22, {
  streets: [[8, 1, 24], [14, 1, 24]], vstreets: [[11, 8, 18]], open: [['west', 8]], path: 'path',
  stock: ['greatorb', 'ultraorb', 'superpotion', 'hyperpotion', 'fullheal', 'revive', 'maxrepel', 'froststone'],
  pre(m) { fill(m, 1, 17, 24, 4, 'sand'); fill(m, 0, 19, 26, 3, 'water'); fill(m, 11, 17, 2, 4, 'dock'); carve(m, 'south', 11, 'water'); },
  b: [['center', 2, 8], ['mart', 7, 8], ['house', 14, 8, { name: 'Lighthouse Keeper', npcs: [{ look: 'sailor', text: ['South of here is open sea. You\'ll need a creature that can Wave Ride.', 'Leader Marina gives a Trail Disc to trainers who beat her.'] }] }],
    ['gym', 15, 14, { gym: GYMS.tide }], ['house2', 2, 14, { name: 'Fisher\'s Hut', npcs: [{ look: 'oldman', text: ['Splashkoi look useless, but raise one past level 20 and you\'ll see!'] }] }]],
});
sign(MAPS.coralport, 20, 10, 'CORALPORT\nWhere the reef meets the city.');
link('route5', 'east', 8, 'coralport', 8);

// ---------- Route 6 (sea) + sea cave ----------
genRoute('route6', {
  name: 'Route 6', w: 26, h: 40, style: 'sea', lv: [24, 28], open: [['north', 11], ['south', 12]], trainers: 5, items: 3, hidden: 1, islands: 5,
  post(m, { fill: f }) {
    f(19, 18, 5, 5, 'sand'); f(20, 18, 3, 1, 'rock'); f(21, 18, 1, 1, 'sand');
    m.warps['21,18'] = { map: 'seacave', x: 5, y: 9, dir: 'up' };
  },
});
link('coralport', 'south', 11, 'route6', 11);
{
  const m = add(M('seacave', { name: 'Hidden Grotto', w: 12, h: 11, base: 'cavefloor', music: 'cave' }));
  m.style = 'cave'; m.border = 'cavewall';
  fill(m, 0, 0, 12, 1, 'cavewall'); fill(m, 0, 10, 12, 1, 'cavewall'); fill(m, 0, 0, 1, 11, 'cavewall'); fill(m, 11, 0, 1, 11, 'cavewall');
  fill(m, 1, 4, 10, 4, 'water'); fill(m, 4, 4, 4, 4, 'water'); fill(m, 5, 1, 2, 3, 'cavefloor'); fill(m, 5, 8, 2, 2, 'cavefloor');
  fill(m, 1, 1, 3, 3, 'cavewall'); fill(m, 8, 1, 3, 3, 'cavewall');
  m.warps['5,10'] = { map: 'route6', x: 21, y: 19, dir: 'down' }; m.warps['6,10'] = { map: 'route6', x: 21, y: 19, dir: 'down' };
  npc(m, { id: 'legend_abyssion', creature: 'abyssion', level: 50, x: 5, y: 2, dir: 'down', move: 'static', script: 'legend', show: '!caught_abyssion' });
}

// ---------- Kestrel Isle (Gym 5: Brawl) ----------
mkTown('kestrel', 'Kestrel Isle', 24, 20, {
  streets: [[8, 1, 22], [15, 3, 20]], vstreets: [[12, 0, 16]], open: [['north', 12], ['east', 8]], style: 'coast', path: 'sand',
  stock: ['greatorb', 'ultraorb', 'hyperpotion', 'fullheal', 'revive', 'tonic', 'maxrepel'],
  pre(m) { fill(m, 1, 0, 22, 3, 'water'); fill(m, 12, 0, 2, 3, 'water'); fill(m, 1, 3, 22, 1, 'sand'); carve(m, 'north', 12, 'water'); },
  b: [['center', 2, 8], ['mart', 7, 8], ['house', 15, 8, { name: 'Dojo Hall', npcs: [{ look: 'blackbelt', text: ['Leader Kenta trains under the waterfall every morning.', 'Beat him and he\'ll teach you to Heave boulders!'] }] }],
    ['gym', 4, 15, { gym: GYMS.grit }], ['house2', 15, 15, { name: 'Beach House', npcs: [{ look: 'swimmer', text: ['A strange glowing grotto sits on an island on Route 6...', 'Something ancient sleeps there.'] }] }]],
});
sign(MAPS.kestrel, 18, 10, 'KESTREL ISLE\nTrain hard, eat well, sleep under the stars.');
link('route6', 'south', 12, 'kestrel', 12);

// ---------- Route 7 (coast) ----------
genRoute('route7', {
  name: 'Route 7', w: 36, h: 18, style: 'coast', lv: [27, 31], open: [['west', 8], ['east', 9]], trainers: 6, items: 3, hidden: 3,
  post(m, { fill: f, nearP }) { f(14, 12, 9, 5, 'water'); f(26, 1, 6, 4, 'water'); },
});
link('kestrel', 'east', 8, 'route7', 8);

// ---------- Lumen City (Gym 6: Mind) + Eclipse HQ ----------
mkTown('lumen', 'Lumen City', 30, 22, {
  streets: [[9, 1, 28], [17, 3, 26]], vstreets: [[13, 0, 18]], open: [['west', 9], ['north', 13]],
  stock: ['greatorb', 'ultraorb', 'hyperpotion', 'maxpotion', 'fullheal', 'revive', 'tonic', 'maxrepel', 'moonshard', 'duskstone'],
  b: [['center', 2, 9], ['mart', 7, 9], ['tower', 17, 9, { to: 'eclipsehq' }], ['gym', 3, 17, { gym: GYMS.lumen }],
    ['house', 17, 17, { name: 'Maple\'s Colleague', npcs: [{ look: 'aide', script: 'td_glow' }] }], ['house2', 23, 17, { name: 'Apartment', npcs: [{ look: 'boy', text: ['Lumen Tower was taken over by people in dark uniforms!', 'They locked Leader Sable inside the Gym!'] }] }]],
});
sign(MAPS.lumen, 11, 11, 'LUMEN CITY\nThe city of bright minds.');
sign(MAPS.lumen, 25, 11, 'LUMEN TOWER\n...the sign has been spray-painted over with an eclipse symbol.');
link('route7', 'east', 9, 'lumen', 9);
{ const gb = MAPS.lumen.buildings.find((x) => x.kind === 'gym'); gb.cond = 'hqClear'; gb.lockedMsg = 'The Gym doors are locked tight. A note reads: "Closed by order of TEAM ECLIPSE."'; }
{
  const m = interior('eclipsehq', 'Eclipse HQ', 20, 16, [[9, 15], [10, 15]], { base: 'dkfloor', music: 'boss' });
  fill(m, 0, 0, 20, 2, 'wall');
  fill(m, 1, 11, 7, 1, 'console'); fill(m, 12, 11, 7, 1, 'console');
  fill(m, 4, 7, 12, 1, 'console'); fill(m, 9, 7, 2, 1, 'dkfloor');
  fill(m, 1, 4, 5, 1, 'console'); fill(m, 14, 4, 5, 1, 'console');
  npc(m, { id: 'hq_g1', look: 'grunt', x: 3, y: 13, dir: 'right', trainer: 'eclipse_hq1', sight: 4 });
  npc(m, { id: 'hq_g2', look: 'grunt', x: 16, y: 13, dir: 'left', trainer: 'eclipse_hq2', sight: 4 });
  npc(m, { id: 'hq_g3', look: 'grunt', x: 3, y: 9, dir: 'right', trainer: 'eclipse_hq3', sight: 5 });
  npc(m, { id: 'hq_nyx', look: 'nyx', x: 9, y: 8, dir: 'down', move: 'static', show: '!hqDuo', text: ['...'] });
  npc(m, { id: 'hq_corvo', look: 'corvo', x: 10, y: 8, dir: 'down', move: 'static', show: '!hqDuo', text: ['...'] });
  npc(m, { id: 'hq_vex', look: 'vex', x: 9, y: 3, dir: 'down', move: 'static', script: 'vex', show: '!hqClear' });
  npc(m, { id: 'legend_eclipsa', creature: 'eclipsa', level: 55, x: 10, y: 2, dir: 'down', move: 'static', script: 'legend', show: () => flag('hqClear') && !flag('caught_eclipsa') });
  trig(m, 9, 9, 2, 1, 'hqDuo');
}

// ---------- Route 8 ----------
genRoute('route8', {
  name: 'Route 8', w: 22, h: 32, lv: [31, 34], open: [['south', 13], ['north', 10]], trainers: 5, items: 3, hidden: 2,
  fixedItems: [{ id: 'r8_dusk', x: 0, y: 0, item: 'duskstone', n: 1 }],
  post(m) {},
});
link('lumen', 'north', 13, 'route8', 13);
{ const m = MAPS.route8; const it = m.items.find((i) => i.id === 'r8_dusk'); for (let y = 3; y < m.h; y++) { const x = [2, 3, 18, 19].find((xx) => m.tiles[y][xx] === 'grass' || m.tiles[y][xx] === 'tall'); if (x) { it.x = x; it.y = y; m.tiles[y][x] = 'grass'; break; } } }

// ---------- Ember Tunnel (dark cave) ----------
genRoute('embertunnel', {
  name: 'Ember Tunnel', w: 28, h: 22, style: 'cave', dark: true, lv: [33, 36], open: [['south', 10], ['north', 15]], trainers: 3, items: 4, hidden: 2,
  post(m, { stamp, nearP }) { stamp(18, 3, 6, 4, 'lava', (i, j) => !nearP(i, j, 1)); },
});
link('route8', 'north', 10, 'embertunnel', 10);

// ---------- Cinderpeak (Gym 7: Fire) ----------
mkTown('cinderpeak', 'Cinderpeak', 26, 20, {
  base: 'ash', style: 'ash', border: 'rock', streets: [[8, 1, 24], [15, 3, 21]], vstreets: [[15, 0, 16]], open: [['south', 15], ['east', 8]],
  stock: ['ultraorb', 'hyperpotion', 'maxpotion', 'fullheal', 'revive', 'tonic', 'maxrepel'],
  pre(m) { fill(m, 15, 16, 2, 4, 'path'); fill(m, 19, 1, 5, 3, 'lava'); fill(m, 1, 1, 4, 2, 'lava'); },
  b: [['center', 2, 8], ['mart', 7, 8], ['gym', 17, 15, { gym: GYMS.ember }], ['house', 3, 15, { name: 'Hot Spring Inn', npcs: [{ look: 'oldman', text: ['Our hot springs heal body and soul!', 'Past Route 9 the mountain is blocked by big boulders. Only a strong Heave moves them.'] }] }]],
});
sign(MAPS.cinderpeak, 12, 10, 'CINDERPEAK\nA town built on a sleeping volcano.');
link('embertunnel', 'north', 15, 'cinderpeak', 15);

// ---------- Route 9 (Heave boulders, Stormaw) ----------
genRoute('route9', {
  name: 'Route 9', w: 36, h: 22, style: 'snow', lv: [37, 41], open: [['west', 8], ['east', 10]], trainers: 6, items: 4, hidden: 3,
  post(m, { P, K }) {
    gateCol(m, 12, P, K, 'snowpath', 'rock');
    const ys = []; for (let y = 1; y < m.h - 1; y++) if (P.has(K(12, y))) ys.push(y);
    ys.forEach((y) => m.boulders.push({ x: 12, y }));
    for (let x = 2; x < 9; x++) for (let y = 1; y < 5; y++) m.tiles[y][x] = 'snow';
    for (let x = 1; x < 10; x++) m.tiles[5][x] = 'pine';
    for (let y = 1; y < 5; y++) m.tiles[y][9] = 'pine';
    m.tiles[5][5] = 'snow'; m.boulders.push({ x: 5, y: 5 }); m.tiles[6][4] = 'snow'; m.tiles[6][6] = 'snow';
    for (let y = 6; y < m.h - 1 && !P.has(K(5, y)); y++) { m.tiles[y][5] = 'snow'; if (P.has(K(5, y + 1))) break; }
    npc(m, { id: 'legend_stormaw', creature: 'stormaw', level: 50, x: 4, y: 2, dir: 'down', move: 'static', script: 'legend', show: '!caught_stormaw' });
  },
});
link('cinderpeak', 'east', 8, 'route9', 8);

// ---------- Skyreach (Gym 8: Dragon) ----------
mkTown('skyreach', 'Skyreach', 24, 20, {
  base: 'snow', style: 'snow', border: 'pine', path: 'snowpath', streets: [[10, 1, 22], [16, 3, 20]], vstreets: [[11, 0, 17]], open: [['west', 10], ['north', 11]],
  stock: ['ultraorb', 'hyperpotion', 'maxpotion', 'fullheal', 'revive', 'tonic', 'maxrepel', 'lvcandy'],
  b: [['center', 2, 10], ['mart', 15, 10], ['gym', 3, 16, { gym: GYMS.wyrm }], ['house', 15, 16, { name: 'Elder\'s Hut', npcs: [{ look: 'oldman', text: ['Victory Road lies north. Only trainers with all eight badges may pass.', 'Beyond it is Crown Plateau, home of the Elite Four.'] }] }]],
});
sign(MAPS.skyreach, 8, 12, 'SKYREACH\nThe village above the clouds.');
link('route9', 'east', 10, 'skyreach', 10);

// ---------- Route 10 ----------
genRoute('route10', {
  name: 'Route 10', w: 22, h: 30, style: 'snow', lv: [42, 45], open: [['south', 11], ['north', 10]], trainers: 6, items: 4, hidden: 3,
  post(m, { fill: f }) { f(14, 12, 6, 6, 'water'); trig(m, 1, 2, 20, 1, 'badgeGate'); },
});
link('skyreach', 'north', 11, 'route10', 11);

// ---------- Victory Road ----------
genRoute('victoryroad', {
  name: 'Victory Road', w: 30, h: 26, style: 'cave', lv: [45, 49], open: [['south', 10], ['north', 14]], trainers: 6, items: 5, hidden: 3,
  post(m, { P, K, fill: f }) {
    gateRow(m, 19, P, K, 'crack', 'cavewall');
    const xs = []; for (let x = 1; x < m.w - 1; x++) if (P.has(K(x, 10))) xs.push(x);
    gateRow(m, 10, P, K, 'cavefloor', 'cavewall'); xs.forEach((x) => m.boulders.push({ x, y: 10 }));
    f(3, 13, 6, 4, 'water'); f(20, 3, 6, 4, 'water');
  },
});
link('route10', 'north', 10, 'victoryroad', 10);

// ---------- Crown Plateau (Elite Four) ----------
mkTown('crown', 'Crown Plateau', 22, 16, {
  streets: [[12, 1, 20]], vstreets: [[10, 12, 15]], open: [['south', 10]],
  stock: ['ultraorb', 'maxpotion', 'hyperpotion', 'fullheal', 'revive', 'tonic', 'maxrepel'],
  b: [['center', 2, 12], ['mart', 15, 12], ['league', 6, 7, { to: 'league_lobby' }]],
  pre(m) { fill(m, 10, 7, 2, 5, 'path'); },
});
link('victoryroad', 'north', 14, 'crown', 10);
{
  const lobby = interior('league_lobby', 'Aldermoor League', 12, 9, [[5, 8], [6, 8]], { heal: true });
  fill(lobby, 3, 3, 6, 1, 'counter'); dots(lobby, 'healer', [[7, 2]]); dots(lobby, 'statue', [[1, 6], [10, 6]]);
  npc(lobby, { id: 'nurse', look: 'nurse', x: 5, y: 2, dir: 'down', move: 'static', script: 'nurse' });
  npc(lobby, { id: 'lg_guard', look: 'guide', x: 10, y: 2, dir: 'down', move: 'static', script: 'leagueGuard' });
  fill(lobby, 11, 2, 1, 1, 'mat');
  lobby.warps['11,2'] = { map: 'e4_1', x: 4, y: 8, dir: 'up', cond: 'leagueOpen', lockedMsg: 'Talk to the guard first.' };
  const rooms = [['e4_1', 'Frida\'s Room', 'icefloor'], ['e4_2', 'Morrow\'s Room', 'dkfloor'], ['e4_3', 'Raze\'s Room', 'dkfloor'], ['e4_4', 'Ferrum\'s Room', 'gymfloor'], ['champ', 'Champion\'s Room', 'carpet']];
  rooms.forEach(([id, name, floor], i) => {
    const r = interior(id, name, 10, 10, [], { base: floor, music: 'boss' });
    dots(r, 'statue', [[1, 3], [8, 3], [1, 7], [8, 7]]);
    npc(r, { id: 'e4', look: ['frida', 'morrow', 'raze', 'ferrum', 'kai'][i], x: 4, y: 3, dir: 'down', move: 'static', script: i === 4 ? 'champion' : 'elite' });
    r.e4 = i;
    const next = rooms[i + 1] ? rooms[i + 1][0] : 'halloffame';
    fill(r, 4, 1, 2, 1, 'mat');
    r.warps['4,1'] = { map: next, x: 4, y: 8, dir: 'up', cond: `e4_${i}`, lockedMsg: 'The way forward is sealed until you win.' };
    r.warps['5,1'] = r.warps['4,1'];
  });
  const hof = interior('halloffame', 'Hall of Fame', 10, 10, [[4, 9], [5, 9]], { base: 'carpet', music: 'victory' });
  dots(hof, 'statue', [[2, 3], [7, 3]]);
  npc(hof, { id: 'hof_maple', look: 'maple', x: 4, y: 3, dir: 'down', move: 'static', script: 'hallOfFame' });
  hof.exitTo = { map: 'crown', x: 10, y: 8, dir: 'down' };
}

// ---------- region layout for the Town Map ----------
// [x, y] cell on a 28 x 20 grid, plus kind: town, route, cave, sea
export const LAYOUT = {
  brookhollow: [3, 18, 'town'], route1: [3, 15, 'route', 3, 18], pebbleton: [3, 12, 'town'], route2: [5, 12, 'route', 3, 12, 7, 12],
  hollowgrove: [7, 12, 'forest'], thistlewood: [9, 12, 'town'], route3: [9, 10, 'route', 9, 12, 9, 7], cindercave: [9, 7, 'cave'],
  route4: [9, 5, 'route', 9, 7, 9, 3], voltara: [9, 3, 'town'], route5: [12, 3, 'route', 9, 3, 15, 3], coralport: [15, 3, 'town'],
  route6: [15, 7, 'sea', 15, 3, 15, 11], seacave: [17, 7, 'cave'], kestrel: [15, 11, 'town'], route7: [18, 11, 'route', 15, 11, 21, 11],
  lumen: [21, 11, 'town'], eclipsehq: [22, 11, 'cave'], route8: [21, 9, 'route', 21, 11, 21, 7], embertunnel: [21, 7, 'cave'],
  cinderpeak: [21, 5, 'town'], route9: [23, 5, 'route', 21, 5, 25, 5], skyreach: [25, 5, 'town'], route10: [25, 3, 'route', 25, 5, 25, 2],
  victoryroad: [25, 2, 'cave'], crown: [25, 0.6, 'town'],
};

// ---------------- link doors <-> interiors ----------------
for (const m of Object.values(MAPS)) {
  for (const b of m.buildings) {
    const dx = b.x + b.door, dy = b.y + b.h - 1;
    const inn = MAPS[b.to];
    const [mx, my] = inn.mats[0];
    m.warps[`${dx},${dy}`] = { map: b.to, x: mx, y: my, dir: 'up', cond: b.cond, lockedMsg: b.lockedMsg };
    inn.exitTo = { map: m.id, x: dx, y: dy + 1, dir: 'down' };
  }
}

export function tileAt(m, x, y) {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return y < 0 && m.borderNorth ? m.borderNorth : m.border;
  return m.tiles[y][x];
}

export function buildingSolid(m, x, y) {
  return m.buildings.some((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
}

// ---------------- wild encounter tables ----------------
// Like the classic games, each area has its own 3-4 creatures (plus a few in the water).
// [species, weight]. Levels come from the map's lv range. Evolved forms come from evolving.
export const WILD = {
  route1: { land: [['bunnip', 35], ['gustling', 30], ['squeakle', 25], ['twigling', 10]] },
  route2: { land: [['wormlet', 30], ['grubling', 30], ['dunepup', 25], ['buzzlet', 15]] },
  hollowgrove: { land: [['budlet', 46], ['sproutmole', 18], ['emberkit', 18], ['puddlefin', 18]] },
  route3: { land: [['acornut', 35], ['fawnlet', 30], ['leafwing', 25], ['chubbin', 10]], surf: [['splashkoi', 100]] },
  cindercave: { land: [['echobat', 35], ['pebbit', 30], ['digadillo', 25], ['ammonix', 10]] },
  route4: { land: [['whiskit', 30], ['coilet', 30], ['puffpetal', 25], ['voltpup', 15]] },
  route5: { land: [['sludgeon', 30], ['boltnut', 30], ['mindlet', 25], ['zapfinch', 15]], surf: [['croakle', 50], ['splashkoi', 50]] },
  route6: { land: [['crabble', 60], ['gullwhip', 40]], surf: [['gullwhip', 35], ['shellby', 35], ['dreamray', 15], ['dragoneel', 15]] },
  route7: { land: [['punchpup', 30], ['nightpip', 30], ['twinklet', 25], ['grapplex', 15]], surf: [['croakle', 40], ['shellby', 40], ['dragoneel', 20]] },
  route8: { land: [['sandcroc', 30], ['pumpling', 30], ['cindersnail', 25], ['flarecolt', 15]] },
  embertunnel: { land: [['wisplet', 35], ['ashpup', 30], ['cogling', 25], ['sneakit', 10]] },
  route9: { land: [['frostpup', 30], ['snowmite', 30], ['beetank', 25], ['slumbear', 15]] },
  route10: { land: [['ironhorn', 35], ['glacieroo', 30], ['frostseer', 20], ['drakelet', 15]], surf: [['clamorite', 50], ['kingpincer', 50]] },
  victoryroad: { land: [['sonarwing', 35], ['bouldox', 30], ['mucklord', 20], ['pterrock', 15]], surf: [['torrentail', 50], ['krakammon', 50]] },
};
for (const [id, t] of Object.entries(WILD)) {
  const m = MAPS[id];
  const lv = m.lv || [5, 8];
  if (t.land) m.encounters = t.land.map(([sp, w]) => [sp, lv[0], lv[1], w]);
  if (t.surf) m.surfEnc = t.surf.map(([sp, w]) => [sp, lv[0], lv[1], w]);
}
