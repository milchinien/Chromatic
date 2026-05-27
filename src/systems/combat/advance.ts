import { MAX_DT_SEC } from '../data/balance';
import { AiController } from './AiController';
import { type CombatState } from './CombatState';
import { ComboAuraSystem } from './ComboAuraSystem';
import { DrawSystem } from './DrawSystem';
import { ExpSystem, applyHpRegen } from './ExpSystem';
import { ManaSystem } from './ManaSystem';
import { UnitSystem } from './UnitSystem';

/**
 * Single Tick des Combat. Wird vom Renderer mit dt (Sek.) aufgerufen.
 * Bei `paused` / `levelup` / `victory` / `defeat` läuft der Tick gar nicht durch
 * — der Caller muss vorher den Status setzen oder den Aufruf unterdrücken.
 */
export const advance = (state: CombatState, dtRaw: number): void => {
  if (state.status !== 'running') return;
  if (state.pendingLevelUp) {
    // Sofort selbst lösen, wenn KI dran ist; sonst auf User-Klick warten.
    if (state.pendingLevelUp === 'enemy') {
      AiController.applyLevelUp(state, 'enemy');
    } else {
      state.status = 'levelup';
      return;
    }
  }

  const dt = Math.min(dtRaw, MAX_DT_SEC);
  state.tick += 1;
  state.elapsedSec += dt;

  ManaSystem.tick(state.player, dt);
  ManaSystem.tick(state.enemy, dt);
  DrawSystem.tick(state.player, dt, state.rng);
  DrawSystem.tick(state.enemy, dt, state.rng);
  AiController.tick(state, 'enemy', dt);

  UnitSystem.tick(state, dt);
  ComboAuraSystem.recomputeIfDirty(state);

  applyHpRegen(state, dt);
  ExpSystem.check(state);

  if (state.enemy.baseHp <= 0) state.status = 'victory';
  else if (state.player.baseHp <= 0) state.status = 'defeat';
};
