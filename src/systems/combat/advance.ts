import { MAX_DT_SEC, RESOLVE_MAX_SEC } from '../data/balance';
import { AiController } from './AiController';
import { type CombatState } from './CombatState';
import { ExpSystem, applyHpRegen } from './ExpSystem';
import { ManaSystem } from './ManaSystem';
import { RoundSystem } from './RoundSystem';
import { UnitSystem } from './UnitSystem';

/**
 * Single Tick des rundenbasierten Combat. Vom Renderer mit dt (Sek.) aufgerufen.
 *
 * Phasen:
 *  - banner : „Runde N"-Anzeige läuft, dann Draw aufsetzen.
 *  - draw   : wartet auf Spieler (blind 3 von 5 picken). Gegner hat schon gewählt.
 *  - select : wartet auf Spieler (2 von 3 spielen + Confirm).
 *  - resolve: Echtzeit-Gefecht (bestehende Sim) bis Feld leer / Cap.
 *
 * Bei `paused`/`levelup`/`victory`/`defeat` läuft der Tick nicht durch.
 */
export const advance = (state: CombatState, dtRaw: number): void => {
  if (state.status !== 'running') return;
  if (state.pendingLevelUp) {
    // KI löst sofort selbst; Spieler muss klicken (Loop pausiert via 'levelup').
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

  // Mana ist Platzhalter — Bar regeneriert weiter, gated aber nichts.
  ManaSystem.tick(state.player, dt);
  ManaSystem.tick(state.enemy, dt);

  switch (state.roundPhase) {
    case 'banner': {
      state.bannerTimer -= dt;
      if (state.bannerTimer <= 0) RoundSystem.startDraw(state);
      return;
    }
    case 'draw':
    case 'select':
      // Warten auf Spieler-Eingabe (Pick/Select via UI-Handler).
      return;
    case 'resolve': {
      state.resolveTimer += dt;
      UnitSystem.tick(state, dt);
      applyHpRegen(state, dt);
      ExpSystem.check(state);

      if (state.enemy.baseHp <= 0) {
        state.status = 'victory';
        return;
      }
      if (state.player.baseHp <= 0) {
        state.status = 'defeat';
        return;
      }
      // Runde vorbei, wenn keine lebenden Units mehr da sind (oder Safety-Cap).
      const anyAlive = state.units.some((u) => u.alive);
      if (!anyAlive || state.resolveTimer >= RESOLVE_MAX_SEC) {
        RoundSystem.endRound(state);
      }
      return;
    }
    case 'roundEnd':
      // endRound() setzt direkt auf 'banner' — dieser Zweig ist nur Fallback.
      RoundSystem.endRound(state);
      return;
  }
};
