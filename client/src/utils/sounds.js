/**
 * sounds.js — Web Audio API synthesized game sounds
 * No external audio files needed. All sounds are generated in real-time.
 */

let _ctx = null;
const MUTE_KEY = 'minigame_muted';
let _muted = (() => {
  try { return localStorage.getItem(MUTE_KEY) === 'true'; } catch { return false; }
})();
const _muteListeners = new Set();

function _notifyMute() {
  _muteListeners.forEach(fn => { try { fn(_muted); } catch (_) { /* ignore */ } });
}

function _persistMute() {
  try { localStorage.setItem(MUTE_KEY, String(_muted)); } catch (_) { /* ignore */ }
  _notifyMute();
}

// ── Public mute controls ──────────────────────────────────────────────────────
export function isMuted() { return _muted; }
export function setMuted(v) { _muted = !!v; _persistMute(); }
export function toggleMute() { _muted = !_muted; _persistMute(); return _muted; }
export function subscribeMute(fn) {
  _muteListeners.add(fn);
  return () => _muteListeners.delete(fn);
}

/** Unlock audio context on first user gesture (required by browsers). */
export function primeAudio() {
  return resume().catch(() => {});
}

// ── Audio context (lazy init) ─────────────────────────────────────────────────
function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

export async function resume() {
  const c = getCtx();
  if (c.state === 'suspended') await c.resume();
  return c;
}

// ── Master gain node ──────────────────────────────────────────────────────────
function master(c, vol = 0.45) {
  const g = c.createGain();
  g.gain.value = vol;
  g.connect(c.destination);
  return g;
}

// ── Primitive: oscillator tone ────────────────────────────────────────────────
function osc(c, freq, type, gain, t0, dur, out) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + t0);
  g.gain.setValueAtTime(gain, c.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
  o.connect(g); g.connect(out);
  o.start(c.currentTime + t0);
  o.stop(c.currentTime + t0 + dur + 0.01);
}

// ── Primitive: frequency ramp ─────────────────────────────────────────────────
function ramp(c, f1, f2, type, gain, t0, dur, out) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, c.currentTime + t0);
  o.frequency.exponentialRampToValueAtTime(f2, c.currentTime + t0 + dur);
  g.gain.setValueAtTime(gain, c.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
  o.connect(g); g.connect(out);
  o.start(c.currentTime + t0);
  o.stop(c.currentTime + t0 + dur + 0.01);
}

// ── Primitive: white noise burst ──────────────────────────────────────────────
function noise(c, gain, t0, dur, out) {
  const samples = Math.max(1, Math.ceil(c.sampleRate * dur));
  const buf = c.createBuffer(1, samples, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
  src.connect(g); g.connect(out);
  src.start(c.currentTime + t0);
}

// ── Play helper (async, safe) ─────────────────────────────────────────────────
async function play(fn) {
  if (_muted) return;
  try {
    const c = await resume();
    fn(c);
  } catch (_) { /* ignore audio errors */ }
}

// ════════════════════════════════════════════════════════════════════════════
// GAME LAUNCH (profile mini-game buttons)
// ════════════════════════════════════════════════════════════════════════════

export const gameOpenChess = () => play(c => {
  const d = master(c, 0.38);
  noise(c, 0.22, 0, 0.04, d);
  osc(c, 660, 'sine', 0.18, 0, 0.08, d);
});

export const gameOpenWord = () => play(c => {
  const d = master(c, 0.32);
  [440, 554, 659].forEach((f, i) => osc(c, f, 'sine', 0.16, i * 0.06, 0.1, d));
});

export const gameOpenSolitaire = () => play(c => {
  const d = master(c, 0.34);
  noise(c, 0.08, 0, 0.05, d);
  osc(c, 880, 'sine', 0.12, 0, 0.06, d);
  osc(c, 1100, 'sine', 0.1, 0.05, 0.08, d);
});

export const gameOpenTetris = () => play(c => {
  const d = master(c, 0.34);
  osc(c, 330, 'square', 0.14, 0, 0.06, d);
  osc(c, 440, 'square', 0.12, 0.07, 0.08, d);
});

// ════════════════════════════════════════════════════════════════════════════
// TETRIS SOUNDS
// ════════════════════════════════════════════════════════════════════════════

/** Piece moved left/right */
export const tetrisMove = () => play(c => {
  const d = master(c, 0.25);
  osc(c, 210, 'square', 0.14, 0, 0.055, d);
});

/** Piece rotated */
export const tetrisRotate = () => play(c => {
  const d = master(c, 0.28);
  osc(c, 360, 'square', 0.12, 0,    0.05, d);
  osc(c, 540, 'square', 0.08, 0.03, 0.05, d);
});

/** Piece locked into place */
export const tetrisLock = () => play(c => {
  const d = master(c, 0.42);
  ramp(c, 115, 42, 'triangle', 0.4, 0, 0.13, d);
  noise(c, 0.07, 0, 0.06, d);
});

/** Hard drop */
export const tetrisHardDrop = () => play(c => {
  const d = master(c, 0.42);
  ramp(c, 290, 65, 'square', 0.32, 0, 0.11, d);
  noise(c, 0.13, 0, 0.07, d);
});

/** Lines cleared (count = 1-4) */
export const tetrisClear = (count) => play(c => {
  const d = master(c, 0.5);
  if (count >= 4) {
    // TETRIS! big ascending arp
    [261, 329, 392, 523, 659, 784].forEach((f, i) => osc(c, f, 'sine', 0.35, i * 0.07, 0.3, d));
    noise(c, 0.04, 0, 0.5, d);
  } else {
    const sets = [[392], [392, 523], [392, 523, 659]];
    sets[count - 1].forEach((f, i) => osc(c, f, 'sine', 0.3, i * 0.09, 0.22, d));
    noise(c, 0.03, 0, 0.18, d);
  }
});

/** Level up */
export const tetrisLevelUp = () => play(c => {
  const d = master(c, 0.48);
  [262, 330, 392, 523, 784].forEach((f, i) => osc(c, f, 'sine', 0.26, i * 0.1, 0.26, d));
});

/** Game over */
export const tetrisGameOver = () => play(c => {
  const d = master(c, 0.48);
  [392, 330, 262, 196, 131].forEach((f, i) => osc(c, f, 'sawtooth', 0.22, i * 0.13, 0.2, d));
});

// ════════════════════════════════════════════════════════════════════════════
// SOLITAIRE SOUNDS
// ════════════════════════════════════════════════════════════════════════════

/** Card flip (from stock) */
export const solitaireFlip = () => play(c => {
  const d = master(c, 0.32);
  noise(c, 0.1, 0, 0.06, d);
  osc(c, 1100, 'sine', 0.055, 0, 0.05, d);
});

/** Card placed on tableau */
export const solitairePlace = () => play(c => {
  const d = master(c, 0.38);
  noise(c, 0.13, 0, 0.04, d);
  ramp(c, 270, 170, 'triangle', 0.18, 0, 0.1, d);
});

/** Card moved to foundation */
export const solitaireFoundation = () => play(c => {
  const d = master(c, 0.42);
  osc(c, 523, 'sine', 0.22, 0,    0.1,  d);
  osc(c, 659, 'sine', 0.18, 0.09, 0.14, d);
});

/** Win! */
export const solitaireWin = () => play(c => {
  const d = master(c, 0.48);
  [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) =>
    osc(c, f, 'sine', 0.25, i * 0.09, 0.3, d)
  );
});

