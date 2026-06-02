/**
 * Prozedurales SFX-System via Web-Audio-API.
 *
 * Statt Asset-Dateien zu laden synthetisieren wir kurze Tone-Sequenzen mit
 * OscillatorNode + GainNode-Envelope. Vorteile:
 *  - Keine Asset-Downloads, keine Lizenz-Fragen, keine Loading-Screens
 *  - Bundle bleibt klein
 *  - Passt zum geometrischen Visual-Stil von Chromatic
 *
 * Nachteile: Sounds wirken etwas „beep-y". Wird in Phase R5 (Präsentation)
 * durch echte Samples ersetzt, wenn der MVP läuft.
 *
 * Mute-Toggle persistiert in localStorage. M-Taste in Combat schaltet um.
 */

const MUTE_KEY = 'chromatic.muted';

let ctx: AudioContext | null = null;
let muted = false;

const getCtx = (): AudioContext | null => {
  if (ctx) return ctx;
  try {
    const Ctor =
      typeof window !== 'undefined'
        ? (window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext)
        : null;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
};

const loadMutedFromStorage = (): void => {
  try {
    muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    muted = false;
  }
};
loadMutedFromStorage();

const persistMuted = (): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    }
  } catch {
    /* ignore */
  }
};

export const isMuted = (): boolean => muted;
export const setMuted = (v: boolean): void => {
  muted = v;
  persistMuted();
};
export const toggleMute = (): boolean => {
  muted = !muted;
  persistMuted();
  return muted;
};

interface ToneOpts {
  freq: number;
  durationSec: number;
  type?: OscillatorType;
  gain?: number;
  /** Frequenz-Slide am Ende des Tons (0 = konstant). */
  freqEnd?: number;
  /** Verzögerung vor Start (für Sequenzen). */
  delaySec?: number;
}

const tone = (opts: ToneOpts): void => {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  // Manche Browser starten den AudioContext erst nach User-Geste — versuchen wir's.
  if (audio.state === 'suspended') audio.resume().catch(() => {});

  const now = audio.currentTime + (opts.delaySec ?? 0);
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, now);
  if (opts.freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(opts.freqEnd, now + opts.durationSec);
  }
  const peak = (opts.gain ?? 0.18) * (muted ? 0 : 1);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.durationSec);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + opts.durationSec + 0.02);
};

// ===== Public SFX-API =====

export const sfx = {
  click(): void {
    tone({ freq: 720, durationSec: 0.06, type: 'square', gain: 0.08 });
  },
  spawn(side: 'player' | 'enemy' = 'player'): void {
    const base = side === 'player' ? 380 : 280;
    tone({ freq: base, freqEnd: base * 1.6, durationSec: 0.18, type: 'triangle', gain: 0.12 });
  },
  hit(): void {
    tone({ freq: 220, freqEnd: 110, durationSec: 0.08, type: 'sawtooth', gain: 0.08 });
  },
  death(): void {
    tone({ freq: 200, freqEnd: 80, durationSec: 0.25, type: 'sawtooth', gain: 0.14 });
  },
  baseHit(): void {
    tone({ freq: 130, freqEnd: 70, durationSec: 0.22, type: 'square', gain: 0.18 });
  },
  coin(): void {
    tone({ freq: 1200, durationSec: 0.05, type: 'triangle', gain: 0.10 });
    tone({ freq: 1600, durationSec: 0.08, type: 'triangle', gain: 0.10, delaySec: 0.05 });
  },
  victory(): void {
    [523, 659, 784, 1047].forEach((f, i) => {
      tone({ freq: f, durationSec: 0.18, type: 'triangle', gain: 0.13, delaySec: i * 0.10 });
    });
  },
  defeat(): void {
    [330, 247, 196, 165].forEach((f, i) => {
      tone({ freq: f, durationSec: 0.22, type: 'sine', gain: 0.16, delaySec: i * 0.14 });
    });
  },
  perk(): void {
    [523, 659, 784].forEach((f, i) => {
      tone({ freq: f, durationSec: 0.12, type: 'triangle', gain: 0.12, delaySec: i * 0.06 });
    });
  },
};
