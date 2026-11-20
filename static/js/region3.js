// Region 3: the Azurine Isles. A chain of tropical islands linked by sea routes:
// Coral Isle (beach and jungle), Ember Isle (a smoking volcano with a cloud-top town),
// Lagoon Isle (pink pearl lagoon, sunken ruins, a storm-lashed lighthouse), the rocky
// Crag Isle, the dragon crater of Wyrmhold, and Crown Atoll where the League stands.
// Built with the same tools as Aldermoor and Meridia (maps.js passes them in).

export const AZURINE_GYMS = {
  bloom: { id: 'bloom', type: 'Grass', look: 'kalea', tlook: 'beauty', layout: 2, region: 'azurine' },
  reef: { id: 'reef', type: 'Water', look: 'marlin', tlook: 'swimmer', layout: 3, region: 'azurine' },
  magma: { id: 'magma', type: 'Fire', look: 'cinda', tlook: 'hiker', layout: 1, region: 'azurine' },
  cirrus: { id: 'cirrus', type: 'Flying', look: 'skye', tlook: 'birdkeeper', layout: 2, region: 'azurine' },
  pearl: { id: 'pearl', type: 'Fae', look: 'perla', tlook: 'lass', layout: 3, region: 'azurine' },
  beacon: { id: 'beacon', type: 'Electric', look: 'arc', tlook: 'acetrainer', layout: 1, region: 'azurine' },
  crag: { id: 'crag', type: 'Rock', look: 'basalt', tlook: 'hiker', layout: 2, region: 'azurine' },
  scale: { id: 'scale', type: 'Dragon', look: 'wyneth', tlook: 'tamer', layout: 3, region: 'azurine' },
};

// where things sit on the Isles' Town Map (same 28 x 20 grid)
export const AZURINE_LAYOUT = {
  coralline: [3, 16, 'town'], route20: [3, 12.5, 'route', 3, 16, 3, 9], palmhaven: [3, 9, 'town'],
  route21: [6, 9, 'route', 3, 9, 9, 9], tidecave: [9, 6.5, 'cave'], shellport: [9, 4, 'town'],
  route22: [12, 4, 'sea', 9, 4, 15, 4], emberisle: [15, 4, 'town'], route23: [15, 7, 'route', 15, 4, 15, 9.5],
  magmatunnel: [15, 9.5, 'cave'], cirrus: [15, 12, 'town'],
  route24: [18.5, 12, 'sea', 15, 12, 22, 12], pearlcove: [22, 12, 'town'], route25: [22, 9, 'route', 22, 12, 22, 6.5],
  sunkenruins: [22, 6.5, 'cave'], stormwatch: [22, 3, 'town'], eclipserig: [25, 2, 'cave'],
  route26: [25, 5.5, 'sea', 22, 3, 25, 9], cragmoor: [25, 9, 'town'], route27: [25, 13, 'route', 25, 9, 25, 16.5],
  wyrmhold: [25, 16.5, 'town'], route28: [19, 16.5, 'sea', 25, 16.5, 13, 16.5], coraldepths: [13, 16.5, 'cave'],
  route29: [10.5, 16.5, 'route', 13, 16.5, 8, 16.5], crownatoll: [8, 16.5, 'town'],
};
// island outlines for the Town Map: [x0, y0, x1, y1, colour]
export const AZURINE_ISLANDS = [
  [1, 7.5, 5.5, 18.6, '#88c070'], [1, 7.5, 11, 10.5, '#4f9a50'], [7.5, 2.5, 11, 10.5, '#88c070'], [1, 14.5, 5.5, 18.6, '#e8d8a0'],
  [13, 2.5, 17, 13.5, '#a89888'], [13.5, 10.5, 16.5, 13.5, '#e8eef8'],
  [20, 1.5, 24, 13.5, '#88c070'], [20, 10.5, 24, 13.5, '#f0b8d0'], [20, 1.5, 24, 4.5, '#7a8aa0'],
  [23.5, 7.5, 27, 18.5, '#b0a088'], [23, 15, 27, 18.5, '#a05040'],
  [6.5, 15, 14.5, 18.5, '#e8d8a0'],
];

