// Team Eclipse's hidden hideouts: one per region, underground, opened only after you're
// Champion there. Each is a one-shot gauntlet of Eclipse members ending with Vex, with a
// restore spring halfway. The entrance is placed on the overworld at run time (story.js).
// Every region's hideout has its own look and layout.

export const HIDEOUTS = {
  aldermoor: { map: 'hideout_aldermoor', name: 'Eclipse Bunker', lvl: 50, types: ['Shadow', 'Toxic', 'Spirit'], prof: 'maple', champ: 'champion', entry: [6, 20], league: ['crown'] },
  meridia: { map: 'hideout_meridia', name: 'Eclipse Foundry', lvl: 51, types: ['Shadow', 'Bug', 'Metal'], prof: 'cedar', champ: 'champion_meridia', entry: [7, 20], league: ['zenith'] },
  azurine: { map: 'hideout_azurine', name: 'Eclipse Grotto', lvl: 54, types: ['Shadow', 'Water', 'Toxic'], prof: 'marlowe', champ: 'champion_azurine', entry: [6, 24], league: ['crownatoll'] },
};

export function buildHideouts(A) {
  const { REGION, fill, dots, npc, interior } = A;
  const done = REGION.id;
  // trainers: n 0..3 grunts, 4 Nyx, 5 Corvo; Vex waits at the end (script, not a sight trainer)
  const grunt = (m, r, n, x, y, dir, sight = 4) => npc(m, { id: `hx_${n}`, look: 'grunt', x, y, dir, trainer: `hideout:${r}:${n}`, sight });
  const admin = (m, r, n, look, x, y, dir) => npc(m, { id: `hx_${n}`, look, x, y, dir, trainer: `hideout:${r}:${n}`, sight: 3 });
  const vex = (m, x, y) => npc(m, { id: 'hx_vex', look: 'vex', x, y, dir: 'down', move: 'static', script: 'hideoutBoss' });

  // ---------- Aldermoor: a concrete bunker of consoles and crates, switchbacks left and right ----------
  REGION.id = 'aldermoor';
  {
    const m = interior('hideout_aldermoor', 'Eclipse Bunker', 14, 22, [[6, 21], [7, 21]], { base: 'dkfloor', music: 'boss' });
    m.hideout = 'aldermoor';
    fill(m, 1, 16, 9, 1, 'console'); fill(m, 3, 11, 10, 1, 'crate'); fill(m, 1, 6, 9, 1, 'console');
    dots(m, 'crate', [[1, 20], [12, 20], [12, 12], [1, 7], [12, 1], [1, 1]]);
    dots(m, 'pc', [[12, 15]]);
    dots(m, 'spring', [[1, 13]]);
    grunt(m, 'aldermoor', 0, 2, 18, 'right'); grunt(m, 'aldermoor', 1, 12, 17, 'left');
    grunt(m, 'aldermoor', 2, 9, 14, 'left');
    admin(m, 'aldermoor', 4, 'nyx', 3, 9, 'right'); admin(m, 'aldermoor', 5, 'corvo', 11, 8, 'left');
    grunt(m, 'aldermoor', 3, 11, 4, 'left', 3);
    vex(m, 6, 2);
  }
  // ---------- Meridia: a foundry under the earth, lava channels and stacked barrels, mirrored ----------
  REGION.id = 'meridia';
  {
    const m = interior('hideout_meridia', 'Eclipse Foundry', 16, 22, [[7, 21], [8, 21]], { base: 'ash', music: 'boss' });
    m.hideout = 'meridia';
    fill(m, 4, 16, 11, 1, 'lava'); fill(m, 1, 11, 11, 1, 'lava'); fill(m, 4, 6, 11, 1, 'lava');
    dots(m, 'barrel', [[14, 20], [1, 20], [1, 12], [14, 15], [14, 7], [1, 1], [14, 1]]);
    dots(m, 'console', [[6, 1], [9, 1]]);
    dots(m, 'spring', [[14, 13]]);
    grunt(m, 'meridia', 0, 13, 18, 'left'); grunt(m, 'meridia', 1, 2, 19, 'right');
    grunt(m, 'meridia', 2, 5, 13, 'right');
    admin(m, 'meridia', 4, 'nyx', 12, 9, 'left'); admin(m, 'meridia', 5, 'corvo', 4, 8, 'right');
    grunt(m, 'meridia', 3, 3, 4, 'right', 3);
    vex(m, 8, 2);
  }
  // ---------- Azurine: a flooded sea grotto, stalagmite walls, tide pools and glowing crystals ----------
  REGION.id = 'azurine';
  {
    const m = interior('hideout_azurine', 'Eclipse Grotto', 14, 26, [[6, 25], [7, 25]], { base: 'cavefloor', music: 'boss' });
    m.hideout = 'azurine'; m.cave = true;
    fill(m, 1, 21, 8, 1, 'rock'); fill(m, 5, 17, 8, 1, 'rock'); fill(m, 1, 13, 8, 1, 'rock'); fill(m, 5, 9, 8, 1, 'rock'); fill(m, 1, 5, 9, 1, 'rock');
    fill(m, 10, 22, 3, 2, 'water'); fill(m, 1, 18, 2, 2, 'water'); fill(m, 11, 10, 2, 2, 'water');
    dots(m, 'crystal', [[1, 24], [12, 14], [1, 10], [12, 6], [1, 1], [12, 1]]);
    dots(m, 'spring', [[12, 15]]);
    grunt(m, 'azurine', 0, 11, 20, 'left'); grunt(m, 'azurine', 1, 2, 16, 'right');
    grunt(m, 'azurine', 2, 11, 12, 'left');
    admin(m, 'azurine', 4, 'nyx', 2, 8, 'right'); admin(m, 'azurine', 5, 'corvo', 11, 7, 'left');
    grunt(m, 'azurine', 3, 11, 3, 'left', 3);
    vex(m, 6, 2);
  }
  REGION.id = done;
}
