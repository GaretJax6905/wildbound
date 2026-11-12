// Creature model: creation, stats, experience, move learning.
import { SPECIES, MOVES } from './data.js';

let uidCounter = Date.now() % 100000;

export function expForLevel(l) { return l <= 1 ? 0 : l * l * l; }

export function makeMon(sp, level, opts = {}) {
  const s = SPECIES[sp];
  const iv = {};
  ['hp', 'atk', 'def', 'spa', 'spd', 'spe'].forEach((k) => { iv[k] = Math.floor(Math.random() * 16); });
  const m = {
    uid: ++uidCounter + '-' + Math.floor(Math.random() * 1e6),
    sp, level, exp: expForLevel(level), iv, status: null, sleep: 0,
    moves: [], nick: opts.nick || null, ot: opts.ot || null,
  };
  // knows the last 4 moves it would have learned by this level
  const known = [];
  for (const [lv, mv] of s.learn) if (lv <= level && !known.includes(mv)) known.push(mv);
  m.moves = known.slice(-4).map((id) => ({ id, pp: MOVES[id].pp }));
  m.hp = stats(m).hp;
  return m;
}

export function name(m) { return m.nick || SPECIES[m.sp].name; }
export function species(m) { return SPECIES[m.sp]; }

export function stats(m) {
  const b = SPECIES[m.sp].base, L = m.level;
  const f = (i, k) => Math.floor(((2 * b[i] + m.iv[k]) * L) / 100) + 5;
  return {
    hp: Math.floor(((2 * b[0] + m.iv.hp) * L) / 100) + L + 10,
    atk: f(1, 'atk'), def: f(2, 'def'), spa: f(3, 'spa'), spd: f(4, 'spd'), spe: f(5, 'spe'),
  };
}

export function maxHp(m) { return stats(m).hp; }

export function healFull(m) {
  m.hp = maxHp(m); m.status = null; m.sleep = 0;
  m.moves.forEach((mv) => { mv.pp = MOVES[mv.id].pp; });
}

export function expYield(foe, trainer) {
  return Math.floor((SPECIES[foe.sp].exp * foe.level) / 7 * (trainer ? 1.5 : 1));
}

// Adds exp, returns list of {level, newMoves:[...]} for each level gained.
export function addExp(m, amount) {
  const gains = [];
  if (m.level >= 100) return gains;
  m.exp += amount;
  while (m.level < 100 && m.exp >= expForLevel(m.level + 1)) {
    const before = maxHp(m);
    m.level++;
    const after = maxHp(m);
    if (m.hp > 0) m.hp += after - before;
    gains.push({ level: m.level, newMoves: movesAt(m.sp, m.level) });
  }
  return gains;
}

export function movesAt(sp, level) {
  return SPECIES[sp].learn.filter(([lv]) => lv === level).map(([, id]) => id);
}

export function knows(m, id) { return m.moves.some((mv) => mv.id === id); }

export function canEvolveByLevel(m) {
  const e = SPECIES[m.sp].evo;
  return e && e.level && m.level >= e.level ? e.to : null;
}

export function evolve(m, to) {
  const before = maxHp(m);
  m.sp = to;
  m.hp = Math.max(m.hp > 0 ? 1 : 0, m.hp + maxHp(m) - before);
}
