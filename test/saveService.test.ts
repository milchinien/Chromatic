import { describe, it, expect, beforeEach } from 'vitest';
import { saveRun, loadRun, clearSavedRun, hasSavedRun } from '../src/systems/save/SaveService';
import { createRunState } from '../src/systems/run/RunState';
import { enterRoom } from '../src/systems/run/RunState';
import { generateRoom } from '../src/systems/run/RoomMapGenerator';
import { perkById } from '../src/systems/data/perks';
import { mulberry32 } from '../src/systems/rng';

// Minimaler localStorage-Ersatz (Vitest läuft in Node ohne DOM).
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

const installStorage = (): FakeStorage => {
  const fake = new FakeStorage();
  (globalThis as { localStorage?: Storage }).localStorage = fake as unknown as Storage;
  return fake;
};

/** Run mit nicht-trivialem Zustand (Coins, besuchte Knoten, Upgrades, Perk,
 *  aktive Sub-Map) — testet die Map/Set/ID-Serialisierung. */
const richRun = () => {
  const run = createRunState(12345);
  run.coins = 321;
  run.baseHp = 67;
  run.actNumber = 2;
  run.actColor = 'krieg';
  run.visitedNodes.add('n1_0');
  run.visitedNodes.add('n2_1');
  run.cardLevels[run.deck[0]!.id] = 3;
  run.activePerks.push(perkById('damage_plus_5'));
  // Sub-Map betreten → roomMaps + visitedRoomNodes füllen.
  const worldNode = run.map.nodes.find((n) => n.type === 'combat_normal') ?? run.map.nodes[1]!;
  const room = generateRoom(worldNode, run.actNumber, mulberry32(7));
  run.roomMaps.set(worldNode.id, room);
  enterRoom(run, worldNode.id, room);
  return run;
};

describe('SaveService', () => {
  beforeEach(() => {
    installStorage();
  });

  it('Round-Trip: speichert und lädt den vollständigen Zustand', () => {
    const run = richRun();
    saveRun(run);
    const loaded = loadRun();
    expect(loaded).not.toBeNull();
    const r = loaded!;

    expect(r.seed).toBe(run.seed);
    expect(r.actNumber).toBe(run.actNumber);
    expect(r.actColor).toBe(run.actColor);
    expect(r.coins).toBe(run.coins);
    expect(r.baseHp).toBe(run.baseHp);
    expect(r.maxBaseHp).toBe(run.maxBaseHp);
    expect(r.currentNodeId).toBe(run.currentNodeId);

    // Deck als IDs rehydriert (gleiche Reihenfolge inkl. Duplikate).
    expect(r.deck.map((c) => c.id)).toEqual(run.deck.map((c) => c.id));
    expect(r.cardLevels).toEqual(run.cardLevels);
    expect(r.activePerks.map((p) => p.id)).toEqual(['damage_plus_5']);

    // Set/Map korrekt rekonstruiert.
    expect(r.visitedNodes).toBeInstanceOf(Set);
    expect([...r.visitedNodes].sort()).toEqual([...run.visitedNodes].sort());
    expect(r.roomMaps).toBeInstanceOf(Map);
    expect(r.activeWorldNodeId).toBe(run.activeWorldNodeId);
    expect(r.currentRoomNodeId).toBe(run.currentRoomNodeId);
    expect(r.roomMaps.get(run.activeWorldNodeId!)?.nodes.length).toBe(
      run.roomMaps.get(run.activeWorldNodeId!)?.nodes.length,
    );
    expect(r.visitedRoomNodes.get(run.activeWorldNodeId!)).toBeInstanceOf(Set);
  });

  it('hasSavedRun spiegelt den Save-Zustand', () => {
    expect(hasSavedRun()).toBe(false);
    saveRun(richRun());
    expect(hasSavedRun()).toBe(true);
    clearSavedRun();
    expect(hasSavedRun()).toBe(false);
    expect(loadRun()).toBeNull();
  });

  it('Versions-Mismatch wird erkannt und gelöscht', () => {
    const fake = installStorage();
    saveRun(richRun());
    const key = fake.key(0)!;
    const data = JSON.parse(fake.getItem(key)!);
    data.saveVersion = 999;
    fake.setItem(key, JSON.stringify(data));

    expect(loadRun()).toBeNull();
    expect(hasSavedRun()).toBe(false);
    expect(fake.getItem(key)).toBeNull(); // gelöscht
  });

  it('kaputtes JSON wird sauber verworfen (kein Crash)', () => {
    const fake = installStorage();
    fake.setItem('chromatic:run', '{ not valid json');
    expect(loadRun()).toBeNull();
  });

  it('unbekannte Card-ID macht das Save ungültig und löscht es', () => {
    const fake = installStorage();
    saveRun(richRun());
    const key = fake.key(0)!;
    const data = JSON.parse(fake.getItem(key)!);
    data.deckIds = ['__does_not_exist__'];
    fake.setItem(key, JSON.stringify(data));

    expect(loadRun()).toBeNull();
    expect(fake.getItem(key)).toBeNull();
  });

  it('ohne Save liefert loadRun null', () => {
    installStorage();
    expect(loadRun()).toBeNull();
    expect(hasSavedRun()).toBe(false);
  });
});
