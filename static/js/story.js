// Story scripts, trainers, rivals (Kai & Juno) and the villain duo Team Eclipse.
import { wait, fadeOut, fadeIn, fx, setScene } from './engine.js';
import { world, warp, walk, spawn, despawn, npcById, refreshNpcs, faceEachOther, showEmote, pathTo, blocked, opposite, stepActor } from './world.js';
import { G, flag, setFlag, save, addItem, addToCollection } from './state.js';
import { SPECIES } from './data.js';
import { makeMon, healFull, name } from './mon.js';
import { say, yesNo, choose } from './ui.js';
import { battle } from './battle.js';
import { starterScreen, shopScreen, pcScreen, startMenu, checkEvolutions, partyScreen } from './screens.js';
import { sfx, playMusic } from './audio.js';

// ---------- trainers ----------
// party entries: [species, level]
const TRAINERS = {
  leo: { name: 'Bug Kid Leo', look: 'bugkid', party: [['twigling', 4], ['twigling', 5]], money: 15, intro: 'Hey! My bug creatures are the toughest around!', lose: 'Aww, my bugs got squashed!', after: 'I need to train my bugs more...' },
  mia: { name: 'Lass Mia', look: 'lass', party: [['bunnip', 5], ['gustling', 5]], money: 18, intro: 'You looked at me! That means we have to battle!', lose: 'Mean! You didn\'t go easy at all!', after: 'My Bunnip is so fluffy, though.' },
  dale: { name: 'Hiker Dale', look: 'hiker', party: [['pebbit', 9], ['dunepup', 10]], money: 30, intro: 'Ho! These hills made my creatures rock-solid!', lose: 'Ho ho! You crumbled my defense!', after: 'Rock types hate Water and Grass moves.' },
  ana: { name: 'Bird Keeper Ana', look: 'birdkeeper', party: [['gustling', 10], ['gustling', 11]], money: 25, intro: 'My birds ride the sea breeze. Can you keep up?', lose: 'Grounded...', after: 'Electric moves are great against birds.' },
  rocco: { name: 'Hiker Rocco', look: 'hiker', party: [['pebbit', 9], ['pebbit', 10]], money: 30, intro: 'You want Shale? Get past me first!', lose: 'You\'ve got real grit!', after: 'Shale\'s creatures have sky-high Defense. Special moves like Water Jet hit harder.' },
  shale: { name: 'Leader Shale', look: 'shale', party: [['pebbit', 11], ['pebbit', 13]], money: 100, potions: 1, music: 'boss', intro: '', lose: 'Your bond with your creatures is stronger than stone. I\'m impressed!', after: '' },
  corvo1: { name: 'Eclipse Corvo', look: 'corvo', party: [['twigling', 4], ['bunnip', 5]], money: 20, lose: 'No way! Beaten by a rookie!' },
  nyx2: { name: 'Eclipse Nyx', look: 'nyx', party: [['dunepup', 11], ['gustling', 10]], money: 25, lose: 'This can\'t be happening!' },
  corvo2: { name: 'Eclipse Corvo', look: 'corvo', party: [['pebbit', 11], ['twigling', 10]], money: 25, lose: 'Not again!' },
};

const BEATS = { sproutmole: 'puddlefin', emberkit: 'sproutmole', puddlefin: 'emberkit' };
const COUNTER = { sproutmole: 'emberkit', emberkit: 'puddlefin', puddlefin: 'sproutmole' };
const evoOf = (sp) => SPECIES[sp].evo && SPECIES[sp].evo.to;

function rivalTrainer(who, lvl, extra) {
  const sp = G.rivals[who];
  const party = [];
  if (extra) party.push(...extra);
  party.push([lvl >= 16 && evoOf(sp) ? evoOf(sp) : sp, lvl]);
  return { name: who === 'kai' ? 'Kai' : 'Juno', look: who, party, money: 35, music: 'boss' };
}

function build(t) {
  return { ...t, party: t.party.map(([sp, l]) => makeMon(sp, l, { ot: t.name })) };
}

// ---------- shared helpers ----------
async function whiteout() {
  await fadeOut(20);
  G.party.forEach(healFull);
  G.money = Math.floor(G.money / 2);
  const h = G.lastHeal;
  const { loadMap } = await import('./world.js');
  loadMap(h.map, h.x, h.y, h.dir);
  save();
  await wait(10);
  await fadeIn(20);
  await say(`${G.name} hurried back to safety and healed up. Half the money was lost in the scramble...`);
}

