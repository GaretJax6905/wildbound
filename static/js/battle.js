// Turn-based battles: wild, trainer, double (2v2 tag battles) and
// "alternating" two-trainer battles when you only have one creature.
import { W, H, wait, setScene, getScene, frame, rand, chance, pick, fx, input, open } from './engine.js';
import { creature, trainerPortrait, orb as orbSprite } from './art.js';
import { MOVES, SPECIES, ITEMS, TYPE_COLORS, SPECIAL_TYPES, effectiveness, STATUS_NAMES } from './data.js';
import { stats, maxHp, name, addExp, expYield, expForLevel, knows } from './mon.js';
import { G, addToCollection, useItem } from './state.js';
import { say, box, text, hpBar, bar, Menu, choose, yesNo, FONT_SMALL, menu } from './ui.js';
import { sfx, playMusic } from './audio.js';
import { partyScreen, bagScreen } from './screens.js';

const STAT_NAMES = { atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed', acc: 'accuracy' };
const STRUGGLE = { name: 'Struggle', type: 'Normal', power: 50, acc: 0, pp: 1, recoil: 4 };

function stageMult(s) { return s >= 0 ? (2 + s) / 2 : 2 / (2 - s); }

class Slot {
  constructor(side, i) { this.side = side; this.i = i; this.mon = null; this.owner = null; this.reset(); }
  reset() { this.st = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0 }; this.anim = { dx: 0, dy: 0, hide: false, blink: 0, scale: 1 }; this.seen = new Set(); this.disp = this.mon ? this.mon.hp : 0; }
  get alive() { return this.mon && this.mon.hp > 0; }
}

let B = null; // current battle state

const battleScene = {
  animate() {
    if (!B) return;
    for (const s of [...B.p, ...B.e]) {
      if (!s.mon) continue;
      const target = s.mon.hp;
      if (s.disp !== target) {
        const step = Math.max(1, maxHp(s.mon) / 40);
        s.disp = s.disp > target ? Math.max(target, s.disp - step) : Math.min(target, s.disp + step);
      }
      if (s.anim.blink > 0) s.anim.blink--;
    }
  },
  update() { },
  draw(g) { drawBattle(g); },
};

function slotPos(s) {
  const dbl = B.double;
  if (s.side === 'e') return dbl ? [[150, 58], [202, 54]][s.i] : [176, 60];
  return dbl ? [[36, 114], [90, 114]][s.i] : [62, 114];
}

function drawBattle(g) {
  const grd = g.createLinearGradient(0, 0, 0, 112);
  grd.addColorStop(0, '#d8f0f8'); grd.addColorStop(1, '#f0f8e0');
  g.fillStyle = grd; g.fillRect(0, 0, W, 112);
  g.fillStyle = '#c8e8a8'; g.fillRect(0, 70, W, 42);
  g.fillStyle = '#b0d890'; for (let i = 0; i < 12; i++) g.fillRect((i * 37 + 11) % W, 76 + (i * 13) % 30, 6, 1);
  // platforms
  const plat = (x, y, rx) => { g.fillStyle = '#88b868'; g.beginPath(); g.ellipse(x, y, rx, rx * 0.28, 0, 0, 7); g.fill(); g.fillStyle = '#a0d080'; g.beginPath(); g.ellipse(x, y - 1, rx - 3, rx * 0.22, 0, 0, 7); g.fill(); };
  if (B.double) { plat(176, 56, 58); plat(64, 112, 60); } else { plat(176, 58, 44); plat(62, 112, 52); }
  // trainer portraits during intro / outro
  if (B.portraits) B.portraits.forEach((pt) => g.drawImage(trainerPortrait(pt.look), pt.x, pt.y));
  if (B.playerPortrait) g.drawImage(trainerPortrait('player'), B.playerPortrait.x, 40);
  const draw = (s, back) => {
    if (!s.mon || s.anim.hide) return;
    if (s.anim.blink > 0 && (s.anim.blink >> 1) % 2) return;
    const size = B.double ? 48 : back ? 64 : 56;
    const img = creature(s.mon.sp, size, back);
    const [x, y] = slotPos(s);
    const sc = s.anim.scale;
    const w = size * sc, h = size * sc;
    const dy = s.anim.dy;
    g.save();
    g.beginPath(); g.rect(0, 0, W, y + 2); g.clip();
    g.drawImage(img, Math.round(x - w / 2 + s.anim.dx), Math.round(y - h + dy), w, h);
    g.restore();
  };
  B.e.forEach((s) => draw(s, false));
  B.p.forEach((s) => draw(s, true));
  if (B.orb) g.drawImage(orbSprite(B.orb.kind), Math.round(B.orb.x - 6), Math.round(B.orb.y - 6));
  if (B.particles) {
    for (const pt of B.particles) { g.fillStyle = pt.c; g.fillRect(Math.round(pt.x), Math.round(pt.y), pt.s, pt.s); }
  }
  // info boxes
  B.e.forEach((s, i) => { if (s.mon && !s.anim.hide && B.showInfo) infoBox(g, s, 4, B.double ? 4 + i * 27 : 10, false); });
  B.p.forEach((s, i) => { if (s.mon && !s.anim.hide && B.showInfo) infoBox(g, s, 132, B.double ? 58 + i * 27 : 72, true); });
  box(g, 0, 112, W, 48, 'dark');
  if (B.prompt) {
    text(g, B.prompt[0], 10, 120, '#f8f8f8', '#384868');
    text(g, B.prompt[1] || '', 10, 135, '#f8f8f8', '#384868');
  }
}

