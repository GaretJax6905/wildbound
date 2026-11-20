// Story scripts: trainers (hand-made + generated), 8 gyms, Elite Four, rivals Kai & Juno,
// Team Eclipse's storyline, legendary creatures and the ferry to the next region.
import { wait, fadeOut, fadeIn, fx, setScene } from './engine.js';
import { world, warp, walk, spawn, despawn, npcById, refreshNpcs, faceEachOther, showEmote, pathTo, blocked, opposite, stepActor, loadMap, fieldUser } from './world.js';
import { G, flag, setFlag, save, addItem, addToCollection } from './state.js';
import { SPECIES, SPECIES_LIST, ITEMS, BADGES, regionDex, regionBadges, OBEY_CAPS } from './data.js';
import { MAPS, GYMS } from './maps.js';
import { makeMon, healFull, name } from './mon.js';
import { say, yesNo, choose, setNameHook, offerNickname, askName } from './ui.js';
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
const STARTER_LINES = new Set(['sproutmole', 'thornmole', 'grovemaw', 'emberkit', 'blazelynx', 'infernyx', 'puddlefin', 'tidalotl', 'abyssalotl',
  'bramblecub', 'thornbear', 'briarbruin', 'cindergecko', 'forgecko', 'smeltwyrm', 'splotter', 'surfotter', 'glaciotter']);