async function afterBattle(result) {
  playMusic(world.map.music);
  if (result === 'lose') { await whiteout(); return; }
  await checkEvolutions();
  playMusic(world.map.music);
  save();
}

// fights a trainer (or two); returns true on win
async function fight(trainers, o = {}) {
  const list = (Array.isArray(trainers) ? trainers : [trainers]).map(build);
  const r = await battle({ trainers: list, double: o.double, canLose: o.canLose, music: list[0].music || 'boss' });
  if (o.canLose && r === 'lose') {
    playMusic(world.map.music);
    G.party.forEach(healFull);
    return false;
  }
  await afterBattle(r);
  return r === 'win';
}

function freeNear(p) {
  for (const d of ['up', 'left', 'right', 'down']) {
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d];
    if (!blocked(p.x + dx, p.y + dy)) return { x: p.x + dx, y: p.y + dy, d };
  }
  return { x: p.x, y: p.y - 1, d: 'up' };
}

async function appear(id, look) {
  const p = world.player;
  const s = freeNear(p);
  const n = spawn({ id, look, x: s.x, y: s.y, dir: opposite[s.d] });
  sfx('door');
  fx.flash = 0.6; fx.flashColor = '#fff';
  p.dir = s.d;
  await wait(10);
  return n;
}

async function leave(n, dirs) {
  await walk(n, dirs, 2);
  despawn(n.id);
}

// ---------- intro ----------
export async function newGameIntro(askName) {
  const scene = { draw(g) {
    g.fillStyle = '#101828'; g.fillRect(0, 0, 240, 160);
    if (scene.show) { g.imageSmoothingEnabled = false; g.drawImage(scene.portrait, 96, 12, 48, 72); }
    if (scene.mon) g.drawImage(scene.mon, 150, 40);
  } };
  const art = await import('./art.js');
  scene.portrait = art.trainerPortrait('maple');
  setScene(scene);
  playMusic('indoor');
  await fadeIn(20);
  scene.show = true;
  await say('Hello there! Welcome to the world of WILDBOUND!', 'My name is Maple. People call me the Creature Professor.');
  scene.mon = art.creature('bunnip', 56);
  sfx('door');
  await say('This world is full of creatures! They live in fields, forests, oceans and skies, in every region you can imagine.', 'Trainers travel from region to region with their creatures, starting fresh every time they arrive somewhere new.');
  scene.mon = null;
  await say('Now, tell me. What is your name?');
  G.name = await askName('Your name?', 'TOM');
  await say(`Right! So your name is ${G.name}!`, 'Your two friends from next door, Kai and Juno, have been waiting for this day too.', `${G.name}! Your very own journey is about to begin! A world of creatures awaits!`);
  await fadeOut(20);
}

