// Full-screen menus: team, summary, bag, PC box, dex, shop, starter pick,
// trainer card, options, title and the evolution scene.
import { W, H, input, open, wait, frame, fx } from './engine.js';
import { creature, silhouette, person, drawCreature, trainerPortrait, blit } from './art.js';
import { SPECIES, SPECIES_LIST, MOVES, ITEMS, TYPE_COLORS, STATUS_NAMES, BADGES, FIELD, canLearnField } from './data.js';
import { MAPS, LAYOUT } from './maps.js';
import { stats, maxHp, name, expForLevel, evolve, movesAt, canEvolveByLevel } from './mon.js';
import { G, settings, saveSettings, save, exportSave, importSaveFile, useItem, addItem } from './state.js';
import { box, text, hpBar, bar, cursor, say, menu, choose, yesNo, Menu, QtyPicker, wrap, FONT, FONT_SMALL, FONT_BIG } from './ui.js';
import { sfx, playMusic, applyVolumes } from './audio.js';
import { applyItem, learnMove } from './battle.js';

const BG = '#4878a8';
function bg(g, col = BG) { g.fillStyle = col; g.fillRect(0, 0, W, H); g.fillStyle = '#00000018'; for (let y = 0; y < H; y += 8) g.fillRect(0, y, W, 4); }

function typeTag(g, t, x, y) { g.fillStyle = TYPE_COLORS[t]; g.fillRect(x, y, 36, 10); text(g, t.toUpperCase(), x + 18, y + 1, '#fff', '#00000055', FONT_SMALL, 'center'); }

// generic list widget that stays on screen while a handler runs
class ListScreen {
  constructor(o) { Object.assign(this, o); this.index = o.index || 0; this.scroll = 0; this.busy = false; }
  get count() { return this.itemsFn().length; }
  update() {
    if (this.busy) return;
    const n = this.count;
    if (!n) { if (input.pressed('b') || input.pressed('a')) this.close(-1); return; }
    if (input.repeat('down')) { this.index = (this.index + 1) % n; sfx('move'); }
    if (input.repeat('up')) { this.index = (this.index - 1 + n) % n; sfx('move'); }
    if (this.index >= n) this.index = n - 1;
    if (input.pressed('a')) {
      sfx('select');
      this.busy = true;
      Promise.resolve(this.onPick(this.index)).then((r) => { this.busy = false; if (r !== undefined) this.close(r); });
    } else if (input.pressed('b') && !this.forced) { sfx('back'); this.close(-1); }
  }
}

// ---------------- TEAM ----------------
class PartyList extends ListScreen {
  itemsFn() { return G.party; }
  draw(g) {
    bg(g, '#58a088');
    G.party.forEach((m, i) => {
      const y = 3 + i * 22;
      const sel = i === this.index, swap = this.swapFrom === i;
      box(g, 4, y, 232, 21, sel ? 'red' : swap ? 'dark' : 'white');
      const bob = sel && (frame >> 3) % 2 ? -1 : 0;
      g.drawImage(creature(m.sp, 24), 8, y - 3 + bob);
      const dark = swap && !sel;
      text(g, name(m), 36, y + 5, dark ? '#fff' : '#383840', dark ? null : '#d0d0c8');
      text(g, 'Lv' + m.level, 108, y + 5, dark ? '#fff' : '#383840', dark ? null : '#d0d0c8');
      if (m.status) text(g, STATUS_NAMES[m.status], 134, y + 5, '#d05020');
      if (m.hp <= 0) text(g, 'FNT', 134, y + 5, '#c03030');
      hpBar(g, 158, y + 6, 70, m.hp / maxHp(m));
      text(g, `${m.hp}/${maxHp(m)}`, 228, y + 11, dark ? '#fff' : '#383840', null, FONT_SMALL, 'right');
      if (this.active && this.active.includes(m)) text(g, 'IN', 156, y + 11, '#3870d0', null, FONT_SMALL);
    });
    box(g, 4, 136, 232, 22);
    text(g, this.swapFrom != null ? 'Move to where?' : this.title || 'Choose a creature.', 12, 141);
  }
}

