// Story scripts: trainers (hand-made + generated), 8 gyms, Elite Four, rivals Kai & Juno,
// Team Eclipse's storyline, legendary creatures and the ferry to the next region.
import { wait, fadeOut, fadeIn, fx, setScene } from './engine.js';
import { world, warp, walk, spawn, despawn, npcById, refreshNpcs, faceEachOther, showEmote, pathTo, blocked, opposite, stepActor, loadMap, fieldUser } from './world.js';
import { G, flag, setFlag, save, addItem, addToCollection } from './state.js';
import { SPECIES, SPECIES_LIST, ITEMS, BADGES } from './data.js';
import { MAPS, GYMS } from './maps.js';
import { makeMon, healFull, name } from './mon.js';
import { say, yesNo, choose } from './ui.js';
import { battle } from './battle.js';
import { starterScreen, shopScreen, pcScreen, startMenu, checkEvolutions, partyScreen, townMapScreen, partnerScreen } from './screens.js';
import { sfx, playMusic } from './audio.js';

// ---------- seeded helpers ----------
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (str) => [...str].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

// Which stage of an evolution line fits a level (item evolutions count from level 30)
const PREV = {};
for (const [id, s] of Object.entries(SPECIES)) if (s.evo) PREV[s.evo.to] = id;
function minLevel(sp) {
  const p = PREV[sp];
  if (!p) return 1;
  const e = SPECIES[p].evo;
  return e.level || 28;
}
function evolveFor(sp, lvl) {
  let cur = sp;
  for (;;) {
    const e = SPECIES[cur].evo;
    if (!e) return cur;
    const need = e.level || 30;
    if (lvl >= need) cur = e.to; else return cur;
  }
}
const STARTER_LINES = new Set(['sproutmole', 'thornmole', 'grovemaw', 'emberkit', 'blazelynx', 'infernyx', 'puddlefin', 'tidalotl', 'abyssalotl']);
function poolFor(types, lvl) {
  return SPECIES_LIST.filter((sp) => {
    const S = SPECIES[sp];
    if (S.legend || STARTER_LINES.has(sp)) return false;
    if (!S.types.some((t) => types.includes(t))) return false;
    if (minLevel(sp) > lvl) return false;
    return !(S.evo && S.evo.level && S.evo.level <= lvl);
  });
}

// ---------- trainers ----------
const T = (name, look, party, money, intro, lose, after, extra = {}) => ({ name, look, party, money, intro, lose, after, ...extra });
const TRAINERS = {
  leo: T('Bug Kid Leo', 'bugkid', [['twigling', 4], ['twigling', 5]], 15, 'Hey! My bug creatures are the toughest around!', 'Aww, my bugs got squashed!', 'I need to train my bugs more...'),
  mia: T('Lass Mia', 'lass', [['bunnip', 5], ['gustling', 5]], 18, 'You looked at me! That means we have to battle!', 'Mean! You didn\'t go easy at all!', 'My Bunnip is so fluffy, though.'),
  dale: T('Hiker Dale', 'hiker', [['pebbit', 9], ['dunepup', 10]], 30, 'Ho! These hills made my creatures rock-solid!', 'Ho ho! You crumbled my defense!', 'Rock types hate Water and Grass moves.'),
  ana: T('Bird Keeper Ana', 'birdkeeper', [['gustling', 10], ['gustling', 11]], 25, 'My birds ride the sea breeze. Can you keep up?', 'Grounded...', 'Electric moves are great against birds.'),
  rocco: T('Hiker Rocco', 'hiker', [['pebbit', 9], ['pebbit', 10]], 30, 'You want Shale? Get past me first!', 'You\'ve got real grit!', 'Shale\'s creatures have sky-high Defense. Special moves like Water Jet hit harder.'),
  // Team Eclipse — always close to the level of the local gym
  corvo1: T('Eclipse Corvo', 'corvo', [['twigling', 4], ['bunnip', 5]], 20, '', 'No way! Beaten by a rookie!', ''),
  nyx2: T('Eclipse Nyx', 'nyx', [['dunepup', 11], ['gustling', 10]], 25, '', 'This can\'t be happening!', ''),
  corvo2: T('Eclipse Corvo', 'corvo', [['pebbit', 11], ['twigling', 10]], 25, '', 'Not again!', ''),
  eclipse_cc1: T('Eclipse Grunt', 'grunt', [['echobat', 16], ['coilet', 17]], 25, 'These fossils belong to Team Eclipse now! Scram, kid!', 'Ugh... the boss won\'t be happy.', 'We\'re digging for ancient creatures. With them, we\'ll find Eclipsa!'),
  eclipse_cc2: T('Eclipse Grunt', 'grunt', [['ashpup', 17], ['wisplet', 18]], 25, 'Hey! You\'re the brat who beat Nyx and Corvo!', 'You\'re for real...', 'Our leader Vex is setting up in Lumen City. Stay away if you know what\'s good for you.'),
  eclipse_hq1: T('Eclipse Grunt', 'grunt', [['sneakit', 34], ['echobat', 35]], 30, 'Intruder alert!', 'How did a kid get this far?!', 'Vex is upstairs. You\'ll never beat Vex!'),
  eclipse_hq2: T('Eclipse Grunt', 'grunt', [['sludgeon', 35], ['ashpup', 34], ['coilet', 35]], 30, 'Lumen Tower belongs to Team Eclipse!', 'Lights out for me...', 'We locked up the Gym Leader so nobody would interfere.'),
  eclipse_hq3: T('Eclipse Grunt', 'grunt', [['hauntle', 36], ['nightpip', 35]], 30, 'You\'ll go no further!', 'Gah! Fine!', 'The mythical creature Eclipsa is drawn to darkness. Vex wants to control it.'),
  nyx_hq: T('Eclipse Nyx', 'nyx', [['mesaruff', 36], ['nightpip', 37]], 40, '', 'NOT AGAIN!', ''),
  corvo_hq: T('Eclipse Corvo', 'corvo', [['bouldox', 36], ['hauntle', 37]], 40, '', 'I can\'t believe this!', ''),
  vex: T('Eclipse Leader Vex', 'vex', [['shadeclaw', 38], ['constricta', 38], ['cinderfang', 39], ['hauntle', 40]], 80, '', 'Impossible... beaten by a child?', '', { potions: 2, music: 'boss' }),
  nyx_final: T('Eclipse Nyx', 'nyx', [['mesaruff', 44], ['ravenlord', 45]], 50, '', 'We lost... again...', ''),
  corvo_final: T('Eclipse Corvo', 'corvo', [['monolox', 44], ['shadeking', 45]], 50, '', 'This is the worst!', ''),
};

