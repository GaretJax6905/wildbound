// Game data: types, moves, items, and the creature list (built from species.js).
// Everything here is original.
import { RAW_SPECIES, HAND_LEARNSETS } from './species.js';

export const TYPES = ['Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Brawl', 'Toxic', 'Ground', 'Flying', 'Mind', 'Bug', 'Rock', 'Spirit', 'Dragon', 'Shadow', 'Metal', 'Fae'];
export const TYPE_COLORS = {
  Normal: '#a8a878', Fire: '#f08030', Water: '#6890f0', Grass: '#78c850', Electric: '#e8c020', Ice: '#78c8d8',
  Brawl: '#c03028', Toxic: '#a040a0', Ground: '#d8b058', Flying: '#a890f0', Mind: '#f85888', Bug: '#a8b820',
  Rock: '#b8a038', Spirit: '#705898', Dragon: '#7038f8', Shadow: '#705848', Metal: '#9898b8', Fae: '#e890c8',
};
// Physical vs special is decided by the move's type, like the classic games.
export const SPECIAL_TYPES = new Set(['Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Mind', 'Dragon', 'Shadow', 'Fae']);

const CHART = {
  Normal: { Rock: 0.5, Spirit: 0, Metal: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Metal: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Toxic: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Metal: 0.5 },
  Electric: { Water: 2, Grass: 0.5, Electric: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Metal: 0.5 },
  Brawl: { Normal: 2, Ice: 2, Toxic: 0.5, Flying: 0.5, Mind: 0.5, Bug: 0.5, Rock: 2, Spirit: 0, Shadow: 2, Metal: 2, Fae: 0.5 },
  Toxic: { Grass: 2, Toxic: 0.5, Ground: 0.5, Rock: 0.5, Spirit: 0.5, Metal: 0, Fae: 2 },
  Ground: { Fire: 2, Grass: 0.5, Electric: 2, Toxic: 2, Flying: 0, Bug: 0.5, Rock: 2, Metal: 2 },
  Flying: { Grass: 2, Electric: 0.5, Brawl: 2, Bug: 2, Rock: 0.5, Metal: 0.5 },
  Mind: { Brawl: 2, Toxic: 2, Mind: 0.5, Shadow: 0, Metal: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Brawl: 0.5, Toxic: 0.5, Flying: 0.5, Mind: 2, Spirit: 0.5, Shadow: 2, Metal: 0.5, Fae: 0.5 },
  Rock: { Fire: 2, Ice: 2, Brawl: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Metal: 0.5 },
  Spirit: { Normal: 0, Mind: 2, Spirit: 2, Shadow: 0.5 },
  Dragon: { Dragon: 2, Metal: 0.5, Fae: 0 },
  Shadow: { Brawl: 0.5, Mind: 2, Spirit: 2, Shadow: 0.5, Fae: 0.5 },
  Metal: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Metal: 0.5, Fae: 2 },
  Fae: { Fire: 0.5, Brawl: 2, Toxic: 0.5, Dragon: 2, Shadow: 2, Metal: 0.5 },
};
export function effectiveness(moveType, defTypes) {
  return defTypes.reduce((m, t) => m * (CHART[moveType][t] ?? 1), 1);
}