export function buildAzurine(A) {
  const { MAPS, flag, fill, dots, sign, npc, genRoute, mkTown, link, carve, interior, gateRow, gateCol, GYMS } = A;
  Object.assign(GYMS, AZURINE_GYMS);
  const G = AZURINE_GYMS;

  // ---------- Coralline Bay: the ferry harbour and Professor Marlowe's lab ----------
  mkTown('coralline', 'Coralline Bay', 26, 22, {
    style: 'coast', decor: ['palm', 'flower', 'palm', 'barrel'], density: 18, streets: [[8, 1, 24], [14, 1, 24]], vstreets: [[12, 0, 15]], open: [['north', 12]],
    stock: ['orb', 'potion', 'fullheal', 'repel'],
    pre(m) { fill(m, 1, 16, 24, 2, 'sand'); fill(m, 0, 18, 26, 4, 'water'); fill(m, 12, 16, 2, 6, 'dock'); },
    b: [['center', 2, 8], ['mart', 7, 8], ['lab', 15, 8, { to: 'lab_coralline' }],
      ['house', 2, 14, { name: 'Surf Shack', npcs: [{ look: 'swimmer', text: ['Welcome to the Azurine Isles! Every island here has its own weather.', 'You\'ll be riding the waves between them a LOT. Hope you like boats!'] }] }],
      ['house2', 16, 14, { name: 'Shell Cottage', npcs: [{ look: 'oldman', text: ['Eight islands, eight Gyms. The Isles\' League sits on Crown Atoll, far to the south-west.', 'Start at Palmhaven, up the beach to the north.'] }] }]],
  });
  {
    const m = MAPS.coralline;
    sign(m, 10, 10, 'CORALLINE BAY\nWhere the tide brings every traveller home.');
    npc(m, { id: 'az_sailor', look: 'sailor', x: 14, y: 17, dir: 'left', move: 'static', script: 'ferryAzurine' });
    npc(m, { id: 'cor_girl', look: 'girl', x: 20, y: 15, dir: 'down', move: 'wander', text: ['Professor Marlowe studies creatures that live between the islands.', 'She says new trainers should visit her lab first!'] });
    const lab = interior('lab_coralline', 'Marlowe Lab', 12, 10, [[5, 9]]);
    dots(lab, 'shelf', [[1, 2], [2, 2], [3, 2], [8, 2], [9, 2], [10, 2]]);
    dots(lab, 'table', [[4, 5], [5, 5], [6, 5]]); dots(lab, 'pc', [[10, 4]]); dots(lab, 'plant', [[1, 8], [10, 8]]); dots(lab, 'console', [[6, 2]]);
    npc(lab, { id: 'marlowe', look: 'marlowe', x: 5, y: 3, dir: 'down', move: 'static', script: 'marlowe' });
    npc(lab, { id: 'marlowe_aide', look: 'aide', x: 9, y: 6, dir: 'left', move: 'wander', script: 'marloweAide' });
  }

  // ---------- Route 20 (beach) -> Palmhaven (Gym 1: Grass, jungle village) ----------
  genRoute('route20', { name: 'Route 20', w: 22, h: 30, style: 'coast', lv: [6, 9], open: [['south', 12], ['north', 9]], trainers: 3, items: 3, hidden: 2 });
  link('coralline', 'north', 12, 'route20', 12);
  mkTown('palmhaven', 'Palmhaven', 26, 20, {
    decor: ['palm', 'tree', 'flower', 'palm', 'stump'], density: 18,
    post(m) { fill(m, 18, 1, 5, 2, 'water'); fill(m, 17, 3, 7, 1, 'flower'); },
    streets: [[8, 1, 24], [15, 3, 21]], vstreets: [[12, 8, 19]], open: [['south', 12], ['east', 8]],
    stock: ['orb', 'potion', 'superpotion', 'fullheal', 'repel'],
    b: [['center', 2, 8], ['mart', 7, 8], ['house', 15, 8, { name: 'Fruit Stand', npcs: [{ look: 'lass', text: ['Palmhaven\'s Gym is a greenhouse full of giant flowers.', 'Its Leader can make a vine grow a foot in a single song!'] }] }],
      ['house2', 20, 8, { name: 'Treehouse', npcs: [{ look: 'boy', text: ['The jungle east of town rains every single afternoon.', 'There\'s a sea cave on the far side. Shellport is past it.'] }] }],
      ['gym', 4, 15, { gym: G.bloom }], ['house', 15, 15, { name: 'Weaver\'s Hut', npcs: [{ look: 'oldman', text: ['We weave our roofs from palm leaves. They hold off the rain better than tile!'] }] }]],
  });
  link('route20', 'north', 9, 'palmhaven', 12);
  sign(MAPS.palmhaven, 10, 10, 'PALMHAVEN\nA village in the shade of a thousand palms.');

  // ---------- Route 21 (rainy jungle, Slash gate) -> Tide Cave -> Shellport (Gym 2: Water) ----------
  genRoute('route21', {
    name: 'Route 21', w: 34, h: 18, style: 'forest', lv: [10, 13], open: [['west', 8], ['east', 8]], trainers: 4, items: 3, hidden: 3,
    post(m, { P, K }) { gateCol(m, 6, P, K, 'bush', 'tree'); },
  });
  MAPS.route21.weather = 'rain';
  link('palmhaven', 'east', 8, 'route21', 8);
  genRoute('tidecave', { name: 'Tide Cave', w: 26, h: 20, style: 'cave', lv: [13, 16], open: [['west', 9], ['east', 9]], trainers: 3, items: 3, hidden: 2 });
  link('route21', 'east', 8, 'tidecave', 9);
  mkTown('shellport', 'Shellport', 26, 22, {
    style: 'coast', decor: ['palm', 'barrel', 'crate', 'flower'], density: 16,
    pre(m) { fill(m, 1, 0, 24, 3, 'water'); fill(m, 1, 3, 24, 1, 'sand'); },
    streets: [[8, 1, 24], [15, 3, 21]], vstreets: [[11, 8, 19]], open: [['west', 9], ['east', 8]],
    stock: ['orb', 'greatorb', 'superpotion', 'fullheal', 'repel', 'revive'],
    b: [['center', 2, 8], ['mart', 7, 8], ['house', 14, 8, { name: 'Net Mender', npcs: [{ look: 'fisher', text: ['The open sea east of here leads to Ember Isle.', 'You can see the volcano smoking from the end of the dock.'] }] }],
      ['gym', 4, 15, { gym: G.reef }], ['house2', 15, 15, { name: 'Diver\'s House', npcs: [{ look: 'swimmer', text: ['The Gym here is one big aquarium. Mind the jellyfish!'] }] }]],
  });
  link('tidecave', 'east', 9, 'shellport', 9);
  sign(MAPS.shellport, 9, 10, 'SHELLPORT\nThe harbour built on a giant seashell.');

  // ---------- Route 22 (open sea) -> Ember Isle (Gym 3: Fire, volcano) ----------
  genRoute('route22', { name: 'Route 22', w: 36, h: 22, style: 'sea', lv: [17, 20], open: [['west', 8], ['east', 9]], trainers: 4, items: 3, hidden: 1, islands: 5 });
  link('shellport', 'east', 8, 'route22', 8);
  mkTown('emberisle', 'Ember Isle', 26, 22, {
    base: 'ash', style: 'grass', border: 'rock', path: 'path', decor: ['deadtree', 'rock', 'rock', 'deadtree'], density: 20,
    post(m) { fill(m, 17, 1, 7, 2, 'lava'); fill(m, 2, 19, 5, 2, 'lava'); },
    streets: [[8, 1, 24], [15, 1, 24]], vstreets: [[12, 8, 21]], open: [['west', 9], ['south', 12]],
    stock: ['greatorb', 'superpotion', 'hyperpotion', 'fullheal', 'revive', 'repel', 'sunstone'],
    b: [['center', 2, 9], ['mart', 7, 9], ['house', 15, 9, { name: 'Hot Spring', npcs: [{ look: 'beauty', text: ['The volcano heats our springs. Best bath in the Isles!'] }] }],
      ['gym', 4, 16, { gym: G.magma }], ['house2', 15, 16, { name: 'Obsidian Smith', npcs: [{ look: 'hiker', text: ['Cracked lava rock blocks the trail up the volcano.', 'Bring a creature that can Shatter it.'] }] }]],
  });
  MAPS.emberisle.weather = 'ash';
  link('route22', 'east', 9, 'emberisle', 9);
  sign(MAPS.emberisle, 10, 11, 'EMBER ISLE\nLife at the foot of a sleeping fire.');

  // ---------- Route 23 (volcano slope, Shatter gate) -> Magma Tunnel (dark) -> Cirrus Peak (Gym 4: Flying) ----------
  genRoute('route23', {
    name: 'Route 23', w: 22, h: 30, style: 'ash', lv: [20, 23], open: [['north', 12], ['south', 10]], trainers: 4, items: 3, hidden: 2,
    post(m, { P, K }) { gateRow(m, 5, P, K, 'crack', 'rock'); },
  });
  MAPS.route23.weather = 'ash';
  link('emberisle', 'south', 12, 'route23', 12);
  genRoute('magmatunnel', { name: 'Magma Tunnel', w: 26, h: 20, style: 'cave', dark: true, lv: [23, 26], open: [['north', 11], ['south', 12]], trainers: 3, items: 3, hidden: 2 });
  link('route23', 'south', 10, 'magmatunnel', 11);
  mkTown('cirrus', 'Cirrus Peak', 24, 20, {
    border: 'rock', decor: ['rock', 'pine', 'flower', 'rock'], density: 18,
    post(m) { fill(m, 15, 2, 7, 1, 'fence'); },
    streets: [[8, 1, 22], [15, 3, 20]], vstreets: [[12, 0, 16]], open: [['north', 12], ['east', 8]],
    stock: ['greatorb', 'ultraorb', 'hyperpotion', 'fullheal', 'revive', 'maxrepel'],
    b: [['center', 2, 8], ['mart', 7, 8], ['house', 15, 8, { name: 'Cloud Watcher', npcs: [{ look: 'scientist', text: ['We live above the clouds here. On a clear day you can see four islands!'] }] }],
      ['gym', 2, 15, { gym: G.cirrus }], ['house2', 15, 15, { name: 'Glider Shop', npcs: [{ look: 'birdkeeper', text: ['East of the peak, the sea leads to Lagoon Isle.', 'The water there is pink at sunset. Honest!'] }] }]],
  });
  MAPS.cirrus.weather = 'fog';
  link('magmatunnel', 'south', 12, 'cirrus', 12);
  sign(MAPS.cirrus, 10, 10, 'CIRRUS PEAK\nThe town that floats on the clouds.');

  // ---------- Route 24 (sea) -> Pearlcove (Gym 5: Fae, pink lagoon) ----------
  genRoute('route24', { name: 'Route 24', w: 36, h: 18, style: 'sea', lv: [26, 29], open: [['west', 8], ['east', 8]], trainers: 4, items: 3, hidden: 1, islands: 4 });
  link('cirrus', 'east', 8, 'route24', 8);
  mkTown('pearlcove', 'Pearlcove', 26, 20, {
    style: 'coast', decor: ['palm', 'flower', 'flower', 'palm'], density: 18,
    pre(m) { fill(m, 16, 16, 9, 3, 'water'); fill(m, 15, 15, 11, 1, 'sand'); },
    streets: [[8, 1, 24], [14, 1, 14]], vstreets: [[12, 0, 15]], open: [['west', 8], ['north', 12]],
    stock: ['greatorb', 'ultraorb', 'hyperpotion', 'fullheal', 'revive', 'maxrepel', 'moonshard'],
    b: [['center', 2, 9], ['mart', 7, 9], ['house', 15, 9, { name: 'Pearl Diver', npcs: [{ look: 'swimmer', text: ['The pearls in our lagoon glow under a full moon.', 'Fae creatures come to dance around them.'] }] }],
      ['gym', 3, 15, { gym: G.pearl }], ['house2', 20, 9, { name: 'Ruin Hunter', npcs: [{ look: 'hiker', text: ['North of town there\'s an old city sunk into the sea cliffs.', 'Pitch black inside. Bring light!'] }] }]],
  });
  link('route24', 'east', 8, 'pearlcove', 8);
  sign(MAPS.pearlcove, 10, 11, 'PEARLCOVE\nWhere the lagoon glows like moonlight.');

  // ---------- Route 25 (coast, Heave gate) -> Sunken Ruins -> Stormwatch (Gym 6: Electric, lighthouse) ----------
  genRoute('route25', {
    name: 'Route 25', w: 22, h: 30, style: 'coast', lv: [29, 32], open: [['south', 12], ['north', 10]], trainers: 5, items: 3, hidden: 3,
    post(m, { P, K }) {
      const xs = []; for (let x = 1; x < m.w - 1; x++) if (P.has(K(x, 12))) xs.push(x);
      gateRow(m, 12, P, K, 'sand', 'rock'); xs.forEach((x) => m.boulders.push({ x, y: 12 }));
    },
  });
  link('pearlcove', 'north', 12, 'route25', 12);
  genRoute('sunkenruins', { name: 'Sunken Ruins', w: 26, h: 20, style: 'cave', dark: true, lv: [31, 34], open: [['south', 12], ['north', 12]], trainers: 3, items: 4, hidden: 2 });
  link('route25', 'north', 10, 'sunkenruins', 12);
  mkTown('stormwatch', 'Stormwatch', 26, 20, {
    border: 'rock', decor: ['rock', 'lamp', 'barrel', 'rock'], density: 18,
    pre(m) { fill(m, 1, 0, 24, 3, 'water'); fill(m, 1, 3, 24, 1, 'sand'); },
    streets: [[8, 1, 24], [15, 3, 21]], vstreets: [[12, 8, 19]], open: [['south', 12], ['east', 7]],
    stock: ['ultraorb', 'hyperpotion', 'maxpotion', 'fullheal', 'revive', 'maxrepel', 'sparkstone'],
    b: [['center', 2, 8], ['mart', 7, 8], ['tower', 17, 8, { to: 'eclipserig' }],
      ['gym', 4, 15, { gym: G.beacon }], ['house2', 15, 15, { name: 'Keeper\'s Cottage', npcs: [{ look: 'sailor', text: ['Some strangers rented the old lighthouse. Now it hums all night long.', 'Lightning hits it every storm. I don\'t think that\'s a coincidence.'] }] }]],
  });
  MAPS.stormwatch.weather = 'storm';
  link('sunkenruins', 'north', 12, 'stormwatch', 12);
  sign(MAPS.stormwatch, 10, 10, 'STORMWATCH\nThe light that guides every ship home.');
  {
    const b = interior('eclipserig', 'Old Lighthouse', 16, 16, [[7, 15], [8, 15]], { base: 'dkfloor', music: 'boss' });
    fill(b, 2, 3, 4, 1, 'console'); fill(b, 10, 3, 4, 1, 'console'); fill(b, 6, 8, 4, 1, 'console');
    dots(b, 'crate', [[1, 13], [2, 13], [14, 13], [13, 2]]);
    npc(b, { id: 'er_g1', look: 'grunt', x: 3, y: 10, dir: 'right', trainer: 'eclipse_a1', sight: 3 });
    npc(b, { id: 'er_g2', look: 'grunt', x: 12, y: 10, dir: 'left', trainer: 'eclipse_a2', sight: 3 });
    npc(b, { id: 'er_admin', look: 'corvo', x: 8, y: 5, dir: 'down', trainer: 'eclipse_a3', sight: 4, show: '!eclipseRig' });
  }

  // ---------- Route 26 (sea) -> Cragmoor (Gym 7: Rock) ----------
  genRoute('route26', { name: 'Route 26', w: 26, h: 34, style: 'sea', lv: [33, 36], open: [['west', 9], ['south', 12]], trainers: 4, items: 3, hidden: 1, islands: 5 });
  link('stormwatch', 'east', 7, 'route26', 9);
  mkTown('cragmoor', 'Cragmoor', 26, 20, {
    border: 'rock', decor: ['rock', 'rock', 'stump', 'fence'], density: 22, path: 'dirt',
    pre(m) { fill(m, 1, 0, 24, 3, 'water'); fill(m, 1, 3, 24, 1, 'sand'); carve(m, 'north', 12, 'water'); },
    streets: [[8, 1, 24], [15, 3, 21]], vstreets: [[12, 0, 16]], open: [['north', 12], ['south', 12]],
    stock: ['ultraorb', 'hyperpotion', 'maxpotion', 'fullheal', 'revive', 'maxrepel', 'tonic'],
    b: [['center', 2, 8], ['mart', 7, 8], ['house', 15, 8, { name: 'Quarry Office', npcs: [{ look: 'hiker', text: ['Cragmoor was built from the island\'s own stone. Even the beds are rock. Kidding! Mostly.'] }] }],
      ['gym', 4, 15, { gym: G.crag }], ['house2', 15, 15, { name: 'Lookout', npcs: [{ look: 'oldman', text: ['South of here is Wyrmhold, a town inside a dead volcano\'s crater.', 'Dragons nest on its rim.'] }] }]],
  });
  link('route26', 'south', 12, 'cragmoor', 12);
  sign(MAPS.cragmoor, 10, 10, 'CRAGMOOR\nCarved from the bones of the island.');

  // ---------- Route 27 (crag trail) -> Wyrmhold (Gym 8: Dragon, crater town) ----------
  genRoute('route27', { name: 'Route 27', w: 22, h: 30, style: 'desert', lv: [37, 40], open: [['north', 12], ['south', 11]], trainers: 5, items: 3, hidden: 3 });
  link('cragmoor', 'south', 12, 'route27', 12);
  mkTown('wyrmhold', 'Wyrmhold', 26, 20, {
    base: 'ash', border: 'rock', decor: ['rock', 'deadtree', 'rock', 'pillar'], density: 20,
    post(m) { fill(m, 17, 1, 6, 2, 'lava'); },
    streets: [[8, 1, 24], [15, 1, 24]], vstreets: [[11, 0, 15]], open: [['north', 11], ['west', 8]],
    stock: ['ultraorb', 'maxpotion', 'hyperpotion', 'fullheal', 'revive', 'tonic', 'maxrepel'],
    b: [['center', 2, 9], ['mart', 7, 9], ['house', 15, 9, { name: 'Dragon Keeper', npcs: [{ look: 'tamer', text: ['Our dragons only respect trainers who have crossed the whole sea.'] }] }],
      ['gym', 3, 15, { gym: G.scale }], ['house2', 15, 15, { name: 'Pilgrim\'s Rest', npcs: [{ look: 'oldman', text: ['West across the sea is Crown Atoll, home of the Isles\' League.', 'Only trainers with all eight Azurine badges may enter.'] }] }]],
  });
  link('route27', 'south', 11, 'wyrmhold', 11);
  sign(MAPS.wyrmhold, 9, 11, 'WYRMHOLD\nA town in the cradle of a sleeping volcano.');

  // ---------- Route 28 (sea) -> Coral Depths -> Route 29 -> Crown Atoll (Azurine League) ----------
  genRoute('route28', { name: 'Route 28', w: 38, h: 20, style: 'sea', lv: [41, 45], open: [['east', 8], ['west', 9]], trainers: 6, items: 4, hidden: 1, islands: 6 });
  link('wyrmhold', 'west', 8, 'route28', 8);
  genRoute('coraldepths', { name: 'Coral Depths', w: 28, h: 22, style: 'cave', lv: [45, 48], open: [['east', 10], ['west', 10]], trainers: 5, items: 4, hidden: 3 });
  link('route28', 'west', 9, 'coraldepths', 10);
  genRoute('route29', { name: 'Route 29', w: 30, h: 18, style: 'coast', lv: [47, 50], open: [['east', 8], ['west', 8]], trainers: 6, items: 4, hidden: 3 });
  link('coraldepths', 'west', 10, 'route29', 8);
  mkTown('crownatoll', 'Crown Atoll', 22, 16, {
    style: 'coast', decor: ['palm', 'flower', 'pillar'], density: 20,
    streets: [[12, 1, 20]], vstreets: [[10, 7, 13]], open: [['east', 12]],
    stock: ['ultraorb', 'maxpotion', 'hyperpotion', 'fullheal', 'revive', 'tonic', 'maxrepel'],
    b: [['center', 2, 12], ['mart', 15, 12], ['league', 6, 7, { to: 'league3_lobby' }]],
  });
  link('route29', 'west', 8, 'crownatoll', 12);
  {
    const lobby = interior('league3_lobby', 'Azurine League', 12, 9, [[5, 8], [6, 8]], { heal: true });
    fill(lobby, 3, 3, 6, 1, 'counter'); dots(lobby, 'healer', [[7, 2]]); dots(lobby, 'statue', [[1, 6], [10, 6]]);
    npc(lobby, { id: 'nurse', look: 'nurse', x: 5, y: 2, dir: 'down', move: 'static', script: 'nurse' });
    npc(lobby, { id: 'lg3_guard', look: 'guide', x: 10, y: 2, dir: 'down', move: 'static', script: 'leagueGuard3' });
    fill(lobby, 11, 2, 1, 1, 'mat');
    const rooms = [['e4a_1', 'Nalu\'s Room', 'icefloor'], ['e4a_2', 'Coralie\'s Room', 'marble'], ['e4a_3', 'Haku\'s Room', 'dkfloor'], ['e4a_4', 'Mira\'s Room', 'gymfloor'], ['champ3', 'Champion\'s Hall', 'carpet']];
    lobby.warps['11,2'] = { map: rooms[0][0], x: 4, y: 8, dir: 'up', cond: 'league3Open', lockedMsg: 'Talk to the guard first.' };
    rooms.forEach(([id, name, floor], i) => {
      const r = interior(id, name, 10, 10, [], { base: floor, music: 'boss' });
      dots(r, 'statue', [[1, 3], [8, 3], [1, 7], [8, 7]]);
      npc(r, { id: 'e4a', look: ['nalu', 'coralie', 'haku', 'mira', 'kai'][i], x: 4, y: 3, dir: 'down', move: 'static', script: i === 4 ? 'champion3' : 'elite3' });
      r.e4a = i;
      const next = rooms[i + 1] ? rooms[i + 1][0] : 'halloffame3';
      fill(r, 4, 1, 2, 1, 'mat');
      r.warps['4,1'] = { map: next, x: 4, y: 8, dir: 'up', cond: `e4a_${i}`, lockedMsg: 'The way forward is sealed until you win.' };
      r.warps['5,1'] = r.warps['4,1'];
      r.exitTo = { map: 'league3_lobby', x: 5, y: 7, dir: 'down' };
    });
    const hof = interior('halloffame3', 'Hall of Fame', 10, 10, [[4, 9], [5, 9]], { base: 'carpet', music: 'victory' });
    dots(hof, 'statue', [[2, 3], [7, 3]]);
    npc(hof, { id: 'hof_marlowe', look: 'marlowe', x: 4, y: 3, dir: 'down', move: 'static', script: 'hallOfFame3' });
    hof.exitTo = { map: 'crownatoll', x: 10, y: 8, dir: 'down' };
  }

  // ---- special encounters: the starters gather in the Route 21 jungle; four legends hide around the Isles ----
  const SOLIDISH = new Set(['tree', 'water', 'rock', 'cavewall', 'pine', 'cactus', 'barrelcactus', 'mapletree', 'goldtree', 'bush', 'crack', 'sign', 'fence', 'lava', 'palm', 'deadtree']);
  const spot = (m, prefer) => {
    const taken = new Set([...m.npcs.map((n) => `${n.x},${n.y}`), ...m.items.map((i) => `${i.x},${i.y}`)]);
    const trail = new Set(['path', 'dirt', 'cavepath', 'snowpath', 'sand']);
    const free = (x, y) => !SOLIDISH.has(m.tiles[y][x]) && !taken.has(`${x},${y}`) && !m.boulders.some((b) => b.x === x && b.y === y);
    const N = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let cands = [];
    for (let y = 3; y < m.h - 3; y++) for (let x = 3; x < m.w - 3; x++) {
      if (!free(x, y) || trail.has(m.tiles[y][x])) continue;
      if (N.some(([dx, dy]) => trail.has(m.tiles[y + dy][x + dx]))) cands.push([x, y]);
    }
    // at sea: any spot of island shore you can surf up to
    if (!cands.length) for (let y = 3; y < m.h - 3; y++) for (let x = 3; x < m.w - 3; x++) {
      if (free(x, y) && N.some(([dx, dy]) => m.tiles[y + dy][x + dx] === 'water')) cands.push([x, y]);
    }
    cands.sort((a, b2) => Math.abs(a[0] - prefer[0]) + Math.abs(a[1] - prefer[1]) - Math.abs(b2[0] - prefer[0]) - Math.abs(b2[1] - prefer[1]));
    return cands[0];
  };
  const special = (mapId, sp, level, prefer, show) => {
    const m = MAPS[mapId]; const at = spot(m, prefer);
    npc(m, { id: `legend_${sp}`, creature: sp, level, x: at[0], y: at[1], dir: 'down', move: 'static', script: 'legend', show: show || `!caught_${sp}` });
  };
  special('route21', 'batbud', 10, [12, 4]); special('route21', 'cindershell', 10, [18, 12]); special('route21', 'tuskle', 10, [26, 4]);
  special('magmatunnel', 'caldoros', 55, [13, 10]); special('route26', 'maelstrix', 55, [13, 20]);
  special('coraldepths', 'coralis', 58, [14, 10]); special('route28', 'azuron', 62, [19, 10], () => flag('eclipseSea') && !flag('caught_azuron'));

}