function infoBox(g, s, x, y, mine) {
  const m = s.mon;
  const w = 104, h = mine ? (B.double ? 26 : 36) : 25;
  box(g, x, y, w, h);
  text(g, name(m), x + 7, y + 4, '#383840', '#d0d0c8', FONT_SMALL);
  text(g, 'Lv' + m.level, x + w - 8, y + 4, '#383840', '#d0d0c8', FONT_SMALL, 'right');
  if (m.status) { g.fillStyle = m.status === 'burn' ? '#e06030' : m.status === 'par' ? '#d0b020' : '#8888a0'; g.fillRect(x + 7, y + 14, 15, 7); text(g, STATUS_NAMES[m.status], x + 8, y + 14, '#fff', null, '6px Pixelify, monospace'); }
  text(g, 'HP', x + 25, y + 14, '#f8a030', null, '600 6px Pixelify, monospace');
  if (mine && B.double) {
    hpBar(g, x + 36, y + 16, w - 70, s.disp / maxHp(m));
    text(g, `${Math.ceil(s.disp)}/${maxHp(m)}`, x + w - 7, y + 13, '#383840', null, FONT_SMALL, 'right');
    return;
  }
  hpBar(g, x + 36, y + 16, w - 44, s.disp / maxHp(m));
  if (mine) {
    text(g, `${Math.ceil(s.disp)}/${maxHp(m)}`, x + w - 8, y + 20, '#383840', '#d0d0c8', FONT_SMALL, 'right');
    const lo = expForLevel(m.level), hi = expForLevel(m.level + 1);
    bar(g, x + 7, y + h - 6, w - 14, (m.exp - lo) / (hi - lo));
  }
}

// ---------- helpers ----------
const msg = (...t) => say(...t);
function eStat(s, k) {
  const v = stats(s.mon)[k] * stageMult(s.st[k]);
  if (k === 'spe' && s.mon.status === 'par') return v / 2;
  return v;
}
const label = (s) => (s.side === 'e' ? (B.wild ? 'The wild ' : 'The foe\'s ') : '') + name(s.mon);
const Label = (s) => { const l = label(s); return l[0].toUpperCase() + l.slice(1); };

async function waitHp() { for (let i = 0; i < 90; i++) { if ([...B.p, ...B.e].every((s) => !s.mon || s.disp === s.mon.hp)) break; await wait(1); } }

async function lunge(s) {
  const dir = s.side === 'p' ? 1 : -1;
  for (let i = 0; i < 6; i++) { s.anim.dx = dir * i * 2; await wait(1); }
  for (let i = 6; i >= 0; i--) { s.anim.dx = dir * i * 2; await wait(1); }
}
async function burst(target, type) {
  const [x, y] = slotPos(target);
  const c = TYPE_COLORS[type] || '#fff';
  B.particles = Array.from({ length: 16 }, () => ({ x: x + rand(-6, 6), y: y - 26 + rand(-6, 6), vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, c: Math.random() < 0.5 ? c : '#ffffff', s: rand(2, 3) }));
  for (let i = 0; i < 14; i++) { B.particles.forEach((p) => { p.x += p.vx; p.y += p.vy; }); await wait(1); }
  B.particles = null;
}