export async function partyScreen(o = {}) {
  if (!G.party.length) { await say('You don\'t have any creatures yet.'); return -1; }
  let start = 0;
  if (o.mode === 'battle') start = Math.max(0, G.party.findIndex((m) => m.hp > 0 && !(o.active || []).includes(m)));
  const w = new PartyList({ title: o.title, forced: o.forced, active: o.active, swapFrom: null, index: start });
  w.onPick = async (i) => {
    const m = G.party[i];
    if (w.swapFrom != null) {
      const j = w.swapFrom; w.swapFrom = null;
      if (i !== j) { [G.party[i], G.party[j]] = [G.party[j], G.party[i]]; sfx('select'); }
      return undefined;
    }
    if (o.mode === 'item' || o.mode === 'pick') return i;
    const opts = o.mode === 'battle' ? ['SHIFT', 'SUMMARY', 'CANCEL'] : ['SUMMARY', 'SWITCH', 'CANCEL'];
    const r = await menu({ items: opts, x: 150, y: 52, w: 86 });
    const pickd = opts[r];
    if (pickd === 'SUMMARY') { await summaryScreen(i); return undefined; }
    if (pickd === 'SWITCH') { w.swapFrom = i; return undefined; }
    if (pickd === 'SHIFT') {
      if (m.hp <= 0) { await say(`${name(m)} has no energy left to battle!`); return undefined; }
      if (o.active && o.active.includes(m)) { await say(`${name(m)} is already in battle!`); return undefined; }
      return i;
    }
    return undefined;
  };
  return open(w);
}

// ---------------- SUMMARY ----------------
class Summary {
  constructor(i) { this.i = i; }
  update() {
    if (input.pressed('b') || input.pressed('a')) { sfx('back'); this.close(); }
    if (input.repeat('down') || input.repeat('right')) { this.i = (this.i + 1) % G.party.length; sfx('move'); }
    if (input.repeat('up') || input.repeat('left')) { this.i = (this.i - 1 + G.party.length) % G.party.length; sfx('move'); }
  }
  draw(g) {
    const m = G.party[this.i];
    const S = SPECIES[m.sp], st = stats(m);
    bg(g, '#e8d8a8');
    box(g, 2, 2, 92, 92);
    drawCreature(g, m.sp, 64, 16, 2);
    text(g, name(m), 8, 66);
    text(g, 'Lv' + m.level, 88, 66, '#383840', '#d0d0c8', FONT, 'right');
    S.types.forEach((t, k) => typeTag(g, t, 8 + k * 40, 80));
    box(g, 96, 2, 142, 92);
    const rows = [['HP', `${m.hp}/${st.hp}`], ['ATTACK', st.atk], ['DEFENSE', st.def], ['SP. ATK', st.spa], ['SP. DEF', st.spd], ['SPEED', st.spe]];
    rows.forEach(([k, v], j) => { text(g, k, 104, 8 + j * 11, '#383840', '#d0d0c8', FONT_SMALL); text(g, String(v), 230, 8 + j * 11, '#383840', '#d0d0c8', FONT_SMALL, 'right'); });
    const lo = expForLevel(m.level), hi = expForLevel(m.level + 1);
    text(g, `EXP to next Lv: ${Math.max(0, hi - m.exp)}`, 104, 74, '#383840', '#d0d0c8', FONT_SMALL);
    bar(g, 104, 85, 126, (m.exp - lo) / (hi - lo));
    box(g, 2, 96, 236, 62);
    m.moves.forEach((mv, j) => {
      const M = MOVES[mv.id];
      const x = 8 + (j % 2) * 116, y = 102 + Math.floor(j / 2) * 26;
      g.fillStyle = TYPE_COLORS[M.type]; g.fillRect(x, y + 1, 4, 20);
      text(g, M.name, x + 8, y);
      text(g, `PP ${mv.pp}/${M.pp}  ${M.power ? 'PWR ' + M.power : 'STATUS'}`, x + 8, y + 12, '#606068', null, FONT_SMALL);
    });
  }
}
export function summaryScreen(i) { return open(new Summary(i)); }

// ---------------- BAG ----------------
class BagList extends ListScreen {
  itemsFn() { return Object.keys(G.bag).filter((k) => G.bag[k] > 0 && ITEMS[k] && (!this.battle || ITEMS[k].battle)).sort((a, b) => (ITEMS[a].key ? 1 : 0) - (ITEMS[b].key ? 1 : 0)); }
  draw(g) {
    bg(g, '#c88848');
    box(g, 4, 4, 232, 106);
    const items = this.itemsFn();
    if (!items.length) text(g, 'The bag is empty.', 16, 12);
    const top = Math.max(0, Math.min(this.index - 3, items.length - 6));
    items.slice(top, top + 6).forEach((k, j) => {
      const i = top + j;
      text(g, ITEMS[k].name, 22, 12 + j * 15);
      if (!ITEMS[k].key) text(g, 'x' + G.bag[k], 224, 12 + j * 15, '#383840', '#d0d0c8', FONT, 'right');
      if (i === this.index) cursor(g, 12, 13 + j * 15);
    });
    box(g, 4, 112, 232, 44);
    const k = items[this.index];
    if (k) wrap(g, ITEMS[k].desc, 210).forEach((ln, j) => text(g, ln, 12, 120 + j * 14));
    text(g, '$' + G.money, 228, 4 + 96, '#383840', '#d0d0c8', FONT_SMALL, 'right');
  }
}

