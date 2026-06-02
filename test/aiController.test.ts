import { describe, it, expect } from 'vitest';
import { AiController } from '../src/systems/combat/AiController';
import { createCombatState } from '../src/systems/combat/CombatState';
import { UnitSystem } from '../src/systems/combat/UnitSystem';
import { mulberry32 } from '../src/systems/rng';
import { cardById } from '../src/systems/data/cards';

describe('AiController', () => {
  it('bevorzugt eine Karte, die mit gespawnten Units eine Combo bildet', () => {
    // Auf Spieler-Seite ein Grabwächter (Untot/Krieger) — die Wahl soll zwischen
    // einer Combo-Option (Untot ODER Krieger) und einer Nicht-Combo entscheiden.
    const state = createCombatState([], [], mulberry32(42));
    UnitSystem.spawn(state, cardById('grabwaechter'), 'player');
    const stein = cardById('steinbeschwoerer'); // Stein/Magier — keine Combo mit Grabwächter
    const beser = cardById('berserker'); // Krieger → Class-Combo mit Grabwächter
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
    const state = createCombatState([], [cardById('berserker')], mulberry32(7));
    state.enemy.mana = 5; // Berserker kostet 7
    state.enemy.hand = [cardById('berserker')];
    state.enemy.aiDecisionCooldown = 0;
    AiController.tick(state, 'enemy', 0);
    expect(state.units.length).toBe(0);
    expect(state.enemy.mana).toBe(5);
  });

  it('spielt die teuerste leistbare Karte ohne Combo-Optionen', () => {
    const billig = cardById('gebetswirker'); // Farblos/Heiler 3 Mana
    const teuer = cardById('berserker'); // Krieg/Krieger 7 Mana — anderes Color+Class als Heiler
    const state = createCombatState([], [], mulberry32(1));
    const choice = AiController.pickBest(
      [
        { card: billig, idx: 0 },
        { card: teuer, idx: 1 },
      ],
      state,
      'player',
    );
    expect(choice.card.id).toBe('berserker');
  });
});