// effect keys: burn/par/sleep/poison (chance %), stat {target:'foe'|'self', stat, n, chance}, drain %, recoil, priority
const M = (name, type, power, acc, pp, extra = {}) => ({ name, type, power, acc, pp, ...extra });
export const MOVES = {
  // Normal
  tackle: M('Tackle', 'Normal', 40, 100, 35), scratch: M('Scratch', 'Normal', 40, 100, 35),
  quickjab: M('Quick Jab', 'Normal', 40, 100, 30, { priority: 1 }), chomp: M('Chomp', 'Normal', 60, 100, 25),
  headbutt: M('Headbutt', 'Normal', 70, 100, 15), bodyslam: M('Body Slam', 'Normal', 85, 100, 15, { par: 30 }),
  megaimpact: M('Mega Impact', 'Normal', 120, 90, 5, { recoil: 4 }),
  growl: M('Growl', 'Normal', 0, 100, 40, { stat: { target: 'foe', stat: 'atk', n: -1 } }),
  tailwag: M('Tail Wag', 'Normal', 0, 100, 30, { stat: { target: 'foe', stat: 'def', n: -1 } }),
  harden: M('Harden', 'Normal', 0, 0, 30, { stat: { target: 'self', stat: 'def', n: 1 } }),
  powerup: M('Power Up', 'Normal', 0, 0, 30, { stat: { target: 'self', stat: 'atk', n: 1 } }),
  quickstep: M('Quick Step', 'Normal', 0, 0, 30, { stat: { target: 'self', stat: 'spe', n: 2 } }),
  lullaby: M('Lullaby', 'Normal', 0, 55, 15, { sleep: 100 }),
  // field moves (taught by Trail Discs)
  slash: M('Slash', 'Normal', 70, 100, 20), glow: M('Glow', 'Normal', 0, 100, 20, { stat: { target: 'foe', stat: 'acc', n: -1 } }),
  waveride: M('Wave Ride', 'Water', 90, 100, 15), heave: M('Heave', 'Brawl', 80, 100, 15),
  shatter: M('Shatter', 'Brawl', 40, 100, 15, { stat: { target: 'foe', stat: 'def', n: -1, chance: 50 } }), soar: M('Soar', 'Flying', 90, 95, 15),
  // Fire
  ember: M('Ember', 'Fire', 40, 100, 25, { burn: 10 }), flamefang: M('Flame Fang', 'Fire', 65, 95, 15, { burn: 10 }),
  blazerush: M('Blaze Rush', 'Fire', 85, 100, 15, { burn: 10 }), inferno: M('Inferno Burst', 'Fire', 110, 85, 5, { burn: 30 }),
  scorchhaze: M('Scorch Haze', 'Fire', 0, 85, 15, { burn: 100 }),
  // Water
  waterjet: M('Water Jet', 'Water', 40, 100, 25), bubbleburst: M('Bubble Burst', 'Water', 65, 100, 20, { stat: { target: 'foe', stat: 'spe', n: -1, chance: 10 } }),
  tidecrash: M('Tide Crash', 'Water', 85, 100, 10), torrent: M('Torrent Blast', 'Water', 110, 80, 5),
  // Grass
  leafflick: M('Leaf Flick', 'Grass', 40, 100, 25), vinelash: M('Vine Lash', 'Grass', 55, 100, 20), seeddrain: M('Seed Drain', 'Grass', 50, 100, 15, { drain: 50 }),
  bramble: M('Bramble Burst', 'Grass', 85, 100, 10), solarlance: M('Solar Lance', 'Grass', 110, 90, 5),
  sporepuff: M('Spore Puff', 'Grass', 0, 75, 15, { sleep: 100 }), stunpollen: M('Stun Pollen', 'Grass', 0, 75, 20, { par: 100 }),
  // Electric
  spark: M('Spark', 'Electric', 40, 100, 30, { par: 10 }), zapbolt: M('Zap Bolt', 'Electric', 65, 100, 15, { par: 10 }),
  voltdive: M('Volt Dive', 'Electric', 90, 100, 10, { par: 10 }), thundercrash: M('Thunder Crash', 'Electric', 110, 70, 5, { par: 30 }),
  staticwave: M('Static Wave', 'Electric', 0, 90, 20, { par: 100 }),
  // Ice
  frostnip: M('Frost Nip', 'Ice', 40, 100, 25), icicleshot: M('Icicle Shot', 'Ice', 60, 100, 20),
  glacierbeam: M('Glacier Beam', 'Ice', 90, 100, 10), blizzardgale: M('Blizzard Gale', 'Ice', 110, 70, 5),
  chillmist: M('Chill Mist', 'Ice', 0, 95, 20, { stat: { target: 'foe', stat: 'spe', n: -2 } }),
  // Brawl
  palmstrike: M('Palm Strike', 'Brawl', 40, 100, 30), kneestrike: M('Knee Strike', 'Brawl', 70, 100, 15),
  titanfist: M('Titan Fist', 'Brawl', 100, 90, 10), haymaker: M('Haymaker', 'Brawl', 120, 70, 5),
  brace: M('Brace', 'Brawl', 0, 0, 20, { stat: { target: 'self', stat: 'atk', n: 2 } }),
  // Toxic
  acidspit: M('Acid Spit', 'Toxic', 40, 100, 30, { poison: 20 }), venomfang: M('Venom Fang', 'Toxic', 60, 100, 20, { poison: 30 }),
  sludgewave: M('Sludge Wave', 'Toxic', 90, 100, 10, { poison: 30 }), toxicburst: M('Toxic Burst', 'Toxic', 110, 80, 5, { poison: 40 }),
  poisonmist: M('Poison Mist', 'Toxic', 0, 85, 20, { poison: 100 }),
  // Ground
  mudslap: M('Mud Slap', 'Ground', 20, 100, 10, { stat: { target: 'foe', stat: 'acc', n: -1, chance: 100 } }),
  sandtoss: M('Sand Toss', 'Ground', 0, 100, 15, { stat: { target: 'foe', stat: 'acc', n: -1 } }),
  digclaw: M('Dig Claw', 'Ground', 60, 100, 20), tremor: M('Tremor', 'Ground', 80, 100, 10), earthsplit: M('Earthsplit', 'Ground', 100, 100, 10),
  // Flying
  peck: M('Peck', 'Flying', 35, 100, 35), gust: M('Gust', 'Flying', 40, 100, 35), wingstrike: M('Wing Strike', 'Flying', 60, 100, 20),
  skydive: M('Sky Dive', 'Flying', 85, 95, 10), hurricane: M('Hurricane Dive', 'Flying', 110, 80, 5),
  // Mind
  mindpulse: M('Mind Pulse', 'Mind', 50, 100, 25), psywave: M('Psy Wave', 'Mind', 65, 100, 20), mindcrush: M('Mind Crush', 'Mind', 90, 100, 10),
  psystorm: M('Psy Storm', 'Mind', 110, 85, 5), trance: M('Trance', 'Mind', 0, 60, 20, { sleep: 100 }),
  focus: M('Calm Focus', 'Mind', 0, 0, 20, { stat: { target: 'self', stat: 'spa', n: 1 } }),
  // Bug
  bugnip: M('Bug Nip', 'Bug', 40, 100, 30), silkshot: M('Silk Shot', 'Bug', 0, 95, 40, { stat: { target: 'foe', stat: 'spe', n: -2 } }),
  crossslash: M('Cross Slash', 'Bug', 70, 100, 15), swarmrush: M('Swarm Rush', 'Bug', 90, 100, 10), lancehorn: M('Lance Horn', 'Bug', 110, 85, 5),
  // Rock
  rocktoss: M('Rock Toss', 'Rock', 50, 90, 15), rockslam: M('Rock Slam', 'Rock', 75, 90, 10), bouldercrash: M('Boulder Crash', 'Rock', 100, 80, 5),
  // Spirit
  phantomtouch: M('Phantom Touch', 'Spirit', 40, 100, 30, { par: 20 }), hexbolt: M('Hex Bolt', 'Spirit', 65, 100, 15),
  spiritorb: M('Spirit Orb', 'Spirit', 85, 100, 10), soulrend: M('Soul Rend', 'Spirit', 110, 85, 5),
  // Dragon
  galecoil: M('Gale Coil', 'Dragon', 40, 100, 20), drakebreath: M('Drake Breath', 'Dragon', 60, 100, 20, { par: 30 }),
  wyrmclaw: M('Wyrm Claw', 'Dragon', 80, 100, 15), dracosurge: M('Draco Surge', 'Dragon', 110, 90, 5),
  // Shadow
  ambush: M('Ambush', 'Shadow', 40, 100, 20, { priority: 1 }), nightbite: M('Night Bite', 'Shadow', 60, 100, 25),
  umbralpulse: M('Umbral Pulse', 'Shadow', 80, 100, 15), nightfall: M('Nightfall', 'Shadow', 100, 90, 5),
  glare: M('Glare', 'Shadow', 0, 100, 30, { stat: { target: 'foe', stat: 'spe', n: -2 } }),
  // Metal
  ironclaw: M('Iron Claw', 'Metal', 50, 95, 35), steeltail: M('Steel Tail', 'Metal', 75, 85, 15, { stat: { target: 'foe', stat: 'def', n: -1, chance: 30 } }),
  chromebeam: M('Chrome Beam', 'Metal', 80, 100, 10), meteorfist: M('Meteor Fist', 'Metal', 100, 85, 10),
  ironwall: M('Iron Wall', 'Metal', 0, 0, 15, { stat: { target: 'self', stat: 'def', n: 2 } }),
  // Fae
  pixiebreeze: M('Pixie Breeze', 'Fae', 40, 100, 30), spritekiss: M('Sprite Kiss', 'Fae', 50, 100, 10, { drain: 75 }),
  moonbeam: M('Moonbeam', 'Fae', 90, 100, 15), starfall: M('Starfall', 'Fae', 110, 85, 5),
  sweetgaze: M('Sweet Gaze', 'Fae', 0, 100, 20, { stat: { target: 'foe', stat: 'atk', n: -2 } }),
};

