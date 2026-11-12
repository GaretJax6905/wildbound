// Game state + saving. Progress is written to localStorage (with a rolling
// backup copy) AND mirrored to IndexedDB, and can be exported/imported as a
// .json file so it can never be lost.
const KEY = 'wildbound.save.v1';
const BAK = 'wildbound.save.v1.bak';
const SETTINGS = 'wildbound.settings';

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

export const settings = Object.assign({ textSpeed: 1, music: true, sfx: true }, safeParse(lsGet(SETTINGS)) || {});
export function saveSettings() { lsSet(SETTINGS, JSON.stringify(settings)); }

function safeParse(s) { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }

export let G = null;
export function setGame(g) { G = g; }

export function newGame(playerName) {
  G = {
    version: 1,
    name: playerName,
    rivals: { kai: null, juno: null }, // their starter species
    starter: null,
    money: 3000,
    badges: [],
    flags: {},
    party: [],
    region: 'aldermoor',
    regionsVisited: ['aldermoor'],
    boxes: { aldermoor: [] }, // creatures left behind stay in their own region
    partners: [], // uids of creatures that travel between regions with you
    bag: { potion: 2 },
    dex: { seen: {}, caught: {} },
    pos: { map: 'house_player', x: 4, y: 3, dir: 'down' },
    lastHeal: { map: 'house_player', x: 4, y: 4, dir: 'down' },
    time: 0,
    steps: 0,
    savedAt: 0,
  };
  return G;
}

export function validSave(s) {
  return s && typeof s === 'object' && s.version === 1 && Array.isArray(s.party) && s.pos && s.boxes && s.dex;
}

// ----- IndexedDB mirror -----
function idb() {
  return new Promise((res) => {
    try {
      const r = indexedDB.open('wildbound', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('saves');
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch (e) { res(null); }
  });
}
async function idbPut(v) {
  const db = await idb(); if (!db) return;
  try { db.transaction('saves', 'readwrite').objectStore('saves').put(v, 'main'); } catch (e) { /* ignore */ }
}
async function idbGet() {
  const db = await idb(); if (!db) return null;
  return new Promise((res) => {
    try {
      const q = db.transaction('saves').objectStore('saves').get('main');
      q.onsuccess = () => res(q.result || null);
      q.onerror = () => res(null);
    } catch (e) { res(null); }
  });
}

let lastSaveJson = '';
export function save() {
  if (!G) return false;
  G.savedAt = Date.now();
  const json = JSON.stringify(G);
  if (json === lastSaveJson) return true;
  const prev = lsGet(KEY);
  if (prev && validSave(safeParse(prev))) lsSet(BAK, prev);
  const ok = lsSet(KEY, json);
  idbPut(json);
  lastSaveJson = json;
  return ok;
}

export async function loadSave() {
  const cands = [safeParse(lsGet(KEY)), safeParse(lsGet(BAK)), safeParse(await idbGet())].filter(validSave);
  if (!cands.length) return null;
  cands.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  return cands[0];
}

export async function hasSave() { return !!(await loadSave()); }

export function exportSave() {
  if (!G) return;
  save();
  const blob = new Blob([JSON.stringify(G, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  const d = new Date();
  a.download = `wildbound-save-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
  a.href = URL.createObjectURL(blob);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function importSaveFile() {
  return new Promise((res) => {
    const inp = document.getElementById('import-file');
    inp.value = '';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return res(null);
      const r = new FileReader();
      r.onload = () => {
        const s = safeParse(r.result);
        if (!validSave(s)) return res(false);
        G = s; lastSaveJson = ''; save();
        res(true);
      };
      r.onerror = () => res(false);
      r.readAsText(f);
    };
    inp.click();
  });
}

export function requestPersistentStorage() {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignore */ }
}

// ----- helpers on state -----
export function addToCollection(m) {
  G.dex.seen[m.sp] = true;
  G.dex.caught[m.sp] = true;
  if (G.party.length < 6) { G.party.push(m); return 'party'; }
  (G.boxes[G.region] = G.boxes[G.region] || []).push(m);
  return 'box';
}
export function addItem(id, n = 1) { G.bag[id] = (G.bag[id] || 0) + n; }
export function useItem(id) { if (G.bag[id] > 0) { G.bag[id]--; if (!G.bag[id]) delete G.bag[id]; return true; } return false; }
export const flag = (k) => !!(G && G.flags[k]);
export const setFlag = (k, v = true) => { G.flags[k] = v; };
