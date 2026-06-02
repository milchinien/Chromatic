import type { Card } from '../../domain/Card';
import { cardById } from './cards';

// 10-Karten-Starter-Deck. Multi-Color, sodass Combos möglich aber nicht
// dominant sind. Wird in Phase 3 vom Run-Loop verwendet.
//
// Composition: 2× Krieger-Klasse (Combo), 1× Festung, 1× Reittier, 2× Magier,
// 2× Heiler, gemischte Farben damit Color- und Class-Combos beide getriggert
// werden können.
const STARTER_IDS: readonly string[] = [
  'berserker',        // Krieg / Krieger
  'waldlaeufer',      // Natur / Krieger  ← Class-Combo mit Berserker möglich
  'kriegsfeste',      // Krieg / Festung  ← Color-Combo mit Berserker möglich
  'hirsch-des-waldes',// Natur / Reittier ← Color-Combo mit Waldläufer
  'feuermagier',      // Krieg / Magier
  'nekromant',        // Untot / Magier   ← Class-Combo mit Feuermagier
  'naturheiler',      // Natur / Heiler
  'gebetswirker',     // Farblos / Heiler ← Class-Combo mit Naturheiler
  'steinwolf',        // Stein / Reittier ← Color-Combo mit anderen Stein-Karten aus Shop
  'soeldner',         // Farblos / Krieger
];

export const starterDeck = (): Card[] => STARTER_IDS.map(cardById);

// Test-Decks für die Combat-Sandbox (Phase 2).
// Spieler-Deck: combo-fokussiert mit Krieg + Natur, damit Auras sichtbar werden.
const PLAYER_SANDBOX_IDS: readonly string[] = [
  'berserker',
  'kriegsfeste',
  'kriegspferd',
  'feuermagier',
  'waldlaeufer',
  'wurzelbastion',
  'naturheiler',
  'gebetswirker',
];

const ENEMY_SANDBOX_IDS: readonly string[] = [
  'grabwaechter',
  'totenzitadelle',
  'knochenross',
  'nekromant',
  'seelenheiler',
  'steinfestung',
  'steinwolf',
  'zeitweiser',
];

export const sandboxPlayerDeck = (): Card[] => PLAYER_SANDBOX_IDS.map(cardById);
export const sandboxEnemyDeck = (): Card[] => ENEMY_SANDBOX_IDS.map(cardById);