function sendOutPos(s) { s.anim.hide = false; s.anim.scale = 1; s.anim.dy = 0; }
async function popIn(s) {
  sfx('door');
  s.anim.hide = false;
  for (let i = 1; i <= 10; i++) { s.anim.scale = i / 10; await wait(1); }
  s.anim.scale = 1;
}

async function sendOut(s, mon, owner) {
  s.mon = mon; s.owner = owner || null; s.reset(); s.disp = mon.hp;
  if (s.side === 'p') { await msg(`Go! ${name(mon)}!`); } else if (owner) { await msg(`${owner.name} sent out ${name(mon)}!`); }
  G.dex.seen[mon.sp] = true;
  await popIn(s);
  markSeen();
}

function markSeen() {
  for (const e of B.e) if (e.alive) for (const p of B.p) if (p.alive) e.seen.add(p.mon.uid);
}

// ---------- the battle ----------
// cfg: { wild: mon } | { trainers: [{name, look, party:[mon], money, potions}], double, canLose, music }
export async function battle(cfg) {
  const prevScene = getScene();
  B = {
    wild: !!cfg.wild, trainers: cfg.trainers || [], p: [], e: [], double: false, runs: 0,
    showInfo: false, portraits: null, result: null, cfg, lastAltIdx: -1,
  };
  const partyAlive = G.party.filter((m) => m.hp > 0);
  B.double = !B.wild && (cfg.double || B.trainers.length === 2) && partyAlive.length >= 2;
  B.p = B.double ? [new Slot('p', 0), new Slot('p', 1)] : [new Slot('p', 0)];
  B.e = B.double ? [new Slot('e', 0), new Slot('e', 1)] : [new Slot('e', 0)];
  setScene(battleScene);
  playMusic(cfg.music || (B.wild ? 'battle' : 'boss'));
  sfx('encounter');
  for (let i = 0; i < 3; i++) { fx.flash = 1; fx.flashColor = '#000'; await wait(6); }
  fx.flash = 0;

  // intro
  if (B.wild) {
    const s = B.e[0];
    s.mon = cfg.wild; s.reset(); s.disp = s.mon.hp; s.anim.dx = -140;
    G.dex.seen[s.mon.sp] = true;
    B.playerPortrait = { x: 260 };
    for (let i = 0; i <= 30; i++) { s.anim.dx = -140 + (140 * i) / 30; B.playerPortrait.x = 260 - (222 * i) / 30; await wait(1); }
    B.showInfo = true;
    await msg(`A wild ${name(s.mon)} appeared!`);
  } else {
    const n = B.trainers.length;
    B.portraits = B.trainers.map((t, i) => ({ look: t.look, x: -60, tx: n === 2 ? 132 + i * 52 : 152, y: 2 }));
    B.playerPortrait = { x: 260 };
    for (let i = 0; i <= 30; i++) { B.portraits.forEach((p) => { p.x = -60 + ((p.tx + 60) * i) / 30; }); B.playerPortrait.x = 260 - (222 * i) / 30; await wait(1); }
    await msg(n === 2 ? `${B.trainers[0].name} and ${B.trainers[1].name} want to battle!` : `${B.trainers[0].name} wants to battle!`);
    for (let i = 0; i <= 16; i++) { B.portraits.forEach((p) => { p.x += 8; }); await wait(1); }
    B.portraits = null;
    B.showInfo = true;
    if (B.double) {
      for (let i = 0; i < 2; i++) {
        const t = n === 2 ? B.trainers[i] : B.trainers[0];
        const mon = nextEnemyMon(n === 2 ? i : 0, i === 1 && n === 1 ? B.e[0].mon : null);
        if (mon) await sendOut(B.e[i], mon, t);
      }
    } else {
      const { mon, t } = nextAlternating();
      await sendOut(B.e[0], mon, t);
    }
  }
  for (let i = 0; i <= 16; i++) { B.playerPortrait.x -= 10; await wait(1); }
  B.playerPortrait = null;
  const firsts = G.party.filter((m) => m.hp > 0).slice(0, B.p.length);
  for (let i = 0; i < firsts.length; i++) await sendOut(B.p[i], firsts[i]);

  // main loop
  while (!B.result) {
    await playerTurn();
    if (B.result) break;
    await checkReplacements();
  }
  const result = B.result;
  if (result === 'win' && !B.wild) await winTrainer();
  if (result === 'lose') {
    if (!cfg.canLose) await msg(`${G.name} is out of usable creatures!`, `${G.name} blacked out!`);
  }
  // clean up stat stages; statuses stay on creatures
  B = null;
  setScene(prevScene);
  return result;
}

