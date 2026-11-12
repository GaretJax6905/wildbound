// Data rules for Wildbound (run: node tests/check_data.mjs)
//  - every creature can be caught in the wild somewhere
//  - every evolution happens by level or by an item that exists (no trade evolutions)
//  - every move in every learnset exists; every encounter species exists
import { SPECIES, MOVES, ITEMS } from '../static/js/data.js';
import { MAPS, SOLID } from '../static/js/maps.js';

const errors = [];
const wild = new Set();
for (const m of Object.values(MAPS)) {
  for (const row of m.tiles) if (row.length !== m.w) errors.push(`${m.id}: row width ${row.length} != ${m.w}`);
  if (m.tiles.length !== m.h) errors.push(`${m.id}: height mismatch`);
  for (const [sp, lo, hi, w] of m.encounters || []) {
    if (!SPECIES[sp]) errors.push(`${m.id}: unknown species ${sp}`);
    if (lo > hi || w <= 0) errors.push(`${m.id}: bad encounter ${sp}`);
    wild.add(sp);
  }
  for (const [dir, c] of Object.entries(m.connections)) if (!MAPS[c.map]) errors.push(`${m.id}: connection ${dir} -> missing ${c.map}`);
  for (const b of m.buildings) if (!MAPS[b.to]) errors.push(`${m.id}: door to missing ${b.to}`);
  for (const n of m.npcs) if (SOLID.has(m.tiles[n.y]?.[n.x])) errors.push(`${m.id}: npc ${n.id} stands on solid tile`);
  for (const it of m.items) if (!ITEMS[it.item]) errors.push(`${m.id}: unknown item ${it.item}`);
}
for (const [id, s] of Object.entries(SPECIES)) {
  if (!wild.has(id)) errors.push(`${id} cannot be caught anywhere`);
  for (const [, mv] of s.learn) if (!MOVES[mv]) errors.push(`${id}: unknown move ${mv}`);
  if (s.evo) {
    if (!SPECIES[s.evo.to]) errors.push(`${id}: evolves into unknown ${s.evo.to}`);
    if (!s.evo.level && !(s.evo.item && ITEMS[s.evo.item])) errors.push(`${id}: evolution must be by level or item`);
    if (s.evo.trade) errors.push(`${id}: trade evolutions are not allowed`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK: ${Object.keys(SPECIES).length} creatures, all catchable; ${Object.keys(MAPS).length} maps valid.`);