/** Invalid move */
export const solitaireInvalid = () => play(c => {
  const d = master(c, 0.3);
  osc(c, 165, 'sawtooth', 0.2, 0,    0.09, d);
  osc(c, 140, 'sawtooth', 0.15, 0.07, 0.08, d);
});

// ════════════════════════════════════════════════════════════════════════════
// CHESS SOUNDS
// ════════════════════════════════════════════════════════════════════════════

/** Piece moved (wooden click) */
export const chessMove = () => play(c => {
  const d = master(c, 0.42);
  noise(c, 0.3, 0, 0.045, d);
  osc(c, 740, 'sine', 0.07, 0, 0.06, d);
});

/** Piece captured (heavier impact) */
export const chessCapture = () => play(c => {
  const d = master(c, 0.48);
  noise(c, 0.4, 0, 0.09, d);
  ramp(c, 230, 95, 'sawtooth', 0.22, 0, 0.12, d);
});

/** Check warning */
export const chessCheck = () => play(c => {
  const d = master(c, 0.42);
  osc(c, 880, 'sine', 0.25, 0,    0.11, d);
  osc(c, 660, 'sine', 0.2,  0.13, 0.17, d);
});

/** Checkmate — player wins */
export const chessWin = () => play(c => {
  const d = master(c, 0.48);
  [392, 523, 659, 784, 1047].forEach((f, i) => osc(c, f, 'sine', 0.28, i * 0.12, 0.28, d));
});

/** Checkmate — player loses */
export const chessLose = () => play(c => {
  const d = master(c, 0.42);
  [330, 277, 220, 185].forEach((f, i) => osc(c, f, 'sawtooth', 0.22, i * 0.16, 0.2, d));
});

// ════════════════════════════════════════════════════════════════════════════
// WORD CHAIN SOUNDS
// ════════════════════════════════════════════════════════════════════════════

/** Tile selected */
export const wordSelect = () => play(c => {
  const d = master(c, 0.2);
  osc(c, 440, 'sine', 0.12, 0, 0.07, d);
});

/** Correct answer */
export const wordCorrect = () => play(c => {
  const d = master(c, 0.42);
  osc(c, 659, 'sine', 0.25, 0,   0.1,  d);
  osc(c, 880, 'sine', 0.2,  0.1, 0.18, d);
});

/** Wrong answer */
export const wordWrong = () => play(c => {
  const d = master(c, 0.42);
  osc(c, 200, 'sawtooth', 0.28, 0,   0.13, d);
  osc(c, 170, 'sawtooth', 0.22, 0.1, 0.1,  d);
});

/** Time ran out */
export const wordTimeout = () => play(c => {
  const d = master(c, 0.42);
  [440, 392, 330, 262].forEach((f, i) => osc(c, f, 'triangle', 0.22, i * 0.11, 0.16, d));
});

/** All levels complete */
export const wordWin = () => play(c => {
  const d = master(c, 0.48);
  [523, 659, 784, 1047, 1319].forEach((f, i) => osc(c, f, 'sine', 0.25, i * 0.1, 0.28, d));
});