export async function bagScreen(o = {}) {
  const w = new BagList({ battle: o.battle });
  w.onPick = async (i) => {
    const id = w.itemsFn()[i];
    if (!id) return undefined;
    if (o.battle) return id;
    const I = ITEMS[id];
    const r = await menu({ items: I.key ? ['USE', 'CANCEL'] : ['USE', 'TOSS', 'CANCEL'], x: 150, y: 50, w: 86 });
    if (I.key && r === 1) return undefined;
    if (r === 1) {
      if (await yesNo(`Throw away one ${I.name}?`)) { useItem(id); await say(`Threw away one ${I.name}.`); }
      return undefined;
    }
    if (r !== 0) return undefined;
    if (I.kind === 'orb') { await say('You can only use that in a battle with a wild creature.'); return undefined; }
    if (I.kind === 'map') { await townMapScreen(); return undefined; }
    if (I.kind === 'repel') { useItem(id); G.repel = I.steps; sfx('item'); await say(`${G.name} used a ${I.name}. Weaker wild creatures will stay away.`); return undefined; }
    if (I.kind === 'td') { await teachTD(I.move); return undefined; }
    const pi = await partyScreen({ mode: 'item', title: `Use ${I.name} on which creature?` });
    if (pi < 0) return undefined;
    const m = G.party[pi];
    if (I.kind === 'evo') {
      const e = SPECIES[m.sp].evo;
      if (!e || e.item !== id) { await say('It won\'t have any effect.'); return undefined; }
      useItem(id);
      await evolutionScene(m, e.to, true);
      return undefined;
    }
    await applyItem(id, m, false);
    if (I.kind === 'level') await checkEvolutions();
    return undefined;
  };
  const r = await open(w);
  return r === -1 ? null : r;
}

// ---------------- PC BOX ----------------
class BoxList extends ListScreen {
  itemsFn() { return G.boxes[G.region] || []; }
  draw(g) {
    bg(g, '#7090c0');
    box(g, 4, 4, 232, 22);
    text(g, `${regionName(G.region)} BOX  (${this.itemsFn().length})`, 12, 9);
    box(g, 4, 28, 140, 128);
    const list = this.itemsFn();
    if (!list.length) text(g, 'The box is empty.', 14, 36);
    const top = Math.max(0, Math.min(this.index - 3, list.length - 7));
    list.slice(top, top + 7).forEach((m, j) => {
      const i = top + j;
      text(g, `${name(m)}`, 22, 34 + j * 17);
      text(g, 'Lv' + m.level, 136, 34 + j * 17, '#383840', '#d0d0c8', FONT, 'right');
      if (i === this.index) cursor(g, 12, 35 + j * 17);
    });
    box(g, 146, 28, 90, 128);
    const m = list[this.index];
    if (m) {
      drawCreature(g, m.sp, 56, 163, 34);
      text(g, name(m), 191, 94, '#383840', '#d0d0c8', FONT, 'center');
      SPECIES[m.sp].types.forEach((t, k) => typeTag(g, t, 153 + k * 40, 110));
      text(g, `HP ${m.hp}/${maxHp(m)}`, 191, 126, '#383840', '#d0d0c8', FONT_SMALL, 'center');
    }
  }
}
export function regionName(id) { return { aldermoor: 'ALDERMOOR' }[id] || id.toUpperCase(); }

export async function pcScreen() {
  sfx('select');
  await say(`${G.name} booted up the PC.`, `Creatures you leave in the ${regionName(G.region)} box stay in this region. Only the team you carry travels with you.`);
  for (;;) {
    const r = await choose('What would you like to do?', ['WITHDRAW', 'DEPOSIT', 'SEE TEAM', 'LOG OFF'], { w: 100, x: 136 });
    if (r === 0) {
      const w = new BoxList({});
      w.onPick = async (i) => {
        const m = w.itemsFn()[i];
        if (G.party.length >= 6) { await say('Your team is full! Deposit a creature first.'); return undefined; }
        if (await yesNo(`Withdraw ${name(m)}?`)) { G.boxes[G.region].splice(i, 1); G.party.push(m); sfx('door'); await say(`${name(m)} joined your team!`); }
        return undefined;
      };
      await open(w);
    } else if (r === 1) {
      for (;;) {
        const i = await partyScreen({ mode: 'pick', title: 'Deposit which creature?' });
        if (i < 0) break;
        const m = G.party[i];
        if (G.party.length <= 1 || G.party.filter((x, k) => k !== i && x.hp > 0).length === 0) { await say('That\'s your last creature able to battle!'); continue; }
        if (await yesNo(`Deposit ${name(m)}?`)) {
          G.party.splice(i, 1);
          (G.boxes[G.region] = G.boxes[G.region] || []).push(m);
          sfx('door');
          await say(`${name(m)} was stored in the ${regionName(G.region)} box.`);
        }
      }
    } else if (r === 2) await partyScreen({});
    else break;
  }
  save();
}