// ---------- triggers ----------
const TRIGGERS = {
  async needStarter() {
    if (flag('gotStarter')) return false;
    const p = world.player;
    await showEmote(p, '!');
    await say('???: Hey! Wait! Don\'t go out there!');
    const maple = spawn({ id: 'tmp_maple', look: 'maple', x: p.x, y: p.y + 3, dir: 'up' });
    await walk(maple, ['up', 'up'], 1);
    await say(`MAPLE: That was close, ${G.name}! Wild creatures live in the tall grass.`, 'You need your own creature to protect you. Come with me to my lab!');
    despawn('tmp_maple');
    setFlag('labRivals');
    await warp('lab', 5, 6, 'up');
    refreshNpcs();
    await starterSequence();
    return true;
  },

  async eclipse1() {
    if (flag('eclipse1') || !flag('gotStarter')) return false;
    const p = world.player;
    await say('???: Hold it right there, kid!');
    const nyx = await appear('ec_nyx', 'nyx');
    const corvoSpot = freeNear(p);
    const corvo = spawn({ id: 'ec_corvo', look: 'corvo', x: corvoSpot.x, y: corvoSpot.y, dir: opposite[corvoSpot.d] });
    playMusic('boss');
    await say('NYX: When daylight fades and stars descend...', 'CORVO: ...the shadow falls, the dark ascends!', 'NYX: Nyx!', 'CORVO: Corvo!', 'BOTH: Team Eclipse! We cover every region in shadow!', `CORVO: That creature of yours looks valuable. Hand it over!`);
    p.dir = corvoSpot.d;
    const won = await fight(TRAINERS.corvo1);
    if (!won) { despawn('ec_nyx'); despawn('ec_corvo'); return true; }
    await say('CORVO: Nyx! The kid beat me!', 'NYX: Ugh! This isn\'t over. We\'ll get the rare creatures of Aldermoor with or without your partner!', 'BOTH: Team Eclipse is retreating... for now!');
    setFlag('eclipse1');
    fx.flash = 1; fx.flashColor = '#fff'; sfx('door');
    despawn(nyx.id); despawn(corvo.id);
    playMusic(world.map.music);
    return true;
  },

  async junoRoute1() {
    if (flag('junoR1') || !flag('gotStarter')) return false;
    await say(`???: ${G.name}! Wait up!`);
    const j = await appear('tmp_juno', 'juno');
    await say(`JUNO: I've been training out here the whole time! Let's see whose ${SPECIES[G.rivals.juno].name}... I mean, whose team is stronger!`);
    const won = await fight(rivalTrainer('juno', 7, [['gustling', 5]]));
    if (won) await say('JUNO: Wow, you\'re really good! Kai is going to be so mad.');
    await say('JUNO: Pebbleton is just ahead. There\'s a Gym there! I\'m going to go train some more. See you!');
    setFlag('junoR1');
    await leave(j, ['up', 'up']);
    return true;
  },

  async eclipse2() {
    if (flag('eclipse2')) return false;
    const nyx = npcById('nyx2'), corvo = npcById('corvo2');
    await showEmote(nyx, '!');
    playMusic('boss');
    await say('NYX: You again?! We\'re busy catching the rare creatures hiding in Hollow Grove!', 'CORVO: Kai and Juno\'s starters live wild in there. Rare ones fetch a fortune!', 'NYX: Corvo, let\'s team up and crush this pest!');
    const alive = G.party.filter((m) => m.hp > 0).length;
    if (alive < 2) await say('CORVO: Only one creature? Then we\'ll take turns beating you!');
    world.player.dir = 'right';
    const won = await fight([TRAINERS.nyx2, TRAINERS.corvo2], { double: true });
    if (!won) return true;
    await say('NYX: How?! Even together...', 'CORVO: Team Eclipse will be back! Every region you go to, we\'ll be there!', 'BOTH: Team Eclipse is retreating... AGAIN!');
    setFlag('eclipse2');
    fx.flash = 1; fx.flashColor = '#fff'; sfx('door');
    if (nyx) despawn(nyx.id); if (corvo) despawn(corvo.id);
    refreshNpcs();
    playMusic(world.map.music);
    return true;
  },

  async tagBattle() {
    if (!G.badges.includes('stone') || flag('tagDone')) return false;
    const p = world.player;
    await say(`KAI: ${G.name}! Leaving for another region without saying goodbye?`);
    const kai = spawn({ id: 'tmp_kai', look: 'kai', x: 12, y: 4, dir: 'up' });
    const juno = spawn({ id: 'tmp_juno', look: 'juno', x: 13, y: 4, dir: 'up' });
    await Promise.all([walk(kai, ['up'], 1), walk(juno, ['up'], 1)]);
    p.dir = 'down';
    await say('JUNO: We heard you beat Shale! Before you go anywhere, one more battle!', 'KAI: And this time, Juno and I are teaming up against you. Two on two!');
    const alive = G.party.filter((m) => m.hp > 0).length;
    if (alive < 2) {
      await say('KAI: Wait, you only have one creature ready to fight? That\'s no fun.', 'JUNO: Catch another creature or heal up, then come back!');
      await Promise.all([leave(kai, ['down', 'down']), leave(juno, ['down', 'down'])]);
      return true;
    }
    const won = await fight([rivalTrainer('kai', 14, [['gustling', 12]]), rivalTrainer('juno', 14, [['bunnip', 12]])], { double: true });
    if (!won) { despawn('tmp_kai'); despawn('tmp_juno'); return true; }
    await say('KAI: Even two against one... You\'re unbelievable.', 'JUNO: The ferry to the next region isn\'t running yet. When it is, we\'ll all go together!', 'KAI: Remember, in a new region you start over. You can only bring a partner or two. The rest wait in your Aldermoor box until you come back.', 'JUNO: See you on the next adventure!');
    setFlag('tagDone');
    await Promise.all([leave(kai, ['down', 'down', 'down']), leave(juno, ['down', 'down', 'down'])]);
    return true;
  },
};

