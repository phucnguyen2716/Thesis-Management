/**
 * Looped background music — mỗi game một giai điệu / nhịp / sóng riêng.
 */
import { resume, isMuted, subscribeMute } from './sounds';

const TRACKS = {
  /** Cờ vua: ambient trầm, nghe rõ trên loa điện thoại */
  chess: {
    bpm: 76,
    gain: 0.16,
    bassType: 'sine',
    melodyType: 'triangle',
    bassVol: 0.1,
    melodyVol: 0.075,
    bass: [65.41, 65.41, 58.27, 58.27, 49, 49, 58.27, 58.27],
    melody: [130.81, 164.81, 196, 220, 196, 164.81, 130.81, 116.54, 130.81, 164.81, 196, 220, 246.94, 220, 196, 164.81],
  },
  /** Tetris: arcade nhanh, sóng vuông */
  tetris: {
    bpm: 156,
    gain: 0.11,
    bassType: 'square',
    melodyType: 'square',
    bassVol: 0.055,
    melodyVol: 0.038,
    bass: [110, 110, 82.41, 82.41, 98, 98, 82.41, 110],
    melody: [659.25, 493.88, 392, 329.63, 392, 493.88, 587.33, 659.25, 783.99, 659.25, 587.33, 493.88, 392, 493.88, 587.33, 659.25],
  },
  /** Solitaire: nhẹ nhàng, sine cao */
  solitaire: {
    bpm: 92,
    gain: 0.11,
    bassType: 'sine',
    melodyType: 'sine',
    bassVol: 0.06,
    melodyVol: 0.05,
    bass: [130.81, 98, 116.54, 130.81, 146.83, 116.54, 98, 130.81],
    melody: [523.25, 587.33, 659.25, 587.33, 523.25, 440, 493.88, 0, 659.25, 698.46, 783.99, 698.46, 659.25, 587.33, 523.25, 587.33],
  },
  /** Nối chữ: puzzle vui, tam giác sáng */
  word: {
    bpm: 112,
    gain: 0.11,
    bassType: 'triangle',
    melodyType: 'triangle',
    bassVol: 0.065,
    melodyVol: 0.048,
    bass: [196, 220, 246.94, 220, 196, 174.61, 196, 220],
    melody: [587.33, 659.25, 783.99, 880, 783.99, 659.25, 587.33, 523.25, 659.25, 698.46, 880, 987.77, 880, 783.99, 659.25, 587.33],
  },
};

let _timer = null;
let _trackId = null;
let _gain = null;
let _step = 0;
let _muteUnsub = null;

function playNote(c, out, freq, dur, vol, type = 'triangle') {
  if (!freq) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

async function applyGain() {
  if (!_gain || !_trackId) return;
  const c = await resume();
  const vol = isMuted() ? 0 : (TRACKS[_trackId]?.gain ?? 0.11);
  _gain.gain.setValueAtTime(vol, c.currentTime);
}

async function tick() {
  if (!_trackId || isMuted()) return;
  try {
    const c = await resume();
    if (!_gain) {
      _gain = c.createGain();
      _gain.connect(c.destination);
    }
    await applyGain();
    const track = TRACKS[_trackId];
    if (!track) return;
    const i = _step % track.melody.length;
    const beatDur = 60 / track.bpm / 2;
    playNote(c, _gain, track.bass[i % track.bass.length], beatDur * 1.7, track.bassVol, track.bassType);
    if (track.melody[i]) {
      playNote(c, _gain, track.melody[i], beatDur * 0.88, track.melodyVol, track.melodyType);
    }
    _step += 1;
  } catch (_) { /* ignore */ }
}

function ensureMuteListener() {
  if (_muteUnsub) return;
  _muteUnsub = subscribeMute(() => { applyGain(); });
}

/** @param {'chess'|'tetris'|'solitaire'|'word'} id */
export function startGameMusic(id) {
  if (!TRACKS[id]) return;
  if (_trackId === id && _timer) return;
  stopGameMusic();
  _trackId = id;
  _step = 0;
  ensureMuteListener();
  const ms = (60 / TRACKS[id].bpm / 2) * 1000;
  tick();
  _timer = setInterval(tick, ms);
}

export function stopGameMusic() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
  _trackId = null;
  _step = 0;
}