// Gym leaders, the Elite Four
const LEADERS = {
  stone: T('Leader Shale', 'shale', [['pebbit', 11], ['pebbit', 13]], 100, 'My creatures are as hard as the cliffs of this coast. Let\'s see if you can crack them!', 'Your bond with your creatures is stronger than stone. I\'m impressed!', 'A creature that travels with you through many regions grows stronger each time.', { potions: 1, reward: [['revive', 2], ['superpotion', 3]] }),
  thistle: T('Leader Briar', 'briar', [['budlet', 18], ['oakling', 19], ['barkmantis', 21]], 100, 'Welcome to my garden! Every thorn here has grown strong, just like my creatures.', 'You pruned my whole team...', 'With Slash, thorny bushes won\'t stop you anymore.', { potions: 1, reward: [['td_slash', 1]] }),
  volt: T('Leader Jolt', 'jolt', [['boltnut', 23], ['voltpup', 24], ['voltwasp', 26]], 110, 'Ready to get shocked? My team runs on pure lightning!', 'Short-circuited! You win!', 'Shatter breaks cracked boulders. Try it on Route 5!', { potions: 2, reward: [['td_shatter', 1]] }),
  tide: T('Leader Marina', 'marina', [['shellby', 27], ['croakle', 29], ['torrentail', 31]], 120, 'The sea is calm one moment and furious the next. So am I!', 'You rode out my storm...', 'With Wave Ride you can cross the sea to Kestrel Isle.', { potions: 2, reward: [['td_waveride', 1]] }),
  grit: T('Leader Kenta', 'kenta', [['punchpup', 32], ['grapplex', 33], ['brawlbull', 35]], 130, 'Hah! Train hard, fight harder! Show me your spirit!', 'What a battle! My muscles are tingling!', 'Heave lets you push heavy boulders. Use your strength wisely!', { potions: 2, reward: [['td_heave', 1]] }),
  lumen: T('Leader Sable', 'sable', [['mindlet', 36], ['lunamoth', 37], ['psyrook', 38], ['dreamray', 40]], 140, 'Thank you for saving my city. Now, let me see your mind at its sharpest.', 'I foresaw this... and still I couldn\'t stop it.', 'Glow lights dark caves, and Soar carries you to any town you\'ve visited.', { potions: 2, reward: [['td_glow', 1], ['td_soar', 1]] }),
  ember: T('Leader Ignis', 'ignis', [['ashpup', 41], ['flarecolt', 42], ['magmollusk', 43], ['cinderfang', 45]], 150, 'Hot enough for you? My creatures burn as fierce as this volcano!', 'Extinguished... you\'re the real deal.', 'Skyreach is east, past the boulders on Route 9.', { potions: 2, reward: [['maxpotion', 2]] }),
  wyrm: T('Leader Vesper', 'vesper', [['dragoneel', 46], ['wyvernix', 47], ['torrentail', 48], ['skydrake', 50]], 160, 'Dragons are the proudest creatures alive. Do you have what it takes to face them?', 'The dragons... acknowledge you.', 'With eight badges, Victory Road is open. The Elite Four await.', { potions: 3, reward: [['ultraorb', 5]] }),
};
const ELITE = [
  T('Elite Frida', 'frida', [['clamorite', 52], ['glacieroo', 53], ['rimewing', 53], ['frostseer', 54], ['shadeclaw', 55]], 200, 'I am Frida of the Elite Four. My ice will freeze your hopes solid!', 'Melted... Go on.', '', { potions: 2 }),
  T('Elite Morrow', 'morrow', [['hauntle', 53], ['gourdghast', 54], ['sonarwing', 54], ['pumpling', 54], ['shadeking', 56]], 200, 'Morrow is my name. Spirits whisper that you\'ll fall here...', 'The spirits were wrong.', '', { potions: 2 }),
  T('Elite Raze', 'raze', [['pantherine', 54], ['dunejaw', 55], ['ravenlord', 55], ['cinderfang', 56], ['shadeclaw', 57]], 200, 'I\'m Raze. I fight dirty, and I fight to win.', 'Tch. You earned that.', '', { potions: 2 }),
  T('Elite Ferrum', 'ferrum', [['dynamagnet', 55], ['armadrill', 56], ['beetank', 56], ['steelrhine', 57], ['mechatron', 58]], 200, 'Ferrum, last of the Four. Nothing breaks my iron wall!', 'My wall... crumbled. The Champion awaits.', '', { potions: 3 }),
];

