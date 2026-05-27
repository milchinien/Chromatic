import type { Card } from '../../domain/Card';
import type { Side } from '../../domain/Side';
import { AI_DECISION_INTERVAL_SEC } from '../data/balance';
import type { CombatState, SideState } from './CombatState';
import { ManaSystem } from './ManaSystem';
import { DrawSystem } from './DrawSystem';
import { UnitSystem } from './UnitSystem';
import { applyLevelUp, LEVEL_UP_CHOICES, type LevelUpChoice } from './ExpSystem';

/**
 * Heuristik v1 aus dem Phase-2-Plan:
 * - Alle X Sekunden eine Entscheidung treffen
 * - Aus der Hand die teuerste leistbare Karte spielen
 * - Bonus: Karten, die mit bereits gespawnten Units eine Combo bilden
 *   (gleiche Farbe oder Klasse), werden bevorzugt
 */
export const AiController = {
  tick(state: CombatState, side: Side, dt: number): void {
    const s: SideState = side === 'player' ? state.player : state.enemy;
    if (s.aiDecisionCooldown > 0) {
      s.aiDecisionCooldown = Math.max(0, s.aiDecisionCooldown - dt);
      return;
    }
    s.aiDecisionCooldown = AI_DECISION_INTERVAL_SEC;

    const playableIndices = s.hand
      .map((card, idx) => ({ card, idx }))
      .filter(({ card }) => ManaSystem.canAfford(s, card));
    if (playableIndices.length === 0) return;

    const choice = AiController.pickBest(playableIndices, state, side);
    const card = s.hand[choice.idx];
    if (!card) return;
    if (!ManaSystem.spend(s, card)) return;
    DrawSystem.consume(s, choice.idx);
    UnitSystem.spawn(state, card, side);
  },

  pickBest(
    playable: ReadonlyArray<{ card: Card; idx: number }>,
    state: CombatState,
    side: Side,
  ): { card: Card; idx: number } {
    const friendly = state.units.filter((u) => u.alive && u.side === side);
    const score = (card: Card): number => {
      const comboBonus = friendly.some(
        (u) =>
          (card.color !== 'farblos' && u.card.color === card.color) ||
          u.card.class === card.class,
      )
        ? 10
        : 0;
      return card.manaCost + comboBonus;
    };
    let best = playable[0]!;
    let bestScore = score(best.card);
    for (const p of playable.slice(1)) {
      const sc = score(p.card);
      if (sc > bestScore) {
        bestScore = sc;
        best = p;
      }
    }
    return best;
  },

  /** Wenn die KI einen Level-Up auswählen soll, nimmt sie für MVP einfach
   *  den Damage-Buff — sichtbarer Effekt, einfache Heuristik. */
  applyLevelUp(state: CombatState, side: Side): void {
    const choice: LevelUpChoice = LEVEL_UP_CHOICES.find((c) => c.id === 'damage')?.id ?? 'damage';
    applyLevelUp(state, side, choice);
  },
};
