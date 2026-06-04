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

// Akt-1: leicht — viele Normal-Kämpfe, ein Schwer-Kampf, Shop+Perk frühzeitig.
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
    count: 3,
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

// Akt 2: mehr Knoten pro Layer, häufiger combat_hard, weniger Treasures.
const ACT_2_LAYERS: readonly LayerSpec[] = [
  { count: 1, pickType: fixed('start') },
  {
    count: 3,
    pickType: weighted([
      { type: 'combat_normal', w: 3 },
      { type: 'combat_hard', w: 1 },
      { type: 'treasure', w: 1 },
    ]),
  },
  {
    count: 3,
    pickType: weighted([
      { type: 'combat_normal', w: 2 },
      { type: 'combat_hard', w: 2 },
      { type: 'shop', w: 1 },
      { type: 'perk', w: 1 },
    ]),
  },
  {
    count: 3,
    pickType: weighted([
      { type: 'combat_hard', w: 3 },
      { type: 'combat_normal', w: 1 },
      { type: 'treasure', w: 1 },
    ]),
  },
  { count: 1, pickType: fixed('boss') },
];

// Akt 3: kompakt aber hart — fast nur combat_hard, ein Shop.
const ACT_3_LAYERS: readonly LayerSpec[] = [
  { count: 1, pickType: fixed('start') },
  {
    count: 3,
    pickType: weighted([
      { type: 'combat_hard', w: 3 },
      { type: 'combat_normal', w: 1 },
      { type: 'perk', w: 1 },
    ]),
  },
  {
    count: 4,
    pickType: weighted([
      { type: 'combat_hard', w: 3 },
      { type: 'combat_normal', w: 1 },
      { type: 'shop', w: 1 },
      { type: 'treasure', w: 1 },
    ]),
  },
  {
    count: 3,
    pickType: weighted([
      { type: 'combat_hard', w: 4 },
      { type: 'combat_normal', w: 1 },
    ]),
  },
  { count: 1, pickType: fixed('boss') },
];

const LAYERS_BY_ACT: Record<number, readonly LayerSpec[]> = {
  1: ACT_1_LAYERS,
  2: ACT_2_LAYERS,
  3: ACT_3_LAYERS,
};

/** Sonder-Räume, von denen jeder Akt MIND. einen enthalten muss. Fehlt einer nach
 *  dem gewichteten Würfeln, wird ein Mid-Layer-Kampfknoten dazu umgewandelt. */
const GUARANTEED_NODE_TYPES: readonly NodeType[] = ['shop', 'treasure', 'perk', 'elite'];

/** Stellt sicher, dass jeder Sonder-Raum-Typ (Shop/Schatz/Perk/Event) mind. einmal
 *  vorkommt. Wandelt fehlende Typen auf Mid-Layer-Knoten um. Umwandlungs-Kandidaten
 *  in Prioritäts-Reihenfolge: combat_normal → combat_hard → ÜBERZÄHLIGE Sonder-Räume
 *  (ein zweiter Shop o. Ä.). Die LETZTE Kopie eines benötigten Typs wird nie
 *  entfernt — so passen auch mehrere fehlende Typen sicher in die Mid-Layer. */
const ensureGuaranteedNodeTypes = (nodes: MapNode[], lastLayer: number, rng: Rng): void => {
  const count = (t: NodeType): number => nodes.reduce((s, n) => s + (n.type === t ? 1 : 0), 0);
  const remaining = new Map<NodeType, number>();
  for (const n of nodes) remaining.set(n.type, (remaining.get(n.type) ?? 0) + 1);

  const missing = GUARANTEED_NODE_TYPES.filter((t) => count(t) === 0);
  if (missing.length === 0) return;

  const isMid = (n: MapNode): boolean => n.layer !== 0 && n.layer !== lastLayer;
  const shuffle = (idx: number[]): number[] => idx.sort(() => rng() - 0.5);
  const idxOf = (predicate: (n: MapNode) => boolean): number[] =>
    nodes.map((n, i) => ({ n, i })).filter(({ n }) => predicate(n)).map(({ i }) => i);

  // Kandidaten priorisiert: erst Kämpfe (Schwierigkeit zuerst opfern), dann
  // überzählige Sonder-Räume.
  const candidates = [
    ...shuffle(idxOf((n) => isMid(n) && n.type === 'combat_normal')),
    ...shuffle(idxOf((n) => isMid(n) && n.type === 'combat_hard')),
    ...shuffle(idxOf((n) => isMid(n) && GUARANTEED_NODE_TYPES.includes(n.type))),
  ];

  for (const type of missing) {
    const pos = candidates.findIndex((idx) => {
      const cur = nodes[idx]!.type;
      // Nie die letzte Kopie eines garantierten Typs entfernen.
      return !(GUARANTEED_NODE_TYPES.includes(cur) && (remaining.get(cur) ?? 0) <= 1);
    });
    if (pos === -1) continue;
    const idx = candidates.splice(pos, 1)[0]!;
    const cur = nodes[idx]!.type;
    remaining.set(cur, (remaining.get(cur) ?? 1) - 1);
    remaining.set(type, (remaining.get(type) ?? 0) + 1);
    nodes[idx] = { ...nodes[idx]!, type };
  }
};

/** Anzahl Akte in einem kompletten Run. Sieg gegen Akt N-Boss = Game-Won. */
export const MAX_ACTS = 3;

/** Pro Akt ein Schauplatz-Name fürs WorldMap-HUD. */
const ACT_NAMES: Record<number, string> = {
  1: 'Verfluchter Hain',
  2: 'Bergpass der Echos',
  3: 'Halle des Magierats',
};

export const actName = (actNumber: number): string =>
  ACT_NAMES[actNumber] ?? `Akt ${actNumber}`;

/**
 * generateAct — deterministisch via Rng. Layered Random:
 *  - Pro Layer N Knoten (siehe LayerSpec).
 *  - Jeder Knoten in Layer L hat Edges zu 1–2 Knoten in Layer L+1.
 *  - Reachability garantiert: jeder Layer-L+1-Knoten bekommt mindestens eine
 *    eingehende Edge (sonst „Toter Knoten").
 *  - Bossknoten ist immer der einzige Knoten im letzten Layer und erreichbar.
 */
export const generateAct = (actNumber: number, rng: Rng): ActMap => {
  const layers = LAYERS_BY_ACT[actNumber] ?? ACT_3_LAYERS;
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

  // 1b) Sonder-Räume garantieren (mind. 1 Shop/Schatz/Perk pro Akt).
  ensureGuaranteedNodeTypes(nodes, layers.length - 1, rng);

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