const CLASSES = {
  grass: [['Bug Kid', 'bugkid', ['Bug']], ['Lass', 'lass', ['Normal', 'Fae']], ['Youngster', 'boy', ['Normal', 'Ground']], ['Bird Keeper', 'birdkeeper', ['Flying']], ['Beauty', 'beauty', ['Grass', 'Fae']], ['Ace Trainer', 'acetrainer', ['Fire', 'Water', 'Grass', 'Electric']]],
  forest: [['Bug Kid', 'bugkid', ['Bug']], ['Beauty', 'beauty', ['Grass']]],
  coast: [['Fisher', 'fisher', ['Water']], ['Swimmer', 'swimmer', ['Water']], ['Black Belt', 'blackbelt', ['Brawl']], ['Beauty', 'beauty', ['Fae', 'Grass']], ['Bird Keeper', 'birdkeeper', ['Flying']]],
  sea: [['Swimmer', 'swimmer', ['Water']], ['Fisher', 'fisher', ['Water']]],
  cave: [['Hiker', 'hiker', ['Rock', 'Ground']], ['Mystic', 'mystic', ['Spirit', 'Mind']], ['Biker', 'biker', ['Toxic', 'Shadow']]],
  snow: [['Skier', 'skier', ['Ice']], ['Ace Trainer', 'acetrainer', ['Dragon', 'Ice', 'Metal', 'Fire']], ['Dragon Tamer', 'tamer', ['Dragon', 'Flying']], ['Hiker', 'hiker', ['Rock', 'Ground']]],
  ash: [['Hiker', 'hiker', ['Rock', 'Fire']], ['Biker', 'biker', ['Fire', 'Toxic']]],
};
const NAMES = ['Ari', 'Beck', 'Cleo', 'Dax', 'Eli', 'Faye', 'Gus', 'Hana', 'Ivo', 'Jade', 'Kip', 'Lena', 'Milo', 'Nell', 'Otto', 'Pia', 'Quin', 'Rosa', 'Sol', 'Tess', 'Uma', 'Vic', 'Wren', 'Yara', 'Zed', 'Bo', 'Cal', 'Dina', 'Ezra', 'Fern'];
const INTROS = ['Let\'s battle!', 'My team is ready for you!', 'I\'ve been training all day for this!', 'Bet you can\'t beat me!', 'Don\'t hold back!', 'Our eyes met, so we battle!'];
const LOSES = ['I lost?!', 'You\'re really strong!', 'Back to training...', 'Wow, nice team!', 'No fair!'];
const AFTERS = ['Every creature in this region can be caught somewhere. Keep exploring!', 'Some creatures only evolve with a special stone.', 'Healing Centers are free. Use them!', 'Have you checked your Town Map? Press SELECT.', 'Hidden items are everywhere. Try pressing A on suspicious spots!'];

const genCache = {};
function getTrainer(id) {
  if (TRAINERS[id]) return TRAINERS[id];
  if (genCache[id]) return genCache[id];
  const [kind, a, b] = id.split(':');
  const R = rng(hash(id));
  const pickR = (arr) => arr[Math.floor(R() * arr.length)];
  let t;
  if (kind === 'gen') {
    const m = MAPS[a];
    const classes = CLASSES[m.style] || CLASSES.grass;
    const [cls, look, types] = pickR(classes);
    const [lo, hi] = m.lv || [5, 8];
    const n = Math.min(4, (hi < 15 ? 1 : hi < 30 ? 2 : 3) + (R() < 0.4 ? 1 : 0));
    const party = [];
    for (let i = 0; i < n; i++) {
      const lvl = lo + Math.floor(R() * (hi - lo + 1));
      const pool = poolFor(types, lvl);
      const sp = pool.length ? pickR(pool) : 'bunnip';
      party.push([evolveFor(sp, lvl), lvl]);
    }
    t = T(`${cls} ${pickR(NAMES)}`, look, party, 18 + Math.floor(hi / 2), pickR(INTROS), pickR(LOSES), pickR(AFTERS));
  } else if (kind === 'gym') {
    const gym = GYMS[a];
    const lead = LEADERS[a];
    const lv = lead.party[0][1] - 3 + +b;
    const pool = poolFor([gym.type], lv);
    const party = [0, 1].map((i) => { const sp = pool.length ? pickR(pool) : 'bunnip'; return [evolveFor(sp, lv + i), lv + i]; });
    t = T(`Gym Trainer ${pickR(NAMES)}`, gym.tlook || 'guide', party, 40, `You'll have to beat me before you face our Leader!`, 'Our Leader is even stronger than me!', gym.tip || 'Good luck!');
  }
  genCache[id] = t;
  return t;
}

