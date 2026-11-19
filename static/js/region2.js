// Region 2: Meridia. Built with the same tools as Aldermoor (maps.js passes them in), so it
// shares buildings, props, weather and the route generator. Every climate at once: a sunny
// harbour, rainy forest and marsh, desert and canyon, open prairie, misty ruins, an iron city,
// snowfields and thunderstorm peaks.

export const MERIDIA_GYMS = {
  hive: { id: 'hive', type: 'Bug', look: 'tansy', tlook: 'bugkid', layout: 1, region: 'meridia' },
  dune: { id: 'dune', type: 'Ground', look: 'sahar', tlook: 'hiker', layout: 2, region: 'meridia' },
  gale: { id: 'gale', type: 'Flying', look: 'aeron', tlook: 'birdkeeper', layout: 3, region: 'meridia' },
  bog: { id: 'bog', type: 'Toxic', look: 'fennick', tlook: 'biker', layout: 1, region: 'meridia' },
  wraith: { id: 'wraith', type: 'Spirit', look: 'ysolde', tlook: 'mystic', layout: 2, region: 'meridia' },
  forge: { id: 'forge', type: 'Metal', look: 'bram', tlook: 'scientist', layout: 3, region: 'meridia' },
  rime: { id: 'rime', type: 'Ice', look: 'nevia', tlook: 'skier', layout: 1, region: 'meridia' },
  dusk: { id: 'dusk', type: 'Shadow', look: 'corwin', tlook: 'acetrainer', layout: 2, region: 'meridia' },
};

// where things sit on Meridia's Town Map (same 28 x 20 grid as Aldermoor's)
export const MERIDIA_LAYOUT = {
  solace: [3, 14, 'town'], route11: [3, 11, 'route', 3, 14, 3, 8], mossbrook: [3, 8, 'town'],
  whisperwood: [6, 8, 'forest'], route12: [9, 8, 'route', 6, 8, 12, 8], sunscar: [12, 8, 'town'],
  route13: [12, 5, 'route', 12, 8, 12, 3], echocanyon: [12, 3, 'cave'], mesaridge: [12, 1, 'town'],
  route14: [16, 1, 'route', 12, 1, 20, 1], fenmoor: [20, 1, 'town'], route15: [20, 5, 'sea', 20, 1, 20, 9],
  kingsgate: [20, 9, 'town'], route16: [23, 9, 'route', 20, 9, 26, 9], ironhaven: [26, 9, 'town'], eclipsebase: [27, 8, 'cave'],
  route17: [26, 12, 'route', 26, 9, 26, 15], frostvale: [26, 15, 'town'], route18: [22, 15, 'route', 26, 15, 19, 15],
  stormcave: [19, 15, 'cave'], skyspire: [16, 15, 'town'], route19: [13, 15, 'route', 16, 15, 10, 15],
  summitpass: [10, 15, 'cave'], zenith: [7, 15, 'town'],
};

