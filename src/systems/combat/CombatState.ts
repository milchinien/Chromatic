import type { Card } from '../../domain/Card';
import type { Unit } from '../../domain/Unit';
import type { Side } from '../../domain/Side';
import type { Rng } from '../rng';
import {
  AI_DECISION_INTERVAL_SEC,
  BASE_HP_START,
  BASE_HP_MAX,
  DRAW_INTERVAL_SEC,
  HAND_SIZE,
  MANA_MAX,
  MANA_REGEN_PER_SEC,
  MANA_START,
} from '../data/balance';

export interface SideState {
  baseHp: number;
  maxBaseHp: number;
  mana: number;
  maxMana: number;
  manaRegen: number;
  hand: Card[];
  handSize: number;
  drawIntervalSec: number;
  drawTimer: number;
  deck: Card[];
  exp: number;
  level: number;
  aiDecisionCooldown: number;
  /** Pause zwischen zwei KI-Entscheidungen. Default = AI_DECISION_INTERVAL_SEC,
   *  bei höheren Akten wird das verkürzt → härtere Gegner. */
  aiDecisionIntervalSec: number;
  /** Base-HP-Heilung pro Sekunde (Perks + Level-Ups). */
  baseHpRegen: number;
  /** Pauschal-Damage-Bonus auf alle eigenen Units (Perks + Level-Ups). */
  globalDamageBonus: number;
}

export type CombatStatus = 'running' | 'paused' | 'levelup' | 'victory' | 'defeat';

export interface PendingSpawn {
  card: Card;
  side: Side;
  x: number;
  y: number;
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
  /** Visuelle Feedback-Events (Phase-7-Polish), vom Combat-Tick gefüttert
   *  und vom Renderer abgebaut. */
  damageNumbers: DamageNumber[];
  screenShake: ScreenShake;
  /** Zähler für SFX-Trigger — Renderer liest delta und feuert pro Event. */
  spawnFxQueue: { side: Side; x: number; y: number }[];
  deathFxQueue: { x: number; y: number }[];
  baseHitFxQueue: { side: Side }[];
}

const initialSide = (deck: Card[]): SideState => ({
  baseHp: BASE_HP_START,
  maxBaseHp: BASE_HP_MAX,
  mana: MANA_START,
  maxMana: MANA_MAX,
  manaRegen: MANA_REGEN_PER_SEC,
  hand: [],
  handSize: HAND_SIZE,
  drawIntervalSec: DRAW_INTERVAL_SEC,
  drawTimer: 0,
  deck: [...deck],
  exp: 0,
  level: 1,
  aiDecisionCooldown: 0,
  aiDecisionIntervalSec: AI_DECISION_INTERVAL_SEC,
  baseHpRegen: 0,
  globalDamageBonus: 0,
});

export const createCombatState = (
  playerDeck: Card[],
  enemyDeck: Card[],
  rng: Rng,
): CombatState => {
  const state: CombatState = {
    tick: 0,
    elapsedSec: 0,
    status: 'running',
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
  // Sofortige Initial-Hand befüllen (sonst startet man mit leerer Hand).
  for (const side of [state.player, state.enemy]) {
    while (side.hand.length < side.handSize && side.deck.length > 0) {
      const idx = Math.floor(rng() * side.deck.length);
      side.hand.push(side.deck[idx]!);
    }
  }
  return state;
};

export const getSide = (state: CombatState, side: Side): SideState =>
  side === 'player' ? state.player : state.enemy;

export const logEvent = (state: CombatState, text: string): void => {
  state.log.push({ tick: state.tick, text });
  if (state.log.length > 30) state.log.shift();
};
