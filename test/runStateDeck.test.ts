import { describe, it, expect } from 'vitest';
import { addCardToDeck, createRunState } from '../src/systems/run/RunState';
import { cardById } from '../src/systems/data/cards';

describe('RunState — Deck-Wachstum', () => {
  it('addCardToDeck hängt Karte an und behält bestehende', () => {
    const s = createRunState(1);
    const before = s.deck.length;
    const card = cardById('zeitweiser');
    addCardToDeck(s, card);
    expect(s.deck.length).toBe(before + 1);
    expect(s.deck.at(-1)?.id).toBe('zeitweiser');
    expect(s.deck.filter((c) => c.id === card.id).length).toBe(1);
  });

  it('mehrfaches Hinzufügen derselben Karte erhöht den Pool', () => {
    const s = createRunState(1);
    const card = cardById('grabwaechter');
    const before = s.deck.filter((c) => c.id === 'grabwaechter').length;
    addCardToDeck(s, card);
    addCardToDeck(s, card);
    expect(s.deck.filter((c) => c.id === 'grabwaechter').length).toBe(before + 2);
  });
});