// ---------------- DEX ----------------
class DexList extends ListScreen {
  itemsFn() { return SPECIES_LIST; }
  draw(g) {
    bg(g, '#c04848');
    box(g, 4, 4, 128, 152);
    const top = Math.max(0, Math.min(this.index - 4, SPECIES_LIST.length - 9));
    SPECIES_LIST.slice(top, top + 9).forEach((sp, j) => {
      const i = top + j;
      const seen = G.dex.seen[sp], caught = G.dex.caught[sp];
      text(g, String(SPECIES[sp].no).padStart(3, '0'), 20, 10 + j * 16, '#606068');
      text(g, seen ? SPECIES[sp].name : '-----', 44, 10 + j * 16);
      if (caught) { g.fillStyle = '#2aa89a'; g.fillRect(122, 13 + j * 16, 5, 3); g.fillStyle = '#f0e6c8'; g.fillRect(122, 16 + j * 16, 5, 2); g.fillStyle = '#e0b030'; g.fillRect(124, 15 + j * 16, 1, 2); }
      if (i === this.index) cursor(g, 10, 11 + j * 16);
    });
    box(g, 134, 4, 102, 152);
    const sp = SPECIES_LIST[this.index];
    if (G.dex.seen[sp]) drawCreature(g, sp, 56, 157, 12);
    else blit(g, silhouette(sp, 56, '#303040'), 157, 12, 56, 56);
    if (G.dex.seen[sp]) SPECIES[sp].types.forEach((t, k) => typeTag(g, t, 145 + k * 40, 72));
    const s = Object.keys(G.dex.seen).length, c = Object.keys(G.dex.caught).length;
    text(g, `SEEN ${s}`, 144, 90); text(g, `CAUGHT ${c}`, 144, 104);
    text(g, `of ${SPECIES_LIST.length}`, 144, 118, '#606068');
    text(g, 'A: entry', 144, 138, '#606068', null, FONT_SMALL);
  }
}
class DexEntry {
  constructor(sp) { this.sp = sp; }
  update() { if (input.pressed('a') || input.pressed('b')) { sfx('back'); this.close(); } }
  draw(g) {
    const S = SPECIES[this.sp];
    bg(g, '#c04848');
    box(g, 4, 4, 232, 152);
    drawCreature(g, this.sp, 64, 10, 8);
    text(g, `No.${String(S.no).padStart(3, '0')}  ${S.name}`, 78, 14, '#383840', '#d0d0c8', FONT_BIG);
    S.types.forEach((t, k) => typeTag(g, t, 78 + k * 40, 34));
    const evo = S.evo ? `Evolves into ${SPECIES[S.evo.to].name} ${S.evo.level ? 'at Lv. ' + S.evo.level : 'with a ' + ITEMS[S.evo.item].name}.` : '';
    if (evo) wrap(g, evo, 150, FONT_SMALL).forEach((l, j) => text(g, l, 78, 50 + j * 10, '#606068', null, FONT_SMALL));
    if (G.dex.caught[this.sp]) wrap(g, S.dex, 212).forEach((l, j) => text(g, l, 14, 76 + j * 14));
    else text(g, 'Catch one to learn more!', 14, 80, '#606068');
  }
}
export async function dexScreen() {
  const w = new DexList({});
  w.onPick = async (i) => { const sp = SPECIES_LIST[i]; if (G.dex.seen[sp]) await open(new DexEntry(sp)); return undefined; };
  await open(w);
}

