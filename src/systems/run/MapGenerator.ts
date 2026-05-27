import type { ActMap, MapNode, NodeType } from '../../domain/Run';
import type { Rng } from '../rng';
import { randInt } from '../rng';

interface LayerSpec {
  count: number;
  pickType: (rng: Rng) => NodeType;
}

const fixed = (t: NodeType): ((rng: Rng) => NodeType) => () => t;
const weighted =
  (entries: ReadonlyArray<{ type: NodeType; w: number }>): ((rng: Rng) => NodeType) =>
  (rng) => {
    const total = entries.reduce((s, e) => s + e.w, 0);
    let pick = rng() * total;
    for (const e of entries) {
      pick -= e.w;
      if (pick <= 0) return e.type;
    }
    return entries[entries.length - 1]!.type;
  };

// Akt-1-Layout aus Phase-3-Plan. Phasen 4/5/6 erweitern dieses Schema.
const ACT_1_LAYERS: readonly LayerSpec[] = [
  { count: 1, pickType: fixed('start') },
  {
    count: 2,
    pickType: weighted([
      { type: 'combat_normal', w: 3 },
      { type: 'treasure', w: 1 },
    ]),
  },
  {
    count: 2,
    pickType: weighted([
      { type: 'combat_normal', w: 2 },
      { type: 'shop', w: 1 },
      { type: 'perk', w: 1 },
    ]),
  },
  {
    count: 2,
    pickType: weighted([
      { type: 'combat_normal', w: 2 },
      { type: 'combat_hard', w: 2 },
      { type: 'treasure', w: 1 },
    ]),
  },
  { count: 1, pickType: fixed('boss') },
];

/**
 * generateAct — deterministisch via Rng. Layered Random:
 *  - Pro Layer N Knoten (siehe LayerSpec).
 *  - Jeder Knoten in Layer L hat Edges zu 1–2 Knoten in Layer L+1.
 *  - Reachability garantiert: jeder Layer-L+1-Knoten bekommt mindestens eine
 *    eingehende Edge (sonst „Toter Knoten").
 *  - Bossknoten ist immer der einzige Knoten im letzten Layer und erreichbar.
 *
 *  In Phase 3 zählt nur Akt 1; spätere Akte (Post-MVP) kommen mit eigenen
 *  LayerSpec-Sets.
 */
export const generateAct = (actNumber: number, rng: Rng): ActMap => {
  if (actNumber !== 1) {
    // MVP: nur Akt 1. Spätere Akte recyceln Akt 1 als Fallback.
    return generateAct(1, rng);
  }
  const layers = ACT_1_LAYERS;
  const nodes: MapNode[] = [];
  const layerIds: string[][] = [];

  // 1) Knoten anlegen
  for (let li = 0; li < layers.length; li++) {
    const spec = layers[li]!;
    const ids: string[] = [];
    for (let i = 0; i < spec.count; i++) {
      const id = `n${li}_${i}`;
      const type = li === 0 ? 'start' : li === layers.length - 1 ? 'boss' : spec.pickType(rng);
      const x = (li + 0.5) / layers.length;
      const yStep = 1 / (spec.count + 1);
      const y = yStep * (i + 1);
      nodes.push({ id, type, layer: li, x, y, edges: [] });
      ids.push(id);
    }
    layerIds.push(ids);
  }

  // 2) Edges erzeugen: jeder Knoten bekommt 1–2 Out-Edges zur nächsten Layer.
  //    Danach prüfen, ob jeder Ziel-Knoten mindestens eine eingehende Edge hat —
  //    sonst nachträglich eine Edge vom nächstbesten Quell-Knoten ergänzen.
  const edgesOf = new Map<string, Set<string>>(nodes.map((n) => [n.id, new Set<string>()]));
  for (let li = 0; li < layers.length - 1; li++) {
    const sourceIds = layerIds[li]!;
    const targetIds = layerIds[li + 1]!;
    for (const sid of sourceIds) {
      const outCount = targetIds.length === 1 ? 1 : Math.min(targetIds.length, 1 + randInt(rng, 0, 2));
      const shuffled = [...targetIds].sort(() => rng() - 0.5);
      for (const tid of shuffled.slice(0, outCount)) edgesOf.get(sid)!.add(tid);
    }
    // Reachability sicherstellen
    const incoming = new Set<string>();
    for (const sid of sourceIds) for (const tid of edgesOf.get(sid)!) incoming.add(tid);
    for (const tid of targetIds) {
      if (!incoming.has(tid)) {
        const sid = sourceIds[randInt(rng, 0, sourceIds.length)]!;
        edgesOf.get(sid)!.add(tid);
      }
    }
  }

  // 3) Edges in Knoten zurückschreiben (immutable view)
  const finalNodes: MapNode[] = nodes.map((n) => ({
    ...n,
    edges: Object.freeze([...edgesOf.get(n.id)!].sort()),
  }));

  return {
    nodes: Object.freeze(finalNodes),
    startNodeId: layerIds[0]![0]!,
    bossNodeId: layerIds[layers.length - 1]![0]!,
  };
};
