import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadMeta,
  saveMeta,
  clearMeta,
  recordRunStart,
  recordBossBeaten,
  recordRunEnd,
  META_VERSION,
} from '../src/systems/save/MetaSave';

class FakeStorage {
  private m = new Map<string, string>();
  get length(): number {
    return this.m.size;
  }
  clear(): void {
    this.m.clear();
  }
  getItem(k: string): string | null {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, String(v));
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
  key(i: number): string | null {
    return [...this.m.keys()][i] ?? null;
  }
}

beforeEach(() => {
  (globalThis as { localStorage?: Storage }).localStorage = new FakeStorage() as unknown as Storage;
});

describe('MetaSave', () => {
  it('loadMeta liefert Default ohne Save', () => {
    const m = loadMeta();
    expect(m.metaVersion).toBe(META_VERSION);
    expect(m.runsStarted).toBe(0);
    expect(m.bossesBeaten).toBe(0);
    expect(m.achievements).toEqual([]);
  });

  it('recordRunStart erhöht runsStarted und setzt highestActReached >= 1', () => {
    recordRunStart();
    const m = loadMeta();
    expect(m.runsStarted).toBe(1);
    expect(m.highestActReached).toBe(1);
  });

  it('recordBossBeaten zählt Bosse und schaltet "Erstes Blut" frei (genau einmal)', () => {
    const first = recordBossBeaten(1);
    expect(first.map((a) => a.id)).toContain('first_boss');
    expect(loadMeta().bossesBeaten).toBe(1);
    expect(loadMeta().highestActReached).toBe(2);

    // Zweiter Boss → kein erneutes „Erstes Blut".
    const second = recordBossBeaten(2);
    expect(second.map((a) => a.id)).not.toContain('first_boss');
    expect(loadMeta().bossesBeaten).toBe(2);
    expect(loadMeta().highestActReached).toBe(3);
  });

  it('recordRunEnd aktualisiert Bestwerte', () => {
    recordRunEnd({ actReached: 4, coins: 1200, roomsVisited: 25 });
    const m = loadMeta();
    expect(m.runsEnded).toBe(1);
    expect(m.highestActReached).toBe(4);
    expect(m.bestCoins).toBe(1200);
    expect(m.bestRoomsVisited).toBe(25);
    // Bestwerte sinken nicht.
    recordRunEnd({ actReached: 1, coins: 10, roomsVisited: 2 });
    const m2 = loadMeta();
    expect(m2.bestCoins).toBe(1200);
    expect(m2.highestActReached).toBe(4);
  });

  it('Achievements lösen bei erreichten Schwellen aus', () => {
    recordRunEnd({ actReached: 3, coins: 1000, roomsVisited: 20 });
    const ids = new Set(loadMeta().achievements);
    expect(ids.has('reach_act3')).toBe(true);
    expect(ids.has('hoarder')).toBe(true);
    expect(ids.has('explorer')).toBe(true);
    expect(ids.has('reach_act5')).toBe(false);
  });

  it('Version-Mismatch → Default', () => {
    (globalThis.localStorage as Storage).setItem(
      'chromatic:meta',
      JSON.stringify({ metaVersion: 999, runsStarted: 42 }),
    );
    expect(loadMeta().runsStarted).toBe(0);
  });

  it('saveMeta/loadMeta Round-Trip + clearMeta', () => {
    const m = loadMeta();
    m.runsStarted = 7;
    m.achievements.push('first_boss');
    saveMeta(m);
    expect(loadMeta().runsStarted).toBe(7);
    expect(loadMeta().achievements).toContain('first_boss');
    clearMeta();
    expect(loadMeta().runsStarted).toBe(0);
  });
});
