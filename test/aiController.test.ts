import { describe, it, expect } from 'vitest';
import { AiController } from '../src/systems/combat/AiController';
import { createCombatState } from '../src/systems/combat/CombatState';
import { UnitSystem } from '../src/systems/combat/UnitSystem';
import { mulberry32 } from '../src/systems/rng';
import { cardById } from '../src/systems/data/cards';

describe('AiController', () => {
  it('bevorzugt eine Karte, die mit gespawnten Units eine Combo bildet', () => {
    // Auf Spieler-Seite ein Skelett (Untot/Krieger) — die Wahl soll zwischen
    // einer Combo-Option (Untot oder Krieger) und einer Nicht-Combo entscheiden.
    const state = createCombatState([], [], mulberry32(42));
    UnitSystem.spawn(state, cardById('skelett'), 'player');
    const stein = cardById('stein-magier'); // weder Untot noch Krieger
    const beser = cardById('berserker'); // Krieger → Combo-Klasse mit Skelett
    const choice = AiController.pickBest(
      [
        { card: stein, idx: 0 },
        { card: beser, idx: 1 },
      ],
      state,
      'player',
    );
    expect(choice.card.id).toBe('berserker');
  });

  it('gibt nichts aus wenn keine Karte leistbar', () => {
    const state = createCombatState([], [cardById('meteor')], mulberry32(7));
    state.enemy.mana = 5; // Meteor kostet 15
    state.enemy.hand = [cardById('meteor')];
    state.enemy.aiDecisionCooldown = 0;
    AiController.tick(state, 'enemy', 0);
    expect(state.units.length).toBe(0);
    expect(state.enemy.mana).toBe(5);
  });

  it('spielt die teuerste leistbare Karte ohne Combo-Optionen', () => {
    const billig = cardById('skelett'); // 4
    const teuer = cardById('blutreiter'); // 9
    const state = createCombatState([], [], mulberry32(1));
    const choice = AiController.pickBest(
      [
        { card: billig, idx: 0 },
        { card: teuer, idx: 1 },
      ],
      state,
      'player',
    );
    expect(choice.card.id).toBe('blutreiter');
  });
});
