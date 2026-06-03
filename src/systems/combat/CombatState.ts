import type { Card, UnitStats } from '../../domain/Card';
import type { Unit } from '../../domain/Unit';
import type { Side } from '../../domain/Side';
import type { DeckEntry } from '../../domain/Run';
import type { Rng } from '../rng';
import {
  BASE_HP_START,
  BASE_HP_MAX,
  MANA_MAX,
  MANA_REGEN_PER_SEC,
  MANA_START,
  ROUND_BANNER_SEC,
} from '../data/balance';

/** Eine in der aktuellen Runde gezogene, aufgedeckte Karte inkl. gerollter
 *  Truppenzahl. Beim Spielen spawnt sie `troops` Units mit `leveledStats`. */
export interface DrawnCard {
  card: Card;
  level: number;
  troops: number;
}

export interface SideState {
  baseHp: number;
  maxBaseHp: number;
  /** Mana ist seit dem Runden-Redesign Platzhalter: sichtbar + regeneriert,
   *  gated das Spielen aber NICHT (pro Runde 2 Karten). */
  mana: number;
  maxMana: number;
  manaRegen: number;
  /** Komplettes Deck mit Upgrade-Leveln. Wächst nie — Random-Pool-Draw. */
  deck: DeckEntry[];
  // --- Runden-Draw ---
  /** 5 verdeckte Optionen (nur Spieler; Gegner zieht direkt 3). */
  drawOptions: DeckEntry[];
  /** Blind gepickte Indizes in drawOptions (Spieler, bis PICK_COUNT). */
  pickedIdx: number[];
  /** Aufgedeckte gepickte Karten dieser Runde (Spieler & Gegner). */
  picked: DrawnCard[];
  /** Indizes in `picked` der gespielten Karten (bis PLAY_COUNT). */
  selectedIdx: number[];
  // --- Combat-Progression ---
  exp: number;
  level: number;
  /** Base-HP-Heilung pro Sekunde (Perks + Level-Ups). */
  baseHpRegen: number;
  /** Pauschal-Damage-Bonus auf alle eigenen Units (Perks + Level-Ups). */
  globalDamageBonus: number;
  /** Zusätzliche Truppen pro gespielter Karte (Level-Up-Vorteil). */
  troopBonus: number;
}

export type CombatStatus = 'running' | 'paused' | 'levelup' | 'victory' | 'defeat';

/** Phasen einer Runde:
 *  banner  → großes „Runde N"; draw → 5 verdeckte, blind 3 picken;
 *  select  → 2 der 3 spielen; resolve → Echtzeit-Gefecht bis Feld leer;
 *  roundEnd→ Feld leeren, nächste Runde. */
export type RoundPhase = 'banner' | 'draw' | 'select' | 'resolve' | 'roundEnd';

export interface PendingSpawn {
  card: Card;
  side: Side;
  x: number;
  y: number;
  /** Optionale Stat-Überschreibung (z.B. geleverte Stats eines Truppen-Stacks). */
  stats?: UnitStats;
}

export interface EventLogEntry {
  tick: number;
  text: string;
}

/** Floating-Damage-Number über einer getroffenen Unit oder Base. */
export interface DamageNumber {
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
}

/** Aktiver Screen-Shake-Impuls — wird beim Base-Hit angestoßen, klingt ab. */
export interface ScreenShake {
  remainingSec: number;
  intensity: number;
}

export interface CombatState {
  tick: number;
  elapsedSec: number;
  status: CombatStatus;
  /** Aktuelle Rundenphase. */
  roundPhase: RoundPhase;
  roundNumber: number;
  /** Restzeit der Banner-Anzeige (Sek.). */
  bannerTimer: number;
  /** Laufzeit der aktuellen Resolve-Phase (Sek.) — Safety gegen Endlos-Stau. */
  resolveTimer: number;
  /** Set wenn eine Seite einen Level-Up auswählen muss. Pausiert den Loop. */
  pendingLevelUp: Side | null;
  /** Vom Renderer gelesen, wer als nächstes spawnt (z.B. Nekromant-onDeath). */
  pendingSpawns: PendingSpawn[];
  player: SideState;
  enemy: SideState;
  units: Unit[];
  /** Wird vom ComboAuraSystem als dirty markiert bei Spawn/Tod. */
  auraDirty: boolean;
  rng: Rng;
  log: EventLogEntry[];
  nextUnitId: number;
  damageNumbers: DamageNumber[];
  screenShake: ScreenShake;
  spawnFxQueue: { side: Side; x: number; y: number }[];
  deathFxQueue: { x: number; y: number }[];
  baseHitFxQueue: { side: Side }[];
}

const initialSide = (deck: DeckEntry[]): SideState => ({
  baseHp: BASE_HP_START,
  maxBaseHp: BASE_HP_MAX,
  mana: MANA_START,
  maxMana: MANA_MAX,
  manaRegen: MANA_REGEN_PER_SEC,
  deck: [...deck],
  drawOptions: [],
  pickedIdx: [],
  picked: [],
  selectedIdx: [],
  exp: 0,
  level: 1,
  baseHpRegen: 0,
  globalDamageBonus: 0,
  troopBonus: 0,
});

export const createCombatState = (
  playerDeck: DeckEntry[],
  enemyDeck: DeckEntry[],
  rng: Rng,
): CombatState => {
  return {
    tick: 0,
    elapsedSec: 0,
    status: 'running',
    roundPhase: 'banner',
    roundNumber: 1,
    bannerTimer: ROUND_BANNER_SEC,
    resolveTimer: 0,
    pendingLevelUp: null,
    pendingSpawns: [],
    player: initialSide(playerDeck),
    enemy: initialSide(enemyDeck),
    units: [],
    auraDirty: false,
    rng,
    log: [],
    nextUnitId: 1,
    damageNumbers: [],
    screenShake: { remainingSec: 0, intensity: 0 },
    spawnFxQueue: [],
    deathFxQueue: [],
    baseHitFxQueue: [],
  };
};

export const getSide = (state: CombatState, side: Side): SideState =>
  side === 'player' ? state.player : state.enemy;

export const logEvent = (state: CombatState, text: string): void => {
  state.log.push({ tick: state.tick, text });
  if (state.log.length > 30) state.log.shift();
};
