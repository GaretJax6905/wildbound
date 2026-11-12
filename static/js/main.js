import { start, bindTouchPad, setFirstInputHandler, setScene, fadeIn, fadeOut, everyFrame, fx } from './engine.js';
import { G, setGame, newGame, loadSave, save, importSaveFile, requestPersistentStorage } from './state.js';
import { unlockAudio, playMusic } from './audio.js';
import { titleScreen, optionsScreen } from './screens.js';
import { enterWorld } from './world.js';
import { say, yesNo, askName } from './ui.js';
import { newGameIntro } from './story.js';

const blank = { draw(g) { g.fillStyle = '#101828'; g.fillRect(0, 0, 240, 160); } };

async function boot() {
  try { await Promise.race([document.fonts.load('10px Pixelify'), new Promise((r) => setTimeout(r, 2500))]); } catch (e) { /* fallback font */ }
  bindTouchPad();
  setFirstInputHandler(unlockAudio);
  requestPersistentStorage();
  setScene(blank);
  start();
  everyFrame(() => { if (G && G.pos) G.time += 1 / 60; });
  const flush = () => { if (G && G.pos) save(); };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('/sw.js').catch(() => {});
  // handle for automated browser tests
  const eng = await import('./engine.js');
  const wld = await import('./world.js');
  window.__wildbound = { get G() { return G; }, layers: eng.layers, world: wld.world, scene: eng.getScene, get idle() { return eng.getScene() === wld.worldScene && !eng.layers.length && !wld.world.busy && !wld.world.walking; } };

  for (;;) {
    const existing = await loadSave();
    const items = existing ? ['CONTINUE', 'NEW GAME', 'OPTIONS'] : ['NEW GAME', 'LOAD FILE', 'OPTIONS'];
    playMusic('town');
    fx.fade = 0;
    const r = await titleScreen(items);
    const k = items[r];
    if (k === 'CONTINUE') {
      setGame(existing);
      await fadeOut(12);
      enterWorld();
      await fadeIn(12);
      return;
    }
    if (k === 'NEW GAME') {
      if (existing && !(await yesNo('Starting a new game will replace your saved progress. Are you sure?'))) continue;
      if (existing && (await yesNo('Download a backup of your old save first?'))) { setGame(existing); (await import('./state.js')).exportSave(); }
      await fadeOut(12);
      newGame('TOM');
      await newGameIntro(askName);
      enterWorld();
      save();
      await fadeIn(20);
      await say('Tip: the game saves automatically, and you can download a backup file any time from OPTIONS.');
      return;
    }
    if (k === 'LOAD FILE') {
      const ok = await importSaveFile();
      if (ok) { await say('Save file loaded!'); continue; }
      if (ok === false) await say('That file isn\'t a Wildbound save.');
    }
    if (k === 'OPTIONS') { if (existing) setGame(existing); await optionsScreen(); }
  }
}

boot();
