// Tiny chiptune synth: sound effects and looping background tunes, all
// generated with Web Audio oscillators (no audio files).
import { settings } from './state.js';

let ac = null, master = null, musicGain = null, sfxGain = null;

export function unlockAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
    musicGain = ac.createGain(); musicGain.connect(master);
    sfxGain = ac.createGain(); sfxGain.connect(master);
    applyVolumes();
    if (pendingTrack) playMusic(pendingTrack, true);
  } catch (e) { ac = null; }
}

export function applyVolumes() {
  if (!ac) return;
  musicGain.gain.value = settings.music ? 0.22 : 0;
  sfxGain.gain.value = settings.sfx ? 0.5 : 0;
}

function tone(freq, t0, dur, type = 'square', vol = 0.3, dest = sfxGain, slide = 0) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(dest);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function noise(t0, dur, vol = 0.3) {
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ac.createBufferSource(); s.buffer = buf;
  const g = ac.createGain(); g.gain.value = vol;
  s.connect(g); g.connect(sfxGain); s.start(t0);
}

const SFX = {
  blip: (t) => tone(1200, t, 0.02, 'square', 0.05),
  move: (t) => tone(880, t, 0.04, 'square', 0.12),
  select: (t) => { tone(1046, t, 0.05, 'square', 0.15); tone(1568, t + 0.05, 0.06, 'square', 0.12); },
  back: (t) => tone(523, t, 0.06, 'square', 0.12),
  bump: (t) => tone(110, t, 0.08, 'square', 0.2),
  door: (t) => { tone(330, t, 0.06, 'triangle', 0.3); tone(220, t + 0.06, 0.1, 'triangle', 0.3); },
  hit: (t) => { noise(t, 0.15, 0.35); tone(220, t, 0.12, 'square', 0.2, sfxGain, -150); },
  superhit: (t) => { noise(t, 0.25, 0.45); tone(440, t, 0.2, 'sawtooth', 0.25, sfxGain, -380); },
  weakhit: (t) => { noise(t, 0.08, 0.2); },
  faint: (t) => tone(600, t, 0.6, 'square', 0.22, sfxGain, -560),
  encounter: (t) => { for (let i = 0; i < 6; i++) tone(i % 2 ? 784 : 988, t + i * 0.06, 0.05, 'square', 0.18); },
  throw: (t) => tone(400, t, 0.3, 'triangle', 0.25, sfxGain, 600),
  shake: (t) => tone(180, t, 0.08, 'square', 0.2),
  caught: (t) => [523, 659, 784, 1046].forEach((f, i) => tone(f, t + i * 0.1, 0.12, 'square', 0.2)),
  levelup: (t) => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, t + i * 0.08, 0.1, 'square', 0.2)),
  heal: (t) => [784, 784, 659, 1046, 988, 1046].forEach((f, i) => tone(f, t + i * 0.16, 0.15, 'triangle', 0.3)),
  badge: (t) => [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, t + i * 0.12, 0.2, 'square', 0.2)),
  evolve: (t) => [392, 523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, t + i * 0.1, 0.18, 'triangle', 0.3)),
  save: (t) => { tone(988, t, 0.08, 'square', 0.15); tone(1318, t + 0.09, 0.12, 'square', 0.15); },
  item: (t) => [659, 784, 988].forEach((f, i) => tone(f, t + i * 0.09, 0.1, 'square', 0.18)),
};

export function sfx(name) {
  if (!ac || !settings.sfx || !SFX[name]) return;
  SFX[name](ac.currentTime + 0.001);
}

