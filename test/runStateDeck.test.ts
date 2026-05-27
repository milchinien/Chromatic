import { describe, it, expect } from 'vitest';
import { addCardToDeck, createRunState } from '../src/systems/run/RunState';
import { cardById } from '../src/systems/data/cards';

describe('RunState — Deck-Wachstum', () => {
  it('addCardToDeck hängt Karte an und behält bestehende', () => {
    const s = createRunState(1);
    const before = s.deck.length;
    const meteor = cardById('meteor');
    addCardToDeck(s, meteor);
    expect(s.deck.length).toBe(before + 1);
    expect(s.deck.at(-1)?.id).toBe('meteor');
    expect(s.deck.filter((c) => c.id === meteor.id).length).toBe(1);
  });

  it('mehrfaches Hinzufügen derselben Karte erhöht den Pool', () => {
    const s = createRunState(1);
    const skel = cardById('skelett');
    const before = s.deck.filter((c) => c.id === 'skelett').length;
    addCardToDeck(s, skel);
    addCardToDeck(s, skel);
    expect(s.deck.filter((c) => c.id === 'skelett').length).toBe(before + 2);
  });
});
