import type { Card, Color } from '../../domain/Card';
import type { NodeType, SubNodeType } from '../../domain/Run';
import { cardById, cardsByColor } from './cards';

export interface Encounter {
  readonly id: string;
  /** Karten-IDs, aus denen der Gegner zufällig zieht (Random-Pool). Seit dem
   *  Redesign mono-farbig: alle Gegner eines Akts nutzen nur die Akt-Farbe. */
  readonly deckIds: readonly string[];
  readonly coinReward: number;
}

// Coin-Belohnung nach Encounter-Härte; skaliert zusätzlich mit dem Akt.
const make = (idPrefix: string, color: Color, baseCoin: number, actNumber: number): Encounter => ({
  id: `${idPrefix}_${color}`,
  deckIds: cardsByColor(color),
  coinReward: baseCoin + 20 * Math.max(0, actNumber - 1),
});

/** Welt-Knoten-Encounter. `color` = Akt-Farbe (run.actColor). Die eigentliche
 *  Härte skaliert über das Gegner-Karten-Level (siehe Combat.ts: actNumber). */
export const encounterForNodeType = (
  type: NodeType,
  actNumber = 1,
  color: Color = 'natur',
): Encounter | null => {
  switch (type) {
    case 'combat_normal':
      return make('combat', color, 30, actNumber);
    case 'combat_hard':
      return make('combat_hard', color, 60, actNumber);
    case 'boss':
      return make('boss', color, 150, actNumber);
    default:
      return null;
  }
};

export const encounterForSubNodeType = (
  type: SubNodeType,
  actNumber = 1,
  color: Color = 'natur',
): Encounter | null => {
  switch (type) {
    case 'sub_combat':
      return make('combat', color, 30, actNumber);
    case 'mini_boss':
      return make('mini_boss', color, 100, actNumber);
    default:
      return null;
  }
};

export const encounterDeck = (enc: Encounter): Card[] => enc.deckIds.map(cardById);
