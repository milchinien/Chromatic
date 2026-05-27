import type { UnitStats } from '../../domain/Card';
import type { CombatState } from './CombatState';

const STAT_KEYS: readonly (keyof UnitStats)[] = ['damage', 'attackInterval', 'hp', 'speed'];

const addPartial = (target: Partial<UnitStats>, src: Partial<UnitStats>): void => {
  for (const k of STAT_KEYS) {
    const v = src[k];
    if (v === undefined) continue;
    target[k] = (target[k] ?? 0) + v;
  }
};

/**
 * Field-Aura-Modell aus GAME_DESIGN 6.5:
 * - Jede befreundete Unit gibt ihren colorBuff an alle anderen befreundeten Units
 *   gleicher Farbe (farblos zählt nicht).
 * - Jede befreundete Unit gibt ihren classBuff an alle anderen befreundeten Units
 *   gleicher Klasse.
 * - Self-Exclusion: die Unit erhält ihren eigenen Buff nicht.
 * - Stacking: bei N gleichfarbigen Units stapeln sich die Buffs (N-1)-mal.
 */
export const ComboAuraSystem = {
  recompute(state: CombatState): void {
    for (const u of state.units) {
      if (!u.alive) continue;
      u.buffs = {};
    }
    for (const side of ['player', 'enemy'] as const) {
      const friendly = state.units.filter((u) => u.alive && u.side === side);
      for (const u of friendly) {
        for (const other of friendly) {
          if (other === u) continue;
          if (u.card.color !== 'farblos' && other.card.color === u.card.color) {
            addPartial(u.buffs, other.card.colorBuff);
          }
          if (other.card.class === u.card.class) {
            addPartial(u.buffs, other.card.classBuff);
          }
        }
      }
    }
    state.auraDirty = false;
  },

  markDirty(state: CombatState): void {
    state.auraDirty = true;
  },

  recomputeIfDirty(state: CombatState): void {
    if (state.auraDirty) ComboAuraSystem.recompute(state);
  },
};
