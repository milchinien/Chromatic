import { describe, it, expect } from 'vitest';
import { getRandomDrops, shopPool, shopPriceOf, treasurePool } from '../src/systems/data/dropPool';
import { mulberry32 } from '../src/systems/rng';
import { cardById } from '../src/systems/data/cards';

describe('dropPool', () => {
  it('shopPool und treasurePool nicht leer', () => {
    expect(shopPool.length).toBeGreaterThan(0);
    expect(treasurePool.length).toBeGreaterThan(0);
  });

  it('getRandomDrops liefert genau n Karten', () => {
    const drops = getRandomDrops(shopPool, 4, mulberry32(1));
    expect(drops.length).toBe(4);
  });

  it('alle gezogenen Karten sind unique', () => {
    const drops = getRandomDrops(shopPool, 4, mulberry32(99));
    const ids = drops.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('deterministisch bei gleichem Seed', () => {
    const a = getRandomDrops(shopPool, 4, mulberry32(7)).map((c) => c.id);
    const b = getRandomDrops(shopPool, 4, mulberry32(7)).map((c) => c.id);
    expect(a).toEqual(b);
  });

  it('liefert höchstens pool.length Karten wenn n größer', () => {
    const drops = getRandomDrops(shopPool, 999, mulberry32(1));
    expect(drops.length).toBe(shopPool.length);
  });

  it('leerer Pool → leeres Ergebnis', () => {
    expect(getRandomDrops([], 5, mulberry32(1))).toEqual([]);
  });
});

describe('shopPriceOf', () => {
  it('Preis-Formel = 50 + manaCost * 10', () => {
    expect(shopPriceOf(cardById('gebetswirker'))).toBe(50 + 3 * 10); // 80 (Heiler)
    expect(shopPriceOf(cardById('zeitweiser'))).toBe(50 + 4 * 10); // 90 (Magier)
    expect(shopPriceOf(cardById('hirsch-des-waldes'))).toBe(50 + 5 * 10); // 100 (Reittier)
    expect(shopPriceOf(cardById('berserker'))).toBe(50 + 7 * 10); // 120 (Krieger)
  });
});