async function winTrainer() {
  playMusic('victory');
  const n = B.trainers.length;
  B.portraits = B.trainers.map((t, i) => ({ look: t.look, x: n === 2 ? 132 + i * 52 : 152, y: 2 }));
  B.e.forEach((s) => { s.mon = null; });
  await msg(n === 2 ? `${G.name} defeated ${B.trainers[0].name} and ${B.trainers[1].name}!` : `${G.name} defeated ${B.trainers[0].name}!`);
  for (const t of B.trainers) if (t.lose) await msg(`${t.name}: ${t.lose}`);
  let money = 0;
  for (const t of B.trainers) money += (t.money || 20) * Math.max(...t.party.map((m) => m.level));
  G.money += money;
  await msg(`${G.name} got $${money} for winning!`);
}

function nextEnemyMon(ti, exclude) {
  const t = B.trainers[ti];
  return t.party.find((m) => m.hp > 0 && m !== exclude && !B.e.some((s) => s.mon === m)) || null;
}
function anyEnemyLeft() { return B.wild ? B.e[0].alive : B.trainers.some((t) => t.party.some((m) => m.hp > 0)); }

// for single battles against two trainers: they take turns sending creatures out
function nextAlternating() {
  const n = B.trainers.length;
  for (let k = 1; k <= n; k++) {
    const ti = (B.lastAltIdx + k + n) % n;
    const mon = nextEnemyMon(ti);
    if (mon) { B.lastAltIdx = ti; return { mon, t: B.trainers[ti] }; }
  }
  return { mon: null, t: null };
}

async function checkReplacements() {
  if (!anyEnemyLeft()) { B.result = 'win'; return; }
  // enemies
  if (!B.wild) {
    for (let i = 0; i < B.e.length; i++) {
      const s = B.e[i];
      if (s.alive) continue;
      let mon, t;
      if (B.double) { const ti = B.trainers.length === 2 ? i : 0; t = B.trainers[ti]; mon = nextEnemyMon(ti); if (!mon && B.trainers.length === 2) { t = B.trainers[1 - ti]; mon = nextEnemyMon(1 - ti); } } else ({ mon, t } = nextAlternating());
      if (mon) await sendOut(s, mon, t); else s.mon = null;
    }
  }
  // player
  if (!G.party.some((m) => m.hp > 0)) { B.result = 'lose'; return; }
  for (const s of B.p) {
    if (s.alive) continue;
    const bench = G.party.filter((m) => m.hp > 0 && !B.p.some((x) => x.mon === m));
    if (!bench.length) { s.mon = null; continue; }
    if (B.wild && B.p.length === 1) {
      if (!(await yesNo('Use next creature?'))) {
        if (await tryRun(true)) return;
      }
    }
    const idx = await partyScreen({ mode: 'battle', forced: true, title: 'Choose a creature.', active: B.p.map((x) => x.mon) });
    await sendOut(s, G.party[idx]);
  }
}

// ---------- choosing actions ----------
async function playerTurn() {
  const acts = [];
  for (const s of B.p) {
    if (!s.alive) continue;
    const a = await chooseAction(s);
    if (B.result) return;
    if (a) acts.push(a);
  }
  if (B.result) return;
  for (const s of B.e) if (s.alive) acts.push(enemyAction(s));
  await runTurn(acts);
}