// ---------- rivals ----------
const COUNTER = { sproutmole: 'emberkit', emberkit: 'puddlefin', puddlefin: 'sproutmole' };
const RIVAL_POOLS = { kai: ['gustling', 'voltpup', 'digadillo', 'drakelet', 'ironhorn'], juno: ['bunnip', 'puffpetal', 'splashkoi', 'mindlet', 'fawnlet'] };
function rivalTrainer(who, lvl, extra) {
  const party = [];
  if (extra) party.push(...extra);
  else {
    const count = Math.min(5, Math.floor(lvl / 10));
    RIVAL_POOLS[who].slice(0, count).forEach((sp, i) => party.push([evolveFor(sp, lvl - 2 - (i % 3)), lvl - 2 - (i % 3)]));
  }
  party.push([evolveFor(G.rivals[who], lvl), lvl]);
  return { name: who === 'kai' ? 'Kai' : 'Juno', look: who, party, money: 40, music: 'boss', potions: lvl > 30 ? 2 : 0 };
}

function build(t) { return { ...t, party: t.party.map(([sp, l]) => makeMon(sp, l, { ot: t.name })) }; }

// ---------- shared helpers ----------
async function whiteout() {
  await fadeOut(20);
  G.party.forEach(healFull);
  G.money = Math.floor(G.money / 2);
  if (world.map.e4 !== undefined || world.map.id === 'league_lobby') ['e4_0', 'e4_1', 'e4_2', 'e4_3', 'leagueOpen'].forEach((f) => setFlag(f, false));
  const h = G.lastHeal;
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

async function fight(trainers, o = {}) {
  const list = (Array.isArray(trainers) ? trainers : [trainers]).map(build);
  const r = await battle({ trainers: list, double: o.double, canLose: o.canLose, music: list[0].music || 'boss' });
  if (o.canLose && r === 'lose') { playMusic(world.map.music); G.party.forEach(healFull); return false; }
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
  sfx('door'); fx.flash = 0.6; fx.flashColor = '#fff';
  p.dir = s.d;
  await wait(10);
  return n;
}
async function vanish(...ids) { fx.flash = 1; fx.flashColor = '#fff'; sfx('door'); ids.forEach(despawn); await wait(8); }
const MOTTO = ['NYX: When daylight fades and stars descend...', 'CORVO: ...the shadow falls, the dark ascends!', 'NYX: Nyx!', 'CORVO: Corvo!', 'BOTH: Team Eclipse! We cover every region in shadow!'];

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
  await say('This world is full of creatures, living in every region you can imagine.', 'Trainers travel from region to region, starting fresh every time, with only a partner or two by their side.');
  scene.mon = null;
  await say('Now, tell me. What is your name?');
  G.name = await askName('Your name?', 'TOM');
  await say(`Right! So your name is ${G.name}!`, 'Your two friends from next door, Kai and Juno, have been waiting for this day too.', `${G.name}! Your very own journey is about to begin!`);
  await fadeOut(20);
}

