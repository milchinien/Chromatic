import { describe, it, expect } from 'vitest';
import { rollTroopCount, troopRangeFor, leveledStats } from '../src/systems/data/balance';
import { cardsByColor, cardById } from '../src/systems/data/cards';
import { mulberry32 } from '../src/systems/rng';

describe('Truppen-Roll', () => {
  it('liefert gerade Zahlen im erwarteten Range (schwache Karte 2..20)', () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 200; i++) {
      const n = rollTroopCount(3, 1, rng); // Heiler (3 Mana) → 2..20
      expect(n % 2).toBe(0);
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(20);
    }
  });

  it('starke Karte hat kleineren Max-Range als schwache', () => {
    expect(troopRangeFor(7, 1).max).toBeLessThan(troopRangeFor(3, 1).max);
  });

  it('Level erhöht Min und Max der Truppen-Range um je +2/Stufe', () => {
    const l1 = troopRangeFor(3, 1);
    const l2 = troopRangeFor(3, 2);
    expect(l2.min).toBe(l1.min + 2);
    expect(l2.max).toBe(l1.max + 2);
  });
});

describe('Karten-Level skaliert Stats', () => {
  it('leveledStats erhöht Damage/HP, lässt Tempo/Speed unverändert', () => {
    const base = { damage: 10, attackInterval: 1, hp: 20, speed: 50 };
    const up = leveledStats(base, 3); // +30 %
    expect(up.damage).toBe(13);
    expect(up.hp).toBe(26);
    expect(up.attackInterval).toBe(1);
    expect(up.speed).toBe(50);
  });
});

describe('Farb-Decks', () => {
  it('cardsByColor liefert genau 5 Karten (5 Klassen) und alle in der Farbe', () => {
    for (const color of ['natur', 'krieg', 'stein', 'untot', 'farblos'] as const) {
      const ids = cardsByColor(color);
      expect(ids.length).toBe(5);
      for (const id of ids) expect(cardById(id).color).toBe(color);
    }
  });
});