async function chooseAction(s) {
  for (;;) {
    B.prompt = ['What will', name(s.mon) + ' do?'];
    const r = await open(new Menu({ items: ['FIGHT', 'BAG', 'TEAM', B.wild ? 'RUN' : 'RUN'], cols: 2, x: 120, y: 112, w: 120, h: 48, cancel: false, lineH: 17 }));
    B.prompt = null;
    if (r === 0) {
      const usable = s.mon.moves.filter((m) => m.pp > 0);
      if (!usable.length) { await msg(`${name(s.mon)} has no moves left!`); return { type: 'move', s, move: 'struggle', target: pickFoe(s), pri: 0 }; }
      const mv = await moveMenu(s);
      if (mv == null) continue;
      if (s.mon.moves[mv].pp <= 0) { await msg('There\'s no PP left for this move!'); continue; }
      const id = s.mon.moves[mv].id;
      let target = pickFoe(s);
      const M = MOVES[id];
      if (B.double && !(M.stat && M.stat.target === 'self')) {
        const foes = B.e.filter((e) => e.alive);
        if (foes.length > 1) {
          const t = await choose('Use ' + M.name + ' on which foe?', foes.map((f) => name(f.mon)), { w: 100, x: 136 });
          if (t < 0) continue;
          target = foes[t];
        }
      }
      return { type: 'move', s, move: id, mi: mv, target, pri: M.priority || 0 };
    }
    if (r === 1) {
      const it = await bagScreen({ battle: true });
      if (!it) continue;
      const I = ITEMS[it];
      if (I.kind === 'orb') {
        if (!B.wild) { await msg('The trainer blocked the orb!', 'Don\'t be a thief!'); continue; }
        useItem(it);
        await throwOrb(it);
        if (B.result) return null;
        return null; // throwing used the turn
      }
      const idx = await partyScreen({ mode: 'item', item: it, title: 'Use on which creature?' });
      if (idx < 0) continue;
      const target = G.party[idx];
      const ok = await applyItem(it, target, true);
      if (!ok) continue;
      return null;
    }
    if (r === 2) {
      const idx = await partyScreen({ mode: 'battle', title: 'Choose a creature.', active: B.p.map((x) => x.mon) });
      if (idx < 0) continue;
      return { type: 'switch', s, to: G.party[idx], pri: 10 };
    }
    if (r === 3) {
      if (!B.wild) { await msg('No! There\'s no running from a trainer battle!'); continue; }
      if (await tryRun()) return null;
      return null;
    }
  }
}

function moveMenu(s) {
  const items = s.mon.moves.map((m) => ({ label: MOVES[m.id].name }));
  while (items.length < 4) items.push({ label: '-', disabled: true });
  const mm = new Menu({
    items, cols: 2, x: 0, y: 112, w: 162, h: 48, lineH: 17,
    extra: (g, i) => {
      box(g, 160, 112, 80, 48);
      const mv = s.mon.moves[i];
      if (!mv) return;
      const M = MOVES[mv.id];
      text(g, 'PP', 168, 121); text(g, `${mv.pp}/${M.pp}`, 232, 121, mv.pp ? '#383840' : '#e03030', '#d0d0c8', undefined, 'right');
      g.fillStyle = TYPE_COLORS[M.type]; g.fillRect(168, 138, 64, 12);
      text(g, M.type.toUpperCase(), 200, 139, '#fff', '#00000055', FONT_SMALL, 'center');
    },
  });
  return open(mm).then((r) => (r < 0 ? null : r));
}

function pickFoe(s) {
  const side = s.side === 'p' ? B.e : B.p;
  const alive = side.filter((x) => x.alive);
  return alive.length ? pick(alive) : null;
}

function enemyAction(s) {
  const target = pickFoe(s);
  const usable = s.mon.moves.map((m, i) => ({ m, i })).filter(({ m }) => m.pp > 0);
  const trainer = s.owner;
  if (trainer && trainer.potions > 0 && s.mon.hp < maxHp(s.mon) * 0.3 && s.mon.hp > 0) {
    trainer.potions--;
    return { type: 'enemyitem', s, pri: 10 };
  }
  if (!usable.length) return { type: 'move', s, move: 'struggle', target, pri: 0 };
  let choice;
  if (B.wild) choice = pick(usable);
  else {
    let best = -1;
    for (const u of usable) {
      const M = MOVES[u.m.id];
      let sc;
      if (M.power) {
        const eff = target ? effectiveness(M.type, SPECIES[target.mon.sp].types) : 1;
        const stab = SPECIES[s.mon.sp].types.includes(M.type) ? 1.5 : 1;
        sc = M.power * eff * stab * (M.acc || 100) / 100;
      } else {
        sc = 30;
        if ((M.sleep || M.par) && target && target.mon.status) sc = 0;
        if (M.stat && M.stat.target === 'self' && s.st[M.stat.stat] >= 2) sc = 5;
        if (M.stat && M.stat.target === 'foe' && target && target.st[M.stat.stat] <= -2) sc = 5;
      }
      sc *= 0.7 + Math.random() * 0.6;
      if (sc > best) { best = sc; choice = u; }
    }
  }
  return { type: 'move', s, move: choice.m.id, mi: choice.i, target, pri: MOVES[choice.m.id].priority || 0 };
}

