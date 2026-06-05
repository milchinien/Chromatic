import { ACHIEVEMENTS, type Achievement } from '../meta/achievements';

// Meta-Progression (R3): überlebt Run-Niederlagen UND Browser-Refresh, in einem
// SEPARATEN localStorage-Key (unabhängig vom Run-Save aus SaveService).
//
// Kern-konform: KEINE Karten-Freischaltung (alle 25 immer verfügbar), KEIN Mana.
// Getrackt werden reine Lauf-Statistiken + Achievements.

const META_KEY = 'chromatic:meta';
export const META_VERSION = 1;

export interface MetaSave {
  metaVersion: number;
  runsStarted: number;
  runsEnded: number; // beendete Runs (Niederlagen)
  bossesBeaten: number; // kumulativ über alle Runs
  highestActReached: number;
  bestCoins: number; // meiste Coins bei Run-Ende
  bestRoomsVisited: number;
  achievements: string[]; // freigeschaltete Achievement-IDs
}

const defaultMeta = (): MetaSave => ({
  metaVersion: META_VERSION,
  runsStarted: 0,
  runsEnded: 0,
  bossesBeaten: 0,
  highestActReached: 0,
  bestCoins: 0,
  bestRoomsVisited: 0,
  achievements: [],
});

const storage = (): Storage | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

/** Lädt den Meta-Save (oder Default). Inkompatible/kaputte Saves → Default. */
export const loadMeta = (): MetaSave => {
  const s = storage();
  if (!s) return defaultMeta();
  let raw: string | null;
  try {
    raw = s.getItem(META_KEY);
  } catch {
    return defaultMeta();
  }
  if (!raw) return defaultMeta();
  try {
    const data = JSON.parse(raw) as Partial<MetaSave>;
    if (!data || data.metaVersion !== META_VERSION) return defaultMeta();
    // Defensive Merge — fehlende Felder mit Defaults auffüllen.
    return { ...defaultMeta(), ...data, achievements: [...(data.achievements ?? [])] };
  } catch {
    return defaultMeta();
  }
};

export const saveMeta = (meta: MetaSave): void => {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // Quota / nicht verfügbar — ignorieren.
  }
};

export const clearMeta = (): void => {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(META_KEY);
  } catch {
    // ignore
  }
};

/** Prüft alle Achievement-Bedingungen, ergänzt neu erfüllte in `meta.achievements`
 *  und liefert die NEU freigeschalteten zurück (für Toasts). Mutiert `meta`. */
export const evaluateAchievements = (meta: MetaSave): Achievement[] => {
  const owned = new Set(meta.achievements);
  const newly: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!owned.has(a.id) && a.isMet(meta)) {
      meta.achievements.push(a.id);
      newly.push(a);
    }
  }
  return newly;
};

const recordAndSave = (mutate: (m: MetaSave) => void): Achievement[] => {
  const meta = loadMeta();
  mutate(meta);
  const newly = evaluateAchievements(meta);
  saveMeta(meta);
  return newly;
};

/** Run-Start: erhöht runsStarted, garantiert highestActReached >= 1. */
export const recordRunStart = (): Achievement[] =>
  recordAndSave((m) => {
    m.runsStarted += 1;
    m.highestActReached = Math.max(m.highestActReached, 1);
  });

/** Boss besiegt (Akt `actJustBeaten` geschafft → Akt N+1 erreicht). */
export const recordBossBeaten = (actJustBeaten: number): Achievement[] =>
  recordAndSave((m) => {
    m.bossesBeaten += 1;
    m.highestActReached = Math.max(m.highestActReached, actJustBeaten + 1);
  });

/** Run-Ende (Niederlage): aktualisiert Bestwerte. */
export const recordRunEnd = (info: {
  actReached: number;
  coins: number;
  roomsVisited: number;
}): Achievement[] =>
  recordAndSave((m) => {
    m.runsEnded += 1;
    m.highestActReached = Math.max(m.highestActReached, info.actReached);
    m.bestCoins = Math.max(m.bestCoins, info.coins);
    m.bestRoomsVisited = Math.max(m.bestRoomsVisited, info.roomsVisited);
  });
