// Walks the whole region (node tests/check_reach.mjs):
//  - with every field move, every map, item, trainer and legendary must be reachable
//  - each field move must actually gate something (progression order is enforced)
import { MAPS, SOLID, buildingSolid } from '../static/js/maps.js';

function explore(ab) {
  const seen = new Set();
  const q = [['house_player', 4, 3]];
  const K = (m, x, y) => `${m}|${x}|${y}`;
  seen.add(K(...q[0]));
  const ok = (m, x, y) => {
    const t = m.tiles[y][x];
    if (buildingSolid(m, x, y)) return false;
    if (t === 'water') return ab.surf;
    if (t === 'bush') return ab.slash;
    if (t === 'crack') return ab.shatter;
    if (m.boulders.some((b) => b.x === x && b.y === y)) return ab.heave;
    return !SOLID.has(t);
  };
  while (q.length) {
    const [mid, x, y] = q.pop();
    const m = MAPS[mid];
    const push = (id, nx, ny) => { const k = K(id, nx, ny); if (!seen.has(k)) { seen.add(k); q.push([id, nx, ny]); } };
    if (m.interior && m.tiles[y][x] === 'mat' && m.exitTo) push(m.exitTo.map, m.exitTo.x, m.exitTo.y);
    for (const [dx, dy, side] of [[1, 0, 'east'], [-1, 0, 'west'], [0, 1, 'south'], [0, -1, 'north']]) {
      const nx = x + dx, ny = y + dy;
      const w = m.warps[`${nx},${ny}`];
      if (w) { push(w.map, w.x, w.y); continue; }
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) {
        const c = m.connections[side];
        if (!c) continue;
        const t = MAPS[c.map];
        let tx = nx, ty = ny;
        if (side === 'north') { ty = t.h - 1; tx = nx + c.offset; }
        if (side === 'south') { ty = 0; tx = nx + c.offset; }
        if (side === 'west') { tx = t.w - 1; ty = ny + c.offset; }
        if (side === 'east') { tx = 0; ty = ny + c.offset; }
        if (t.tiles[ty] && t.tiles[ty][tx] !== undefined && ok(t, tx, ty)) push(c.map, tx, ty);
        continue;
      }
      if (ok(m, nx, ny) && !m.npcs.some((n) => n.x === nx && n.y === ny && !n.trainer && !n.creature && !n.show) && !m.items.some((i) => i.x === nx && i.y === ny)) push(mid, nx, ny);
    }
  }
  const maps = new Set([...seen].map((k) => k.split('|')[0]));
  const at = (m, x, y) => [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 0]].some(([dx, dy]) => seen.has(K(m, x + dx, y + dy)));
  return { maps, at };
}

const all = { surf: true, slash: true, shatter: true, heave: true };
const full = explore(all);
const errors = [];
for (const m of Object.values(MAPS)) {
  if (!full.maps.has(m.id)) { errors.push(`unreachable map: ${m.id}`); continue; }
  for (const it of m.items) if (!full.at(m.id, it.x, it.y)) errors.push(`${m.id}: item ${it.id} unreachable`);
  for (const n of m.npcs) if ((n.trainer || n.creature || n.script) && !full.at(m.id, n.x, n.y)) errors.push(`${m.id}: npc ${n.id} unreachable`);
}
const gates = [
  ['slash', 'cindercave'], ['shatter', 'coralport'], ['surf', 'kestrel'], ['heave', 'skyreach'],
];
for (const [ab, beyond] of gates) {
  const r = explore({ ...all, [ab]: false });
  if (r.maps.has(beyond)) errors.push(`${ab} doesn't gate ${beyond}`);
}
const none = explore({});
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK: all ${full.maps.size} maps reachable; with no field moves you can reach ${none.maps.size}. Every field move gates the next area.`);