// ---------- talk scripts ----------
async function starterSequence() {
  const kai = npcById('lab_kai'), juno = npcById('lab_juno');
  await say('KAI: Finally! The professor wouldn\'t let us pick until you showed up.', 'JUNO: Hi! We waited for you!');
  await say(`MAPLE: These three creatures are looking for partners. ${G.name}, you may choose first.`, 'Sproutmole, the Grass type. Emberkit, the Fire type. Puddlefin, the Water type.');
  const sp = await starterScreen();
  const m = makeMon(sp, 5, { ot: G.name });
  addToCollection(m);
  G.starter = sp;
  sfx('badge');
  await say(`${G.name} received ${SPECIES[sp].name}!`);
  G.rivals.kai = COUNTER[sp];
  G.rivals.juno = Object.keys(BEATS).find((x) => x !== sp && x !== COUNTER[sp]);
  await say(`KAI: Then I'll take ${SPECIES[G.rivals.kai].name}! It has the type advantage!`, `JUNO: That leaves ${SPECIES[G.rivals.juno].name} for me. Hi there, little buddy!`);
  await say('MAPLE: Don\'t worry about the other two. Every creature in Aldermoor lives somewhere in the wild, even these three.', 'Explore well and you can catch them all!');
  setFlag('gotDex');
  addItem('orb', 5);
  sfx('item');
  await say(`${G.name} received the DEX and 5 Capture Orbs!`, 'MAPLE: The DEX records every creature you see and catch. Open it from the START menu.');
  await say(`KAI: ${G.name}! Let's see what our creatures can do!`);
  const won = await fight(rivalTrainer('kai', 5), { canLose: true });
  await say(won ? 'KAI: What?! I picked the one with the advantage! I\'ll train harder, just watch!' : 'KAI: Ha! Told you I\'d win! ...Don\'t worry, I\'ll heal yours up.');
  G.party.forEach(healFull);
  await say('KAI: I\'m heading to Pebbleton! Juno, you\'re next!', 'JUNO: I\'ll be training on Route 1. Bye!');
  setFlag('gotStarter');
  if (kai) await leave(kai, ['down', 'down', 'down', 'down', 'right', 'right', 'down']);
  if (juno) await leave(juno, ['down', 'down', 'down', 'down', 'left', 'left', 'down']);
  setFlag('labRivals', false);
  refreshNpcs();
  await say('MAPLE: Route 1 is north of town. Your mom can heal your creatures at home, and Pebbleton has a Healing Center.', 'Good luck out there!');
  save();
}

async function heal(where) {
  await fadeOut(10);
  G.party.forEach(healFull);
  sfx('heal');
  await wait(70);
  await fadeIn(10);
  G.lastHeal = where;
  save();
}