// damaging moves of each type, weakest to strongest, and a signature status move
const POOL = {
  Normal: ['quickjab', 'chomp', 'headbutt', 'bodyslam', 'megaimpact'], Fire: ['ember', 'flamefang', 'blazerush', 'inferno'],
  Water: ['waterjet', 'bubbleburst', 'tidecrash', 'torrent'], Grass: ['leafflick', 'vinelash', 'bramble', 'solarlance'],
  Electric: ['spark', 'zapbolt', 'voltdive', 'thundercrash'], Ice: ['frostnip', 'icicleshot', 'glacierbeam', 'blizzardgale'],
  Brawl: ['palmstrike', 'kneestrike', 'titanfist', 'haymaker'], Toxic: ['acidspit', 'venomfang', 'sludgewave', 'toxicburst'],
  Ground: ['mudslap', 'digclaw', 'tremor', 'earthsplit'], Flying: ['gust', 'wingstrike', 'skydive', 'hurricane'],
  Mind: ['mindpulse', 'psywave', 'mindcrush', 'psystorm'], Bug: ['bugnip', 'crossslash', 'swarmrush', 'lancehorn'],
  Rock: ['rocktoss', 'rockslam', 'bouldercrash', 'bouldercrash'], Spirit: ['phantomtouch', 'hexbolt', 'spiritorb', 'soulrend'],
  Dragon: ['galecoil', 'drakebreath', 'wyrmclaw', 'dracosurge'], Shadow: ['ambush', 'nightbite', 'umbralpulse', 'nightfall'],
  Metal: ['ironclaw', 'steeltail', 'chromebeam', 'meteorfist'], Fae: ['pixiebreeze', 'spritekiss', 'moonbeam', 'starfall'],
};
const STATUS = {
  Normal: 'powerup', Fire: 'scorchhaze', Water: 'tailwag', Grass: 'stunpollen', Electric: 'staticwave', Ice: 'chillmist', Brawl: 'brace',
  Toxic: 'poisonmist', Ground: 'sandtoss', Flying: 'quickstep', Mind: 'trance', Bug: 'silkshot', Rock: 'harden', Spirit: 'lullaby',
  Dragon: 'quickstep', Shadow: 'glare', Metal: 'ironwall', Fae: 'sweetgaze',
};

