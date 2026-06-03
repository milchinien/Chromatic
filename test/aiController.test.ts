import { describe, it, expect } from 'vitest';
import { AiController } from '../src/systems/combat/AiController';
import { createCombatState } from '../src/systems/combat/CombatState';
import { RoundSystem } from '../src/systems/combat/RoundSystem';
import { mulberry32 } from '../src/systems/rng';
import { cardById } from '../src/systems/data/cards';
import type { DeckEntry } from '../src/domain/Run';

const entry = (id: string, level = 1): DeckEntry => ({ card: cardById(id), level });

describe('Rundenbasierte Gegner-KI', () => {
  it('startDraw gibt dem Gegner 3 Karten und wählt genau 2', () => {
    const enemyDeck = ['grabwaechter', 'knochenross', 'nekromant', 'seelenheiler', 'totenzitadelle'].map(
      (id) => entry(id),
    );
    const s = createCombatState([entry('berserker')], enemyDeck, mulberry32(42));
    RoundSystem.startDraw(s);
    expect(s.enemy.picked.length).toBe(3);
    expect(s.enemy.selectedIdx.length).toBe(2);
    expect(s.roundPhase).toBe('draw');
  });

  it('confirmSelection spawnt Truppen-Stacks beider Seiten und startet resolve', () => {
    const s = createCombatState(
      [entry('berserker'), entry('grabwaechter')],
      [entry('grabwaechter')],
      mulberry32(1),
    );
    RoundSystem.startDraw(s);
    // Spieler blind 3 von 5 picken → triggert reveal automatisch.
    RoundSystem.togglePick(s, 0);
    RoundSystem.togglePick(s, 1);
    RoundSystem.togglePick(s, 2);
    expect(s.roundPhase).toBe('select');
    RoundSystem.toggleSelect(s, 0);
    RoundSystem.toggleSelect(s, 1);
    RoundSystem.confirmSelection(s);
    expect(s.roundPhase).toBe('resolve');
    // Mindestens 2 Truppen pro Karte × 2 Karten × 2 Seiten.
    expect(s.units.length).toBeGreaterThanOrEqual(8);
  });

  it('applyLevelUp hebt die Gegner-Stufe um 1', () => {
    const s = createCombatState([], [entry('grabwaechter')], mulberry32(3));
    const before = s.enemy.level;
    AiController.applyLevelUp(s, 'enemy');
    expect(s.enemy.level).toBe(before + 1);
  });
});