// ---------- music ----------
// Notes: letter + octave, '-' = rest. Each entry is "note:sixteenths".
const N = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function freq(n) {
  const m = n.match(/^([A-G]#?)(\d)$/);
  if (!m) return 0;
  return 440 * Math.pow(2, (N[m[1]] + (+m[2] + 1) * 12 - 69) / 12);
}
function seq(s) { return s.trim().split(/\s+/).map((x) => { const [n, d] = x.split(':'); return [n === '-' ? 0 : freq(n), +d || 2]; }); }

const TRACKS = {
  town: {
    bpm: 112,
    lead: seq('E5:2 G5:2 A5:4 G5:2 E5:2 D5:4 C5:2 D5:2 E5:2 G5:2 E5:8 E5:2 G5:2 A5:4 C6:2 B5:2 A5:4 G5:2 E5:2 D5:2 E5:2 C5:8'),
    bass: seq('C3:4 G3:4 A2:4 E3:4 F2:4 C3:4 G2:4 G3:4 C3:4 G3:4 A2:4 E3:4 F2:4 G2:4 C3:8'),
  },
  route: {
    bpm: 132,
    lead: seq('D5:2 F#5:2 A5:2 D6:2 C#6:2 A5:2 F#5:4 G5:2 B5:2 D6:2 B5:2 A5:6 -:2 F#5:2 A5:2 B5:2 A5:2 G5:2 F#5:2 E5:4 D5:2 E5:2 F#5:2 E5:2 D5:8'),
    bass: seq('D3:4 A3:4 D3:4 A3:4 G2:4 D3:4 A2:4 E3:4 D3:4 A3:4 G2:4 D3:4 A2:4 E3:4 D3:8'),
  },
  battle: {
    bpm: 168,
    lead: seq('A4:2 A4:2 C5:2 A4:2 E5:2 A4:2 D5:2 C5:2 B4:2 B4:2 D5:2 B4:2 F5:4 E5:4 A4:2 A4:2 C5:2 A4:2 E5:2 A4:2 G5:2 F5:2 E5:2 D5:2 C5:2 B4:2 A4:8'),
    bass: seq('A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 G2:2 G3:2 G2:2 G3:2 F2:2 F3:2 E2:2 E3:2 A2:2 A3:2 A2:2 A3:2 C3:2 C4:2 C3:2 C4:2 E2:2 E3:2 E2:2 E3:2 A2:4 A2:4'),
  },
  boss: {
    bpm: 176,
    lead: seq('E5:2 D#5:2 E5:2 B4:2 G5:2 F#5:2 E5:2 B4:2 C5:2 B4:2 C5:2 G4:2 E5:4 D5:4 E5:2 D#5:2 E5:2 B4:2 A5:2 G5:2 F#5:2 E5:2 F#5:2 G5:2 F#5:2 D#5:2 E5:8'),
    bass: seq('E2:2 E3:2 E2:2 E3:2 E2:2 E3:2 E2:2 E3:2 C2:2 C3:2 C2:2 C3:2 D2:2 D3:2 D2:2 D3:2 E2:2 E3:2 E2:2 E3:2 A2:2 A3:2 A2:2 A3:2 B2:2 B3:2 B2:2 B3:2 E2:4 E2:4'),
  },
  indoor: {
    bpm: 100,
    lead: seq('C5:2 E5:2 G5:2 E5:2 F5:2 A5:2 G5:4 E5:2 C5:2 D5:2 E5:2 D5:8 C5:2 E5:2 G5:2 C6:2 B5:2 G5:2 A5:4 G5:2 F5:2 E5:2 D5:2 C5:8'),
    bass: seq('C3:8 F2:8 C3:8 G2:8 C3:8 G2:8 F2:8 C3:8'),
  },
  victory: {
    bpm: 140,
    lead: seq('C5:2 E5:2 G5:2 C6:6 A5:2 B5:2 C6:2 D6:6 E6:2 D6:2 C6:2 B5:2 C6:8'),
    bass: seq('C3:8 F3:8 G3:8 C3:8'),
  },
};

let current = null, pendingTrack = null, timer = null;
export function playMusic(name, force = false) {
  pendingTrack = name;
  if (!ac) return;
  if (current && current.name === name && !force) return;
  stopMusic();
  const tr = TRACKS[name];
  if (!tr) return;
  const sixteenth = 60 / tr.bpm / 4;
  const voices = [{ notes: tr.lead, i: 0, t: ac.currentTime + 0.05, type: 'square', vol: 0.16 }, { notes: tr.bass, i: 0, t: ac.currentTime + 0.05, type: 'triangle', vol: 0.32 }];
  current = { name };
  const me = current;
  const schedule = () => {
    if (current !== me) return;
    for (const v of voices) {
      while (v.t < ac.currentTime + 0.3) {
        const [f, d] = v.notes[v.i];
        const dur = d * sixteenth;
        if (f && d) tone(f, v.t, Math.max(0.05, dur * 0.9), v.type, v.vol, musicGain);
        v.t += dur;
        v.i = (v.i + 1) % v.notes.length;
      }
    }
  };
  schedule();
  timer = setInterval(schedule, 100);
}
export function stopMusic() { if (timer) clearInterval(timer); timer = null; current = null; }
