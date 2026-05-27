import type { Card } from '../../domain/Card';
import type { SideState } from './CombatState';

export const ManaSystem = {
  tick(side: SideState, dt: number): void {
    side.mana = Math.min(side.maxMana, side.mana + side.manaRegen * dt);
  },
  canAfford(side: SideState, card: Card): boolean {
    return side.mana >= card.manaCost;
  },
  spend(side: SideState, card: Card): boolean {
    if (!ManaSystem.canAfford(side, card)) return false;
    side.mana -= card.manaCost;
    return true;
  },
};
