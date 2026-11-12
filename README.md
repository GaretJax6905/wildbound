# Wildbound

**A retro creature-collecting RPG in the style of the GBA classics, written from scratch in vanilla JavaScript on HTML5 Canvas. Plays on phones with an on-screen D-pad and A/B buttons, installs to the home screen and works offline.**

![Pebbleton town](docs/town.png) ![A 2-on-2 tag battle against both rivals](docs/battle.png)

> Free hosting: the first visit after a quiet spell can take ~30–60 s to wake up.

| | |
| --- | --- |
| **Front end** | Vanilla JavaScript (ES modules), HTML5 Canvas 2D, Web Audio API (chiptune music + SFX), Pointer Events, PWA |
| **Art** | 100% generated in code: 121 creatures from body-plan recipes, GBA-style shaded people and trainer portraits, all pixelized (hard alpha, palette snap, outline, rim shading) |
| **Back end** | Python 3.12 + Flask, only serves the static game |
| **Saving** | Autosave to localStorage + rolling backup + IndexedDB mirror, plus export/import of a save file |
| **Deploy** | Render (free plan), auto-deployed from `main` via `render.yaml` |

## The idea

You're a new trainer who travels from region to region. Like a long-running anime journey, **each region is a fresh start**: three new starters, new gyms, new creatures. When you leave a region you pick **one or two partners** to travel with you. Everyone else stays behind with the professor (in that region's PC box) until you sail back. Becoming Champion **unlocks** the ferry but never forces you to leave, so you can stay to finish the DEX or hunt legendaries.

## Region 1: Aldermoor (complete)

- **10 towns, 8 Gyms, Victory Road, Elite Four and Champion.** The Gyms are Pebbleton (Rock), Thistlewood (Grass), Voltara (Electric), Coralport (Water), Kestrel Isle (Brawl), Lumen City (Mind), Cinderpeak (Fire) and Skyreach (Dragon). Crown Plateau holds the League.
- **121 original creatures across 18 types.** Every one is catchable, including the starters you didn't pick, all evolved forms and 4 legendaries. Evolution happens only by level or item (Spark Stone, Moon Shard, Dusk Stone, Leaf Stone, Frost Stone). There are no trade evolutions, though an optional trade NPC exists.
- **Field moves (HM-style Trail Discs) unlock new areas:**
  - Slash cuts bushes.
  - Shatter smashes cracked rocks.
  - Wave Ride crosses water.
  - Heave pushes boulders.
  - Glow lights dark caves.
  - Soar flies you to any town you've visited.

  Each one needs the right number of badges.
- **Town Map from Mom** (press SELECT). It shows towns, routes, caves and where you are.
- **Generated routes:** seeded paths, tall grass, trainers who spot you, and visible plus hidden items scattered around (hidden ones are found by pressing A). A checker guarantees nothing ever cuts off part of a map.
- **Rivals Kai & Juno** take turns battling you and team up for 2-on-2 tag battles. Kai waits as Champion.
- **Team Eclipse:** the recurring duo Nyx & Corvo, grunts in Cinder Cave, and leader Vex in Lumen Tower, who locks the Gym until you clear the tower. They're always close to the local Gym's level.
- **Battle system:** type chart, physical/special split, STAB, crits, PP, priority, stat stages, burn/poison/paralysis/sleep, drain, recoil, wild/trainer/double/alternating battles, catching and evolution.

## Controls

| Action | Phone | Keyboard |
| --- | --- | --- |
| Move | D-pad | Arrows / WASD |
| A (talk, confirm) | A | Z, Enter, Space |
| B (cancel, hold to run) | B | X, Backspace, Shift |
| Menu | START | Esc / M |

Portrait phones get a Game Boy-style layout. Turn the phone sideways and the D-pad and A/B move to either side of the screen.

## Your progress is never lost

- **Autosave**: after every map change, battle, heal, menu, PC use, and every 30 s. It also saves when the tab is hidden or closed.
- **Two copies + mirror**: each save keeps the previous one as a backup and is mirrored to IndexedDB. The newest valid copy wins on load.
- **Download your save**: START → OPTIONS → EXPORT SAVE gives you a `.json` file. You can load it on any device with IMPORT SAVE or LOAD FILE on the title screen.
- **Install it**: open the site on your phone and use *Add to Home Screen* (iOS: Share → Add to Home Screen). It runs full-screen and offline, and installed apps keep their storage.

## Run locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py              # http://localhost:5000
```

Tests:

```bash
pip install pytest
pytest                       # server routes, PWA files, offline cache list
node tests/check_data.mjs    # every creature catchable, no trade evolutions, maps valid
node tests/check_reach.mjs   # whole region walkable; each field move gates the next area
```

## Deploy on Render

New → **Blueprint** → pick this repo. `render.yaml` sets up a free web service that redeploys on every push to `main`.

## Growing the game

- **New creature**: add it to `SPECIES` in `static/js/data.js` (stats, types, learnset, `evo: {to, level}` or `{to, item}`), add a drawer under its `family` in `static/js/art.js`, and put it in an encounter table in `static/js/maps.js`. `tests/check_data.mjs` fails if it can't be caught anywhere.
- **New region**: add maps with `region: '<id>'` in `maps.js` (use `genRoute` / `mkTown`). Boxes are stored per region (`G.boxes[region]`), and the ferry's partner picker already saves `G.partners`.
- **New trainers / story**: `static/js/story.js` (trainers, rival teams, Team Eclipse scenes).

## Project layout

```
app.py                 Flask server (static files + PWA routes)
render.yaml            Render blueprint
static/index.html      page + touch controls
static/style.css       handheld-console layout (portrait / landscape / desktop)
static/sw.js           offline cache
static/js/
  engine.js   loop, input (keyboard + touch), layers, fades
  ui.js       text boxes, menus, prompts
  art.js      procedural pixel art (creatures, people, tiles, buildings)
  data.js     types, moves, items, field moves; builds the creature list
  species.js  the 121 Aldermoor creatures (stats, evolutions, habitats, art recipes)
  mon.js      stats, EXP, move learning, evolution
  maps.js     Aldermoor maps
  world.js    overworld movement, NPCs, doors, grass, trainer sight
  battle.js   battle engine
  screens.js  team, summary, bag, PC, DEX, shop, starter pick, options, evolution
  story.js    scripts, rivals, Team Eclipse, gym
  state.js    game state + saving/export/import
  audio.js    chiptune synth
```

All creatures, characters, names and art are original. The font is Pixelify Sans (SIL Open Font License, see `static/fonts/OFL.txt`).
