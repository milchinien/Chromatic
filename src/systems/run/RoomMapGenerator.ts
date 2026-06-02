import type { MapNode, RoomMap, SubNode, SubNodeType } from '../../domain/Run';
import type { Rng } from '../rng';
import { randInt } from '../rng';

/**
 * Erzeugt eine deterministische Sub-Map für einen Welt-Knoten.
 *
 * Layout pro Akt:
 *   Layer 0:                spawn
 *   Layer 1..(midLayers):   sub_combat ODER sub_treasure
 *   Layer midLayers+1:      exit (combat_normal) ODER mini_boss (combat_hard)
 *
 * Akt 1 hat 2 Zwischen-Layer (4 Layer total), jeder weitere Akt einen mehr.
 *
 * **Garantien** (gegen Schein-Kampfräume):
 * - Jeder Zwischen-Layer hat MIND. einen `sub_combat`-Knoten.
 * - Jeder Pfad vom Spawn zum Exit passiert mindestens diesen Combat-Knoten.
 *
 * Reachability: jeder Layer-L+1-Knoten bekommt mind. eine Eingangs-Edge.
 */
export const generateRoom = (worldNode: MapNode, actNumber: number, rng: Rng): RoomMap => {
  const midLayers = Math.max(2, 1 + actNumber); // Akt 1 = 2 mid-Layer, Akt 2 = 3, ...
  const totalLayers = midLayers + 2;

  const exitType: SubNodeType = worldNode.type === 'combat_hard' ? 'mini_boss' : 'exit';

  const nodes: SubNode[] = [];
  const layerIds: string[][] = [];

  for (let li = 0; li < totalLayers; li++) {
    const ids: string[] = [];
    const isEndLayer = li === 0 || li === totalLayers - 1;
    const count = isEndLayer ? 1 : 1 + randInt(rng, 0, 2);
    // Index des Pflicht-Combat in diesem Mid-Layer (immer mind. einen pro Layer).
    const forcedCombatIdx = isEndLayer ? -1 : randInt(rng, 0, count);
    for (let i = 0; i < count; i++) {
      const id = `s${li}_${i}`;
      let type: SubNodeType;
      if (li === 0) type = 'spawn';
      else if (li === totalLayers - 1) type = exitType;
      else if (i === forcedCombatIdx) type = 'sub_combat';
      else type = rng() < 0.6 ? 'sub_combat' : 'sub_treasure';
      const x = (li + 0.5) / totalLayers;
      const yStep = 1 / (count + 1);
      const y = yStep * (i + 1);
      nodes.push({ id, type, layer: li, x, y, edges: [] });
      ids.push(id);
    }
    layerIds.push(ids);
  }

  // Edges + Reachability
  const edgesOf = new Map<string, Set<string>>(nodes.map((n) => [n.id, new Set<string>()]));
  for (let li = 0; li < totalLayers - 1; li++) {
    const src = layerIds[li]!;
    const tgt = layerIds[li + 1]!;
    for (const sid of src) {
      const outCount = tgt.length === 1 ? 1 : Math.min(tgt.length, 1 + randInt(rng, 0, 2));
      const shuffled = [...tgt].sort(() => rng() - 0.5);
      for (const tid of shuffled.slice(0, outCount)) edgesOf.get(sid)!.add(tid);
    }
    const incoming = new Set<string>();
    for (const sid of src) for (const tid of edgesOf.get(sid)!) incoming.add(tid);
    for (const tid of tgt) {
      if (!incoming.has(tid)) {
        const sid = src[randInt(rng, 0, src.length)]!;
        edgesOf.get(sid)!.add(tid);
      }
    }
  }

  const finalNodes: SubNode[] = nodes.map((n) => ({
    ...n,
    edges: Object.freeze([...edgesOf.get(n.id)!].sort()),
  }));

  return {
    nodes: Object.freeze(finalNodes),
    startNodeId: layerIds[0]![0]!,
    exitNodeId: layerIds[totalLayers - 1]![0]!,
    worldNodeType: worldNode.type,
  };
};

const seedFor = (runSeed: number, worldNodeId: string): number => {
  let h = (runSeed * 2654435761) >>> 0;
  for (let i = 0; i < worldNodeId.length; i++) h = ((h * 31) ^ worldNodeId.charCodeAt(i)) >>> 0;
  return h;
};

/** Liefert eine Sub-Map für den Welt-Knoten — generiert sie deterministisch
 *  beim ersten Aufruf und cached danach im RunState. */
export const getOrCreateRoomMap = (
  runState: { seed: number; actNumber: number; roomMaps: Map<string, RoomMap> },
  worldNode: MapNode,
  rngFactory: (seed: number) => Rng,
): RoomMap => {
  const existing = runState.roomMaps.get(worldNode.id);
  if (existing) return existing;
  const rng = rngFactory(seedFor(runState.seed, worldNode.id));
  const room = generateRoom(worldNode, runState.actNumber, rng);
  runState.roomMaps.set(worldNode.id, room);
  return room;
};