// ---------------- SHOP ----------------
class ShopList extends ListScreen {
  itemsFn() { return this.stock; }
  draw(g) {
    const s = this.stock;
    box(g, 70, 4, 166, 106);
    const top = Math.max(0, Math.min(this.index - 3, s.length - 6));
    s.slice(top, top + 6).forEach((k, j) => {
      const i = top + j;
      text(g, ITEMS[k].name, 86, 12 + j * 15);
      text(g, '$' + (this.sell ? Math.floor(ITEMS[k].price / 2) : ITEMS[k].price), 228, 12 + j * 15, '#383840', '#d0d0c8', FONT, 'right');
      if (i === this.index) cursor(g, 76, 13 + j * 15);
    });
    box(g, 4, 4, 64, 24); text(g, '$' + G.money, 12, 10);
    box(g, 4, 112, 232, 44);
    const k = s[this.index];
    if (k) wrap(g, ITEMS[k].desc + (this.sell ? `  (You have ${G.bag[k] || 0})` : ''), 210).forEach((ln, j) => text(g, ln, 12, 120 + j * 14));
  }
}
export async function shopScreen(stock) {
  for (;;) {
    const r = await choose('Welcome! How may I help you?', ['BUY', 'SELL', 'QUIT'], { w: 70, x: 166 });
    if (r === 0) {
      const w = new ShopList({ stock });
      w.onPick = async (i) => {
        const id = stock[i], I = ITEMS[id];
        const max = Math.min(99, Math.floor(G.money / I.price));
        if (max < 1) { await say('You don\'t have enough money.'); return undefined; }
        const n = await open(new QtyPicker(max, I.price));
        if (!n) return undefined;
        if (await yesNo(`${I.name}, and you want ${n}. That will be $${n * I.price}. OK?`)) {
          G.money -= n * I.price; addItem(id, n); sfx('item');
          await say('Here you are! Thank you!');
          if (id === 'orb' && n >= 10) { addItem('greatorb', 1); await say('You also get a Great Orb as a bonus!'); }
        }
        return undefined;
      };
      await open(w);
    } else if (r === 1) {
      const sellable = () => Object.keys(G.bag).filter((k) => G.bag[k] > 0);
      if (!sellable().length) { await say('You have nothing to sell.'); continue; }
      const w = new ShopList({ stock: sellable(), sell: true });
      w.onPick = async (i) => {
        const id = w.stock[i], I = ITEMS[id];
        const n = await open(new QtyPicker(G.bag[id], Math.floor(I.price / 2)));
        if (!n) return undefined;
        if (await yesNo(`I can pay $${n * Math.floor(I.price / 2)}. Would that be OK?`)) {
          for (let k = 0; k < n; k++) useItem(id);
          G.money += n * Math.floor(I.price / 2); sfx('item');
          w.stock = sellable(); w.index = Math.min(w.index, w.stock.length - 1);
          if (!w.stock.length) return -1;
        }
        return undefined;
      };
      await open(w);
    } else { await say('Please come again!'); return; }
  }
}

// ---------------- STARTER PICK ----------------
const STARTERS = ['sproutmole', 'emberkit', 'puddlefin'];
class StarterPick {
  constructor() { this.i = 1; }
  update() {
    if (input.repeat('left')) { this.i = (this.i + 2) % 3; sfx('move'); }
    if (input.repeat('right')) { this.i = (this.i + 1) % 3; sfx('move'); }
    if (input.pressed('a')) { sfx('select'); this.close(this.i); }
  }
  draw(g) {
    bg(g, '#f0e8d0');
    text(g, 'Choose your partner!', W / 2, 6, '#383840', '#d0d0c8', FONT_BIG, 'center');
    STARTERS.forEach((sp, i) => {
      const x = 8 + i * 77, sel = i === this.i;
      box(g, x, 26, 72, 84, sel ? 'red' : 'white');
      const bob = sel ? Math.round(Math.sin(frame / 8) * 2) : 0;
      drawCreature(g, sp, 56, x + 8, 32 + bob);
      text(g, SPECIES[sp].name, x + 36, 88, '#383840', '#d0d0c8', FONT_SMALL, 'center');
      typeTag(g, SPECIES[sp].types[0], x + 18, 98);
    });
    box(g, 0, 112, W, 48);
    const S = SPECIES[STARTERS[this.i]];
    wrap(g, S.dex, 220).slice(0, 2).forEach((l, j) => text(g, l, 10, 120 + j * 15));
  }
}
export async function starterScreen() {
  for (;;) {
    const i = await open(new StarterPick());
    const sp = STARTERS[i];
    if (await yesNo(`So, you want ${SPECIES[sp].name}, the ${SPECIES[sp].types[0]}-type creature?`)) return sp;
  }
}

// ---------------- TRAINER CARD ----------------
class Card {
  update() { if (input.pressed('a') || input.pressed('b')) { sfx('back'); this.close(); } }
  draw(g) {
    bg(g, '#3870c0');
    box(g, 10, 14, 220, 132);
    text(g, 'TRAINER CARD', 20, 22, '#383840', '#d0d0c8', FONT_BIG);
    g.drawImage(trainerPortrait('player', 'ready'), 170, 30, 56, 76);
    const t = Math.floor(G.time);
    const rows = [['NAME', G.name], ['MONEY', '$' + G.money], ['DEX', `${Object.keys(G.dex.caught).length} caught`], ['TIME', `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}`], ['REGION', regionName(G.region)]];
    rows.forEach(([k, v], j) => { text(g, k, 22, 44 + j * 15, '#606068'); text(g, String(v), 84, 44 + j * 15); });
    text(g, 'BADGES', 22, 124, '#606068');
    BADGES.forEach(([b, , c], j) => {
      const x = 84 + j * 17;
      g.fillStyle = G.badges.includes(b) ? c : '#c8c8d0';
      g.beginPath(); g.moveTo(x + 6, 122); g.lineTo(x + 12, 128); g.lineTo(x + 6, 134); g.lineTo(x, 128); g.closePath(); g.fill();
    });
  }
}
export function trainerCard() { return open(new Card()); }