function autoLearnset(types) {
  const [a, b] = types;
  const out = [[1, a === 'Normal' || !b ? 'tackle' : 'scratch'], [1, 'growl']];
  POOL[a].forEach((m, i) => out.push([[4, 14, 26, 40][i] ?? 50, m]));
  if (b) POOL[b].forEach((m, i) => { if (i < 3) out.push([[9, 20, 33][i], m]); });
  else if (a !== 'Normal') out.push([18, 'headbutt']);
  out.push([11, STATUS[a]]);
  if (a !== 'Normal' && !b) out.push([47, POOL.Normal[3]]);
  out.sort((x, y) => x[0] - y[0]);
  const seen = new Set();
  return out.filter(([, m]) => (seen.has(m) ? false : seen.add(m)));
}

// ---- build SPECIES from the compact table ----
export const SPECIES = {};
RAW_SPECIES.forEach((r, i) => {
  const [id, name, types, base, evo, where, art, dex] = r;
  const tps = types.split('/');
  const total = base.reduce((s, x) => s + x, 0);
  const s = {
    no: i + 1, name, types: tps, base, art, where: where || '', dex,
    family: art.family, stage: art.stage || 1, legend: !!art.legend,
    exp: Math.round(total / 6.5), rate: art.legend ? 3 : total < 330 ? 255 : total < 420 ? 120 : total < 500 ? 60 : 45,
    learn: HAND_LEARNSETS[id] || autoLearnset(tps),
  };
  if (evo) { const [to, how] = evo.split(':'); s.evo = /^\d+$/.test(how) ? { to, level: +how } : { to, item: how }; }
  SPECIES[id] = s;
});
export const SPECIES_LIST = Object.keys(SPECIES).sort((a, b) => SPECIES[a].no - SPECIES[b].no);

