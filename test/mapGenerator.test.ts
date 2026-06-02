import { describe, it, expect } from 'vitest';
import { generateAct } from '../src/systems/run/MapGenerator';
import { mulberry32 } from '../src/systems/rng';

describe('MapGenerator', () => {
  it('liefert deterministisch bei gleichem Seed', () => {
    const a = generateAct(1, mulberry32(123));
    const b = generateAct(1, mulberry32(123));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('liefert unterschiedliche Maps bei unterschiedlichen Seeds', () => {
    const a = generateAct(1, mulberry32(1));
    const b = generateAct(1, mulberry32(999));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('Start ist immer der erste, Boss der letzte Knoten — beide vom richtigen Typ', () => {
    const map = generateAct(1, mulberry32(7));
    const start = map.nodes.find((n) => n.id === map.startNodeId);
    const boss = map.nodes.find((n) => n.id === map.bossNodeId);
    expect(start?.type).toBe('start');
    expect(boss?.type).toBe('boss');
  });

  it('jeder Nicht-Start-Knoten ist über mind. eine eingehende Edge erreichbar', () => {
    const map = generateAct(1, mulberry32(42));
    const incoming = new Map<string, number>();
    for (const n of map.nodes) for (const e of n.edges) incoming.set(e, (incoming.get(e) ?? 0) + 1);
    for (const n of map.nodes) {
      if (n.id === map.startNodeId) continue;
      expect(incoming.get(n.id) ?? 0).toBeGreaterThan(0);
    }
  });

  it('Boss ist vom Start aus erreichbar (BFS)', () => {
    const map = generateAct(1, mulberry32(2026));
    const nodes = new Map(map.nodes.map((n) => [n.id, n]));
    const visited = new Set<string>();
    const queue = [map.startNodeId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const n = nodes.get(id);
      if (n) queue.push(...n.edges);
    }
    expect(visited.has(map.bossNodeId)).toBe(true);
  });

  it('Snapshot mit Seed 1234', () => {
    const map = generateAct(1, mulberry32(1234));
    expect(map.nodes.map((n) => ({ id: n.id, type: n.type, layer: n.layer, edges: n.edges }))).toMatchInlineSnapshot(`
      [
        {
          "edges": [
            "n1_0",
            "n1_1",
          ],
          "id": "n0_0",
          "layer": 0,
          "type": "start",
        },
        {
          "edges": [
            "n2_0",
          ],
          "id": "n1_0",
          "layer": 1,
          "type": "combat_normal",
        },
        {
          "edges": [
            "n2_1",
            "n2_2",
          ],
          "id": "n1_1",
          "layer": 1,
          "type": "combat_normal",
        },
        {
          "edges": [
            "n3_1",
          ],
          "id": "n2_0",
          "layer": 2,
          "type": "perk",
        },
        {
          "edges": [
            "n3_0",
            "n3_1",
          ],
          "id": "n2_1",
          "layer": 2,
          "type": "perk",
        },
        {
          "edges": [
            "n3_0",
            "n3_1",
          ],
          "id": "n2_2",
          "layer": 2,
          "type": "combat_normal",
        },
        {
          "edges": [
            "n4_0",
          ],
          "id": "n3_0",
          "layer": 3,
          "type": "combat_normal",
        },
        {
          "edges": [
            "n4_0",
          ],
          "id": "n3_1",
          "layer": 3,
          "type": "combat_normal",
        },
        {
          "edges": [],
          "id": "n4_0",
          "layer": 4,
          "type": "boss",
        },
      ]
    `);
  });
});