// ---------------- OPTIONS ----------------
export async function optionsScreen() {
  let idx = 0;
  for (;;) {
    const items = [
      { label: 'TEXT', right: ['SLOW', 'MID', 'FAST'][settings.textSpeed] },
      { label: 'MUSIC', right: settings.music ? 'ON' : 'OFF' },
      { label: 'SOUND', right: settings.sfx ? 'ON' : 'OFF' },
      { label: 'EXPORT SAVE' },
      { label: 'IMPORT SAVE' },
      { label: 'BACK' },
    ];
    const r = await menu({ items, x: 60, y: 10, w: 176, index: idx });
    if (r < 0 || r === 5) { saveSettings(); return; }
    idx = r;
    if (r === 0) settings.textSpeed = (settings.textSpeed + 1) % 3;
    if (r === 1) { settings.music = !settings.music; applyVolumes(); }
    if (r === 2) { settings.sfx = !settings.sfx; applyVolumes(); }
    if (r === 3) { exportSave(); await say('Your save file was downloaded!', 'Keep it somewhere safe. You can load it on any device with IMPORT SAVE.'); }
    if (r === 4) {
      if (!(await yesNo('Load a save file? Your current progress will be replaced.'))) continue;
      const ok = await importSaveFile();
      if (ok) { await say('Save loaded! Restarting...'); location.reload(); return; }
      if (ok === false) await say('That file isn\'t a Wildbound save.');
    }
    saveSettings();
  }
}

// ---------------- TITLE ----------------
class Title {
  constructor(items) { this.menu = new Menu({ items, x: 70, y: 96, w: 100, cancel: false }); this.t = 0; }
  update() { this.t++; const r = this.menu.handle(); if (r !== undefined) this.close(r); }
  draw(g) {
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#203060'); grd.addColorStop(1, '#58a0d0');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) { g.fillStyle = '#ffffff' + ((i * 37) % 2 ? '88' : '44'); g.fillRect((i * 53) % W, (i * 29) % 60, 1, 1); }
    g.fillStyle = '#3a8a3a'; g.fillRect(0, 128, W, 32);
    g.fillStyle = '#58b848'; for (let x = 0; x < W; x += 8) g.fillRect(x, 126 + ((x / 8) % 2), 6, 3);
    text(g, 'WILDBOUND', W / 2, 14, '#f8d030', '#803010', '600 28px Pixelify, monospace', 'center');
    text(g, 'A creature journey across regions', W / 2, 46, '#f8f8f8', '#203060', FONT_SMALL, 'center');
    const sp = SPECIES_LIST[Math.floor(this.t / 150) % SPECIES_LIST.length];
    drawCreature(g, sp, 56, 176, 74 + Math.round(Math.sin(this.t / 15) * 2));
    g.drawImage(person('player', 'down', 0), 20, 82, 40, 48);
    this.menu.draw(g);
    text(g, 'v1.11', 236, 150, '#ffffffcc', null, FONT_SMALL, 'right');
  }
}
export function titleScreen(items) { return open(new Title(items)); }

