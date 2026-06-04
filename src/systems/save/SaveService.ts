import type { ActMap, Perk, RoomMap, RunState } from '../../domain/Run';
import type { Color } from '../../domain/Card';
import { cardById } from '../data/cards';
import { perkById } from '../data/perks';

// Persistiert den vollständigen Run-Zustand in localStorage, damit ein
// Browser-Refresh oder Tab-Wechsel mitten im Run nicht den Fortschritt verliert.
//
// WICHTIG: Es wird NICHT während des Combats gespeichert (Combat ist atomar) —
// nur an sicheren Punkten (Welt-/Raum-Karte = nach jedem Encounter). Niederlage
// und Verlassen-zum-Endbildschirm löschen das Save.

const SAVE_KEY = 'chromatic:run';
export const SAVE_VERSION = 1;

/** JSON-sichere Form des Run-Zustands. Map/Set werden zu Arrays, Card/Perk zu IDs
 *  (rehydriert beim Laden über cardById/perkById). */
interface SavedRun {
  saveVersion: number;
  seed: number;
  actNumber: number;
  actColor: Color;
  coins: number;
  deckIds: string[];
  cardLevels: Record<string, number>;
  perkIds: string[];
  map: ActMap;
  currentNodeId: string;
  visitedNodes: string[];
  baseHp: number;
  maxBaseHp: number;
  roomMaps: Array<[string, RoomMap]>;
  activeWorldNodeId: string | null;
  currentRoomNodeId: string | null;
  visitedRoomNodes: Array<[string, string[]]>;
}

/** Storage zur Laufzeit auflösen (nicht beim Import) — so kann der Test einen
 *  Fake-Storage auf globalThis injizieren, und im Privat-Modus ohne localStorage
 *  fallen alle Aufrufe still durch statt zu werfen. */
const storage = (): Storage | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

const serialize = (run: RunState): SavedRun => ({
  saveVersion: SAVE_VERSION,
  seed: run.seed,
  actNumber: run.actNumber,
  actColor: run.actColor,
  coins: run.coins,
  deckIds: run.deck.map((c) => c.id),
  cardLevels: { ...run.cardLevels },
  perkIds: run.activePerks.map((p) => p.id),
  map: run.map,
  currentNodeId: run.currentNodeId,
  visitedNodes: [...run.visitedNodes],
  baseHp: run.baseHp,
  maxBaseHp: run.maxBaseHp,
  roomMaps: [...run.roomMaps.entries()],
  activeWorldNodeId: run.activeWorldNodeId,
  currentRoomNodeId: run.currentRoomNodeId,
  visitedRoomNodes: [...run.visitedRoomNodes.entries()].map(([k, set]) => [k, [...set]]),
});

/** Wirft, wenn eine Card-/Perk-ID nicht (mehr) existiert → loadRun behandelt das
 *  als inkompatibles Save und löscht es. */
const deserialize = (data: SavedRun): RunState => ({
  seed: data.seed,
  actNumber: data.actNumber,
  actColor: data.actColor,
  coins: data.coins,
  deck: data.deckIds.map(cardById),
  cardLevels: { ...data.cardLevels },
  activePerks: data.perkIds.map((id) => perkById(id) as Perk),
  map: data.map,
  currentNodeId: data.currentNodeId,
  visitedNodes: new Set(data.visitedNodes),
  baseHp: data.baseHp,
  maxBaseHp: data.maxBaseHp,
  roomMaps: new Map(data.roomMaps),
  activeWorldNodeId: data.activeWorldNodeId,
  currentRoomNodeId: data.currentRoomNodeId,
  visitedRoomNodes: new Map(data.visitedRoomNodes.map(([k, arr]) => [k, new Set(arr)])),
});

/** Schreibt den Run-Zustand. Fehler (Quota/Privatmodus) werden geschluckt. */
export const saveRun = (run: RunState): void => {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(SAVE_KEY, JSON.stringify(serialize(run)));
  } catch {
    // Quota überschritten / Storage nicht verfügbar — kein Fortschritts-Save.
  }
};

/** Lädt den Run-Zustand oder null. Inkompatible/kaputte Saves werden gelöscht. */
export const loadRun = (): RunState | null => {
  const s = storage();
  if (!s) return null;
  let raw: string | null;
  try {
    raw = s.getItem(SAVE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as SavedRun;
    if (!data || data.saveVersion !== SAVE_VERSION) {
      clearSavedRun();
      return null;
    }
    return deserialize(data);
  } catch {
    // Kaputtes JSON oder unbekannte Card-/Perk-ID → Save verwerfen.
    clearSavedRun();
    return null;
  }
};

export const clearSavedRun = (): void => {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
};

/** Leichtgewichtiger Check fürs Hauptmenü („Fortsetzen"-Button): prüft nur,
 *  ob ein Save der aktuellen Version vorliegt — ohne volle Rehydrierung. */
export const hasSavedRun = (): boolean => {
  const s = storage();
  if (!s) return false;
  try {
    const raw = s.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as { saveVersion?: number };
    return data?.saveVersion === SAVE_VERSION;
  } catch {
    return false;
  }
};