async function runTurn(acts) {
  acts.sort((a, b) => (b.pri - a.pri) || (eStat(b.s, 'spe') - eStat(a.s, 'spe')) || (Math.random() - 0.5));
  for (const a of acts) {
    if (B.result) return;
    if (!a.s.alive) continue;
    if (a.type === 'switch') {
      await msg(`Come back, ${name(a.s.mon)}!`);
      for (let i = 10; i >= 0; i--) { a.s.anim.scale = i / 10; await wait(1); }
      await sendOut(a.s, a.to);
    } else if (a.type === 'enemyitem') {
      a.s.mon.hp = Math.min(maxHp(a.s.mon), a.s.mon.hp + 60);
      sfx('heal');
      await msg(`${a.s.owner.name} used a Super Potion!`);
      await waitHp();
    } else if (a.type === 'move') {
      await doMove(a);
      if (!anyEnemyLeft()) { B.result = 'win'; return; }
      if (!G.party.some((m) => m.hp > 0)) { B.result = 'lose'; return; }
    }
  }
  // end of turn: burn
  for (const s of [...B.p, ...B.e]) {
    if (!s.alive || s.mon.status !== 'burn') continue;
    s.mon.hp = Math.max(0, s.mon.hp - Math.max(1, Math.floor(maxHp(s.mon) / 16)));
    s.anim.blink = 12;
    await msg(`${Label(s)} is hurt by its burn!`);
    await waitHp();
    if (s.mon.hp <= 0) await faint(s);
  }
  if (!anyEnemyLeft()) B.result = 'win';
  else if (!G.party.some((m) => m.hp > 0)) B.result = 'lose';
}

async function doMove(a) {
  const s = a.s, m = s.mon;
  const M = a.move === 'struggle' ? STRUGGLE : MOVES[a.move];
  if (m.status === 'sleep') {
    m.sleep--;
    if (m.sleep > 0) { await msg(`${Label(s)} is fast asleep.`); return; }
    m.status = null; await msg(`${Label(s)} woke up!`);
  }
  if (m.status === 'par' && chance(0.25)) { await msg(`${Label(s)} is paralyzed! It can't move!`); return; }
  if (a.move !== 'struggle') { const slot = m.moves.find((x) => x.id === a.move); if (slot) slot.pp = Math.max(0, slot.pp - 1); }
  await msg(`${Label(s)} used ${M.name}!`);
  const selfMove = M.stat && M.stat.target === 'self' && !M.power;
  let t = selfMove ? s : a.target;
  if (!selfMove && (!t || !t.alive)) {
    t = pickFoe(s);
    if (!t) { await msg('But there was no target...'); return; }
  }
  if (!selfMove && M.acc) {
    const acc = M.acc * stageMult(s.st.acc);
    if (Math.random() * 100 >= acc) { await msg(`${Label(s)}'s attack missed!`); return; }
  }
  const tTypes = SPECIES[t.mon.sp].types;
  if (M.power) {
    const eff = effectiveness(M.type, tTypes);
    if (eff === 0) { await msg(`It doesn't affect ${label(t)}...`); return; }
    const special = SPECIAL_TYPES.has(M.type);
    let A = eStat(s, special ? 'spa' : 'atk');
    if (!special && m.status === 'burn') A /= 2;
    const D = eStat(t, special ? 'spd' : 'def');
    const crit = chance(1 / 16);
    const stab = SPECIES[m.sp].types.includes(M.type) ? 1.5 : 1;
    let dmg = Math.floor(Math.floor((Math.floor((2 * m.level) / 5 + 2) * M.power * A) / D) / 50) + 2;
    dmg = Math.floor(dmg * (crit ? 1.5 : 1) * stab * eff * (0.85 + Math.random() * 0.15));
    dmg = Math.max(1, dmg);
    await lunge(s);
    await burst(t, M.type);
    sfx(eff > 1 ? 'superhit' : eff < 1 ? 'weakhit' : 'hit');
    t.anim.blink = 16;
    const dealt = Math.min(t.mon.hp, dmg);
    t.mon.hp -= dealt;
    await waitHp();
    if (crit) await msg('A critical hit!');
    if (eff > 1) await msg('It\'s super effective!');
    if (eff < 1) await msg('It\'s not very effective...');
    if (M.drain && m.hp > 0) {
      m.hp = Math.min(maxHp(m), m.hp + Math.max(1, Math.floor((dealt * M.drain) / 100)));
      await waitHp();
      await msg(`${Label(t)} had its energy drained!`);
    }
    if (M.recoil) {
      m.hp = Math.max(0, m.hp - Math.max(1, Math.floor(maxHp(m) / M.recoil)));
      s.anim.blink = 10; await waitHp();
      await msg(`${Label(s)} is hit with recoil!`);
    }
    if (t.mon.hp <= 0) await faint(t);
    else {
      if (M.burn && chance(M.burn / 100)) await inflict(t, 'burn');
      if (M.par && chance(M.par / 100)) await inflict(t, 'par');
      if (M.stat && M.stat.chance && chance(M.stat.chance / 100)) await changeStat(t, M.stat.stat, M.stat.n);
    }
    if (m.hp <= 0) await faint(s);
    return;
  }
  // status moves
  if (!selfMove && effectiveness(M.type, tTypes) === 0) { await msg(`It doesn't affect ${label(t)}...`); return; }
  if (M.sleep || M.par) {
    const st = M.sleep ? 'sleep' : 'par';
    if (t.mon.status) { await msg('But it failed!'); return; }
    await burst(t, M.type);
    await inflict(t, st);
    return;
  }
  if (M.stat) {
    const target = M.stat.target === 'self' ? s : t;
    await changeStat(target, M.stat.stat, M.stat.n);
  }
}

