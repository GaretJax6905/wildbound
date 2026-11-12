// Game data: types, moves, creatures, items. Everything here is original.
// To add a creature: add an entry to SPECIES (and a drawer in art.js under
// the same "family"), then put it in an encounter table in maps.js.

export const TYPES = ['Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Bug', 'Flying', 'Rock', 'Ground'];
export const TYPE_COLORS = {
  Normal: '#a8a878', Fire: '#f08030', Water: '#6890f0', Grass: '#78c850', Electric: '#f8d030',
  Bug: '#a8b820', Flying: '#a890f0', Rock: '#b8a038', Ground: '#e0c068',
};
// Physical vs special is decided by the move's type, like the classic games.
export const SPECIAL_TYPES = new Set(['Fire', 'Water', 'Grass', 'Electric']);

const CHART = {
  Normal: { Rock: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Bug: 2, Rock: 0.5 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Rock: 2, Ground: 2 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Bug: 0.5, Flying: 0.5, Rock: 2, Ground: 2 },
  Electric: { Water: 2, Grass: 0.5, Electric: 0.5, Flying: 2, Ground: 0 },
  Bug: { Fire: 0.5, Grass: 2, Flying: 0.5 },
  Flying: { Grass: 2, Electric: 0.5, Bug: 2, Rock: 0.5 },
  Rock: { Fire: 2, Bug: 2, Flying: 2, Ground: 0.5 },
  Ground: { Fire: 2, Grass: 0.5, Electric: 2, Bug: 0.5, Flying: 0, Rock: 2 },
};
export function effectiveness(moveType, defTypes) {
  return defTypes.reduce((m, t) => m * (CHART[moveType][t] ?? 1), 1);
}

// effect keys: burn/par/sleep (chance %), stat changes {target:'foe'|'self', stat, n}, drain, priority
export const MOVES = {
  tackle: { name: 'Tackle', type: 'Normal', power: 40, acc: 100, pp: 35 },
  scratch: { name: 'Scratch', type: 'Normal', power: 40, acc: 100, pp: 35 },
  quickjab: { name: 'Quick Jab', type: 'Normal', power: 40, acc: 100, pp: 30, priority: 1 },
  chomp: { name: 'Chomp', type: 'Normal', power: 60, acc: 100, pp: 25 },
  headbutt: { name: 'Headbutt', type: 'Normal', power: 70, acc: 100, pp: 15 },
  bodyslam: { name: 'Body Slam', type: 'Normal', power: 85, acc: 100, pp: 15, par: 30 },
  growl: { name: 'Growl', type: 'Normal', power: 0, acc: 100, pp: 40, stat: { target: 'foe', stat: 'atk', n: -1 } },
  tailwag: { name: 'Tail Wag', type: 'Normal', power: 0, acc: 100, pp: 30, stat: { target: 'foe', stat: 'def', n: -1 } },
  harden: { name: 'Harden', type: 'Normal', power: 0, acc: 0, pp: 30, stat: { target: 'self', stat: 'def', n: 1 } },
  powerup: { name: 'Power Up', type: 'Normal', power: 0, acc: 0, pp: 30, stat: { target: 'self', stat: 'atk', n: 1 } },
  quickstep: { name: 'Quick Step', type: 'Normal', power: 0, acc: 0, pp: 30, stat: { target: 'self', stat: 'spe', n: 2 } },
  lullaby: { name: 'Lullaby', type: 'Normal', power: 0, acc: 55, pp: 15, sleep: 100 },
  ember: { name: 'Ember', type: 'Fire', power: 40, acc: 100, pp: 25, burn: 10 },
  flamefang: { name: 'Flame Fang', type: 'Fire', power: 65, acc: 95, pp: 15, burn: 10 },
  blazerush: { name: 'Blaze Rush', type: 'Fire', power: 85, acc: 100, pp: 15, burn: 10 },
  waterjet: { name: 'Water Jet', type: 'Water', power: 40, acc: 100, pp: 25 },
  bubbleburst: { name: 'Bubble Burst', type: 'Water', power: 65, acc: 100, pp: 20, stat: { target: 'foe', stat: 'spe', n: -1, chance: 10 } },
  tidecrash: { name: 'Tide Crash', type: 'Water', power: 85, acc: 100, pp: 10 },
  leafflick: { name: 'Leaf Flick', type: 'Grass', power: 40, acc: 100, pp: 25 },
  vinelash: { name: 'Vine Lash', type: 'Grass', power: 55, acc: 100, pp: 20 },
  seeddrain: { name: 'Seed Drain', type: 'Grass', power: 50, acc: 100, pp: 15, drain: 50 },
  sporepuff: { name: 'Spore Puff', type: 'Grass', power: 0, acc: 75, pp: 15, sleep: 100 },
  bramble: { name: 'Bramble Burst', type: 'Grass', power: 85, acc: 100, pp: 10 },
  spark: { name: 'Spark', type: 'Electric', power: 40, acc: 100, pp: 30, par: 10 },
  zapbolt: { name: 'Zap Bolt', type: 'Electric', power: 65, acc: 100, pp: 15, par: 10 },
  staticwave: { name: 'Static Wave', type: 'Electric', power: 0, acc: 90, pp: 20, par: 100 },
  voltdive: { name: 'Volt Dive', type: 'Electric', power: 90, acc: 100, pp: 10, par: 10 },
  bugnip: { name: 'Bug Nip', type: 'Bug', power: 40, acc: 100, pp: 30 },
  silkshot: { name: 'Silk Shot', type: 'Bug', power: 0, acc: 95, pp: 40, stat: { target: 'foe', stat: 'spe', n: -2 } },
  crossslash: { name: 'Cross Slash', type: 'Bug', power: 70, acc: 100, pp: 15 },
  peck: { name: 'Peck', type: 'Flying', power: 35, acc: 100, pp: 35 },
  gust: { name: 'Gust', type: 'Flying', power: 40, acc: 100, pp: 35 },
  wingstrike: { name: 'Wing Strike', type: 'Flying', power: 60, acc: 100, pp: 20 },
  skydive: { name: 'Sky Dive', type: 'Flying', power: 85, acc: 95, pp: 10 },
  rocktoss: { name: 'Rock Toss', type: 'Rock', power: 50, acc: 90, pp: 15 },
  rockslam: { name: 'Rock Slam', type: 'Rock', power: 75, acc: 90, pp: 10 },
  sandtoss: { name: 'Sand Toss', type: 'Ground', power: 0, acc: 100, pp: 15, stat: { target: 'foe', stat: 'acc', n: -1 } },
  mudslap: { name: 'Mud Slap', type: 'Ground', power: 20, acc: 100, pp: 10, stat: { target: 'foe', stat: 'acc', n: -1, chance: 100 } },
  digclaw: { name: 'Dig Claw', type: 'Ground', power: 60, acc: 100, pp: 20 },
  tremor: { name: 'Tremor', type: 'Ground', power: 80, acc: 100, pp: 10 },
};

