import type { Card, Color } from './Card';

/** Eine Deck-Karte mit ihrem aktuellen Upgrade-Level. Level 1 = unupgegradet.
 *  Combat rollt daraus Truppenzahl + skalierte Stats. */
export interface DeckEntry {
  readonly card: Card;
  readonly level: number;
}

export type NodeType =
  | 'start'
  | 'combat_normal'
  | 'combat_hard'
  | 'elite'
  | 'shop'
  | 'treasure'
  | 'perk'
  | 'boss';

export interface MapNode {
  readonly id: string;
  readonly type: NodeType;
  readonly layer: number;
  /** Normalisiert auf [0,1] in beiden Achsen. Screen-spezifische Pixel-Pos
   *  errechnet sich daraus beim Rendern. */
  readonly x: number;
  readonly y: number;
  readonly edges: readonly string[];
}

export interface ActMap {
  readonly nodes: readonly MapNode[];
  readonly startNodeId: string;
  readonly bossNodeId: string;
}

// Sub-Knoten innerhalb eines Welt-Knotens (Ebene B aus GAME_DESIGN.md).
// 'spawn' = Spieler-Eintritt, 'exit' = Rückkehr-Gate, 'mini_boss' = Pflicht-Encounter
// der als Exit dient (für combat_hard-Welt-Knoten).
export type SubNodeType = 'spawn' | 'sub_combat' | 'sub_treasure' | 'mini_boss' | 'exit';

export interface SubNode {
  readonly id: string;
  readonly type: SubNodeType;
  readonly layer: number;
  readonly x: number;
  readonly y: number;
  readonly edges: readonly string[];
}

export interface RoomMap {
  readonly nodes: readonly SubNode[];
  readonly startNodeId: string;
  readonly exitNodeId: string;
  /** Welcher Welt-Knoten-Typ diese Sub-Map gehört, fürs Header-Label. */
  readonly worldNodeType: NodeType;
}

/** Perk-Effekte werden über `apply` modelliert — der Funktions-Pointer wird
 *  beim Combat-Mount für jeden aktiven Perk einmal ausgeführt.
 *  Der echte Apply-Type ist in src/systems/data/perks.ts, hier nur die Datenform. */
export interface Perk {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Icon-Glyph für die UI (Unicode-Approximation, Phase 7 ersetzt durch SVG). */
  readonly glyph: string;
  readonly color: string;
}

export interface RunState {
  seed: number;
  actNumber: number;
  /** Farbe des aktuellen Akts — bestimmt über die Boss-Auswahl. Alle Gegner
   *  des Akts ziehen nur Karten dieser Farbe. */
  actColor: Color;
  coins: number;
  deck: Card[];
  /** Upgrade-Level je Karten-ID (Default 1). Deck wächst nie — nur Upgrades. */
  cardLevels: Record<string, number>;
  activePerks: Perk[];
  map: ActMap;
  currentNodeId: string;
  visitedNodes: Set<string>;
  baseHp: number;
  maxBaseHp: number;
  /** Cached Sub-Maps pro Welt-Knoten — lazy gefüllt beim ersten Betreten. */
  roomMaps: Map<string, RoomMap>;
  /** Welt-Knoten, dessen Sub-Map gerade aktiv ist. null wenn auf Welt-Karte. */
  activeWorldNodeId: string | null;
  /** Aktueller Sub-Knoten innerhalb der aktiven Sub-Map. null wenn nicht in Sub-Map. */
  currentRoomNodeId: string | null;
  /** Pro Sub-Map die besuchten Sub-Knoten — Reachability-Berechnung analog WeltKarte. */
  visitedRoomNodes: Map<string, Set<string>>;
}
