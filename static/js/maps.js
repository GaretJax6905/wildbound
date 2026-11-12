// Region 1: Aldermoor. Maps are painted with rectangles so they're easy to
// edit: fill(map, x, y, w, h, tile).
export const SOLID = new Set(['tree', 'water', 'fence', 'sign', 'rock', 'wall', 'counter', 'shelf', 'table', 'pc', 'healer', 'plant', 'bed', 'tv', 'statue', 'boulder', 'void']);

function M(id, o) {
  const m = {
    id, name: o.name, w: o.w, h: o.h, region: 'aldermoor', music: o.music || 'route',
    interior: !!o.interior, border: o.border || (o.interior ? 'void' : 'tree'), borderNorth: o.borderNorth,
    tiles: Array.from({ length: o.h }, () => Array(o.w).fill(o.base || (o.interior ? 'floor' : 'grass'))),
    buildings: [], warps: {}, connections: o.connections || {}, npcs: [], signs: {}, items: [], triggers: [],
    encounters: o.encounters || null, heal: o.heal || null, exitTo: null,
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
    name: 'Route 1', w: 20, h: 30, music: 'route',
    connections: { south: { map: 'brookhollow', offset: 0 }, north: { map: 'pebbleton', offset: 0 } },
    encounters: [['bunnip', 3, 5, 35], ['gustling', 3, 5, 30], ['twigling', 3, 4, 25], ['buzzlet', 4, 5, 10]],
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
    name: 'Route 2', w: 32, h: 14, music: 'route',
    connections: { west: { map: 'pebbleton', offset: 4 }, east: { map: 'hollowgrove', offset: 1 } },
    encounters: [['dunepup', 7, 10, 30], ['pebbit', 7, 10, 25], ['bunnip', 8, 10, 15], ['gustling', 8, 10, 15], ['twigling', 8, 10, 10], ['buzzlet', 8, 10, 5]],
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
    name: 'Hollow Grove', w: 18, h: 16, music: 'route', base: 'tall',
    connections: { west: { map: 'route2', offset: -1 } },
    encounters: [
      ['sproutmole', 8, 11, 8], ['emberkit', 8, 11, 8], ['puddlefin', 8, 11, 8], ['buzzlet', 10, 12, 14], ['twigling', 10, 12, 10],
      ['dunepup', 10, 12, 10], ['pebbit', 10, 12, 8], ['barkmantis', 12, 14, 8], ['hopscot', 14, 16, 7], ['galehawk', 15, 17, 6],
      ['voltwasp', 16, 18, 3], ['bouldox', 18, 20, 3], ['mesaruff', 20, 22, 3], ['thornmole', 16, 18, 2], ['blazelynx', 16, 18, 2], ['tidalotl', 16, 18, 2],
    ],
  }));
  fill(m, 0, 7, 5, 2, 'path');
  fill(m, 12, 2, 4, 3, 'water');
  fill(m, 11, 5, 6, 1, 'grass');
  fill(m, 5, 2, 2, 3, 'tree');
  fill(m, 8, 10, 3, 2, 'tree');
  fill(m, 14, 8, 2, 2, 'tree');
  dots(m, 'flower', [[2, 3], [3, 4], [12, 6], [16, 6], [3, 12], [9, 14]]);
  sign(m, 3, 6, 'HOLLOW GROVE\nRare creatures are said to gather here, even ones that partner new trainers.');
  item(m, 'grove_spark', 15, 12, 'sparkstone');
  item(m, 'grove_revive', 2, 13, 'revive');
  npc(m, { id: 'grove_maple', look: 'aide', x: 6, y: 8, dir: 'left', move: 'look', text: ['I\'m one of Professor Maple\'s aides.', 'Every creature in Aldermoor can be found somewhere. Even the three starters live wild in this grove!', 'Evolved forms show up here too, though they\'re rare and strong.'] });
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

// ---------------- link doors <-> interiors ----------------
for (const m of Object.values(MAPS)) {
  for (const b of m.buildings) {
    const dx = b.x + b.door, dy = b.y + b.h - 1;
    const inn = MAPS[b.to];
    const [mx, my] = inn.mats[0];
    m.warps[`${dx},${dy}`] = { map: b.to, x: mx, y: my, dir: 'up' };
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