async function inflict(t, st) {
  const types = SPECIES[t.mon.sp].types;
  if (t.mon.status) return;
  if (st === 'burn' && types.includes('Fire')) return;
  if (st === 'par' && types.includes('Electric')) return;
  t.mon.status = st;
  if (st === 'sleep') t.mon.sleep = rand(2, 4);
  sfx('hit');
  await msg(st === 'burn' ? `${Label(t)} was burned!` : st === 'par' ? `${Label(t)} is paralyzed! It may be unable to move!` : `${Label(t)} fell asleep!`);
}

async function changeStat(t, stat, n) {
  const cur = t.st[stat];
  const nv = Math.max(-6, Math.min(6, cur + n));
  if (nv === cur) { await msg(`${Label(t)}'s ${STAT_NAMES[stat]} won't go any ${n > 0 ? 'higher' : 'lower'}!`); return; }
  t.st[stat] = nv;
  sfx(n > 0 ? 'select' : 'back');
  await msg(`${Label(t)}'s ${STAT_NAMES[stat]} ${n > 0 ? (n > 1 ? 'sharply rose' : 'rose') : (n < -1 ? 'harshly fell' : 'fell')}!`);
}

async function faint(t) {
  sfx('faint');
  for (let i = 0; i <= 14; i++) { t.anim.dy = i * 4; await wait(1); }
  t.anim.hide = true;
  t.mon.status = null; t.mon.sleep = 0;
  await msg(`${Label(t)} fainted!`);
  if (t.side === 'e') await giveExp(t);
}

async function giveExp(foeSlot) {
  const foe = foeSlot.mon;
  const parts = G.party.filter((m) => m.hp > 0 && foeSlot.seen.has(m.uid));
  if (!parts.length) return;
  const each = Math.max(1, Math.floor(expYield(foe, !B.wild) / parts.length));
  for (const m of parts) {
    await msg(`${name(m)} gained ${each} EXP. Points!`);
    const gains = addExp(m, each);
    for (const gnn of gains) {
      sfx('levelup');
      await msg(`${name(m)} grew to Lv. ${gnn.level}!`);
      for (const mv of gnn.newMoves) await learnMove(m, mv);
    }
  }
}

export async function learnMove(m, id) {
  if (knows(m, id)) return;
  const M = MOVES[id];
  if (m.moves.length < 4) {
    m.moves.push({ id, pp: M.pp });
    sfx('levelup');
    await say(`${name(m)} learned ${M.name}!`);
    return;
  }
  await say(`${name(m)} wants to learn the move ${M.name}.`, `However, ${name(m)} already knows four moves.`);
  for (;;) {
    if (!(await yesNo(`Should a move be forgotten to make space for ${M.name}?`))) {
      if (await yesNo(`Stop learning ${M.name}?`)) { await say(`${name(m)} did not learn ${M.name}.`); return; }
      continue;
    }
    const r = await menu({ items: m.moves.map((x) => MOVES[x.id].name).concat(['Cancel']), x: 120, w: 116, y: 20 });
    if (r < 0 || r === 4) continue;
    const old = MOVES[m.moves[r].id].name;
    m.moves[r] = { id, pp: M.pp };
    await say('1, 2, and... ... Poof!', `${name(m)} forgot ${old}.`, `And... ${name(m)} learned ${M.name}!`);
    return;
  }
}

