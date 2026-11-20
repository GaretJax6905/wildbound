// Valor Isle and its Battle Tower: a side trip by ferry once you're Champion of Aldermoor.
// The tower grows a stage taller (and its challenge longer and tougher) for every region
// you've conquered. The island never changes your region: your boxes, map and obedience
// stay those of the region you sailed from.

// battles in one challenge, opponents' levels from first to last, creatures per opponent
export const TOWER_TIERS = [
  { battles: 7, lv: [50, 56], size: 3, floors: 3 },
  { battles: 14, lv: [56, 66], size: 4, floors: 6 },
  { battles: 21, lv: [62, 76], size: 5, floors: 8 },
];
export function towerTier(flag) {
  const n = ['champion', 'champion_meridia', 'champion_azurine'].filter((f) => flag(f)).length;
  return Math.max(1, Math.min(3, n));
}

export function buildValor(A) {
  const { REGION, MAPS, mkTown, fill, sign, npc, interior, dots } = A;
  const done = REGION.id;
  REGION.id = 'valor';
  mkTown('valorisle', 'Valor Isle', 22, 22, {
    style: 'coast', decor: ['palm', 'flower', 'palm'], density: 16, music: 'town',
    streets: [[14, 1, 20]], vstreets: [[10, 16, 17]], open: [],
    stock: ['ultraorb', 'maxpotion', 'fullheal', 'revive', 'maxrepel', 'lvcandy'],
    pre(m) { fill(m, 1, 16, 20, 2, 'sand'); fill(m, 0, 18, 22, 4, 'water'); fill(m, 10, 16, 2, 6, 'dock'); },
    b: [['center', 2, 14], ['mart', 15, 14], ['btower1', 9, 14, { to: 'tower_lobby' }]],
  });
  {
    const m = MAPS.valorisle;
    sign(m, 7, 15, 'VALOR ISLE\nHome of the Battle Tower. Only Champions may climb it.');
    npc(m, { id: 'valor_sailor', look: 'sailor', x: 12, y: 17, dir: 'left', move: 'static', script: 'ferryValor' });
    npc(m, { id: 'valor_vet', look: 'oldman', x: 4, y: 16, dir: 'down', move: 'wander', text: ['They say the tower grows a little taller every time a new Champion is crowned somewhere.', 'Every region you conquer, it adds floors... and tougher trainers to fill them!'] });
    npc(m, { id: 'valor_ace', look: 'acetrainer', x: 17, y: 16, dir: 'left', move: 'wander', text: ['I made it to the fifth floor once. Then a trainer with three dragons happened.', 'They heal your team between floors, but one loss and you start over.'] });
  }
  const lobby = interior('tower_lobby', 'Battle Tower', 11, 9, [[5, 8]], { base: 'marble', music: 'gym' });
  dots(lobby, 'statue', [[1, 1], [9, 1]]);
  dots(lobby, 'pc', [[1, 4]]);
  npc(lobby, { id: 'tower_desk', look: 'guide', x: 5, y: 2, dir: 'down', move: 'static', script: 'towerDesk' });
  npc(lobby, { id: 'tower_board', look: 'scientist', x: 8, y: 4, dir: 'left', move: 'static', script: 'towerRecords' });
  lobby.exitTo = { map: 'valorisle', x: 10, y: 14, dir: 'down' };
  const room = interior('tower_room', 'Battle Tower', 9, 8, [[4, 7]], { base: 'carpet', music: 'gym' });
  dots(room, 'statue', [[1, 1], [7, 1]]);
  room.exitTo = { map: 'tower_lobby', x: 5, y: 7, dir: 'down' };
  room.noExit = true;
  REGION.id = done;
}
