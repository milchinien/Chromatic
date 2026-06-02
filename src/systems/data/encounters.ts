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
    // Gemischter Pool, billig, ohne starke Combo-Synergie.
    deckIds: ids(
      'grabwaechter',
      'seelenheiler',
      'knochenross',
      'nekromant',
      'steinhueter',
      'steinwolf',
      'wanderkamel',
      'gebetswirker',
    ),
    coinReward: 30,
  },
  combat_hard_act1: {
    id: 'combat_hard_act1',
    // Mehr Karten + Festungen → härter zu durchbrechen.
    deckIds: ids(
      'grabwaechter',
      'grabwaechter',
      'totenzitadelle',
      'knochenross',
      'knochenross',
      'nekromant',
      'seelenheiler',
      'steinfestung',
      'steinwolf',
      'steinbeschwoerer',
      'kriegsfeste',
      'soeldner',
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
      'kriegsfeste',
      'kriegspferd',
      'feuermagier',
      'kriegssanitaeter',
      'grabwaechter',
      'knochenross',
      'nekromant',
      'totenzitadelle',
      'seelenheiler',
      'soeldner',
    ),
    coinReward: 100,
    enemyStartMana: 25,
  },
  boss_act1: {
    id: 'boss_act1',
    // Aggressives Krieg-fokussiertes Deck mit Class- und Color-Combos.
    deckIds: ids(
      'berserker',
      'berserker',
      'kriegsfeste',
      'kriegsfeste',
      'kriegspferd',
      'kriegspferd',
      'feuermagier',
      'kriegssanitaeter',
      'grabwaechter',
      'totenzitadelle',
      'knochenross',
      'nekromant',
      'seelenheiler',
      'steinfestung',
      'handelsposten',
    ),
    coinReward: 150,
    enemyStartMana: 30,
  },
};

/** Akt-Skalierung: pro Akt mehr Start-Mana, mehr Coins, ggf. mehr Karten im Deck. */
const scaleForAct = (base: Encounter, actNumber: number): Encounter => {
  if (actNumber <= 1) return base;
  const scale = actNumber - 1;
  return {
    ...base,
    // Decks wachsen mit Akt — mehr verschiedene Spawns möglich.
    deckIds: base.deckIds,
    coinReward: base.coinReward + 20 * scale,
    enemyStartMana: (base.enemyStartMana ?? 0) + 10 * scale,
  };
};

export const encounterForNodeType = (type: NodeType, actNumber = 1): Encounter | null => {
  switch (type) {
    case 'combat_normal':
      return scaleForAct(encounters.combat_normal_act1!, actNumber);
    case 'combat_hard':
      return scaleForAct(encounters.combat_hard_act1!, actNumber);
    case 'boss':
      return scaleForAct(encounters.boss_act1!, actNumber);
    default:
      return null;
  }
};

import type { SubNodeType } from '../../domain/Run';

export const encounterForSubNodeType = (type: SubNodeType, actNumber = 1): Encounter | null => {
  switch (type) {
    case 'sub_combat':
      return scaleForAct(encounters.combat_normal_act1!, actNumber);
    case 'mini_boss':
      return scaleForAct(encounters.mini_boss_act1!, actNumber);
    default:
      return null;
  }
};

export const encounterDeck = (enc: Encounter): Card[] => enc.deckIds.map(cardById);
