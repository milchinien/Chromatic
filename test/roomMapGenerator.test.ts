import { describe, it, expect } from 'vitest';
import { generateRoom, getOrCreateRoomMap } from '../src/systems/run/RoomMapGenerator';
import { mulberry32 } from '../src/systems/rng';
import type { MapNode, RoomMap } from '../src/domain/Run';

const wn = (type: MapNode['type'], id = 'n_test'): MapNode => ({
  id,
  type,
  layer: 1,
  x: 0,
  y: 0,
  edges: Object.freeze([]),
});

describe('RoomMapGenerator', () => {
  it('liefert deterministisch bei gleichem Seed', () => {
    const a = generateRoom(wn('combat_normal'), 1, mulberry32(42));
    const b = generateRoom(wn('combat_normal'), 1, mulberry32(42));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('hat einen Spawn-Knoten als Start und mind. 3 Knoten in Akt 1', () => {
    const room = generateRoom(wn('combat_normal'), 1, mulberry32(7));
    expect(room.nodes[0]?.type).toBe('spawn');
    expect(room.startNodeId).toBe(room.nodes[0]?.id);
    expect(room.nodes.length).toBeGreaterThanOrEqual(3);
  });

  it('combat_hard-Welt-Knoten → Exit ist mini_boss', () => {
    const room = generateRoom(wn('combat_hard'), 1, mulberry32(7));
    const exit = room.nodes.find((n) => n.id === room.exitNodeId);
    expect(exit?.type).toBe('mini_boss');
  });

  it('combat_normal-Welt-Knoten → Exit ist exit-Typ', () => {
    const room = generateRoom(wn('combat_normal'), 1, mulberry32(7));
    const exit = room.nodes.find((n) => n.id === room.exitNodeId);
    expect(exit?.type).toBe('exit');
  });

  it('Exit ist vom Spawn aus erreichbar (BFS)', () => {
    const room = generateRoom(wn('combat_normal'), 1, mulberry32(2026));
    const map = new Map(room.nodes.map((n) => [n.id, n]));
    const visited = new Set<string>();
    const queue = [room.startNodeId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const n = map.get(id);
      if (n) queue.push(...n.edges);
    }
    expect(visited.has(room.exitNodeId)).toBe(true);
  });

  it('jeder Nicht-Spawn-Knoten hat mind. eine eingehende Edge', () => {
    const room = generateRoom(wn('combat_normal'), 1, mulberry32(99));
    const incoming = new Map<string, number>();
    for (const n of room.nodes) for (const e of n.edges) incoming.set(e, (incoming.get(e) ?? 0) + 1);
    for (const n of room.nodes) {
      if (n.id === room.startNodeId) continue;
      expect(incoming.get(n.id) ?? 0).toBeGreaterThan(0);
    }
  });

  it('jede Sub-Map enthält mind. einen sub_treasure (über viele Seeds/Akte)', () => {
    for (let act = 1; act <= 3; act++) {
      for (let seed = 0; seed < 200; seed++) {
        const room = generateRoom(wn('combat_normal'), act, mulberry32(seed));
        const hasTreasure = room.nodes.some((n) => n.type === 'sub_treasure');
        expect(hasTreasure, `Akt ${act}, Seed ${seed}`).toBe(true);
      }
    }
  });

  it('jeder Zwischen-Layer behält mind. einen sub_combat trotz Pflicht-Schatz', () => {
    for (let seed = 0; seed < 200; seed++) {
      const room = generateRoom(wn('combat_normal'), 2, mulberry32(seed));
      const byLayer = new Map<number, string[]>();
      for (const n of room.nodes) {
        const arr = byLayer.get(n.layer) ?? [];
        arr.push(n.type);
        byLayer.set(n.layer, arr);
      }
      for (const [layer, types] of byLayer) {
        const isEnd = layer === 0 || layer === Math.max(...byLayer.keys());
        if (isEnd) continue;
        expect(types, `Seed ${seed}, Layer ${layer}`).toContain('sub_combat');
      }
    }
  });

  it('getOrCreateRoomMap cached die Map beim zweiten Aufruf', () => {
    const cache = new Map<string, RoomMap>();
    const runStateStub = { seed: 5, actNumber: 1, roomMaps: cache };
    const node = wn('combat_normal', 'world-X');
    const r1 = getOrCreateRoomMap(runStateStub, node, mulberry32);
    const r2 = getOrCreateRoomMap(runStateStub, node, mulberry32);
    expect(r1).toBe(r2);
    expect(cache.size).toBe(1);
  });
});