// Field moves ("Trail Discs"): what they unlock, which badge count lets you use them outside battle,
// and which creature types can learn them.
export const FIELD = {
  slash: { item: 'td_slash', badges: 2, types: ['Grass', 'Bug', 'Normal', 'Shadow', 'Metal', 'Brawl', 'Dragon', 'Ground', 'Rock', 'Fire'], verb: 'cut down the bush' },
  shatter: { item: 'td_shatter', badges: 3, types: ['Brawl', 'Rock', 'Ground', 'Metal', 'Normal', 'Fire', 'Dragon', 'Water'], verb: 'smash the rock' },
  waveride: { item: 'td_waveride', badges: 4, types: ['Water', 'Ice', 'Dragon'], verb: 'ride the waves' },
  heave: { item: 'td_heave', badges: 5, types: ['Brawl', 'Rock', 'Ground', 'Metal', 'Normal', 'Dragon'], verb: 'push boulders' },
  glow: { item: 'td_glow', badges: 6, types: ['Electric', 'Fire', 'Fae', 'Mind', 'Spirit', 'Normal', 'Bug'], verb: 'light up dark places' },
  soar: { item: 'td_soar', badges: 6, types: ['Flying', 'Dragon'], verb: 'fly to a town you have visited' },
};
export function canLearnField(sp, move) { return SPECIES[sp].types.some((t) => FIELD[move].types.includes(t)); }