const SCRIPTS = {
  async mom() {
    if (!flag('gotStarter')) {
      await say(`MOM: Good morning, ${G.name}! Professor Maple was looking for you.`, 'Her lab is the big building south-east of here. Kai and Juno already went!');
      return;
    }
    await say(`MOM: ${G.name}! You look tired. Take a quick rest.`);
    await heal({ map: 'house_player', x: 5, y: 5, dir: 'up' });
    await say('MOM: There! Your creatures are full of energy again. Be careful out there!');
  },
  async nurse() {
    if (!G.party.length) { await say('NURSE: Welcome to the Healing Center! Once you have creatures, I can heal them for you.'); return; }
    if (await yesNo('NURSE: Welcome to the Healing Center! We restore tired creatures to full health. Shall I heal your creatures?')) {
      await say('OK, I\'ll take your creatures for a few seconds.');
      await heal({ map: 'center_peb', x: 5, y: 4, dir: 'up' });
      await say('Thank you for waiting. Your creatures are fighting fit! We hope to see you again!');
    } else await say('We hope to see you again!');
  },
  async mart() {
    const stock = ['orb', 'potion', 'fullheal'];
    if (G.badges.includes('stone')) stock.push('greatorb', 'superpotion', 'revive', 'sparkstone');
    await shopScreen(stock);
  },
  async maple() {
    if (!flag('gotStarter')) return;
    const c = Object.keys(G.dex.caught).length;
    await say(`MAPLE: How is your DEX coming along? You've caught ${c} of 18 kinds of creatures in Aldermoor.`);
    if (c >= 6 && !flag('mapleGift')) {
      setFlag('mapleGift'); addItem('greatorb', 5); sfx('item');
      await say('Wonderful progress! Take these Great Orbs. They catch creatures more easily.');
    } else if (c >= 18) await say('You caught every creature in Aldermoor! You are a true creature expert!');
    else await say('Remember, some creatures only evolve with special items, like the Spark Stone.');
  },
  async shale(n) {
    if (G.badges.includes('stone')) { await say('SHALE: A creature that travels with you through many regions grows stronger each time. Treasure your partners.'); return; }
    await say(`SHALE: So you're ${G.name}. I am Shale, Leader of the Pebbleton Gym.`, 'My creatures are as hard as the cliffs of this coast. Let\'s see if you can crack them!');
    const won = await fight(TRAINERS.shale);
    if (!won) return;
    G.badges.push('stone');
    sfx('badge');
    await say(`${G.name} received the STONE BADGE from Shale!`, 'SHALE: That badge lets you board the ferries at the harbor.', 'Here, take these too.');
    addItem('revive', 2); addItem('superpotion', 3); sfx('item');
    await say(`${G.name} received 2 Revives and 3 Super Potions!`, 'SHALE: The Mart sells better items for badge holders now.');
  },
  async trader() {
    if (flag('tradeDone')) { await say('WALTER: How\'s Rusty doing? I hope you two are getting along!'); return; }
    if (!(await yesNo('WALTER: I\'m looking for a Bunnip. Would you trade one for my Dunepup, Rusty?'))) { await say('WALTER: Oh, that\'s a shame.'); return; }
    const i = await partyScreen({ mode: 'pick', title: 'Trade which creature?' });
    if (i < 0) { await say('WALTER: Oh, that\'s a shame.'); return; }
    const m = G.party[i];
    if (m.sp !== 'bunnip') { await say(`WALTER: Hmm, that's not a Bunnip. I'm looking for a Bunnip.`); return; }
    if (G.party.length === 1) { await say('WALTER: That\'s your only creature! I couldn\'t take it.'); return; }
    const rusty = makeMon('dunepup', m.level, { nick: 'Rusty', ot: 'Walter' });
    G.party[i] = rusty;
    G.dex.seen.dunepup = true; G.dex.caught.dunepup = true;
    sfx('evolve');
    await say(`${G.name} traded ${name(m)} for Rusty!`, 'WALTER: Thank you! Rusty loves digging. Take good care of him!');
    setFlag('tradeDone');
  },
  async sailor() {
    if (!G.badges.includes('stone')) { await say('SAILOR: Ferries to other regions leave from this dock.', 'Only trainers with a Gym badge may board, though.'); return; }
    await say('SAILOR: A badge! You can board when the ferry is fixed up.', 'When you travel, only your team of up to six comes with you. Everything in your PC box stays here in Aldermoor until you return.', 'SAILOR: The next region opens in a future update!');
  },
};

// ---------- hooks for world.js ----------
world.hooks = {
  async trigger(id) { return TRIGGERS[id] ? TRIGGERS[id]() : false; },
  async interact(n) {
    if (n.move !== 'static' || n.trainer) faceEachOther(n);
    if (n.trainer) {
      const t = TRAINERS[n.trainer];
      if (flag('beat_' + n.trainer)) { await say(`${t.name.split(' ').pop().toUpperCase()}: ${t.after}`); return; }
      await trainerBattle(n);
      return;
    }
    if (n.script && SCRIPTS[n.script]) { await SCRIPTS[n.script](n); return; }
    if (n.text) await say(...n.text);
  },
  async trainer(n) {
    await showEmote(n, '!');
    const p = world.player;
    // walk until adjacent
    const dirs = pathTo(n, p.x, p.y);
    dirs.pop();
    await walk(n, dirs, 1);
    faceEachOther(n);
    await trainerBattle(n);
  },
  async encounter(sp, lvl) {
    const r = await battle({ wild: makeMon(sp, lvl) });
    await afterBattle(r);
  },
  async menu() { await startMenu(); },
  async pc() { await pcScreen(); },
};

async function trainerBattle(n) {
  const t = TRAINERS[n.trainer];
  const short = t.name.split(' ').pop().toUpperCase();
  if (t.intro) await say(`${short}: ${t.intro}`);
  const won = await fight(t);
  if (won) setFlag('beat_' + n.trainer);
}
