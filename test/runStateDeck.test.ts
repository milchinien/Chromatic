import { describe, it, expect } from 'vitest';
import { cardLevel, createRunState, upgradeCard } from '../src/systems/run/RunState';

describe('RunState — Upgrades (Deck wächst nicht)', () => {
  it('Starter-Karten beginnen auf Level 1', () => {
    const s = createRunState(1);
    for (const c of s.deck) expect(cardLevel(s, c.id)).toBe(1);
  });

  it('upgradeCard erhöht das Level, Deck-Länge bleibt konstant', () => {
    const s = createRunState(1);
    const id = s.deck[0]!.id;
    const len = s.deck.length;
    upgradeCard(s, id);
    expect(cardLevel(s, id)).toBe(2);
    expect(s.deck.length).toBe(len);
  });

  it('mehrfaches Upgraden stapelt das Level', () => {
    const s = createRunState(1);
    const id = s.deck[0]!.id;
    upgradeCard(s, id);
    upgradeCard(s, id);
    upgradeCard(s, id);
    expect(cardLevel(s, id)).toBe(4);
  });
});
