# How Wildbound was built

Wildbound is about 8,500 lines of vanilla JavaScript with no framework, no bundler and no game engine. This page covers how the pieces fit together and the decisions behind them.

## Architecture

**A tiny engine of layers.** `engine.js` runs a fixed-step loop (60 updates a second) and keeps a stack of *layers*: the overworld, a text box, a menu, a battle, a fade. Only the top layer receives input; every layer draws, bottom to top. Opening a menu is just pushing a layer, and closing it is popping one, so screens never need to know about each other.

**Story scripts are plain `async` functions.** Every cutscene, Gym Leader and rival scene is written as straight-line code:

```js
await say('KAI: Took the slow boat?');
const kai = await appear('tmp_kai', 'kai');
const won = await fight(rivalA('kai', 22));
await walkAway(kai);
```

`say()` returns a promise that resolves when the player closes the text box, and `fight()` resolves with the battle result. That keeps hundreds of scenes readable without a state machine or a scripting language.

**Data-driven maps.** A map is an object with a tile grid, warps, NPCs, triggers and encounter tables. Towns come from templates (`mkTown`), and routes come from a seeded generator (`genRoute`) that lays a path, grows tall grass, places trainers where they can see the path, and scatters items. Each region file (`region2.js`, `region3.js`) only describes its layout and what's special about it.

**Post-processing passes give each region its character.** After every map is built, passes run over the whole world:

- **Beaches:** in the Azurine Isles, lawn within two steps of the sea turns to sand, trees near the shore become palms, and a surf edge rolls along the water.
- **Hidden encounters:** on new-region routes, each map keeps its two most common creatures in normal grass and moves the rare ones into small hidden patches you have to find.
- **Hideouts:** Team Eclipse's hideout entrances are placed at run time, on a random map, and removed when the hideout collapses.

**Generated creature data.** Each region's creatures are defined once in a Python generator (`tools/*/dex.py`): name, types, base-stat total, growth style, evolutions, where it lives and an art description. The generator spreads the stats, builds move lists that unlock at sensible levels, writes the encounter tables and outputs `species*.js`. Changing a creature means changing one line and re-running it.

## The art pipeline

The creature and character art started as AI image generation (Gemini), driven by prompts that ask for full-body art on a plain white background, front and back views in a grid. Turning those sheets into game assets is my own Python tooling in `tools/`:

1. **Stitch:** the browser only shows part of a large image, so the sheet is captured in overlapping pieces and stitched back together.
2. **Cut:** the background colour is measured from the border, then flood-filled from the edges, so white areas *inside* a creature (a white belly, say) are kept. Connected components are grouped into the grid cell they belong to, which drops stray marks and labels.
3. **Clean:** the thin pale fringe that JPEG compression leaves around each figure is trimmed, and everything is scaled to a fixed canvas, feet on the baseline.
4. **Sprites:** overworld walkers are cut the same way, shrunk to 76 px and given hard-edged alpha. Walk cycles are *synthesised* from the single standing frame by shifting the leg rows (`tools/npcwalk/synth.py`), so every character walks without needing animation frames from the generator.
5. **In-game outline:** at load time the game draws a dark rim around every creature and portrait (`addRim` in `art.js`), so pale creatures never fade into a light battle background.

Every design is checked by eye against existing franchises, and anything that reads as a lookalike is redrawn.

## Testing

Wildbound has three layers of tests:

- **`pytest`**: the Flask routes, PWA files, and that the offline cache lists every JavaScript module.
- **`tests/check_data.mjs`**: every one of the 359 creatures can be obtained somewhere (wild, special encounter or evolution), every encounter table points at real creatures, every map is well formed.
- **`tests/check_reach.mjs`**: walks all 242 maps with a flood fill, first with no field moves, then adding them one at a time. It proves every map, item, trainer and legend is reachable, and that each field move actually gates the next area, so progression order can't break.

On top of those, Playwright scripts play the real game in headless Chrome: they set up a save, trigger story scenes, fight through battles by pressing buttons, and check flags and screenshots. That's how features like the Elite Four, the hideout gauntlet and creature snatching were verified end to end.

## Balancing

The level curve was tuned with a simulation rather than guesswork. A script collects every trainer, Gym Leader, Elite Four member and wild encounter in a region, sorts them in the order a player meets them, and feeds the EXP into a team of four creatures. It then reports how far the team is above or below each Leader's strongest creature.

The first run showed a team of four would arrive at the Elite Four **about 25 levels too low**. Raising EXP 3.5× and lowering the Elite Four and Champions by 4 levels gave this curve (assuming a modest amount of wild battling):

| | Gyms 1–8 | Elite Four |
| --- | --- | --- |
| Team level vs. Leader's ace | 0 to −4 | −3 to −8 |

That leaves each Gym slightly hard and the League a real test that rewards a little training on the last route. It also lines up with the obedience caps (15, 20, … 50 by badge count), so the creatures you raise naturally keep listening to you.

## Saving and offline play

The game state is one plain object, `G`. It autosaves to `localStorage` after every meaningful event, keeps the previous save as a backup, and mirrors to IndexedDB; on load the newest valid copy wins. A service worker caches every file so the installed app works offline, and the test suite fails if a new module is missing from the cache list.

## Deployment

Pushing to `main` triggers a Render deploy from `render.yaml`. The Flask app only serves static files and PWA routes, so the free plan is enough.