// ---------------- EVOLUTION ----------------
class EvoScene {
  constructor(from, to) { this.from = from; this.to = to; this.phase = 0; this.t = 0; this.showNew = false; this.done = false; }
  update() { }
  draw(g) {
    bg(g, '#101828');
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2 + this.t / 30; g.fillStyle = '#f8f0a0'; g.fillRect(W / 2 + Math.cos(a) * (40 + (this.t % 40)), 56 + Math.sin(a) * (30 + (this.t % 30)), 2, 2); }
    const sp = this.showNew ? this.to : this.from;
    const img = this.phase === 1 ? silhouette(sp, 56, '#f8f8f8') : creature(sp, 56);
    blit(g, img, W / 2 - 28, 28, 56, 56);
  }
}
export async function evolutionScene(m, to, fromItem = false) {
  const scene = new EvoScene(m.sp, to);
  const p = open(scene);
  playMusic('indoor');
  const oldName = name(m);
  await say(`What? ${oldName} is evolving!`);
  scene.phase = 1;
  sfx('evolve');
  let cancelled = false;
  for (let k = 0; k < 14; k++) {
    const dur = Math.max(4, 30 - k * 2);
    for (let i = 0; i < dur; i++) {
      scene.t++;
      if (!fromItem && input.held('b')) cancelled = true;
      await wait(1);
    }
    if (cancelled) break;
    scene.showNew = !scene.showNew;
  }
  if (cancelled) {
    scene.showNew = false; scene.phase = 0;
    await say(`Huh? ${oldName} stopped evolving!`);
    scene.close();
    await p;
    return false;
  }
  scene.showNew = true;
  fx.flash = 1; fx.flashColor = '#fff';
  await wait(20);
  scene.phase = 0;
  evolve(m, to);
  G.dex.seen[to] = true; G.dex.caught[to] = true;
  sfx('badge');
  await say(`Congratulations! Your ${oldName} evolved into ${SPECIES[to].name}!`);
  for (const mv of movesAt(to, m.level)) await learnMove(m, mv);
  scene.close();
  await p;
  save();
  return true;
}

// After battles: evolve anything that leveled past its evolution level.
export async function checkEvolutions() {
  for (const m of G.party) {
    if (m.hp <= 0) continue;
    const to = canEvolveByLevel(m);
    if (to && !m.noEvo) {
      const ok = await evolutionScene(m, to);
      if (!ok) m.noEvo = m.level; // ask again next level
    } else if (m.noEvo && m.level > m.noEvo) delete m.noEvo;
  }
}

// ---------------- START MENU ----------------
export async function startMenu(hooks) {
  let idx = 0;
  for (;;) {
    const items = [];
    if (G.flags.gotDex) items.push('DEX');
    if (G.party.length) items.push('TEAM');
    items.push('BAG');
    if (G.bag.townmap) items.push('MAP');
    if (soarUser()) items.push('SOAR');
    items.push(G.name.toUpperCase(), 'SAVE', 'OPTIONS', 'EXIT');
    sfx('select');
    const r = await menu({ items, x: 164, y: 2, w: 74, index: Math.min(idx, items.length - 1), lineH: 13 });
    if (r < 0 || items[r] === 'EXIT') return;
    idx = r;
    const k = items[r];
    if (k === 'DEX') await dexScreen();
    if (k === 'TEAM') await partyScreen({});
    if (k === 'BAG') await bagScreen({});
    if (k === 'MAP') await townMapScreen();
    if (k === 'SOAR') { if (await soar()) return; }
    if (k === G.name.toUpperCase()) await trainerCard();
    if (k === 'SAVE') {
      const ok = save();
      sfx('save');
      await say(ok ? `${G.name} saved the game! (It also autosaves as you play.)` : 'Couldn\'t save to this browser. Use OPTIONS > EXPORT SAVE to download your progress.');
    }
    if (k === 'OPTIONS') await optionsScreen();
    if (hooks && hooks.after) await hooks.after();
  }
}

// ---------------- TRAIL DISCS (field moves) ----------------
async function teachTD(move) {
  const label = MOVES[move].name;
  const i = await partyScreen({ mode: 'pick', title: `Teach ${label} to which creature?` });
  if (i < 0) return;
  const m = G.party[i];
  if (m.moves.some((x) => x.id === move)) { await say(`${name(m)} already knows ${label}.`); return; }
  if (!canLearnField(m.sp, move)) { await say(`${name(m)} can't learn ${label}.`); return; }
  await learnMove(m, move);
}

// ---------------- SOAR ----------------
function soarUser() {
  if (G.badges.length < FIELD.soar.badges) return null;
  return G.party.find((m) => m.moves.some((mv) => mv.id === 'soar')) || null;
}
async function soar() {
  const towns = Object.keys(G.visited || {}).filter((t) => MAPS[t] && MAPS[t].fly);
  if (!towns.length) { await say('There\'s nowhere to fly to yet.'); return false; }
  const r = await menu({ items: towns.map((t) => MAPS[t].name), x: 110, y: 4, w: 126, lineH: 13 });
  if (r < 0) return false;
  const u = soarUser();
  await say(`${name(u)} used Soar!`);
  const f = MAPS[towns[r]].fly;
  const { warp } = await import('./world.js');
  await warp(towns[r], f.x, f.y, f.dir);
  return true;
}