// base: hp atk def spa spd spe. evo: {to, level} or {to, item}. rate = catch rate.
export const SPECIES = {
  sproutmole: {
    no: 1, name: 'Sproutmole', types: ['Grass'], base: [45, 49, 49, 60, 60, 42], exp: 64, rate: 45, family: 'mole', stage: 1,
    evo: { to: 'thornmole', level: 16 }, dex: 'A shy mole that sprouts a leaf on its head after a good rain. It digs in gardens to help plants grow.',
    learn: [[1, 'tackle'], [1, 'growl'], [5, 'leafflick'], [9, 'mudslap'], [13, 'seeddrain'], [17, 'sporepuff'], [21, 'vinelash'], [27, 'digclaw'], [33, 'bramble']],
  },
  thornmole: {
    no: 2, name: 'Thornmole', types: ['Grass', 'Ground'], base: [70, 80, 78, 82, 80, 58], exp: 155, rate: 45, family: 'mole', stage: 2,
    dex: 'The thorns along its back harden like stone. It tunnels under forests, leaving flowers wherever it surfaces.',
    learn: [[1, 'tackle'], [1, 'leafflick'], [16, 'digclaw'], [21, 'vinelash'], [27, 'tremor'], [33, 'bramble']],
  },
  emberkit: {
    no: 3, name: 'Emberkit', types: ['Fire'], base: [39, 55, 40, 62, 50, 66], exp: 64, rate: 45, family: 'fox', stage: 1,
    evo: { to: 'blazelynx', level: 16 }, dex: 'The flame on its tail flickers with its mood. When it sneezes, little sparks fly.',
    learn: [[1, 'scratch'], [1, 'growl'], [5, 'ember'], [9, 'quickjab'], [13, 'chomp'], [17, 'flamefang'], [23, 'quickstep'], [29, 'blazerush']],
  },
  blazelynx: {
    no: 4, name: 'Blazelynx', types: ['Fire'], base: [62, 80, 60, 86, 66, 92], exp: 155, rate: 45, family: 'fox', stage: 2,
    dex: 'Its blazing mane can be seen from across a valley at night. It is fiercely loyal to a trusted trainer.',
    learn: [[1, 'scratch'], [1, 'ember'], [16, 'flamefang'], [20, 'chomp'], [26, 'quickstep'], [30, 'blazerush'], [36, 'bodyslam']],
  },
  puddlefin: {
    no: 5, name: 'Puddlefin', types: ['Water'], base: [46, 50, 60, 54, 58, 44], exp: 64, rate: 45, family: 'axolotl', stage: 1,
    evo: { to: 'tidalotl', level: 16 }, dex: 'It loves splashing in puddles. Its frilly gills turn pink when it is happy.',
    learn: [[1, 'tackle'], [1, 'tailwag'], [5, 'waterjet'], [9, 'harden'], [13, 'bubbleburst'], [19, 'chomp'], [25, 'headbutt'], [31, 'tidecrash']],
  },
  tidalotl: {
    no: 6, name: 'Tidalotl', types: ['Water'], base: [72, 74, 84, 74, 82, 56], exp: 155, rate: 45, family: 'axolotl', stage: 2,
    dex: 'With a flick of its crest it can call up waves tall enough to surf on. It guards quiet lakes.',
    learn: [[1, 'tackle'], [1, 'waterjet'], [16, 'bubbleburst'], [22, 'headbutt'], [28, 'tidecrash'], [34, 'bodyslam']],
  },
  bunnip: {
    no: 7, name: 'Bunnip', types: ['Normal'], base: [38, 52, 38, 30, 38, 64], exp: 50, rate: 255, family: 'rabbit', stage: 1,
    evo: { to: 'hopscot', level: 14 }, dex: 'It hops through fields all day. Its huge feet thump the ground to warn friends of danger.',
    learn: [[1, 'tackle'], [1, 'tailwag'], [4, 'quickjab'], [8, 'growl'], [12, 'chomp'], [17, 'quickstep'], [22, 'headbutt'], [28, 'bodyslam']],
  },
  hopscot: {
    no: 8, name: 'Hopscot', types: ['Normal'], base: [62, 82, 60, 45, 60, 90], exp: 140, rate: 120, family: 'rabbit', stage: 2,
    dex: 'One kick from its powerful legs can crack a log. It can leap over a house in a single bound.',
    learn: [[1, 'tackle'], [1, 'quickjab'], [14, 'chomp'], [19, 'quickstep'], [24, 'headbutt'], [30, 'bodyslam']],
  },
  gustling: {
    no: 9, name: 'Gustling', types: ['Normal', 'Flying'], base: [40, 45, 38, 35, 35, 58], exp: 52, rate: 255, family: 'bird', stage: 1,
    evo: { to: 'galehawk', level: 15 }, dex: 'A chirpy little bird that rides the breeze. Flocks of them sing at sunrise.',
    learn: [[1, 'peck'], [1, 'growl'], [5, 'gust'], [9, 'sandtoss'], [13, 'quickjab'], [18, 'wingstrike'], [25, 'quickstep'], [31, 'skydive']],
  },
  galehawk: {
    no: 10, name: 'Galehawk', types: ['Normal', 'Flying'], base: [64, 72, 62, 52, 56, 88], exp: 145, rate: 90, family: 'bird', stage: 2,
    dex: 'It circles high above, then dives at incredible speed. Its cry sounds like a rushing wind.',
    learn: [[1, 'peck'], [1, 'gust'], [15, 'wingstrike'], [20, 'quickjab'], [27, 'quickstep'], [33, 'skydive']],
  },
  twigling: {
    no: 11, name: 'Twigling', types: ['Bug'], base: [40, 38, 45, 25, 30, 40], exp: 39, rate: 255, family: 'stick', stage: 1,
    evo: { to: 'barkmantis', level: 10 }, dex: 'It pretends to be a twig so birds will not notice it. It nibbles on leaves very slowly.',
    learn: [[1, 'tackle'], [1, 'silkshot'], [6, 'bugnip'], [9, 'harden']],
  },
  barkmantis: {
    no: 12, name: 'Barkmantis', types: ['Bug', 'Grass'], base: [60, 78, 64, 50, 58, 68], exp: 130, rate: 120, family: 'stick', stage: 2,
    dex: 'Its bark-covered arms are sharp as blades. It stands perfectly still for hours, then strikes.',
    learn: [[1, 'bugnip'], [1, 'harden'], [10, 'leafflick'], [14, 'crossslash'], [19, 'vinelash'], [24, 'powerup'], [30, 'bramble']],
  },
  buzzlet: {
    no: 13, name: 'Buzzlet', types: ['Electric', 'Bug'], base: [40, 42, 38, 56, 45, 74], exp: 60, rate: 190, family: 'bee', stage: 1,
    evo: { to: 'voltwasp', item: 'sparkstone' }, dex: 'Static builds up in its fuzzy coat as it buzzes from flower to flower. Touching it tingles.',
    learn: [[1, 'spark'], [1, 'silkshot'], [6, 'bugnip'], [10, 'staticwave'], [15, 'zapbolt'], [21, 'quickstep'], [28, 'voltdive']],
  },
  voltwasp: {
    no: 14, name: 'Voltwasp', types: ['Electric', 'Bug'], base: [62, 72, 56, 92, 64, 104], exp: 160, rate: 60, family: 'bee', stage: 2,
    dex: 'Lightning crackles between its wings. It evolves when a Buzzlet absorbs the energy of a Spark Stone.',
    learn: [[1, 'spark'], [1, 'bugnip'], [1, 'zapbolt'], [18, 'crossslash'], [24, 'quickstep'], [28, 'voltdive']],
  },
  pebbit: {
    no: 15, name: 'Pebbit', types: ['Rock'], base: [42, 62, 82, 25, 35, 22], exp: 60, rate: 255, family: 'rock', stage: 1,
    evo: { to: 'bouldox', level: 18 }, dex: 'Hikers often trip over it thinking it is an ordinary rock. It rolls downhill for fun.',
    learn: [[1, 'tackle'], [1, 'harden'], [5, 'sandtoss'], [9, 'rocktoss'], [14, 'headbutt'], [19, 'digclaw'], [25, 'rockslam'], [31, 'tremor']],
  },
  bouldox: {
    no: 16, name: 'Bouldox', types: ['Rock', 'Ground'], base: [78, 92, 112, 40, 55, 30], exp: 165, rate: 75, family: 'rock', stage: 2,
    dex: 'It charges with its boulder horns lowered. Mountain roads are carved by herds of Bouldox.',
    learn: [[1, 'tackle'], [1, 'rocktoss'], [18, 'digclaw'], [24, 'rockslam'], [30, 'tremor'], [36, 'bodyslam']],
  },
  dunepup: {
    no: 17, name: 'Dunepup', types: ['Ground'], base: [50, 58, 48, 32, 42, 54], exp: 58, rate: 190, family: 'dog', stage: 1,
    evo: { to: 'mesaruff', level: 20 }, dex: 'It loves to dig holes in sandy soil and bury its favorite stones. It wags its whole body.',
    learn: [[1, 'tackle'], [1, 'tailwag'], [5, 'mudslap'], [9, 'chomp'], [13, 'digclaw'], [18, 'powerup'], [24, 'headbutt'], [30, 'tremor']],
  },
  mesaruff: {
    no: 18, name: 'Mesaruff', types: ['Ground', 'Rock'], base: [76, 90, 74, 45, 62, 72], exp: 160, rate: 75, family: 'dog', stage: 2,
    dex: 'Plates of red stone grow along its back like a desert mesa. Its howl can start a landslide.',
    learn: [[1, 'chomp'], [1, 'mudslap'], [20, 'digclaw'], [24, 'rocktoss'], [28, 'headbutt'], [32, 'tremor'], [38, 'rockslam']],
  },
};
export const SPECIES_LIST = Object.keys(SPECIES).sort((a, b) => SPECIES[a].no - SPECIES[b].no);

export const ITEMS = {
  potion: { name: 'Potion', price: 300, desc: 'Restores 20 HP to one creature.', kind: 'heal', heal: 20, battle: true },
  superpotion: { name: 'Super Potion', price: 700, desc: 'Restores 60 HP to one creature.', kind: 'heal', heal: 60, battle: true },
  revive: { name: 'Revive', price: 1500, desc: 'Revives a fainted creature with half its HP.', kind: 'revive', battle: true },
  fullheal: { name: 'Full Heal', price: 600, desc: 'Cures burns, paralysis and sleep.', kind: 'cure', battle: true },
  orb: { name: 'Capture Orb', price: 200, desc: 'A device for catching wild creatures.', kind: 'orb', bonus: 1, battle: true },
  greatorb: { name: 'Great Orb', price: 600, desc: 'A better orb with a higher catch rate.', kind: 'orb', bonus: 1.5, battle: true },
  sparkstone: { name: 'Spark Stone', price: 2100, desc: 'A crackling stone. Makes certain creatures evolve.', kind: 'evo' },
};

export const STATUS_NAMES = { burn: 'BRN', par: 'PAR', sleep: 'SLP' };
