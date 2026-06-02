import type { Card } from '../../domain/Card';
import type { RunState, ActMap, RoomMap } from '../../domain/Run';
import { BASE_HP_MAX, BASE_HP_START } from '../data/balance';
import { starterDeck } from '../data/starterDeck';
import { mulberry32 } from '../rng';
import { generateAct, MAX_ACTS } from './MapGenerator';

export const STARTING_COINS = 550;

export const createRunState = (seed: number): RunState => {
  const rng = mulberry32(seed);
  const map: ActMap = generateAct(1, rng);
  return {
    seed,
    actNumber: 1,
    coins: STARTING_COINS,
    deck: starterDeck(),
    activePerks: [],
    map,
    currentNodeId: map.startNodeId,
    visitedNodes: new Set([map.startNodeId]),
    baseHp: BASE_HP_START,
    maxBaseHp: BASE_HP_MAX,
    roomMaps: new Map(),
    activeWorldNodeId: null,
    currentRoomNodeId: null,
    visitedRoomNodes: new Map(),
  };
};

// Pure-Updates — mutieren den State explizit. Single-Player ohne Undo,
// daher keine Immutable-Klimmzüge.

export const addCoins = (state: RunState, amount: number): void => {
  state.coins = Math.max(0, state.coins + amount);
};

export const addCardToDeck = (state: RunState, card: Card): void => {
  state.deck.push(card);
};

export const markNodeVisited = (state: RunState, nodeId: string): void => {
  state.visitedNodes.add(nodeId);
};

/** Setzt den aktuellen Welt-Knoten. **Markiert NICHT** als besucht — das passiert
 *  erst nach Abschluss der Aktion (Shop-Verlassen, Treasure-Weiter, Perk-Confirm,
 *  RoomMap-Exit-Klick, Boss-/Mini-Boss-Sieg). So zeigt kein Knoten ein ✓, den
 *  der Spieler nur betreten aber nicht durchlaufen hat. */
export const setCurrentNode = (state: RunState, nodeId: string): void => {
  state.currentNodeId = nodeId;
};

export const damageBase = (state: RunState, amount: number): void => {
  state.baseHp = Math.max(0, state.baseHp - amount);
};

export const healBase = (state: RunState, amount: number): void => {
  state.baseHp = Math.min(state.maxBaseHp, state.baseHp + amount);
};

export const isRunOver = (state: RunState): boolean => state.baseHp <= 0;

export const isFinalAct = (state: RunState): boolean => state.actNumber >= MAX_ACTS;

/** Nach Boss-Sieg in nicht-letztem Akt: neuen Akt generieren, Caches resetten.
 *  Deck, Coins, Perks, Base-HP bleiben — sie sind dauerhafte Progression. */
export const advanceToNextAct = (state: RunState): void => {
  if (isFinalAct(state)) return;
  state.actNumber += 1;
  const rng = mulberry32(state.seed ^ (state.actNumber * 0x9e3779b1));
  state.map = generateAct(state.actNumber, rng);
  state.currentNodeId = state.map.startNodeId;
  state.visitedNodes = new Set([state.map.startNodeId]);
  state.roomMaps = new Map();
  state.activeWorldNodeId = null;
  state.currentRoomNodeId = null;
  state.visitedRoomNodes = new Map();
};

export const reachableFromCurrent = (state: RunState): string[] => {
  const node = state.map.nodes.find((n) => n.id === state.currentNodeId);
  return node ? [...node.edges] : [];
};

// ===== Sub-Map (Ebene B) =====

export const enterRoom = (state: RunState, worldNodeId: string, room: RoomMap): void => {
  state.activeWorldNodeId = worldNodeId;
  state.currentRoomNodeId = room.startNodeId;
  if (!state.visitedRoomNodes.has(worldNodeId)) {
    state.visitedRoomNodes.set(worldNodeId, new Set([room.startNodeId]));
  }
};

export const setCurrentRoomNode = (state: RunState, subNodeId: string): void => {
  state.currentRoomNodeId = subNodeId;
  const wid = state.activeWorldNodeId;
  if (!wid) return;
  let set = state.visitedRoomNodes.get(wid);
  if (!set) {
    set = new Set();
    state.visitedRoomNodes.set(wid, set);
  }
  set.add(subNodeId);
};

export const exitRoom = (state: RunState): void => {
  state.activeWorldNodeId = null;
  state.currentRoomNodeId = null;
};

export const isInRoom = (state: RunState): boolean => state.activeWorldNodeId !== null;

export const reachableInRoom = (state: RunState): string[] => {
  const wid = state.activeWorldNodeId;
  if (!wid || !state.currentRoomNodeId) return [];
  const room = state.roomMaps.get(wid);
  if (!room) return [];
  const node = room.nodes.find((n) => n.id === state.currentRoomNodeId);
  return node ? [...node.edges] : [];
};

/** Eindeutiger Key der aktuellen Position für seed-basierte Side-Effects
 *  (Treasure-Reward, Shop-Offers). Berücksichtigt Sub-Map-Kontext. */
export const locationKey = (state: RunState): string =>
  state.activeWorldNodeId && state.currentRoomNodeId
    ? `${state.activeWorldNodeId}:${state.currentRoomNodeId}`
    : state.currentNodeId;
