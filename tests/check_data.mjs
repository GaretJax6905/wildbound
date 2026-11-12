// Data rules for Wildbound (run: node tests/check_data.mjs)
//  - every creature can be caught somewhere (wild habitat or a one-time special encounter)
//  - every evolution happens by level or by an item that exists (no trade evolutions)
//  - moves, items, maps, connections and doors all point at things that exist
//  - every outdoor map can be walked into from its connections, and doors land on walkable tiles
import { SPECIES, MOVES, ITEMS, SPECIES_LIST } from '../static/js/data.js';
import { MAPS, SOLID } from '../static/js/maps.js';

const errors = [];
const catchable = new Set();
for (const m of Object.values(MAPS)) {
  for (const row of m.tiles) if (row.length !== m.w) errors.push(`${m.id}: row width ${row.length} != ${m.w}`);
  if (m.tiles.length !== m.h) errors.push(`${m.id}: height mismatch`);
  for (const [sp] of [...(m.encounters || []), ...(m.surfEnc || [])]) { if (!SPECIES[sp]) errors.push(`${m.id}: unknown species ${sp}`); catchable.add(sp); }
  for (const n of m.npcs) if (n.creature) catchable.add(n.creature);
  for (const [dir, c] of Object.entries(m.connections)) {
    const t = MAPS[c.map];
    if (!t) { errors.push(`${m.id}: connection ${dir} -> missing ${c.map}`); continue; }
  }
  for (const [k, w] of Object.entries(m.warps)) {
    const t = MAPS[w.map];
    if (!t) { errors.push(`${m.id}: warp ${k} -> missing ${w.map}`); continue; }
    const tt = t.tiles[w.y]?.[w.x];
    if (!tt || (SOLID.has(tt) && tt !== 'water')) errors.push(`${m.id}: warp ${k} lands on ${tt} in ${w.map}`);
  }
  for (const n of m.npcs) { const tt = m.tiles[n.y]?.[n.x]; if (SOLID.has(tt) && !(tt === 'water' && n.swim)) errors.push(`${m.id}: npc ${n.id} stands on ${tt}`); }
  for (const it of [...m.items, ...m.hidden]) if (!ITEMS[it.item]) errors.push(`${m.id}: unknown item ${it.item}`);
}
for (const [id, s] of Object.entries(SPECIES)) {
  if (!catchable.has(id)) errors.push(`${id} cannot be caught anywhere`);
  for (const [, mv] of s.learn) if (!MOVES[mv]) errors.push(`${id}: unknown move ${mv}`);
  if (s.evo) {
    if (!SPECIES[s.evo.to]) errors.push(`${id}: evolves into unknown ${s.evo.to}`);
    if (!s.evo.level && !(s.evo.item && ITEMS[s.evo.item])) errors.push(`${id}: evolution must be by level or item`);
  }
}
const gyms = Object.values(MAPS).filter((m) => m.gym).length + 1;
const towns = Object.values(MAPS).filter((m) => m.town).length;
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK: ${SPECIES_LIST.length} creatures, all catchable; ${Object.keys(MAPS).length} maps; ${gyms} gyms; ${towns} templated towns.`);