// ---------- triggers ----------
const TRIGGERS = {
  async momMap() {
    if (flag('gotMap')) return false;
    const mom = npcById('mom');
    if (mom) await showEmote(mom, '!');
    await say(`MOM: ${G.name}! Wait a second!`, 'Before you go, take this. It\'s a TOWN MAP of Aldermoor, so you always know where you\'re headed.');
    addItem('townmap'); setFlag('gotMap'); sfx('item');
    await say(`${G.name} received the TOWN MAP!`, 'MOM: Press SELECT to open it anytime. Whenever you reach a new region, I\'ll send you a map of it. Promise!');
    return true;
  },
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
    await appear('ec_nyx', 'nyx');
    const cs = freeNear(p);
    spawn({ id: 'ec_corvo', look: 'corvo', x: cs.x, y: cs.y, dir: opposite[cs.d] });
    playMusic('boss');
    await say(...MOTTO, 'CORVO: That creature of yours looks valuable. Hand it over!');
    p.dir = cs.d;
    const won = await fight(TRAINERS.corvo1);
    if (!won) { despawn('ec_nyx'); despawn('ec_corvo'); return true; }
    await say('CORVO: Nyx! The kid beat me!', 'NYX: Ugh! We\'ll get the rare creatures of Aldermoor with or without your partner!', 'BOTH: Team Eclipse is retreating... for now!');
    setFlag('eclipse1');
    await vanish('ec_nyx', 'ec_corvo');
    playMusic(world.map.music);
    return true;
  },
  async junoRoute1() {
    if (flag('junoR1') || !flag('gotStarter')) return false;
    await say(`???: ${G.name}! Wait up!`);
    const j = await appear('tmp_juno', 'juno');
    await say('JUNO: I\'ve been training out here the whole time! Let\'s see whose team is stronger!');
    const won = await fight(rivalTrainer('juno', 7, [['gustling', 5]]));
    if (won) await say('JUNO: Wow, you\'re really good! Kai is going to be so mad.');
    await say('JUNO: Pebbleton is just ahead. There\'s a Gym there! See you!');
    setFlag('junoR1');
    await walk(j, ['up', 'up'], 2); despawn(j.id);
    return true;
  },
  async eclipse2() {
    if (flag('eclipse2')) return false;
    const nyx = npcById('nyx2');
    if (nyx) await showEmote(nyx, '!');
    playMusic('boss');
    await say('NYX: You again?! We\'re busy catching the rare creatures hiding in Hollow Grove!', 'CORVO: Rare starters live wild in there. They\'ll fetch a fortune!', 'NYX: Corvo, let\'s team up and crush this pest!');
    if (G.party.filter((m) => m.hp > 0).length < 2) await say('CORVO: Only one creature? Then we\'ll take turns beating you!');
    world.player.dir = 'right';
    const won = await fight([TRAINERS.nyx2, TRAINERS.corvo2], { double: true });
    if (!won) return true;
    await say('NYX: How?! Even together...', 'CORVO: Team Eclipse will be back! We\'ll be everywhere you go!', 'BOTH: Team Eclipse is retreating... AGAIN!');
    setFlag('eclipse2');
    await vanish('nyx2', 'corvo2');
    refreshNpcs();
    playMusic(world.map.music);
    return true;
  },
  async tagBattle() {
    if (!G.badges.includes('stone') || flag('tagDone')) return false;
    const p = world.player;
    await say(`KAI: ${G.name}! Thought you could sneak off to the next town?`);
    const kai = spawn({ id: 'tmp_kai', look: 'kai', x: 12, y: 4, dir: 'up' });
    const juno = spawn({ id: 'tmp_juno', look: 'juno', x: 13, y: 4, dir: 'up' });
    await Promise.all([walk(kai, ['up'], 1), walk(juno, ['up'], 1)]);
    p.dir = 'down';
    await say('JUNO: We heard you beat Shale! Before you move on, one more battle!', 'KAI: And this time, Juno and I are teaming up against you. Two on two!');
    if (G.party.filter((m) => m.hp > 0).length < 2) {
      await say('KAI: Wait, you only have one creature ready to fight? That\'s no fun.', 'JUNO: Catch another creature or heal up, then come back!');
      await Promise.all([walk(kai, ['down', 'down'], 2), walk(juno, ['down', 'down'], 2)]); despawn('tmp_kai'); despawn('tmp_juno');
      return true;
    }
    const won = await fight([rivalTrainer('kai', 14, [['gustling', 12]]), rivalTrainer('juno', 14, [['bunnip', 12]])], { double: true });
    if (!won) { despawn('tmp_kai'); despawn('tmp_juno'); return true; }
    await say('KAI: Even two against one... You\'re unbelievable.', 'JUNO: There are seven more Gyms in Aldermoor. Let\'s race to the League!', 'KAI: The Champion gets to take the ferry to a whole new region. That\'s gonna be me!');
    setFlag('tagDone');
    await Promise.all([walk(kai, ['down', 'down', 'down'], 2), walk(juno, ['down', 'down', 'down'], 2)]); despawn('tmp_kai'); despawn('tmp_juno');
    return true;
  },
  async kaiVoltara() {
    if (flag('kaiVoltara') || !G.badges.includes('thistle')) return false;
    const k = await appear('tmp_kai', 'kai');
    await say(`KAI: There you are, ${G.name}! I just got here too. Let's see who's grown more!`);
    await fight(rivalTrainer('kai', 25));
    await say('KAI: Hmph. Leader Jolt uses Electric types. Bring something that can dig in!');
    setFlag('kaiVoltara');
    await walk(k, ['up', 'up', 'up'], 2); despawn(k.id);
    return true;
  },
  async junoCoralport() {
    if (flag('junoCoral') || !G.badges.includes('volt')) return false;
    const j = await appear('tmp_juno', 'juno');
    await say(`JUNO: ${G.name}! Coralport is SO pretty. Okay, battle time!`);
    await fight(rivalTrainer('juno', 30));
    await say('JUNO: Leader Marina is tough. Grass and Electric moves will help!', 'JUNO: Oh, and I found out Team Eclipse is hiding in Lumen City, across the sea. Be careful!');
    setFlag('junoCoral');
    await walk(j, ['right', 'right', 'right'], 2); despawn(j.id);
    return true;
  },
  async hqDuo() {
    if (flag('hqDuo')) return false;
    playMusic('boss');
    await say('NYX: Not YOU again!', 'CORVO: We\'re not letting you anywhere near Vex!', ...MOTTO);
    const won = await fight([TRAINERS.nyx_hq, TRAINERS.corvo_hq], { double: true });
    if (!won) return true;
    await say('NYX: Ugh! Fine! Go see Vex. You\'ll regret it!');
    setFlag('hqDuo');
    await vanish('hq_nyx', 'hq_corvo');
    refreshNpcs();
    return true;
  },
  async rivalsLumen() {
    if (flag('rivalsLumen') || !flag('hqClear')) return false;
    if (G.party.filter((m) => m.hp > 0).length < 2) return false;
    await say(`KAI: ${G.name}! We heard you took down Team Eclipse!`);
    const kai = await appear('tmp_kai', 'kai');
    const s = freeNear(world.player);
    spawn({ id: 'tmp_juno', look: 'juno', x: s.x, y: s.y, dir: opposite[s.d] });
    await say('JUNO: That\'s amazing! But we\'re not falling behind. Tag battle, right now!');
    const won = await fight([rivalTrainer('kai', 39), rivalTrainer('juno', 39)], { double: true });
    if (won) await say('KAI: ...We\'ll catch up. Just you wait.');
    await say('JUNO: Ember Tunnel ahead is pitch black. Make sure a creature knows Glow!');
    setFlag('rivalsLumen');
    await vanish('tmp_kai', 'tmp_juno');
    return true;
  },
  async eclipseFinal() {
    if (flag('eclipseFinal') || !G.badges.includes('ember')) return false;
    await say('???: Not so fast!');
    await appear('ec_nyx', 'nyx');
    const cs = freeNear(world.player);
    spawn({ id: 'ec_corvo', look: 'corvo', x: cs.x, y: cs.y, dir: opposite[cs.d] });
    playMusic('boss');
    await say('NYX: Vex may have given up, but WE haven\'t!', ...MOTTO, 'CORVO: This is our last shot in Aldermoor!');
    const won = await fight([TRAINERS.nyx_final, TRAINERS.corvo_final], { double: true });
    if (!won) { despawn('ec_nyx'); despawn('ec_corvo'); return true; }
    await say('NYX: That\'s it. We\'re done with this region.', 'CORVO: But Team Eclipse is everywhere. Whatever region you go to next... we\'ll be waiting!', 'BOTH: Team Eclipse is blasting off to new horizons!');
    setFlag('eclipseFinal');
    await vanish('ec_nyx', 'ec_corvo');
    playMusic(world.map.music);
    return true;
  },
  async junoVictory() {
    if (flag('junoVR')) return false;
    const j = await appear('tmp_juno', 'juno');
    await say(`JUNO: ${G.name}! You made it to Victory Road too!`, 'JUNO: One last battle before the League. No holding back!');
    await fight(rivalTrainer('juno', 50));
    await say('JUNO: Kai went ahead already. He looked really serious...', 'JUNO: Go get him!');
    setFlag('junoVR');
    await vanish(j.id);
    return true;
  },
  async badgeGate() {
    if (G.badges.length >= 8) return false;
    await say(`GUARD: Halt! Only trainers with all eight Aldermoor badges may enter Victory Road.`, `You have ${G.badges.length}. Come back when you have them all!`);
    await stepActor(world.player, 'down', 2);
    return true;
  },
};

