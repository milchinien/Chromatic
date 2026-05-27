import type { Card, Rarity } from '../../domain/Card';
import type { Rng } from '../rng';
import { ALL_CARDS } from './cards';

const rarityOf = (c: Card): Rarity => c.rarity ?? 'common';

/** Pool aller käuflichen Karten (Shop). MVP: alle 'common'. */
export const shopPool: readonly Card[] = ALL_CARDS.filter((c) => rarityOf(c) === 'common');

/** Pool aller findbaren Karten (Schatz). MVP: identisch zu shopPool. */
export const treasurePool: readonly Card[] = ALL_CARDS.filter((c) => rarityOf(c) === 'common');

/**
 * Liefert N **unterschiedliche** Karten aus dem Pool, deterministisch via Rng.
 * Wenn N größer als der Pool ist, gibt es den ganzen Pool zurück.
 * Fisher-Yates auf einer Kopie, dann die ersten N.
 */
export const getRandomDrops = (pool: readonly Card[], n: number, rng: Rng): Card[] => {
  if (n <= 0 || pool.length === 0) return [];
  const arr = [...pool];
  const take = Math.min(n, arr.length);
  for (let i = arr.length - 1; i > arr.length - take - 1 && i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr.slice(arr.length - take);
};

/** Preis-Formel aus PHASE_4_DECK_WACHSTUM.md: cost = 50 + manaCost * 10. */
export const shopPriceOf = (card: Card): number => 50 + card.manaCost * 10;