// ---------- items / orbs / running ----------
export async function applyItem(it, mon, inBattle) {
  const I = ITEMS[it];
  if (I.kind === 'heal') {
    if (mon.hp <= 0 || mon.hp >= maxHp(mon)) { await say('It won\'t have any effect.'); return false; }
    const before = mon.hp;
    mon.hp = Math.min(maxHp(mon), mon.hp + I.heal);
    useItem(it); sfx('heal');
    if (inBattle && B) { await waitHp(); }
    await say(`${name(mon)}'s HP was restored by ${mon.hp - before} point(s).`);
    return true;
  }
  if (I.kind === 'revive') {
    if (mon.hp > 0) { await say('It won\'t have any effect.'); return false; }
    mon.hp = Math.floor(maxHp(mon) / 2);
    useItem(it); sfx('heal');
    await say(`${name(mon)} was revived!`);
    return true;
  }
  if (I.kind === 'cure') {
    if (!mon.status) { await say('It won\'t have any effect.'); return false; }
    mon.status = null; mon.sleep = 0; useItem(it); sfx('heal');
    await say(`${name(mon)} is healthy again!`);
    return true;
  }
  return false;
}

async function throwOrb(it) {
  const s = B.e[0];
  const m = s.mon;
  await msg(`${G.name} used one ${ITEMS[it].name}!`);
  sfx('throw');
  const [tx, ty] = slotPos(s);
  B.orb = { kind: it, x: 40, y: 100 };
  for (let i = 0; i <= 24; i++) { const k = i / 24; B.orb.x = 40 + (tx - 40) * k; B.orb.y = 100 + (ty - 34 - 100) * k - Math.sin(k * Math.PI) * 50; await wait(1); }
  fx.flash = 0.8; fx.flashColor = '#fff';
  for (let i = 10; i >= 0; i--) { s.anim.scale = i / 10; await wait(1); }
  s.anim.hide = true;
  for (let i = 0; i < 12; i++) { B.orb.y = Math.min(ty - 6, B.orb.y + 3); await wait(1); }
  B.orb.y = ty - 6;
  const max = maxHp(m);
  const sb = m.status === 'sleep' ? 2 : m.status ? 1.5 : 1;
  const a = Math.floor((((3 * max - 2 * m.hp) * SPECIES[m.sp].rate * ITEMS[it].bonus) / (3 * max)) * sb);
  let shakes = 0;
  if (a >= 255) shakes = 4;
  else {
    const b = 1048560 / Math.sqrt(Math.sqrt(16711680 / Math.max(1, a)));
    while (shakes < 4 && Math.random() * 65536 < b) shakes++;
  }
  for (let i = 0; i < Math.min(3, shakes); i++) {
    await wait(20);
    sfx('shake');
    for (let k = 0; k < 12; k++) { B.orb.x = tx + Math.sin(k / 2) * 3; await wait(1); }
    B.orb.x = tx;
  }
  await wait(20);
  if (shakes >= 4) {
    sfx('caught');
    await msg(`Gotcha! ${name(m)} was caught!`);
    const isNew = !G.dex.caught[m.sp];
    m.status = m.status || null;
    const where = addToCollection(m);
    if (isNew) await msg(`${name(m)}'s data was added to the DEX!`);
    if (where === 'box') await msg(`Your team is full, so ${name(m)} was sent to the PC box for this region.`);
    B.orb = null;
    B.result = 'caught';
    return;
  }
  B.orb = null;
  s.anim.hide = false;
  for (let i = 1; i <= 10; i++) { s.anim.scale = i / 10; await wait(1); }
  await msg(['Oh no! It broke free!', 'Aww! It appeared to be caught!', 'Aargh! Almost had it!', 'Shoot! It was so close, too!'][Math.min(3, shakes)]);
}

async function tryRun(forced) {
  const me = B.p.find((x) => x.alive) || B.p[0];
  const foe = B.e[0];
  B.runs++;
  const ps = me.mon ? eStat(me, 'spe') : 1, es = eStat(foe, 'spe');
  const ok = forced || ps >= es || Math.random() * 256 < (ps * 128) / es + 30 * B.runs;
  if (ok) { sfx('door'); await msg('Got away safely!'); B.result = 'run'; return true; }
  await msg('Can\'t escape!');
  return false;
}

export { STAT_NAMES };