// add story triggers to generated maps
(function placeTriggers() {
  const t = (m, x, y, w, h, script) => MAPS[m].triggers.push({ x, y, w, h, script });
  t('house_player', 1, 6, 8, 1, 'momMap');
  t('voltara', 10, 17, 2, 2, 'kaiVoltara');
  t('coralport', 1, 8, 2, 2, 'junoCoralport');
  t('route8', 1, MAPS.route8.h - 4, MAPS.route8.w - 2, 1, 'rivalsLumen');
  t('route9', 20, 1, 1, MAPS.route9.h - 2, 'eclipseFinal');
  t('victoryroad', 1, MAPS.victoryroad.h - 3, MAPS.victoryroad.w - 2, 1, 'junoVictory');
})();

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
  G.rivals.juno = ['sproutmole', 'emberkit', 'puddlefin'].find((x) => x !== sp && x !== COUNTER[sp]);
  await say(`KAI: Then I'll take ${SPECIES[G.rivals.kai].name}! It has the type advantage!`, `JUNO: That leaves ${SPECIES[G.rivals.juno].name} for me. Hi there, little buddy!`);
  await say('MAPLE: Don\'t worry about the other two. Every creature in Aldermoor lives somewhere in the wild, even these three.', 'Explore well and you can catch them all!');
  setFlag('gotDex');
  addItem('orb', 5);
  sfx('item');
  await say(`${G.name} received the DEX and 5 Capture Orbs!`, 'MAPLE: The DEX records every creature you see and catch. Open it from the START menu.');
  await say(`KAI: ${G.name}! Let's see what our creatures can do!`);
  const won = await fight(rivalTrainer('kai', 5, []), { canLose: true });
  await say(won ? 'KAI: What?! I picked the one with the advantage! I\'ll train harder, just watch!' : 'KAI: Ha! Told you I\'d win! ...Don\'t worry, I\'ll heal yours up.');
  G.party.forEach(healFull);
  await say('KAI: I\'m heading to Pebbleton! Juno, you\'re next!', 'JUNO: I\'ll be training on Route 1. Bye!');
  setFlag('gotStarter');
  if (kai) { await walk(kai, ['down', 'down', 'down', 'down', 'right', 'right', 'down'], 2); despawn(kai.id); }
  if (juno) { await walk(juno, ['down', 'down', 'down', 'down', 'left', 'left', 'down'], 2); despawn(juno.id); }
  setFlag('labRivals', false);
  refreshNpcs();
  await say('MAPLE: Route 1 is north of town. There are eight Gyms in Aldermoor. Collect all the badges and the League awaits!', 'Good luck out there!');
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