// ---------------- TOWN MAP ----------------
class TownMap {
  constructor() {
    const ids = Object.keys(LAYOUT).filter((id) => LAYOUT[id][2] === 'town');
    this.ids = ids;
    const here = this.hereId();
    this.i = Math.max(0, ids.indexOf(here));
  }
  hereId() {
    let id = G.pos.map;
    const m = MAPS[id];
    if (m && m.interior && m.exitTo) id = m.exitTo.map;
    if (!LAYOUT[id]) { for (const k of Object.keys(LAYOUT)) if (id.startsWith(k) || id.endsWith(k)) return k; }
    return id;
  }
  update() {
    if (input.repeat('right') || input.repeat('down')) { this.i = (this.i + 1) % this.ids.length; sfx('move'); }
    if (input.repeat('left') || input.repeat('up')) { this.i = (this.i - 1 + this.ids.length) % this.ids.length; sfx('move'); }
    if (input.pressed('b') || input.pressed('a') || input.pressed('select')) { sfx('back'); this.close(); }
  }
  draw(g) {
    const CX = (x) => 14 + x * 7.6, CY = (y) => 14 + y * 6.6;
    g.fillStyle = '#3870b8'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#4880c8'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 1);
    // land mass
    g.fillStyle = '#88c070';
    g.fillRect(CX(1), CY(10), CX(10) - CX(1), CY(19.5) - CY(10));
    g.fillRect(CX(7), CY(1.5), CX(17) - CX(7), CY(13.5) - CY(1.5));
    g.fillRect(CX(13.5), CY(9.5), CX(27) - CX(13.5), CY(13) - CY(9.5));
    g.fillRect(CX(19), CY(-1), CX(27) - CX(19), CY(13) - CY(-1));
    g.fillStyle = '#c8b890'; g.fillRect(CX(19), CY(3.5), CX(27) - CX(19), CY(6.5) - CY(3.5));
    g.fillStyle = '#e8f0f8'; g.fillRect(CX(22.5), CY(-1), CX(27) - CX(22.5), CY(6.5) - CY(-1));
    // routes
    for (const [id, L] of Object.entries(LAYOUT)) {
      if (L[2] === 'route' || L[2] === 'sea') {
        g.strokeStyle = L[2] === 'sea' ? '#a0d0f8' : '#f0d890'; g.lineWidth = 3;
        if (L[2] === 'sea') g.setLineDash([3, 3]);
        g.beginPath(); g.moveTo(CX(L[3]), CY(L[4])); g.lineTo(CX(L[5]), CY(L[6])); g.stroke(); g.setLineDash([]);
      }
    }
    const here = this.hereId();
    for (const [id, L] of Object.entries(LAYOUT)) {
      const x = CX(L[0]), y = CY(L[1]);
      if (L[2] === 'town') {
        const seen = G.visited && G.visited[id];
        g.fillStyle = '#202838'; g.fillRect(x - 4, y - 4, 9, 9);
        g.fillStyle = seen ? '#e84838' : '#a0a0a8'; g.fillRect(x - 3, y - 3, 7, 7);
      } else if (L[2] === 'cave' || L[2] === 'forest') {
        g.fillStyle = L[2] === 'forest' ? '#2f7a2a' : '#6a5440'; g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill();
      }
      if (id === here && (frame >> 4) % 2) { g.fillStyle = '#f8e040'; g.beginPath(); g.arc(x, y - 1, 4, 0, 7); g.fill(); g.fillStyle = '#e04030'; g.fillRect(x - 1, y - 2, 3, 3); }
    }
    const sel = this.ids[this.i];
    const L = LAYOUT[sel];
    g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.strokeRect(CX(L[0]) - 6.5, CY(L[1]) - 6.5, 13, 13);
    box(g, 4, 128, 232, 30);
    const seen = G.visited && G.visited[sel];
    const hereName = MAPS[here] ? MAPS[here].name : '';
    text(g, seen ? MAPS[sel].name : '???', 12, 133);
    text(g, `You are in: ${hereName}`, 12, 145, '#606068', null, FONT_SMALL);
    text(g, 'ALDERMOOR', 230, 133, '#3870b8', null, FONT_SMALL, 'right');
  }
}
export function townMapScreen() { return open(new TownMap()); }

// ---------------- PARTNERS (who travels to the next region) ----------------
export async function partnerScreen() {
  const chosen = [];
  for (;;) {
    const i = await partyScreen({ mode: 'pick', title: chosen.length ? `Pick a 2nd partner (B = done).` : 'Pick your traveling partner.' });
    if (i < 0) break;
    const m = G.party[i];
    if (chosen.includes(m)) { chosen.splice(chosen.indexOf(m), 1); await say(`${name(m)} will stay behind.`); continue; }
    chosen.push(m);
    await say(`${name(m)} will travel with you!`);
    if (chosen.length >= 2) break;
  }
  if (!chosen.length) return null;
  if (!(await yesNo(`Travel with ${chosen.map(name).join(' and ')}? Everyone else stays in Aldermoor with Professor Maple.`))) return null;
  return chosen;
}