export const ITEMS = {
  potion: { name: 'Potion', price: 300, desc: 'Restores 20 HP to one creature.', kind: 'heal', heal: 20, battle: true },
  superpotion: { name: 'Super Potion', price: 700, desc: 'Restores 60 HP to one creature.', kind: 'heal', heal: 60, battle: true },
  hyperpotion: { name: 'Hyper Potion', price: 1200, desc: 'Restores 120 HP to one creature.', kind: 'heal', heal: 120, battle: true },
  maxpotion: { name: 'Max Potion', price: 2500, desc: 'Fully restores one creature\'s HP.', kind: 'heal', heal: 9999, battle: true },
  revive: { name: 'Revive', price: 1500, desc: 'Revives a fainted creature with half its HP.', kind: 'revive', battle: true },
  fullheal: { name: 'Full Heal', price: 600, desc: 'Cures burns, poison, paralysis and sleep.', kind: 'cure', battle: true },
  tonic: { name: 'Tonic', price: 1500, desc: 'Restores 10 PP to every move of one creature.', kind: 'pp', battle: true },
  lvcandy: { name: 'Level Candy', price: 4800, desc: 'Raises a creature\'s level by one.', kind: 'level' },
  repel: { name: 'Repel', price: 350, desc: 'Keeps weaker wild creatures away for 100 steps.', kind: 'repel', steps: 100 },
  maxrepel: { name: 'Max Repel', price: 700, desc: 'Keeps weaker wild creatures away for 250 steps.', kind: 'repel', steps: 250 },
  orb: { name: 'Capture Orb', price: 200, desc: 'A device for catching wild creatures.', kind: 'orb', bonus: 1, battle: true },
  greatorb: { name: 'Great Orb', price: 600, desc: 'A better orb with a higher catch rate.', kind: 'orb', bonus: 1.5, battle: true },
  ultraorb: { name: 'Ultra Orb', price: 1200, desc: 'A high-performance orb.', kind: 'orb', bonus: 2, battle: true },
  masterorb: { name: 'Master Orb', price: 0, desc: 'Catches any wild creature without fail.', kind: 'orb', bonus: 255, battle: true },
  sparkstone: { name: 'Spark Stone', price: 2100, desc: 'A crackling stone. Makes certain creatures evolve.', kind: 'evo' },
  moonshard: { name: 'Moon Shard', price: 2100, desc: 'A glittering shard. Makes certain creatures evolve.', kind: 'evo' },
  duskstone: { name: 'Dusk Stone', price: 2100, desc: 'A dark, cold stone. Makes certain creatures evolve.', kind: 'evo' },
  leafstone: { name: 'Leaf Stone', price: 2100, desc: 'A stone with a leaf pattern. Makes certain creatures evolve.', kind: 'evo' },
  froststone: { name: 'Frost Stone', price: 2100, desc: 'An icy stone. Makes certain creatures evolve.', kind: 'evo' },
  townmap: { name: 'Town Map', price: 0, desc: 'A map of the region from Mom. Shows where you are. (Shortcut: SELECT)', kind: 'map', key: true },
  td_slash: { name: 'TD01 Slash', price: 0, desc: 'Trail Disc. Teaches Slash. Out of battle it cuts thorny bushes. Needs 2 badges.', kind: 'td', move: 'slash', key: true },
  td_shatter: { name: 'TD02 Shatter', price: 0, desc: 'Trail Disc. Teaches Shatter. Out of battle it smashes cracked rocks. Needs 3 badges.', kind: 'td', move: 'shatter', key: true },
  td_waveride: { name: 'TD03 Wave Ride', price: 0, desc: 'Trail Disc. Teaches Wave Ride. Out of battle you can travel on water. Needs 4 badges.', kind: 'td', move: 'waveride', key: true },
  td_heave: { name: 'TD04 Heave', price: 0, desc: 'Trail Disc. Teaches Heave. Out of battle it pushes big boulders. Needs 5 badges.', kind: 'td', move: 'heave', key: true },
  td_glow: { name: 'TD05 Glow', price: 0, desc: 'Trail Disc. Teaches Glow. Out of battle it lights up dark caves. Needs 6 badges.', kind: 'td', move: 'glow', key: true },
  td_soar: { name: 'TD06 Soar', price: 0, desc: 'Trail Disc. Teaches Soar. Out of battle it flies you to any town you\'ve visited. Needs 6 badges.', kind: 'td', move: 'soar', key: true },
};

export const STATUS_NAMES = { burn: 'BRN', par: 'PAR', sleep: 'SLP', poison: 'PSN' };

export const BADGES = [
  ['stone', 'Stone', '#a08060'], ['thistle', 'Thistle', '#58b048'], ['volt', 'Volt', '#e8c020'], ['tide', 'Tide', '#4890e8'],
  ['grit', 'Grit', '#c03028'], ['lumen', 'Lumen', '#f85888'], ['ember', 'Ember', '#f08030'], ['wyrm', 'Wyrm', '#7038f8'],
];