async function gymLeader(id) {
  const L = LEADERS[id];
  const short = L.name.split(' ').pop().toUpperCase();
  if (G.badges.includes(id)) { await say(`${short}: ${L.after}`); return; }
  await say(`${short}: ${L.intro}`);
  const won = await fight(L);
  if (!won) return;
  const badge = BADGES.find((b) => b[0] === id);
  G.badges.push(id);
  sfx('badge');
  await say(`${G.name} received the ${badge[1].toUpperCase()} BADGE!`);
  for (const [it, n] of L.reward || []) {
    addItem(it, n); sfx('item');
    await say(`${G.name} received ${n > 1 ? n + ' ' : ''}${ITEMS[it].name}${n > 1 ? 's' : ''}!`);
    if (ITEMS[it].kind === 'td') await say(`Teach it to a creature from the BAG. ${ITEMS[it].desc.split('. ').slice(1).join('. ')}`);
  }
  await say(`${short}: ${L.after}`);
}

const SCRIPTS = {
  async mom() {
    if (!flag('gotStarter')) { await say(`MOM: Good morning, ${G.name}! Professor Maple was looking for you.`, 'Her lab is the big building south-east of here.'); return; }
    await say(`MOM: ${G.name}! You look tired. Take a quick rest.`);
    await heal({ map: 'house_player', x: 5, y: 5, dir: 'up' });
    await say(G.badges.length >= 8 ? 'MOM: Eight badges! I\'m so proud of you!' : 'MOM: There! Your creatures are full of energy again. Be careful out there!');
  },
  async nurse() {
    if (!G.party.length) { await say('NURSE: Welcome! Once you have creatures, I can heal them for you.'); return; }
    if (await yesNo('NURSE: Welcome to the Healing Center! Shall I heal your creatures?')) {
      await say('OK, I\'ll take your creatures for a few seconds.');
      await heal({ map: world.map.id, x: 5, y: 4, dir: 'up' });
      await say('Your creatures are fighting fit! We hope to see you again!');
    } else await say('We hope to see you again!');
  },
  async mart() {
    let stock = world.map.stock;
    if (!stock) { stock = ['orb', 'potion', 'fullheal', 'repel']; if (G.badges.includes('stone')) stock.push('greatorb', 'superpotion', 'revive'); }
    await shopScreen(stock);
  },
  async maple() {
    if (!flag('gotStarter')) return;
    const c = Object.keys(G.dex.caught).length;
    await say(`MAPLE: How is your DEX coming along? You've caught ${c} of ${SPECIES_LIST.length} kinds of creatures in Aldermoor.`);
    if (c >= 15 && !flag('mapleGift')) { setFlag('mapleGift'); addItem('greatorb', 10); sfx('item'); await say('Wonderful progress! Take these 10 Great Orbs.'); }
    else if (c >= 60 && !flag('mapleGift2')) { setFlag('mapleGift2'); addItem('masterorb', 1); sfx('item'); await say('Over half the region! You deserve this: a MASTER ORB. It never fails. Save it for something legendary.'); }
    else if (c >= SPECIES_LIST.length) await say('You caught every creature in Aldermoor! You are a true creature expert!');
    else await say('Creatures you leave in your PC box stay here in Aldermoor with me when you travel. I\'ll take good care of them!');
  },
  async shale() { await gymLeader('stone'); },
  async gym() { await gymLeader(world.map.gym); },
  async trader() {
    if (flag('tradeDone')) { await say('WALTER: How\'s Rusty doing? I hope you two are getting along!'); return; }
    if (!(await yesNo('WALTER: I\'m looking for a Bunnip. Would you trade one for my Dunepup, Rusty?'))) { await say('WALTER: Oh, that\'s a shame.'); return; }
    const i = await partyScreen({ mode: 'pick', title: 'Trade which creature?' });
    if (i < 0) { await say('WALTER: Oh, that\'s a shame.'); return; }
    const m = G.party[i];
    if (m.sp !== 'bunnip') { await say('WALTER: Hmm, that\'s not a Bunnip.'); return; }
    if (G.party.length === 1) { await say('WALTER: That\'s your only creature! I couldn\'t take it.'); return; }
    const rusty = makeMon('dunepup', m.level, { nick: 'Rusty', ot: 'Walter' });
    G.party[i] = rusty;
    G.dex.seen.dunepup = true; G.dex.caught.dunepup = true;
    sfx('evolve');
    await say(`${G.name} traded ${name(m)} for Rusty!`, 'WALTER: Thank you! Take good care of him!');
    setFlag('tradeDone');
  },
  async sailor() {
    if (!flag('champion')) {
      await say('SAILOR: Ferries to other regions leave from this dock.', 'Only the Champion of Aldermoor may sail on. Beat the Elite Four at Crown Plateau!');
      return;
    }
    await say('SAILOR: Champion! The ferry will take you to a brand new region whenever you\'re ready. There\'s no rush.', 'Only one or two partners may travel with you. Everyone else stays here with Professor Maple until you come back.');
    if (!(await yesNo('Do you want to choose your traveling partners now?'))) { await say('SAILOR: Take your time. Aldermoor isn\'t going anywhere.'); return; }
    const chosen = await partnerScreen();
    if (!chosen) { await say('SAILOR: Take your time.'); return; }
    G.partners = chosen.map((m) => m.uid);
    await say(`SAILOR: ${chosen.map(name).join(' and ')} will sail with you!`, 'SAILOR: The route to the next region is still being charted. We set sail in the next update!');
  },
  async td_slash() { await say('RANGER: Thorny bushes have grown over the path to Route 3.', G.bag.td_slash ? 'Teach Slash to a creature from your BAG, then press A in front of a bush!' : 'Leader Briar gives a Trail Disc that teaches Slash to trainers who beat her.'); },
  async td_glow() { await say('AIDE: Ember Tunnel north of town is pitch black.', G.bag.td_glow ? 'Teach Glow to a creature, and you\'ll be asked to light the cave when you enter.' : 'Leader Sable will give you Glow, once she\'s free from Team Eclipse.'); },
  async vex() {
    const v = npcById('hq_vex');
    await say(`VEX: So you're the trainer who keeps humiliating my admins.`, 'VEX: Team Eclipse will awaken Eclipsa and blot out the sun over every region!', 'VEX: But first, I\'ll deal with you personally.');
    const won = await fight(TRAINERS.vex);
    if (!won) return;
    await say('VEX: ...So this is the power of a trainer who travels with their creatures.', 'VEX: Fine. Team Eclipse withdraws from Aldermoor. But the other regions will be ours.', 'VEX: Release the Gym Leader. We\'re leaving.');
    setFlag('hqClear');
    if (v) await vanish(v.id);
    refreshNpcs();
    await say('...A strange presence stirs in the back of the room.');
  },
  async legend(n) {
    const sp = n.creature;
    sfx('encounter');
    await say(`${SPECIES[sp].name} is staring right at you...`);
    const r = await battle({ wild: makeMon(sp, n.level), music: 'boss' });
    if (r === 'caught') { setFlag('caught_' + sp); refreshNpcs(); }
    else if (r === 'win') await say(`${SPECIES[sp].name} retreated, but it will be back...`);
    await afterBattle(r);
  },
  async leagueGuard() {
    if (flag('champion')) { await say('GUARD: Welcome back, Champion! The Elite Four would love a rematch anytime.'); setFlag('leagueOpen'); ['e4_0', 'e4_1', 'e4_2', 'e4_3', 'e4_4'].forEach((f) => setFlag(f, false)); return; }
    if (G.badges.length < 8) { await say('GUARD: You need all eight badges to challenge the League.'); return; }
    if (await yesNo('GUARD: Beyond this door are the Elite Four and the Champion. Once you start, you must win every battle in a row. Are you ready?')) {
      setFlag('leagueOpen'); await say('GUARD: Then go! The door on the right is open. Good luck!');
    }
  },
  async elite() {
    const i = world.map.e4;
    const L = ELITE[i];
    const short = L.name.split(' ').pop().toUpperCase();
    if (flag('e4_' + i)) { await say(`${short}: Go on. The next room awaits.`); return; }
    await say(`${short}: ${L.intro}`);
    const won = await fight(L);
    if (!won) return;
    setFlag('e4_' + i);
    await say(`${short}: ${L.lose}`, 'The door at the back opened!');
  },
  async champion() {
    if (flag('e4_4')) { await say('KAI: Go on. The Hall of Fame is through there.'); return; }
    await say(`KAI: Hey, ${G.name}. Took you long enough.`, 'KAI: I beat the Elite Four before you. That makes ME the Champion.', 'KAI: You and me, one last time. For the title, and for the ferry to the next region!');
    const won = await fight(rivalTrainer('kai', 60));
    if (!won) return;
    setFlag('e4_4');
    await say('KAI: ...I lost. To you. Again.', 'KAI: You know what? You earned it. You\'re the Champion of Aldermoor.', 'The door to the Hall of Fame opened!');
  },
  async hallOfFame() {
    if (flag('champion')) { await say('MAPLE: Welcome back, Champion! Your Hall of Fame record is safe here.'); return; }
    playMusic('victory');
    await say(`MAPLE: ${G.name}! Congratulations! You are the new Champion of Aldermoor!`, 'MAPLE: Your team will be recorded in the Hall of Fame forever.');
    setFlag('champion');
    G.hallOfFame = (G.hallOfFame || []).concat([{ date: Date.now(), team: G.party.map((m) => `${name(m)} Lv${m.level}`) }]);
    sfx('badge');
    await say('MAPLE: The ferry at Pebbleton Harbor will now take you to a new region whenever you choose.', 'MAPLE: But there\'s no rush! Stay as long as you like: finish your DEX, or search for the legendary creatures of Aldermoor.', 'MAPLE: When you do sail, you may bring one or two partners. The rest will stay with me, safe and sound.');
    save();
  },
};

// ---------- hooks for world.js ----------
world.hooks = {
  async trigger(id) { return TRIGGERS[id] ? TRIGGERS[id]() : false; },
  lookFor(d) { if (d.trainer) { const t = getTrainer(d.trainer); return t && t.look; } return null; },
  async interact(n) {
    if (n.move !== 'static' || n.trainer) faceEachOther(n);
    if (n.trainer) {
      const t = getTrainer(n.trainer);
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
  async townMap() { await townMapScreen(); },
};

async function trainerBattle(n) {
  const t = getTrainer(n.trainer);
  const short = t.name.split(' ').pop().toUpperCase();
  if (t.intro) await say(`${short}: ${t.intro}`);
  const won = await fight(t);
  if (won) setFlag('beat_' + n.trainer);
}
