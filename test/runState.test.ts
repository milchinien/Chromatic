import { describe, it, expect } from 'vitest';
import {
  addCoins,
  cardLevel,
  createRunState,
  damageBase,
  healBase,
  reachableFromCurrent,
  setActColor,
  setCurrentNode,
  STARTING_COINS,
  upgradeCard,
} from '../src/systems/run/RunState';

describe('RunState', () => {
  it('createRunState liefert frischen Run mit Default-Werten', () => {
    const s = createRunState(42);
    expect(s.coins).toBe(STARTING_COINS);
    expect(s.baseHp).toBe(s.maxBaseHp);
    expect(s.deck.length).toBeGreaterThan(0);
    expect(s.actNumber).toBe(1);
    expect(s.visitedNodes.has(s.currentNodeId)).toBe(true);
    expect(s.currentNodeId).toBe(s.map.startNodeId);
  });

  it('addCoins addiert und cappt nicht nach oben (aber min 0)', () => {
    const s = createRunState(1);
    addCoins(s, 50);
    expect(s.coins).toBe(STARTING_COINS + 50);
    addCoins(s, -10000);
    expect(s.coins).toBe(0);
  });

  it('upgradeCard erhöht Level ohne das Deck zu vergrößern', () => {
    const s = createRunState(1);
    const id = s.deck[0]!.id;
    const before = s.deck.length;
    upgradeCard(s, id);
    expect(cardLevel(s, id)).toBe(2);
    expect(s.deck.length).toBe(before);
  });

  it('setActColor setzt die Akt-Farbe', () => {
    const s = createRunState(1);
    setActColor(s, 'stein');
    expect(s.actColor).toBe('stein');
  });

  it('damageBase und healBase respektieren Grenzen', () => {
    const s = createRunState(1);
    damageBase(s, 30);
    expect(s.baseHp).toBe(70);
    damageBase(s, 200);
    expect(s.baseHp).toBe(0);
    healBase(s, 30);
    expect(s.baseHp).toBe(30);
    healBase(s, 999);
    expect(s.baseHp).toBe(s.maxBaseHp);
  });

  it('setCurrentNode setzt currentNodeId — markiert aber NICHT als besucht', () => {
    const s = createRunState(1);
    const next = reachableFromCurrent(s)[0];
    expect(next).toBeDefined();
    setCurrentNode(s, next!);
    expect(s.currentNodeId).toBe(next);
    // Besucht-Marker wird explizit vom Abschluss-Hook gesetzt, nicht beim Betreten.
    expect(s.visitedNodes.has(next!)).toBe(false);
  });
});