export function buildMeridia(A) {
  const { MAPS, fill, dots, sign, npc, item, genRoute, mkTown, link, carve, interior, gateRow, gateCol, GYMS } = A;
  Object.assign(GYMS, MERIDIA_GYMS);
  const G = MERIDIA_GYMS;

  // ---------- Port Solace: the ferry harbour, Professor Cedar's lab ----------
  mkTown('solace', 'Port Solace', 26, 22, {
    style: 'coast', decor: ['palm', 'flower', 'flower', 'barrel'], streets: [[8, 1, 24], [14, 1, 24]], vstreets: [[12, 0, 15]], open: [['north', 12]],
    stock: ['orb', 'potion', 'fullheal', 'repel'],
    pre(m) { fill(m, 1, 16, 24, 2, 'sand'); fill(m, 0, 18, 26, 4, 'water'); fill(m, 12, 16, 2, 6, 'dock'); },
    b: [['center', 2, 8], ['mart', 7, 8], ['lab', 15, 8, { to: 'lab_solace' }],
      ['house', 2, 14, { name: 'Harbour House', npcs: [{ look: 'sailor', text: ['Welcome to Meridia! The ferry from Aldermoor docks right outside.', 'Meridia has every kind of weather you can think of. Pack an umbrella AND sunscreen!'] }] }],
      ['house2', 16, 14, { name: 'Seaside Cottage', npcs: [{ look: 'oldman', text: ['Eight Gyms, eight different climates. That\'s Meridia.', 'Mossbrook is the closest. Head north up Route 11.'] }] }]],
  });
  {
    const m = MAPS.solace;
    sign(m, 10, 10, 'PORT SOLACE\nWhere every journey in Meridia begins.');
    npc(m, { id: 'm_sailor', look: 'sailor', x: 14, y: 17, dir: 'left', move: 'static', script: 'ferryHome' });
    npc(m, { id: 'sol_girl', look: 'girl', x: 20, y: 11, dir: 'down', move: 'wander', text: ['Professor Cedar studies Meridia\'s creatures.', 'She says new trainers can get a partner from her lab!'] });
    const lab = interior('lab_solace', 'Cedar Lab', 12, 10, [[5, 9]]);
    dots(lab, 'shelf', [[1, 2], [2, 2], [3, 2], [8, 2], [9, 2], [10, 2]]);
    dots(lab, 'table', [[4, 5], [5, 5], [6, 5]]); dots(lab, 'pc', [[10, 4]]); dots(lab, 'plant', [[1, 8], [10, 8]]); dots(lab, 'console', [[6, 2]]);
    npc(lab, { id: 'cedar', look: 'cedar', x: 5, y: 3, dir: 'down', move: 'static', script: 'cedar' });
    npc(lab, { id: 'cedar_aide', look: 'aide', x: 9, y: 6, dir: 'left', move: 'wander', script: 'cedarAide' });
  }

  // ---------- Route 11 -> Mossbrook (Gym 1: Bug) ----------
  genRoute('route11', { name: 'Route 11', w: 22, h: 30, lv: [5, 8], open: [['south', 12], ['north', 9]], trainers: 3, items: 3, hidden: 2 });
  link('solace', 'north', 12, 'route11', 12);
  mkTown('mossbrook', 'Mossbrook', 26, 20, {
    decor: ['tree', 'tree', 'flower', 'stump', 'tree'], density: 16,
    post(m) { fill(m, 18, 1, 5, 2, 'water'); fill(m, 17, 3, 7, 1, 'flower'); fill(m, 1, 17, 2, 2, 'tree'); },
    streets: [[8, 1, 24], [15, 3, 21]], vstreets: [[12, 8, 19]], open: [['south', 12], ['east', 8]],
    stock: ['orb', 'potion', 'superpotion', 'fullheal', 'repel'],
    b: [['center', 2, 8], ['mart', 7, 8], ['house', 15, 8, { name: 'Beekeeper\'s Hut', npcs: [{ look: 'bugkid', text: ['Leader of the Mossbrook Gym raises the toughest bugs around.', 'They\'re resting up right now, though.'] }] }],
      ['house2', 20, 8, { name: 'Moss Cottage', npcs: [{ look: 'lass', text: ['Whisperwood, east of town, is always raining.', 'Listen closely and the trees really do whisper!'] }] }],
      ['gym', 4, 15, { gym: G.hive }], ['house', 15, 15, { name: 'Weaver\'s House', npcs: [{ look: 'oldman', text: ['Silk from Meridia\'s bug creatures is the softest in any region.'] }] }]],
  });
  link('route11', 'north', 9, 'mossbrook', 12);
  sign(MAPS.mossbrook, 10, 10, 'MOSSBROOK\nA village wrapped in moss and birdsong.');

  // ---------- Whisperwood (rain) -> Route 12 (desert) -> Sunscar (Gym 2: Ground) ----------
  genRoute('whisperwood', { name: 'Whisperwood', w: 30, h: 18, style: 'forest', lv: [9, 12], open: [['west', 8], ['east', 8]], trainers: 3, items: 3, hidden: 2 });
  MAPS.whisperwood.weather = 'rain';
  link('mossbrook', 'east', 8, 'whisperwood', 8);
  genRoute('route12', { name: 'Route 12', w: 34, h: 18, style: 'desert', lv: [12, 15], open: [['west', 8], ['east', 8]], trainers: 4, items: 3, hidden: 3 });
  MAPS.route12.weather = 'sand';
  link('whisperwood', 'east', 8, 'route12', 8);
  mkTown('sunscar', 'Sunscar', 26, 20, {
    base: 'sand', style: 'desert', border: 'rock', path: 'dirt', decor: ['cactus', 'barrelcactus', 'rock', 'barrelcactus'], density: 22,
    post(m) { fill(m, 18, 1, 5, 2, 'water'); dots(m, 'palm', [[17, 1], [23, 1], [17, 3], [23, 3]]); fill(m, 18, 3, 5, 1, 'grass'); },
    streets: [[8, 1, 24], [15, 3, 21]], vstreets: [[12, 0, 16]], open: [['west', 8], ['north', 12]],
    stock: ['orb', 'greatorb', 'superpotion', 'fullheal', 'repel', 'revive', 'sunstone'],
    b: [['center', 2, 8], ['mart', 7, 8], ['house', 15, 8, { name: 'Water Seller', npcs: [{ look: 'hiker', text: ['Out here, a full canteen is worth more than gold.', 'The sandstorms on Route 12 never really stop.'] }] }],
      ['house2', 20, 8, { name: 'Adobe House', npcs: [{ look: 'beauty', text: ['North of town the desert turns into a canyon full of thorny scrub.', 'Bring a creature that can Slash through it!'] }] }],
      ['gym', 4, 15, { gym: G.dune }], ['house', 15, 15, { name: 'Fossil Digger', npcs: [{ look: 'scientist', text: ['Echo Canyon is full of ancient bones.', 'Some say ancient creatures still live deep inside.'] }] }]],
  });
  MAPS.sunscar.weather = null;
  link('route12', 'east', 8, 'sunscar', 8);
  sign(MAPS.sunscar, 10, 10, 'SUNSCAR\nThe oasis town under a burning sky.');

  // ---------- Route 13 (canyon, Slash gate) -> Echo Canyon -> Mesa Ridge (Gym 3: Flying) ----------
  genRoute('route13', {
    name: 'Route 13', w: 22, h: 30, style: 'desert', lv: [15, 18], open: [['south', 12], ['north', 9]], trainers: 4, items: 3, hidden: 2,
    post(m, { P, K }) { gateRow(m, m.h - 5, P, K, 'bush', 'rock'); },
  });
  MAPS.route13.weather = 'sand';
  link('sunscar', 'north', 12, 'route13', 12);
  genRoute('echocanyon', { name: 'Echo Canyon', w: 26, h: 20, style: 'cave', lv: [17, 20], open: [['south', 11], ['north', 13]], trainers: 3, items: 3, hidden: 2 });
  link('route13', 'north', 9, 'echocanyon', 11);
  mkTown('mesaridge', 'Mesa Ridge', 26, 20, {
    border: 'rock', decor: ['rock', 'rock', 'stump', 'flower', 'fence'], density: 20,
    post(m) { fill(m, 15, 2, 9, 1, 'fence'); fill(m, 1, 17, 4, 2, 'rock'); },
    streets: [[8, 1, 24], [15, 3, 21]], vstreets: [[12, 8, 19]], open: [['south', 12], ['east', 8]],
    stock: ['greatorb', 'superpotion', 'hyperpotion', 'fullheal', 'revive', 'repel', 'moonshard'],
    b: [['center', 2, 8], ['mart', 7, 8], ['house', 15, 8, { name: 'Windmill House', npcs: [{ look: 'birdkeeper', text: ['The wind on the mesa never stops. Bird creatures love it here.'] }] }],
      ['house2', 20, 8, { name: 'Ranch House', npcs: [{ look: 'boy', text: ['Cracked boulders block Route 14 to the east.', 'You\'ll need a creature that can Shatter them.'] }] }],
      ['gym', 4, 15, { gym: G.gale }], ['house', 15, 15, { name: 'Lookout', npcs: [{ look: 'oldman', text: ['From up here you can see all the way to Fenmoor\'s marshes.'] }] }]],
  });
  link('echocanyon', 'north', 13, 'mesaridge', 12);
  sign(MAPS.mesaridge, 10, 10, 'MESA RIDGE\nOn top of the world, in the teeth of the wind.');

  // ---------- Route 14 (prairie, Shatter gate) -> Fenmoor (Gym 4: Toxic, rain) ----------
  genRoute('route14', {
    name: 'Route 14', w: 36, h: 18, lv: [20, 24], open: [['west', 8], ['east', 8]], trainers: 5, items: 3, hidden: 3,
    post(m, { P, K }) { gateCol(m, m.w - 9, P, K, 'crack', 'rock'); },
  });
  link('mesaridge', 'east', 8, 'route14', 8);
  mkTown('fenmoor', 'Fenmoor', 26, 22, {
    style: 'marsh', decor: ['reeds', 'water', 'reeds', 'tree', 'flower'], density: 14,
    post(m) { fill(m, 15, 1, 8, 2, 'water'); fill(m, 18, 1, 2, 2, 'dock'); fill(m, 2, 1, 5, 2, 'reeds'); },
    streets: [[8, 1, 24], [15, 1, 24]], vstreets: [[11, 8, 21]], open: [['west', 8], ['south', 11]],
    stock: ['greatorb', 'ultraorb', 'superpotion', 'hyperpotion', 'fullheal', 'revive', 'maxrepel'],
    pre(m) { fill(m, 15, 18, 6, 3, 'water'); fill(m, 2, 18, 5, 3, 'reeds'); },
    b: [['center', 2, 8], ['mart', 7, 8], ['house', 15, 8, { name: 'Bog Witch\'s Hut', npcs: [{ look: 'mystic', text: ['Heh heh... the marsh gas makes the creatures here a little... toxic.'] }] }],
      ['house2', 20, 8, { name: 'Stilt House', npcs: [{ look: 'fisher', text: ['South of Fenmoor is open sea. Only Wave Ride will get you across.'] }] }],
      ['gym', 2, 15, { gym: G.bog }], ['house', 15, 15, { name: 'Ferryman', npcs: [{ look: 'sailor', text: ['Kingsgate lies across the water. Its old castle is full of ghosts, they say.'] }] }]],
  });
  MAPS.fenmoor.weather = 'rain';
  link('route14', 'east', 8, 'fenmoor', 8);
  sign(MAPS.fenmoor, 18, 10, 'FENMOOR\nThe town that floats on the marsh.');

  // ---------- Route 15 (sea, Wave Ride) -> Kingsgate (Gym 5: Spirit, misty ruins) ----------
  genRoute('route15', { name: 'Route 15', w: 26, h: 36, style: 'sea', lv: [24, 28], open: [['north', 11], ['south', 12]], trainers: 4, items: 3, hidden: 1, islands: 5 });
  link('fenmoor', 'south', 11, 'route15', 11);
  mkTown('kingsgate', 'Kingsgate', 26, 20, {
    style: 'ruins', decor: ['pillar', 'mapletree', 'goldtree', 'flower', 'pillar'], density: 18,
    streets: [[8, 1, 24], [15, 3, 21]], vstreets: [[12, 0, 16]], open: [['north', 12], ['east', 8]],
    stock: ['greatorb', 'ultraorb', 'hyperpotion', 'fullheal', 'revive', 'maxrepel', 'duskstone'],
    pre(m) { fill(m, 1, 0, 24, 3, 'water'); fill(m, 1, 3, 24, 1, 'sand'); carve(m, 'north', 12, 'water'); fill(m, 12, 0, 2, 3, 'water'); },
    b: [['center', 2, 8], ['mart', 7, 8], ['house', 15, 8, { name: 'Castle Archive', npcs: [{ look: 'scientist', text: ['Kingsgate was a royal city a thousand years ago.', 'The pillars around town are all that\'s left of the old walls.'] }] }],
      ['house2', 20, 8, { name: 'Graveyard Keeper', npcs: [{ look: 'oldman', text: ['Mist rolls in every night. Spirit creatures wander out with it.'] }] }],
      ['gym', 4, 15, { gym: G.wraith }], ['house', 15, 15, { name: 'Old Tavern', npcs: [{ look: 'biker', text: ['Ironhaven is east, past the autumn woods. Smoke and steel, that place.'] }] }]],
  });
  {
    const m = MAPS.kingsgate; m.weather = 'fog';
    dots(m, 'grave', [[20, 18], [22, 18], [22, 17]]);
    sign(m, 10, 10, 'KINGSGATE\nThe old crown city, wrapped in mist.');
  }
  link('route15', 'south', 12, 'kingsgate', 12);

  // ---------- Route 16 (autumn woods) -> Ironhaven (Gym 6: Metal) + Eclipse base ----------
  genRoute('route16', { name: 'Route 16', w: 36, h: 18, style: 'autumn', lv: [28, 32], open: [['west', 8], ['east', 9]], trainers: 5, items: 3, hidden: 3 });
  link('kingsgate', 'east', 8, 'route16', 8);
  mkTown('ironhaven', 'Ironhaven', 28, 22, {
    style: 'city', decor: ['lamp', 'barrel', 'crate', 'lamp'], density: 22,
    post(m) { for (let x = 2; x < 26; x += 4) { if (m.tiles[10][x] === 'grass') m.tiles[10][x] = 'lamp'; } },
    streets: [[8, 1, 26], [15, 1, 26]], vstreets: [[12, 8, 21]], open: [['west', 8], ['south', 12]],
    stock: ['greatorb', 'ultraorb', 'hyperpotion', 'maxpotion', 'fullheal', 'revive', 'maxrepel', 'ironcore'],
    b: [['center', 2, 8], ['mart', 7, 8], ['tower', 17, 8, { to: 'eclipsebase' }],
      ['gym', 3, 15, { gym: G.forge }], ['house', 16, 15, { name: 'Foundry Office', npcs: [{ look: 'hiker', text: ['Strange folks in dark uniforms bought the old factory.', 'Lights stay on there all night.'] }] }],
      ['house2', 22, 15, { name: 'Workers\' Flats', npcs: [{ look: 'girl', text: ['Route 17 south of here is buried in snow.', 'Big boulders block the way. You\'d need to Heave them!'] }] }]],
  });
  link('route16', 'east', 9, 'ironhaven', 8);
  sign(MAPS.ironhaven, 10, 10, 'IRONHAVEN\nForged in fire, built of steel.');
  {
    const b = interior('eclipsebase', 'Eclipse Factory', 18, 14, [[8, 13], [9, 13]], { base: 'dkfloor', music: 'boss' });
    fill(b, 2, 4, 5, 1, 'console'); fill(b, 11, 4, 5, 1, 'console'); fill(b, 1, 9, 6, 1, 'console'); fill(b, 11, 9, 6, 1, 'console');
    dots(b, 'crate', [[1, 2], [2, 2], [16, 2], [15, 12], [16, 12]]);
    npc(b, { id: 'eb_g1', look: 'grunt', x: 4, y: 7, dir: 'right', trainer: 'eclipse_m1', sight: 3, sight: 3 });
    npc(b, { id: 'eb_g2', look: 'grunt', x: 13, y: 7, dir: 'left', trainer: 'eclipse_m2', sight: 3 });
    npc(b, { id: 'eb_admin', look: 'nyx', x: 8, y: 3, dir: 'down', trainer: 'eclipse_m3', sight: 4 });
  }

  // ---------- Route 17 (snow, Heave gate) -> Frostvale (Gym 7: Ice) ----------
  genRoute('route17', {
    name: 'Route 17', w: 22, h: 30, style: 'snow', lv: [32, 36], open: [['north', 10], ['south', 11]], trainers: 5, items: 4, hidden: 3,
    post(m, { P, K }) {
      const xs = []; for (let x = 1; x < m.w - 1; x++) if (P.has(K(x, 12))) xs.push(x);
      gateRow(m, 12, P, K, 'snow', 'pine'); xs.forEach((x) => m.boulders.push({ x, y: 12 }));
    },
  });
  link('ironhaven', 'south', 12, 'route17', 10);
  mkTown('frostvale', 'Frostvale', 24, 20, {
    base: 'snow', style: 'snow', border: 'pine', path: 'snowpath', decor: ['pine', 'pine', 'rock', 'snowgrass'], density: 20,
    post(m) { fill(m, 15, 1, 6, 2, 'icefloor'); fill(m, 2, 17, 4, 2, 'icefloor'); },
    streets: [[8, 1, 22], [15, 3, 20]], vstreets: [[11, 0, 16]], open: [['north', 11], ['west', 8]],
    stock: ['ultraorb', 'hyperpotion', 'maxpotion', 'fullheal', 'revive', 'maxrepel', 'sparkstone'],
    b: [['center', 2, 8], ['mart', 6, 8], ['house', 15, 8, { name: 'Lodge', npcs: [{ look: 'skier', text: ['The peaks west of here get hit by thunderstorms every afternoon.'] }] }],
      ['gym', 2, 15, { gym: G.rime }], ['house2', 15, 15, { name: 'Hot Spring Inn', npcs: [{ look: 'beauty', text: ['Storm Cave on the way to Skyspire is pitch black. Bring a creature that can Glow!'] }] }]],
  });
  link('route17', 'south', 11, 'frostvale', 11);
  sign(MAPS.frostvale, 9, 10, 'FROSTVALE\nSnow falls here three hundred days a year.');

  // ---------- Route 18 (stormy peaks) -> Storm Cave (dark) -> Skyspire (Gym 8: Shadow) ----------
  genRoute('route18', { name: 'Route 18', w: 36, h: 18, style: 'snow', lv: [36, 40], open: [['east', 8], ['west', 8]], trainers: 6, items: 3, hidden: 3 });
  MAPS.route18.weather = 'storm';
  link('frostvale', 'west', 8, 'route18', 8);
  genRoute('stormcave', { name: 'Storm Cave', w: 26, h: 20, style: 'cave', dark: true, lv: [38, 42], open: [['east', 9], ['west', 9]], trainers: 3, items: 3, hidden: 2 });
  link('route18', 'west', 8, 'stormcave', 9);
  mkTown('skyspire', 'Skyspire', 24, 20, {
    border: 'rock', decor: ['rock', 'pillar', 'pine', 'rock'], density: 20,
    streets: [[8, 1, 22], [15, 1, 22]], vstreets: [[11, 8, 16]], open: [['east', 8], ['west', 8]],
    stock: ['ultraorb', 'maxpotion', 'hyperpotion', 'fullheal', 'revive', 'tonic', 'maxrepel'],
    b: [['center', 2, 8], ['mart', 6, 8], ['house', 15, 8, { name: 'Weather Station', npcs: [{ look: 'scientist', text: ['Lightning strikes Skyspire twelve times a day. We\'ve counted.'] }] }],
      ['gym', 2, 15, { gym: G.dusk }], ['house2', 15, 15, { name: 'Pilgrim\'s Rest', npcs: [{ look: 'oldman', text: ['Beyond Route 19 lies Summit Pass, and then the Meridia League.', 'Only trainers with all eight Meridia badges may pass.'] }] }]],
  });
  MAPS.skyspire.weather = 'storm';
  link('stormcave', 'west', 9, 'skyspire', 8);
  sign(MAPS.skyspire, 9, 10, 'SKYSPIRE\nThe town that touches the storm.');

  // ---------- Route 19 -> Summit Pass -> Zenith Plateau (Meridia League) ----------
  genRoute('route19', { name: 'Route 19', w: 30, h: 18, lv: [42, 46], open: [['east', 8], ['west', 8]], trainers: 6, items: 4, hidden: 3 });
  link('skyspire', 'west', 8, 'route19', 8);
  genRoute('summitpass', { name: 'Summit Pass', w: 30, h: 24, style: 'cave', lv: [46, 50], open: [['east', 10], ['west', 10]], trainers: 6, items: 5, hidden: 3 });
  link('route19', 'west', 8, 'summitpass', 10);
  mkTown('zenith', 'Zenith Plateau', 22, 16, {
    decor: ['pillar', 'flower', 'flower'], density: 20,
    streets: [[12, 1, 20]], vstreets: [[10, 7, 13]], open: [['east', 12]],
    stock: ['ultraorb', 'maxpotion', 'hyperpotion', 'fullheal', 'revive', 'tonic', 'maxrepel'],
    b: [['center', 2, 12], ['mart', 15, 12], ['league', 6, 7, { to: 'league2_lobby' }]],
  });
  link('summitpass', 'west', 10, 'zenith', 12);
  {
    const lobby = interior('league2_lobby', 'Meridia League', 12, 9, [[5, 8], [6, 8]], { heal: true });
    fill(lobby, 3, 3, 6, 1, 'counter'); dots(lobby, 'healer', [[7, 2]]); dots(lobby, 'statue', [[1, 6], [10, 6]]);
    npc(lobby, { id: 'nurse', look: 'nurse', x: 5, y: 2, dir: 'down', move: 'static', script: 'nurse' });
    npc(lobby, { id: 'lg2_guard', look: 'guide', x: 10, y: 2, dir: 'down', move: 'static', script: 'leagueGuard2' });
    fill(lobby, 11, 2, 1, 1, 'mat');
    const rooms = [['e4m_1', 'Calla\'s Room', 'marble'], ['e4m_2', 'Dorran\'s Room', 'dkfloor'], ['e4m_3', 'Lyra\'s Room', 'gymfloor'], ['e4m_4', 'Voss\'s Room', 'dkfloor'], ['champ2', 'Champion\'s Hall', 'carpet']];
    lobby.warps['11,2'] = { map: rooms[0][0], x: 4, y: 8, dir: 'up', cond: 'league2Open', lockedMsg: 'Talk to the guard first.' };
    rooms.forEach(([id, name, floor], i) => {
      const r = interior(id, name, 10, 10, [], { base: floor, music: 'boss' });
      dots(r, 'statue', [[1, 3], [8, 3], [1, 7], [8, 7]]);
      npc(r, { id: 'e4m', look: ['calla', 'dorran', 'lyra', 'voss', 'juno'][i], x: 4, y: 3, dir: 'down', move: 'static', script: i === 4 ? 'champion2' : 'elite2' });
      r.e4m = i;
      const next = rooms[i + 1] ? rooms[i + 1][0] : 'halloffame2';
      fill(r, 4, 1, 2, 1, 'mat');
      r.warps['4,1'] = { map: next, x: 4, y: 8, dir: 'up', cond: `e4m_${i}`, lockedMsg: 'The way forward is sealed until you win.' };
      r.warps['5,1'] = r.warps['4,1'];
      r.exitTo = { map: 'league2_lobby', x: 5, y: 7, dir: 'down' };
    });
    const hof = interior('halloffame2', 'Hall of Fame', 10, 10, [[4, 9], [5, 9]], { base: 'carpet', music: 'victory' });
    dots(hof, 'statue', [[2, 3], [7, 3]]);
    npc(hof, { id: 'hof_cedar', look: 'cedar', x: 4, y: 3, dir: 'down', move: 'static', script: 'hallOfFame2' });
    hof.exitTo = { map: 'zenith', x: 10, y: 8, dir: 'down' };
  }

  // ---- special encounters: the starters gather in Whisperwood; four legends hide around Meridia ----
  const SOLIDISH = new Set(['tree', 'water', 'rock', 'cavewall', 'pine', 'cactus', 'barrelcactus', 'mapletree', 'goldtree', 'bush', 'crack', 'sign', 'fence', 'lava']);
  const spot = (m, prefer, skip = []) => {
    // a walkable tile right beside the trail, far from the map edges, not already taken
    const taken = new Set([...m.npcs.map((n) => `${n.x},${n.y}`), ...m.items.map((i) => `${i.x},${i.y}`), ...skip]);
    const trail = new Set(['path', 'dirt', 'cavepath', 'snowpath', 'sand']);
    const cands = [];
    for (let y = 3; y < m.h - 3; y++) for (let x = 3; x < m.w - 3; x++) {
      const t = m.tiles[y][x];
      if (SOLIDISH.has(t) || trail.has(t) || taken.has(`${x},${y}`) || m.boulders.some((b) => b.x === x && b.y === y)) continue;
      const nearTrail = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => trail.has(m.tiles[y + dy][x + dx]));
      if (nearTrail) cands.push([x, y]);
    }
    cands.sort((a, b) => Math.abs(a[0] - prefer[0]) + Math.abs(a[1] - prefer[1]) - Math.abs(b[0] - prefer[0]) - Math.abs(b[1] - prefer[1]));
    return cands[0];
  };
  const special = (mapId, sp, level, prefer) => {
    const m = MAPS[mapId]; const at = spot(m, prefer);
    npc(m, { id: `legend_${sp}`, creature: sp, level, x: at[0], y: at[1], dir: 'down', move: 'static', script: 'legend', show: `!caught_${sp}` });
  };
  special('whisperwood', 'bramblecub', 10, [6, 4]); special('whisperwood', 'cindergecko', 10, [15, 4]); special('whisperwood', 'splotter', 10, [24, 4]);
  special('echocanyon', 'solkhan', 50, [13, 4]); special('route17', 'glacieth', 55, [4, 4]);
  special('route18', 'thundrael', 55, [18, 3]); special('summitpass', 'meridion', 60, [15, 4]);

}
