import type { Card } from '../../domain/Card';
import type { NodeType } from '../../domain/Run';
import { cardById } from './cards';

export interface Encounter {
  readonly id: string;
  /** Karten-IDs, aus denen der Gegner zufällig zieht (Random-Pool). */
  readonly deckIds: readonly string[];
  readonly coinReward: number;
  /** Optional Karte als Belohnung (Phase 4 nutzt das); MVP-Phase 3 ignoriert es. */
  readonly cardReward?: string;
  /** Optional Override für Encounter-Start-Mana der KI (z.B. Boss startet stärker). */
  readonly enemyStartMana?: number;
}

const ids = (...xs: string[]): readonly string[] => Object.freeze(xs);

export const encounters: Readonly<Record<string, Encounter>> = {
  combat_normal_act1: {
    id: 'combat_normal_act1',
    deckIds: ids('skelett', 'skelett', 'jaeger', 'druide', 'wachposten', 'stein-magier', 'hain-waechter', 'wanderheiler'),
    coinReward: 30,
  },
  combat_hard_act1: {
    id: 'combat_hard_act1',
    deckIds: ids(
      'skelett',
      'skelett',
      'jaeger',
      'jaeger',
      'berserker',
      'wachposten',
      'wachposten',
      'blutreiter',
      'stein-golem',
      'nekromant',
      'druide',
      'hain-waechter',
    ),
    coinReward: 60,
    enemyStartMana: 25,
  },
  // Mini-Boss schließt eine combat_hard-Welt-Map ab. Zwischen normalem und
  // Endboss-Encounter, mit eigener Belohnung — siehe Phase-5-Plan.
  mini_boss_act1: {
    id: 'mini_boss_act1',
    deckIds: ids(
      'berserker',
      'wachposten',
      'blutreiter',
      'stein-golem',
      'nekromant',
      'jaeger',
      'jaeger',
      'skelett',
      'skelett',
      'druide',
      'wachposten',
    ),
    coinReward: 100,
    enemyStartMana: 25,
  },
  boss_act1: {
    id: 'boss_act1',
    // Aggressives Krieg-fokussiertes Deck mit Combo-Synergie.
    deckIds: ids(
      'berserker',
      'berserker',
      'blutreiter',
      'blutreiter',
      'wachposten',
      'wachposten',
      'nekromant',
      'stein-golem',
      'stein-magier',
      'skelett',
      'skelett',
      'meteor',
      'druide',
      'hain-waechter',
      'jaeger',
    ),
    coinReward: 150,
    enemyStartMana: 30,
  },
};

export const encounterForNodeType = (type: NodeType): Encounter | null => {
  switch (type) {
    case 'combat_normal':
      return encounters.combat_normal_act1!;
    case 'combat_hard':
      return encounters.combat_hard_act1!;
    case 'boss':
      return encounters.boss_act1!;
    default:
      return null;
  }
};

import type { SubNodeType } from '../../domain/Run';

export const encounterForSubNodeType = (type: SubNodeType): Encounter | null => {
  switch (type) {
    case 'sub_combat':
      return encounters.combat_normal_act1!;
    case 'mini_boss':
      return encounters.mini_boss_act1!;
    default:
      return null;
  }
};

export const encounterDeck = (enc: Encounter): Card[] => enc.deckIds.map(cardById);
