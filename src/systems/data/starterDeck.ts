import type { Card } from '../../domain/Card';
import { cardById } from './cards';

// 10-Karten-Starter-Deck. Multi-Color, sodass Combos möglich aber nicht
// dominant sind. Wird in Phase 3 vom Run-Loop verwendet.
const STARTER_IDS: readonly string[] = [
  'skelett',
  'skelett',
  'jaeger',
  'jaeger',
  'druide',
  'berserker',
  'wachposten',
  'stein-magier',
  'wanderheiler',
  'nekromant',
];

export const starterDeck = (): Card[] => STARTER_IDS.map(cardById);

// Test-Decks für die Combat-Sandbox (Phase 2).
// Spieler-Deck: combo-fokussiert auf Natur+Krieg, damit Auras sichtbar werden.
const PLAYER_SANDBOX_IDS: readonly string[] = [
  'druide',
  'jaeger',
  'hain-waechter',
  'berserker',
  'wachposten',
  'blutreiter',
  'skelett',
  'wanderheiler',
];

const ENEMY_SANDBOX_IDS: readonly string[] = [
  'skelett',
  'skelett',
  'nekromant',
  'stein-golem',
  'stein-magier',
  'wachposten',
  'jaeger',
  'meteor',
];

export const sandboxPlayerDeck = (): Card[] => PLAYER_SANDBOX_IDS.map(cardById);
export const sandboxEnemyDeck = (): Card[] => ENEMY_SANDBOX_IDS.map(cardById);
