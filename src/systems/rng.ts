export type Rng = () => number;

/**
 * mulberry32 — kleiner, schneller, ausreichend zufälliger Seed-PRNG.
 * Liefert Werte in [0, 1).
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randInt = (rng: Rng, minInclusive: number, maxExclusive: number): number =>
  Math.floor(rng() * (maxExclusive - minInclusive)) + minInclusive;

export const pick = <T,>(rng: Rng, arr: readonly T[]): T => {
  if (arr.length === 0) throw new Error('pick: empty array');
  return arr[randInt(rng, 0, arr.length)]!;
};
