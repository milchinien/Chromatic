import type { Side } from '../../domain/Side';
import type { CombatState } from './CombatState';
import { RARITY_ORDER, applyAdvantage, rollAdvantages } from './ExpSystem';

/**
 * Gegner-KI. Das rundenbasierte Karten-Wählen liegt in RoundSystem
 * (enemySelect); hier bleibt nur die automatische Level-Up-Wahl.
 */
export const AiController = {
  /** Bei einem Gegner-Level-Up: 3 Vorteile rollen, den mit höchster Rarität nehmen. */
  applyLevelUp(state: CombatState, side: Side): void {
    const rolled = rollAdvantages(state.rng);
    const best = rolled.reduce((a, b) =>
      RARITY_ORDER.indexOf(b.rarity) > RARITY_ORDER.indexOf(a.rarity) ? b : a,
    );
    applyAdvantage(state, side, best);
  },
};
