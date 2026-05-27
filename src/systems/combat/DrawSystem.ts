import type { Rng } from '../rng';
import type { SideState } from './CombatState';

export const DrawSystem = {
  tick(side: SideState, dt: number, rng: Rng): void {
    if (side.deck.length === 0) return;
    side.drawTimer += dt;
    while (side.drawTimer >= side.drawIntervalSec) {
      side.drawTimer -= side.drawIntervalSec;
      if (side.hand.length < side.handSize) {
        const card = side.deck[Math.floor(rng() * side.deck.length)]!;
        side.hand.push(card);
      }
      // Wenn Hand voll: Timer wurde trotzdem reduziert (kein „Vorrat" anstauen).
    }
  },

  /** Karte aus Hand entfernen (z.B. nach Spielen). */
  consume(side: SideState, handIndex: number): void {
    if (handIndex < 0 || handIndex >= side.hand.length) return;
    side.hand.splice(handIndex, 1);
  },
};