const MERIDIA_STARTERS = ['bramblecub', 'cindergecko', 'splotter'];
// Meridia: the level of the first place each creature (or its earliest form) lives in the wild,
// so trainers carry what you could have met by that point of the journey
let HOME = null;
function homeLevel(sp) {
  if (!HOME) {
    HOME = {};
    for (const m of Object.values(MAPS)) {
      if (!m.lv) continue;
      for (const [w] of [...(m.encounters || []), ...(m.rareEnc || []), ...(m.surfEnc || []), ...(m.rareSurfEnc || [])]) HOME[w] = Math.min(HOME[w] ?? 99, m.lv[0]);
    }
  }
  let cur = sp;
  while (HOME[cur] === undefined && PREV[cur]) cur = PREV[cur];
  return HOME[cur] ?? 99;
}
function poolFor(types, lvl, region = 'aldermoor') {
  const all = poolAll(types, lvl, region);
  if (region !== 'meridia') return all;
  const near = all.filter((sp) => homeLevel(sp) <= lvl + 2);
  return near.length ? near : all;
}
function poolAll(types, lvl, region) {
  return SPECIES_LIST.filter((sp) => {
    const S = SPECIES[sp];
    if (S.region !== region) return false;
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
  // Team Eclipse in Meridia: hunting the four legends
  corvo_m1: T('Eclipse Corvo', 'corvo', [['murkit', 11], ['webbit', 12]], 30, '', 'Bah! I almost had them!', ''),
  nyx_m2: T('Eclipse Nyx', 'nyx', [['vultyke', 19], ['scorpip', 20]], 35, '', 'The radar\'s fine! It\'s YOU that\'s the problem!', ''),
  corvo_m2: T('Eclipse Corvo', 'corvo', [['coyip', 19], ['webbit', 20]], 35, '', 'Not in the canyon too!', ''),
  eclipse_m4a: T('Eclipse Grunt', 'grunt', [['umbrastoat', 33], ['dunestinger', 34]], 35, '', 'Brr... beaten AND freezing.', ''),
  eclipse_m4b: T('Eclipse Grunt', 'grunt', [['hollowhound', 34], ['vultrex', 34]], 35, '', 'The ice trap is busted...', ''),
  vex_m: T('Eclipse Leader Vex', 'vex', [['umbrastoat', 49], ['centigloom', 50], ['vultrex', 50], ['shadeclaw', 52]], 120, '', 'Again... a child, again!', '', { potions: 2, music: 'boss' }),
  corvo_m5: T('Eclipse Corvo', 'corvo', [['howlote', 48], ['arachnight', 49], ['hollowhound', 50]], 60, '', 'Boss, I\'m sorry!', '', { potions: 1 }),
  // Team Eclipse's Meridia factory in Ironhaven
  eclipse_m1: T('Eclipse Grunt', 'grunt', [['gravepup', 31], ['howlote', 32]], 30, 'Hey! This factory is off-limits!', 'Ugh... Nyx is gonna be furious.', 'We\'re building machines to track Meridia\'s legends. Don\'t tell anyone.'),
  eclipse_m2: T('Eclipse Grunt', 'grunt', [['murkit', 31], ['dunestinger', 32], ['hivelet', 31]], 30, 'You again?! You\'re the Aldermoor Champion!', 'Champion or not, you\'re a pain!', 'Our machines can sense the four legends of Meridia. The boss wants them all.'),
  eclipse_m3: T('Eclipse Nyx', 'nyx', [['vultrex', 33], ['hollowhound', 34], ['centigloom', 35]], 60, 'You followed us across the sea? Ugh! Team Eclipse will cover Meridia in shadow, starting right here!', 'Not AGAIN! Fine, we\'re packing up the factory...', 'Corvo and I just follow orders. Vex is the one hunting the legends.', { music: 'boss', potions: 1 }),
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
// Meridia's eight Leaders
Object.assign(LEADERS, {
  hive: T('Leader Tansy', 'tansy', [['hivelet', 12], ['webbit', 13], ['glimmoth', 15]], 100, 'Bzz! Welcome to my hive! My bugs work together like one big family. Can you break our rhythm?', 'Bzz... you scattered the whole swarm!', 'Bug creatures grow up fast. Catch them young and watch them bloom!', { potions: 1, reward: [['superpotion', 3], ['greatorb', 5]] }),
  dune: T('Leader Sahar', 'sahar', [['sandskink', 18], ['coyip', 19], ['scorpip', 19], ['duneskink', 21]], 110, 'The desert takes the weak and keeps the strong. Let\'s see which you are.', 'Like water through sand... you slipped right past me.', 'Echo Canyon is north. The wind there will test you next.', { potions: 1, reward: [['superpotion', 3], ['revive', 2]] }),
  gale: T('Leader Aeron', 'aeron', [['swiftail', 22], ['vultyke', 23], ['dustwhirl', 24], ['kitewing', 25]], 120, 'Up here the wind never stops! My birds were born riding it. Try to keep your feet!', 'Whoa! You blew me right off the mesa!', 'Fenmoor\'s past the prairie. Watch out for the marsh gas!', { potions: 2, reward: [['hyperpotion', 2], ['greatorb', 5]] }),
  bog: T('Leader Fennick', 'fennick', [['bogslug', 27], ['jellet', 28], ['dunestinger', 29], ['fungloom', 31]], 130, 'Heh. You can smell my Gym from a mile off, right? That\'s the point. Let\'s get toxic!', 'Ugh... I\'m the one who got poisoned this time.', 'Wave Ride gets you to Kingsgate. Don\'t breathe the fog there, it\'s spooky.', { potions: 2, reward: [['fullheal', 4], ['ultraorb', 3]] }),
  wraith: T('Leader Ysolde', 'ysolde', [['gravepup', 31], ['hoothaunt', 32], ['leafwraith', 32], ['sparkshade', 33], ['owlgeist', 35]], 140, 'The old kings of this city never truly left. Their spirits fight beside me. Will you face them?', 'The spirits bow to you. How rare.', 'Ironhaven lies past the autumn woods. Something dark stirs in its old factory.', { potions: 2, reward: [['hyperpotion', 3], ['duskstone', 1]] }),
  forge: T('Leader Bram', 'bram', [['rustmite', 36], ['clanklet', 36], ['gildcrow', 37], ['oregolem', 37], ['ironmantle', 39]], 150, 'Every one of my creatures was tempered in this forge! Let\'s see if you can dent them!', 'Bent like hot iron! Good work, kid!', 'Route 17 south is snowed in. Bundle up!', { potions: 2, reward: [['maxpotion', 2], ['ironcore', 1]] }),
  rime: T('Leader Nevia', 'nevia', [['aurorine', 41], ['emperice', 42], ['frostbeetle', 42], ['hailhawk', 43], ['yetirage', 44]], 160, 'Every move on the ice must be graceful and exact. One slip and it\'s over. Shall we dance?', 'A perfect score... for you.', 'Storm Cave west of Route 18 is pitch black. Light your way!', { potions: 3, reward: [['maxpotion', 3], ['sparkstone', 1]] }),
  dusk: T('Leader Corwin', 'corwin', [['howlote', 45], ['arachnight', 46], ['vultrex', 46], ['razorcuda', 47], ['umbrastoat', 47], ['centigloom', 49]], 170, 'Most trainers fear the dark. My creatures were raised in it. You won\'t see us coming.', 'You saw through every shadow. Remarkable.', 'With eight Meridia badges, Summit Pass and the League are open to you.', { potions: 3, reward: [['ultraorb', 5], ['revive', 3]] }),
});
const ELITE2 = [
  T('Elite Calla', 'calla', [['driftsteed', 52], ['medusail', 53], ['reefortress', 53], ['gloomangler', 54], ['crystallix', 55]], 220, 'I am Calla of the Meridia Elite Four. The tide is turning, and it is turning against you!', 'Washed away... Go on, the next room awaits.', '', { potions: 2 }),
  T('Elite Dorran', 'dorran', [['ramparch', 53], ['siroccor', 54], ['trilocrown', 54], ['sandrake', 55], ['titanore', 56]], 220, 'Dorran. I\'ve dug through every canyon in Meridia. Nothing has ever moved me. Let\'s see you try.', 'Hm. The mountain moved.', '', { potions: 2 }),
  T('Elite Lyra', 'lyra', [['saguarro', 54], ['locustorm', 55], ['shellmoss', 55], ['arachnight', 56], ['leafwraith', 57]], 220, 'I\'m Lyra! Forests, swamps, deserts... life finds a way everywhere. My team is proof!', 'You\'re a force of nature yourself!', '', { potions: 2 }),
  T('Elite Voss', 'voss', [['scarabolt', 55], ['galeon', 56], ['voltibex', 56], ['nimbulord', 57], ['stormwisp', 58]], 220, 'Voss, last of the Four. I was born in a thunderstorm on Skyspire. Let\'s make some lightning.', 'Grounded... The Champion is waiting.', '', { potions: 3 }),
];
function meridiaChampion() {
  return { ...rivalM('juno', 60, { ace: true, title: 'Champion' }), money: 100, potions: 3 };
}

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
  desert: [['Hiker', 'hiker', ['Ground', 'Rock']], ['Biker', 'biker', ['Toxic', 'Shadow']], ['Bird Keeper', 'birdkeeper', ['Flying']], ['Ace Trainer', 'acetrainer', ['Ground', 'Fire', 'Grass']]],
  autumn: [['Mystic', 'mystic', ['Spirit']], ['Lass', 'lass', ['Normal', 'Grass']], ['Bug Kid', 'bugkid', ['Bug']], ['Beauty', 'beauty', ['Grass', 'Fae']]],
};
// Meridia trainers lean on what lives nearby: a few classes fit its routes better
const CLASSES_M = {
  grass: [['Bug Kid', 'bugkid', ['Bug']], ['Lass', 'lass', ['Normal', 'Fae']], ['Youngster', 'boy', ['Normal', 'Electric']], ['Bird Keeper', 'birdkeeper', ['Flying']], ['Ace Trainer', 'acetrainer', ['Metal', 'Ice', 'Electric', 'Ground']]],
  forest: [['Bug Kid', 'bugkid', ['Bug']], ['Beauty', 'beauty', ['Grass', 'Toxic']]],
  cave: [['Hiker', 'hiker', ['Rock', 'Ground']], ['Mystic', 'mystic', ['Spirit', 'Shadow']], ['Biker', 'biker', ['Shadow', 'Bug']]],
  snow: [['Skier', 'skier', ['Ice']], ['Ace Trainer', 'acetrainer', ['Ice', 'Metal', 'Electric']], ['Hiker', 'hiker', ['Ground', 'Ice']], ['Bird Keeper', 'birdkeeper', ['Flying', 'Electric']]],
  sea: [['Swimmer', 'swimmer', ['Water']], ['Fisher', 'fisher', ['Water']], ['Sailor', 'sailor', ['Water', 'Brawl']]],
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
    const region = m.region || 'aldermoor';
    const [lo, hi] = m.lv || [5, 8];
    // only classes that have creatures to use at this point of the region
    const classes = ((region === 'meridia' && CLASSES_M[m.style]) || CLASSES[m.style] || CLASSES.grass).filter(([, , ty]) => poolFor(ty, lo, region).length);
    const [cls, look, types] = classes.length ? pickR(classes) : ['Youngster', 'boy', ['Normal']];
    const n = Math.min(4, (hi < 15 ? 1 : hi < 30 ? 2 : 3) + (R() < 0.4 ? 1 : 0));
    const party = [];
    const local = (m.encounters || []).map((e) => e[0]);
    for (let i = 0; i < n; i++) {
      const lvl = lo + Math.floor(R() * (hi - lo + 1));
      const pool = poolFor(types, lvl, region);
      const sp = pool.length ? pickR(pool) : local.length ? pickR(local) : 'bunnip';
      party.push([evolveFor(sp, lvl), lvl]);
    }
    t = T(`${cls} ${pickR(NAMES)}`, look, party, 18 + Math.floor(hi / 2), pickR(INTROS), pickR(LOSES), pickR(AFTERS));
  } else if (kind === 'gym') {
    const gym = GYMS[a];
    const lead = LEADERS[a];
    const lv = lead.party[0][1] - 3 + +b;
    const pool = poolFor([gym.type], lv, gym.region || 'aldermoor');
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

// In Meridia the rivals start fresh: a Meridia starter plus creatures they catch on the way.
// They left their Aldermoor teams with Maple, and only bring their old starter back for the big finale.
const COUNTER2 = { bramblecub: 'cindergecko', cindergecko: 'splotter', splotter: 'bramblecub' };
const RIVAL_POOLS_M = { kai: ['coyip', 'zaphog', 'squirebeetle', 'rimelet'], juno: ['flurrybun', 'chirpip', 'driftling', 'crysmite'] };
function rivalM(who, lvl, o = {}) {
  const party = [];
  const count = o.ace ? 4 : Math.min(4, Math.floor(lvl / 12));
  RIVAL_POOLS_M[who].slice(0, count).forEach((sp, i) => { const l = lvl - 2 - (i % 3); party.push([evolveFor(sp, l), l]); });
  party.push([evolveFor(G.rivals2[who], lvl), lvl]);
  if (o.ace && G.rivals && G.rivals[who]) party.push([evolveFor(G.rivals[who], lvl + 2), lvl + 2]);
  const nm = who === 'kai' ? 'Kai' : 'Juno';
  return { name: o.title ? `${o.title} ${nm}` : nm, look: who, party, money: 60, music: 'boss', potions: lvl > 30 ? 2 : lvl > 15 ? 1 : 0 };
}

// the rival names the player picked (defaults Kai / Juno)
export const rivalName = (who) => (G && G.rivalNames && G.rivalNames[who]) || (who === 'kai' ? 'Kai' : 'Juno');
const title = (n) => n.charAt(0) + n.slice(1).toLowerCase();
setNameHook((str) => {
  if (!G || !G.rivalNames) return str;
  const k = title(rivalName('kai')), j = title(rivalName('juno'));
  return str.replace(/\bKAI\b/g, k.toUpperCase()).replace(/\bKai\b/g, k).replace(/\bJUNO\b/g, j.toUpperCase()).replace(/\bJuno\b/g, j);
});

function build(t) { return { ...t, party: t.party.map(([sp, l]) => makeMon(sp, l, { ot: t.name })) }; }

// ---------- shared helpers ----------
async function whiteout() {
  await fadeOut(20);
  G.party.forEach(healFull);
  G.money = Math.floor(G.money / 2);
  if (world.map.e4 !== undefined || world.map.id === 'league_lobby') ['e4_0', 'e4_1', 'e4_2', 'e4_3', 'leagueOpen'].forEach((f) => setFlag(f, false));
  if (world.map.e4m !== undefined || world.map.id === 'league2_lobby') ['e4m_0', 'e4m_1', 'e4m_2', 'e4m_3', 'league2Open'].forEach((f) => setFlag(f, false));
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
// A character walks up to the player from a few tiles away (falls back to stepping in beside them).
async function appear(id, look) {
  const p = world.player;
  const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  for (const d of ['up', 'left', 'right', 'down']) {
    const [dx, dy] = D[d];
    let ok = true;
    for (let i = 1; i <= 3; i++) if (blocked(p.x + dx * i, p.y + dy * i)) { ok = false; break; }
    if (!ok) continue;
    const n = spawn({ id, look, x: p.x + dx * 3, y: p.y + dy * 3, dir: opposite[d] });
    p.dir = d;
    await showEmote(p, '!');
    await walk(n, [opposite[d], opposite[d]], 1);
    return n;
  }
  const s = freeNear(p);
  const n = spawn({ id, look, x: s.x, y: s.y, dir: opposite[s.d] });
  p.dir = s.d;
  await wait(10);
  return n;
}
// a rival walks off at normal speed, then disappears
async function walkAway(n) {
  const p = world.player;
  const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const away = n.x < p.x ? 'left' : n.x > p.x ? 'right' : n.y < p.y ? 'up' : 'down';
  const order = [away, ...['up', 'down', 'left', 'right'].filter((d) => d !== away && d !== opposite[away])];
  for (const d of order) {
    const [dx, dy] = D[d];
    let steps = 0;
    while (steps < 4 && !blocked(n.x + dx * (steps + 1), n.y + dy * (steps + 1), n)) steps++;
    if (steps >= 2) { await walk(n, Array(steps).fill(d), 1); break; }
  }
  despawn(n.id);
}
async function vanish(...ids) { fx.flash = 1; fx.flashColor = '#fff'; sfx('door'); ids.forEach(despawn); await wait(8); }
const MOTTO = ['NYX: When daylight fades and stars descend...', 'CORVO: ...the shadow falls, the dark ascends!', 'NYX: Nyx!', 'CORVO: Corvo!', 'BOTH: Team Eclipse! We cover every region in shadow!'];

// ---------- intro ----------
export async function newGameIntro(askName) {
  const scene = { draw(g) {
    g.fillStyle = '#101828'; g.fillRect(0, 0, 240, 160);
    if (scene.show) art.blit(g, scene.portrait, 92, 8, 56, 76);
    if (scene.mon) art.blit(g, scene.mon, 150, 40, 56, 56);
  } };
  const art = await import('./art.js');
  scene.portrait = art.trainerPortrait('maple', 'ready');
  setScene(scene);
  playMusic('indoor');
  await fadeIn(20);
  scene.show = true;
  await say('Hello there! Welcome to the world of WILDBOUND!', 'My name is Maple. People call me the Creature Professor.');
  scene.mon = art.creature('bunnip', 56);
  sfx('door');
  await say('This world is full of creatures, living in every region you can imagine.', 'Trainers travel from region to region, starting fresh every time, with only a partner or two by their side.');
  scene.mon = null;
  art.setPlayerLook('boy');
  scene.portrait = art.trainerPortrait('player', 'ready');
  const gi = await choose('Now, tell me about yourself. Are you a boy or a girl?', ['BOY', 'GIRL'], { w: 56, x: 178 });
  G.gender = gi === 1 ? 'girl' : 'boy';
  art.setPlayerLook(G.gender);
  scene.portrait = art.trainerPortrait('player', 'ready');
  await say('And what is your name?');
  G.name = await askName('Your name?', G.gender === 'girl' ? 'LILY' : 'TOM');
  await say(`Right! So your name is ${G.name}!`);
  scene.portrait = art.trainerPortrait('kai', 'ready');
  await say('This boy lives right next door. He\'s been your rival since you were little. What was his name again?');
  const kn = await askName('Rival\'s name?', 'KAI');
  scene.portrait = art.trainerPortrait('juno', 'ready');
  await say('And this girl is your other neighbor and rival. What\'s her name?');
  const jn = await askName('Rival\'s name?', 'JUNO');
  G.rivalNames = { kai: kn, juno: jn };
  scene.portrait = art.trainerPortrait('maple', 'ready');
  await say(`That's right! ${title(kn)} and ${title(jn)} have been waiting for this day too.`, `${G.name}! Your very own journey is about to begin!`);
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
    await walkAway(j);
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
      await Promise.all([walk(kai, ['down', 'down'], 1), walk(juno, ['down', 'down'], 1)]); despawn('tmp_kai'); despawn('tmp_juno');
      return true;
    }
    const won = await fight([rivalTrainer('kai', 14, [['gustling', 12]]), rivalTrainer('juno', 14, [['bunnip', 12]])], { double: true });
    if (!won) { despawn('tmp_kai'); despawn('tmp_juno'); return true; }
    await say('KAI: Even two against one... You\'re unbelievable.', 'JUNO: There are seven more Gyms in Aldermoor. Let\'s race to the League!', 'KAI: The Champion gets to take the ferry to a whole new region. That\'s gonna be me!');
    setFlag('tagDone');
    await Promise.all([walk(kai, ['down', 'down', 'down'], 1), walk(juno, ['down', 'down', 'down'], 1)]); despawn('tmp_kai'); despawn('tmp_juno');
    return true;
  },
  async kaiVoltara() {
    if (flag('kaiVoltara') || !G.badges.includes('thistle')) return false;
    const k = await appear('tmp_kai', 'kai');
    await say(`KAI: There you are, ${G.name}! I just got here too. Let's see who's grown more!`);
    await fight(rivalTrainer('kai', 25));
    await say('KAI: Hmph. Leader Jolt uses Electric types. Bring something that can dig in!');
    setFlag('kaiVoltara');
    await walkAway(k);
    return true;
  },
  async junoCoralport() {
    if (flag('junoCoral') || !G.badges.includes('volt')) return false;
    const j = await appear('tmp_juno', 'juno');
    await say(`JUNO: ${G.name}! Coralport is SO pretty. Okay, battle time!`);
    await fight(rivalTrainer('juno', 30));
    await say('JUNO: Leader Marina is tough. Grass and Electric moves will help!', 'JUNO: Oh, and I found out Team Eclipse is hiding in Lumen City, across the sea. Be careful!');
    setFlag('junoCoral');
    await walkAway(j);
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
    const jn = npcById('tmp_juno');
    await Promise.all([walkAway(kai), jn ? walkAway(jn) : null]);
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
    await walkAway(j);
    return true;
  },
  // ---------- Meridia: rivals ----------
  async kaiRoute12() {
    if (flag('kaiR12') || !flag('rivalsMeridia') || !G.badges.includes('hive')) return false;
    await say(`KAI: Hey! ${G.name}!`);
    const kai = await appear('tmp_kai', 'kai');
    await say('KAI: First badge, huh? Me too. Let\'s see whose new team is better!');
    const won = await fight(rivalM('kai', 15));
    await say(won ? 'KAI: Tch. My team\'s still young. Next time!' : 'KAI: Ha! Fresh start, same result... for you!', 'KAI: Sunscar\'s just ahead. The sand gets everywhere.');
    setFlag('kaiR12');
    await walkAway(kai);
    return true;
  },
  async junoMesa() {
    if (flag('junoMesa') || !flag('rivalsMeridia') || !G.badges.includes('dune')) return false;
    await say(`JUNO: ${G.name}! Over here!`);
    const j = await appear('tmp_juno', 'juno');
    await say('JUNO: I\'ve been training on the mesa all week. The wind here is amazing! Battle me!');
    const won = await fight(rivalM('juno', 21));
    await say(won ? 'JUNO: You\'re still so strong... I\'m going to get there, you\'ll see.' : 'JUNO: Yes! I won! Kai is never going to believe this!', 'JUNO: Leader Aeron loves Flying types. Bring something that can bring them down!');
    setFlag('junoMesa');
    await walkAway(j);
    return true;
  },
  async rivalsKingsgate() {
    if (flag('rivalsKing') || !flag('rivalsMeridia') || !G.badges.includes('bog')) return false;
    if (G.party.filter((m) => m.hp > 0).length < 2) return false;
    await say(`KAI: There you are, ${G.name}!`);
    const kai = await appear('tmp_kai', 'kai');
    const s = freeNear(world.player);
    spawn({ id: 'tmp_juno', look: 'juno', x: s.x, y: s.y, dir: opposite[s.d] });
    await say('JUNO: We decided we\'re done losing one at a time.', 'KAI: Two against one. Let\'s go!');
    const won = await fight([rivalM('kai', 30), rivalM('juno', 30)], { double: true });
    await say(won ? 'KAI: ...Even together? Seriously?' : 'JUNO: Teamwork wins!', 'JUNO: Have you seen the people in dark uniforms around here? They were asking about legends.', 'KAI: Team Eclipse. They followed us all the way to Meridia. Keep your eyes open.');
    setFlag('rivalsKing');
    const jn = npcById('tmp_juno');
    await Promise.all([walkAway(kai), jn ? walkAway(jn) : null]);
    return true;
  },
  async rivalsStorm() {
    if (flag('rivalsStorm') || !flag('rivalsMeridia') || !G.badges.includes('rime')) return false;
    if (G.party.filter((m) => m.hp > 0).length < 2) return false;
    await say(`JUNO: ${G.name}! Wait up!`);
    const j = await appear('tmp_juno', 'juno');
    const s = freeNear(world.player);
    spawn({ id: 'tmp_kai', look: 'kai', x: s.x, y: s.y, dir: opposite[s.d] });
    await say('KAI: Seven badges each. One storm. Let\'s settle who\'s really ahead!', 'JUNO: Tag battle! No holding back this time!');
    const won = await fight([rivalM('kai', 41), rivalM('juno', 41)], { double: true });
    await say(won ? 'JUNO: Okay, okay, you\'re ahead. For now!' : 'KAI: That\'s how it\'s done!', 'KAI: Skyspire\'s past Storm Cave. Light it up or you\'ll get lost.', 'JUNO: See you at the League!');
    setFlag('rivalsStorm');
    const k = npcById('tmp_kai');
    await Promise.all([walkAway(j), k ? walkAway(k) : null]);
    return true;
  },
  async kaiSummit() {
    if (flag('kaiSummit') || !flag('rivalsMeridia') || regionBadges(G, 'meridia') < 8) return false;
    await say(`KAI: ${G.name}. Hold it.`);
    const kai = await appear('tmp_kai', 'kai');
    await say('KAI: Juno went ahead. She already beat the Elite Four. She\'s the Champion now.', 'KAI: I sent for my old partner from Maple\'s lab. Before you face her, you face me. Full strength!');
    const won = await fight(rivalM('kai', 52, { ace: true }));
    await say(won ? 'KAI: ...Fine. You\'re the one who should face her. Go win it.' : 'KAI: Heh. Maybe I should be the one challenging Juno...', 'KAI: Zenith Plateau is right through here. Good luck, rival.');
    setFlag('kaiSummit');
    await walkAway(kai);
    return true;
  },
  // ---------- Meridia: Team Eclipse ----------
  async eclipseWood() {
    if (flag('eclipseWood') || !flag('cedarStarter')) return false;
    await say('???: Come on, hold STILL, you little...!');
    const c = await appear('ec_corvo', 'corvo');
    await say('CORVO: Huh?! YOU again?! What are you doing in Meridia?!', 'CORVO: Team Eclipse is here on official business. Those three partner creatures in these woods are coming with me!', 'CORVO: Vex says rare creatures make the best bait for legends. Now beat it!');
    const won = await fight(TRAINERS.corvo_m1);
    if (!won) { despawn('ec_corvo'); return true; }
    await say('CORVO: Ugh! Fine! Keep your forest critters!', 'CORVO: But we\'ve got a radar that can sense all four of Meridia\'s legends. You can\'t stop all of us!');
    setFlag('eclipseWood');
    await vanish('ec_corvo');
    return true;
  },
  async eclipseCanyon() {
    if (flag('eclipseCanyon') || !G.badges.includes('dune')) return false;
    if (G.party.filter((m) => m.hp > 0).length < 2) return false;
    await say('NYX: The radar is going crazy! The sun legend has to be close!');
    await appear('ec_nyx', 'nyx');
    const cs = freeNear(world.player);
    spawn({ id: 'ec_corvo', look: 'corvo', x: cs.x, y: cs.y, dir: opposite[cs.d] });
    playMusic('boss');
    await say('CORVO: Nyx! It\'s that kid from the woods!', 'NYX: Oh, it\'s THIS one. The one who wrecked everything in Aldermoor.', ...MOTTO, 'NYX: Solkhan, the lion of the sun, sleeps in this canyon. Vex wants it, and you\'re in the way!');
    const won = await fight([TRAINERS.nyx_m2, TRAINERS.corvo_m2], { double: true });
    if (!won) { despawn('ec_nyx'); despawn('ec_corvo'); playMusic(world.map.music); return true; }
    await say('NYX: Grr... fine. The radar needs recharging anyway.', 'CORVO: We\'ll be at the factory in Ironhaven, working on something big. Not that you\'ll ever find it!', 'NYX: Corvo!! You just TOLD them!', 'BOTH: Team Eclipse is blasting off!');
    setFlag('eclipseCanyon');
    await vanish('ec_nyx', 'ec_corvo');
    playMusic(world.map.music);
    return true;
  },
  async eclipseGlacier() {
    if (flag('eclipseGlacier') || !flag('eclipseFactory')) return false;
    if (G.party.filter((m) => m.hp > 0).length < 2) return false;
    await say('GRUNT: Keep the freezer cannon steady! The ice serpent is waking up!');
    await appear('ec_g1', 'grunt');
    const s = freeNear(world.player);
    spawn({ id: 'ec_g2', look: 'grunt', x: s.x, y: s.y, dir: opposite[s.d] });
    playMusic('boss');
    await say('GRUNT: The Champion?! Stop them, quick!', 'GRUNT: We\'re trapping Glacieth in a block of ice so Vex can carry it to Summit Pass!');
    const won = await fight([TRAINERS.eclipse_m4a, TRAINERS.eclipse_m4b], { double: true });
    if (!won) { despawn('ec_g1'); despawn('ec_g2'); playMusic(world.map.music); return true; }
    await say('GRUNT: The cannon\'s wrecked... Retreat!', 'GRUNT: It doesn\'t matter! Vex only needs ONE legend\'s energy to wake Meridion!');
    setFlag('eclipseGlacier');
    await vanish('ec_g1', 'ec_g2');
    playMusic(world.map.music);
    return true;
  },
  async eclipseSummit() {
    if (flag('eclipseSummit') || !G.badges.includes('dusk')) return false;
    if (G.party.filter((m) => m.hp > 0).length < 2) return false;
    await say('VEX: At last. The peak of Meridia, where the sun and the storm meet.');
    await appear('ec_vex', 'vex');
    const s = freeNear(world.player);
    spawn({ id: 'ec_corvo', look: 'corvo', x: s.x, y: s.y, dir: opposite[s.d] });
    playMusic('boss');
    await say('VEX: You. The child who drove me out of Aldermoor.', 'VEX: Meridion sleeps beneath this mountain. Whoever controls it controls the weather of the whole region.', 'VEX: With our beacon, Team Eclipse will cover Meridia in endless night. Corvo! We finish this together!', 'CORVO: Yes, boss!');
    const won = await fight([TRAINERS.vex_m, TRAINERS.corvo_m5], { double: true });
    if (!won) { despawn('ec_vex'); despawn('ec_corvo'); playMusic(world.map.music); return true; }
    await say('VEX: ...The beacon... it\'s overloading!', 'Rumble...!', 'VEX: The mountain is waking up! Corvo, fall back! FALL BACK!', 'VEX: This isn\'t over. There are other regions, and Team Eclipse is patient.');
    setFlag('eclipseSummit');
    await vanish('ec_vex', 'ec_corvo');
    playMusic(world.map.music);
    refreshNpcs();
    await say('...Something enormous stirs deeper in the pass. Meridion has awakened!');
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
  // Meridia: rivals and Team Eclipse
  const col = (m, x, script) => t(m, x, 1, 1, MAPS[m].h - 2, script);
  const row = (m, y, script) => t(m, 1, y, MAPS[m].w - 2, 1, script);
  col('whisperwood', 14, 'eclipseWood');
  col('route12', MAPS.route12.w - 5, 'kaiRoute12');
  row('echocanyon', 3, 'eclipseCanyon');
  row('mesaridge', MAPS.mesaridge.h - 3, 'junoMesa');
  row('kingsgate', 4, 'rivalsKingsgate');
  row('route17', 7, 'eclipseGlacier');
  col('route18', MAPS.route18.w - 5, 'rivalsStorm');
  col('summitpass', MAPS.summitpass.w - 6, 'eclipseSummit');
  col('summitpass', 3, 'kaiSummit');
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
  await offerNickname(m, SPECIES[sp].name);
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
  if (kai) { await walk(kai, ['down', 'down', 'down', 'down', 'right', 'right', 'down'], 1); despawn(kai.id); }
  if (juno) { await walk(juno, ['down', 'down', 'down', 'down', 'left', 'left', 'down'], 1); despawn(juno.id); }
  setFlag('labRivals', false);
  refreshNpcs();
  await say('MAPLE: Route 1 is north of town. There are eight Gyms in Aldermoor. Collect all the badges and the League awaits!', 'Good luck out there!');
  save();
}

// Take the ferry to another region: only the chosen partners come along; everyone else
// waits in this region's PC box until you return.
const PORTS = { meridia: ['solace', 13, 16, 'up', 'center_solace'], aldermoor: ['pebbleton', 12, 1, 'up', 'center_peb'], azurine: ['coralline', 13, 16, 'up', 'center_coralline'] };
async function sail(to, chosen) {
  const keep = new Set(chosen.map((m) => m.uid));
  const stay = G.party.filter((m) => !keep.has(m.uid));
  (G.boxes[G.region] = G.boxes[G.region] || []).push(...stay);
  G.party = G.party.filter((m) => keep.has(m.uid));
  G.partners = [...keep];
  await say(`SAILOR: ${chosen.map(name).join(' and ')} will sail with you! All aboard!`);
  await fadeOut(30);
  sfx('door');
  G.region = to;
  G.regionsVisited = G.regionsVisited || ['aldermoor'];
  const first = !G.regionsVisited.includes(to);
  if (first) G.regionsVisited.push(to);
  G.boxes[to] = G.boxes[to] || [];
  const [map, x, y, dir, center] = PORTS[to];
  G.lastHeal = { map: center, x: 5, y: 4, dir: 'up' };
  loadMap(map, x, y, dir);
  refreshNpcs();
  save();
  await fadeIn(30);
  const where = REGION_NAMES[to];
  await say(`After a long voyage, the ferry docked in ${where}!`);
  if (first && to === 'meridia') {
    sfx('item');
    await say('...Your phone is ringing!', `MOM: ${G.name}! Did you make it to Meridia safe and sound?`, 'MOM: I promised I\'d send you a map of every new region. Check your TOWN MAP: Meridia is on it now!', 'MOM: Professor Cedar\'s lab is right there in Port Solace. Go say hello. Love you!');
    setFlag('gotMap_meridia');
  }
  if (first && to === 'azurine') {
    sfx('item');
    await say('...Your phone is ringing!', `MOM: ${G.name}! A third region? You're turning into a real world traveller!`, 'MOM: I sent the map of the Azurine Isles to your TOWN MAP. So many islands!', 'MOM: Professor Marlowe has a lab right there in Coralline Bay. Say hi for me!');
    setFlag('gotMap_azurine');
  }
}

// Professor Cedar: the Meridia starters, the obedience talk, and DEX progress afterwards
async function cedarTalk() {
  if (!flag('metCedar')) {
    setFlag('metCedar');
    await say(`CEDAR: Oh! You must be ${G.name}, the Champion from Aldermoor. Professor Maple told me all about you.`, 'CEDAR: I\'m Professor Cedar. I study the creatures of Meridia.');
  }
  if (!flag('cedarStarter')) {
    await say('CEDAR: And you came on the perfect day! Meridia\'s three partner creatures just arrived this morning.',
      'CEDAR: Before you choose, there\'s something every visitor should know.',
      'CEDAR: Creatures here respect trainers who have proven themselves in Meridia. Your partners from Aldermoor are strong... maybe a bit too strong.',
      `CEDAR: Until you earn Meridia's badges, creatures above level ${OBEY_CAPS[regionBadges(G, 'meridia')]} may ignore your orders now and then. A bit like being paralyzed, but they just won't listen.`,
      'CEDAR: Every Meridia badge raises that limit. With all eight, every creature will listen to you.',
      'CEDAR: A partner from Meridia grows up with you, so it always listens. That\'s why I\'d like you to have one.');
    const aide = npcById('cedar_aide');
    if (aide) { faceEachOther(aide); await say('AIDE: Here they are, Professor!'); }
    await say('CEDAR: Bramblecub, the Grass type. Cindergecko, the Fire type. Splotter, the Water type.', 'CEDAR: Take your time and pick the one you like best!');
    const sp = await starterScreen(MERIDIA_STARTERS);
    const m = makeMon(sp, 5, { ot: G.name });
    addToCollection(m);
    G.starter2 = sp;
    sfx('badge');
    await say(`${G.name} received ${SPECIES[sp].name}!`);
    await offerNickname(m, SPECIES[sp].name);
    setFlag('cedarStarter');
    addItem('orb', 10);
    sfx('item');
    await say(`${G.name} received 10 Capture Orbs!`, 'CEDAR: Your DEX already has Meridia\'s pages loaded. Fill them in for me!',
      'CEDAR: The other two partners like to wander in Whisperwood, east of Mossbrook. You might meet them there.',
      'CEDAR: Mossbrook is north up Route 11. That\'s where the first Gym is. Good luck!');
    refreshNpcs();
    await rivalsArrive();
    save();
    return;
  }
  if (!flag('rivalsMeridia')) { await rivalsArrive(); save(); return; }
  const MER = regionDex('meridia');
  const c = MER.filter((x) => G.dex.caught[x]).length;
  await say(`CEDAR: You've caught ${c} of ${MER.length} kinds of creatures in Meridia.`);
  if (c >= 15 && !flag('cedarGift')) { setFlag('cedarGift'); addItem('ultraorb', 5); sfx('item'); await say('CEDAR: Fantastic! Here, take these 5 Ultra Orbs.'); }
  else if (c >= 60 && !flag('cedarGift2')) { setFlag('cedarGift2'); addItem('masterorb', 1); sfx('item'); await say('CEDAR: Over half of Meridia! You\'ve earned a MASTER ORB. Use it on a legend.'); }
  else if (c >= MER.length) await say('CEDAR: Every creature in Meridia! You and Maple will have to write a book together.');
  else await say('CEDAR: Some creatures only show up in one patch of grass, far off the trail. Search every corner!');
}

// Kai and Juno take the next ferry and pick the other two Meridia starters
async function rivalsArrive() {
  if (flag('rivalsMeridia')) return;
  const p = world.player;
  await say('???: Wait! Don\'t give them all away!');
  const kai = spawn({ id: 'tmp_kai', look: 'kai', x: 4, y: 8, dir: 'up' });
  const juno = spawn({ id: 'tmp_juno', look: 'juno', x: 6, y: 8, dir: 'up' });
  await Promise.all([walk(kai, ['up', 'up'], 1), walk(juno, ['up', 'up'], 1)]);
  p.dir = 'down';
  await say(`KAI: ${G.name}! You didn't think we'd let you have Meridia to yourself, did you?`,
    'JUNO: We caught the very next ferry! We left our teams with Professor Maple. A fresh start, so it\'s fair.',
    'CEDAR: My! More trainers from Aldermoor. Well, there are two partners left...');
  G.rivals2 = { kai: COUNTER2[G.starter2], juno: MERIDIA_STARTERS.find((x) => x !== G.starter2 && x !== COUNTER2[G.starter2]) };
  sfx('item');
  await say(`KAI: Then I'll take ${SPECIES[G.rivals2.kai].name}! It has the edge on yours. Again.`,
    `JUNO: And ${SPECIES[G.rivals2.juno].name} is coming with me! Hello, partner!`,
    `KAI: We're going to catch a whole new team out there. Next time we meet, we battle. Both of us, if we feel like it!`,
    'JUNO: See you on the road!');
  setFlag('rivalsMeridia');
  await Promise.all([walk(kai, ['down', 'down', 'down'], 1), walk(juno, ['down', 'down', 'down'], 1)]);
  despawn('tmp_kai'); despawn('tmp_juno');
}

// The ferry offers every region you may sail to from here. The Isles open once you're
// Champion of Meridia.
const REGION_NAMES = { aldermoor: 'Aldermoor', meridia: 'Meridia', azurine: 'Azurine Isles' };
async function ferryTo(here) {
  const dests = ['aldermoor', 'meridia', 'azurine'].filter((r) => r !== here && (r !== 'azurine' || flag('champion_meridia')));
  if (here === 'meridia' && !flag('champion_meridia')) await say('SAILOR: Ships to the Azurine Isles only take the Champion of Meridia, I\'m afraid.');
  const opts = [...dests.map((r) => REGION_NAMES[r].toUpperCase()), 'STAY'];
  const i = dests.length === 1 ? ((await yesNo(`Sail to ${REGION_NAMES[dests[0]]}?`)) ? 0 : 1) : await choose('Where would you like to sail?', opts);
  if (i < 0 || i >= dests.length) { await say(`SAILOR: Enjoy ${REGION_NAMES[here]}!`); return; }
  await say('Only one or two partners may travel with you. Everyone else waits in this region\'s PC.');
  const chosen = await partnerScreen();
  if (!chosen) { await say('SAILOR: Take your time.'); return; }
  await sail(dests[i], chosen);
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
  if (!L) {
    await say('LEADER: Welcome to my Gym! My creatures are still training for the season.', 'Come back once they\'re ready, and we\'ll have a real battle!');
    return;
  }
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
    const ALD = regionDex('aldermoor');
    const c = ALD.filter((x) => G.dex.caught[x]).length;
    await say(`MAPLE: How is your DEX coming along? You've caught ${c} of ${ALD.length} kinds of creatures in Aldermoor.`);
    if (c >= 15 && !flag('mapleGift')) { setFlag('mapleGift'); addItem('greatorb', 10); sfx('item'); await say('Wonderful progress! Take these 10 Great Orbs.'); }
    else if (c >= 60 && !flag('mapleGift2')) { setFlag('mapleGift2'); addItem('masterorb', 1); sfx('item'); await say('Over half the region! You deserve this: a MASTER ORB. It never fails. Save it for something legendary.'); }
    else if (c >= ALD.length) await say('You caught every creature in Aldermoor! You are a true creature expert!');
    else await say('Creatures you leave in your PC box stay here in Aldermoor with me when you travel. I\'ll take good care of them!');
  },
  async shale() { await gymLeader('stone'); },
  async gym() { await gymLeader(world.map.gym); },
  // Name Rater: rename any creature you caught or received yourself
  async namerater() {
    if (!(await yesNo('NAME RATER: Hello, hello! I am the Name Rater. Shall I rate the nickname of one of your creatures?'))) { await say('NAME RATER: Come back any time!'); return; }
    const i = await partyScreen({ mode: 'pick', title: 'Rate which creature\'s name?' });
    if (i < 0) { await say('NAME RATER: Come back any time!'); return; }
    const m = G.party[i], sp = SPECIES[m.sp].name;
    if (m.ot && m.ot !== G.name) { await say(`NAME RATER: ${name(m)}... a fine name its first trainer, ${m.ot}, gave it.`, 'It would be rude of me to change it!'); return; }
    if (!(await yesNo(`NAME RATER: ${name(m)}, is it? A decent name. Shall I give it a better one?`))) { await say('NAME RATER: Then it shall stay as it is!'); return; }
    const v = await askName(`New nickname for ${sp}`, name(m), { keepCase: true, max: 12 });
    const before = name(m);
    m.nick = v && v.toLowerCase() !== sp.toLowerCase() ? v : null;
    if (name(m) === before) await say(`NAME RATER: That's the same as before! ${before} it stays.`);
    else await say(`NAME RATER: From now on this creature shall be known as ${name(m)}!`, 'A fine name indeed. Take good care of it!');
  },
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
    await ferryTo('aldermoor');
  },
  async ferryHome() {
    await say('SAILOR: Welcome to Meridia! This ferry runs to the other regions whenever you like.');
    await ferryTo('meridia');
  },
  async ferryAzurine() {
    await say('SAILOR: Aloha! Welcome to the Azurine Isles. This ferry runs back to the other regions whenever you like.');
    await ferryTo('azurine');
  },
  async cedar() { await cedarTalk(); },
  async marlowe() {
    if (!flag('metMarlowe')) {
      setFlag('metMarlowe');
      await say(`MARLOWE: Ahoy! You must be ${G.name}. Two regions conquered already? Cedar wrote me all about you!`, 'MARLOWE: I\'m Professor Marlowe. I study the creatures that live between the islands: on reefs, in lagoons, up on the volcano.');
    }
    await say('MARLOWE: The Isles\' three partner creatures are still out on the reefs. I\'m tracking them down!', 'MARLOWE: Until then, have a look around. Eight islands, eight Gyms. Palmhaven is just up the beach.');
  },
  async cedarAide() {
    if (!flag('cedarStarter')) { await say('AIDE: The three partner creatures arrived this morning!', 'AIDE: Go talk to the professor. She\'s been waiting for you!'); return; }
    const cap = OBEY_CAPS[regionBadges(G, 'meridia')];
    await say(`AIDE: With ${regionBadges(G, 'meridia')} Meridia badge${regionBadges(G, 'meridia') === 1 ? '' : 's'}, creatures up to level ${cap > 99 ? 100 : cap} will always listen to you here.`, 'AIDE: Stronger ones might ignore you now and then. Every badge you earn raises the limit!');
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
  async leagueGuard2() {
    if (flag('champion_meridia')) { await say('GUARD: Welcome back, Champion of Meridia! The Elite Four are ready for a rematch.'); setFlag('league2Open'); ['e4m_0', 'e4m_1', 'e4m_2', 'e4m_3', 'e4m_4'].forEach((f) => setFlag(f, false)); return; }
    if (regionBadges(G, 'meridia') < 8) { await say(`GUARD: Welcome to the Meridia League! You need all eight Meridia badges to challenge it.`, `GUARD: You have ${regionBadges(G, 'meridia')}. Come back when you have them all!`); return; }
    if (await yesNo('GUARD: Beyond this door are Meridia\'s Elite Four and its Champion. You must win every battle in a row. Are you ready?')) {
      setFlag('league2Open'); await say('GUARD: Then go! The door on the right is open. Good luck!');
    }
  },
  async elite2() {
    const i = world.map.e4m;
    const L = ELITE2[i];
    const short = L.name.split(' ').pop().toUpperCase();
    if (flag('e4m_' + i)) { await say(`${short}: Go on. The next room awaits.`); return; }
    await say(`${short}: ${L.intro}`);
    const won = await fight(L);
    if (!won) return;
    setFlag('e4m_' + i);
    await say(`${short}: ${L.lose}`, 'The door at the back opened!');
  },
  async champion2() {
    if (flag('e4m_4')) { await say('JUNO: Go on through. Professor Cedar is waiting for you.'); return; }
    await say(`JUNO: ${G.name}! I knew you'd make it here.`, 'JUNO: I beat the Elite Four first this time. I\'m Meridia\'s Champion!', 'JUNO: And I brought my partner from Aldermoor back for this. Everything I\'ve got, against everything you\'ve got!');
    const won = await fight(meridiaChampion());
    if (!won) return;
    setFlag('e4m_4');
    await say('JUNO: ...Wow. You really are something else.', 'JUNO: Meridia\'s yours, Champion. Go on, the Hall of Fame is through there!', 'The door to the Hall of Fame opened!');
  },
  async hallOfFame2() {
    if (flag('champion_meridia')) { await say('CEDAR: Welcome back, Champion! Your record in Meridia\'s Hall of Fame is safe.'); return; }
    playMusic('victory');
    await say(`CEDAR: ${G.name}! Congratulations! You are the Champion of Meridia!`, 'CEDAR: Two regions, two titles. Professor Maple is going to be so proud.');
    setFlag('champion_meridia');
    G.hallOfFame = (G.hallOfFame || []).concat([{ date: Date.now(), region: 'meridia', team: G.party.map((m) => `${name(m)} Lv${m.level}`) }]);
    sfx('badge');
    await say('CEDAR: Every creature in Meridia listens to you now.', 'CEDAR: Stay as long as you like. Fill your DEX, and find the legends that still hide around Meridia!');
    save();
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
    if (n.trainer && n.pending) {
      await say('TRAINER: My team is still training out here!', 'Let\'s battle another time, once they\'re ready.');
      return;
    }
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
  if (won && n.trainer === 'eclipse_m3') await eclipseFactory(n);
}

// after Nyx falls in the Ironhaven factory, she lets the plan slip
async function eclipseFactory(n) {
  await say('NYX: Ugh! Fine! You want to know so badly? Here!',
    'NYX: This factory built a radar that can track all four of Meridia\'s legends, and a beacon to control the strongest one.',
    'NYX: Solkhan in the canyon, Glacieth in the snow, Thundrael in the storms... and Meridion, the one that rules them all, sleeping under Summit Pass.',
    'NYX: Vex already took the beacon. Our grunts are heading south to trap Glacieth for its power. You\'re too late!');
  setFlag('eclipseFactory');
  await vanish(n.id);
  refreshNpcs();
  await say('The factory machines powered down. Team Eclipse is heading for Route 17!');
}

// for tests and debugging
export const _debug = { getTrainer, LEADERS, ELITE2, ELITE, meridiaChampion, TRAINERS };
