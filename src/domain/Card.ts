import type { Unit } from './Unit';
import type { CombatState } from '../systems/combat/CombatState';

export type Color = 'natur' | 'krieg' | 'stein' | 'untot' | 'farblos';
export type CardClass = 'krieger' | 'festung' | 'reittier' | 'magier' | 'heiler';
export type Rarity = 'common' | 'rare';

export interface UnitStats {
  damage: number;
  attackInterval: number;
  hp: number;
  speed: number;
}

export type PassiveTrigger = 'onSpawn' | 'onDeath' | 'onTick' | 'onHpThreshold';

export interface PassiveEffect {
  readonly trigger: PassiveTrigger;
  readonly hpThreshold?: number;
  readonly apply: (self: Unit, state: CombatState, dt: number) => void;
}

export interface Card {
  readonly id: string;
  readonly name: string;
  readonly color: Color;
  readonly class: CardClass;
  readonly manaCost: number;
  readonly stats: UnitStats;
  readonly colorBuff: Partial<UnitStats>;
  readonly classBuff: Partial<UnitStats>;
  readonly passive?: PassiveEffect;
  readonly description?: string;
  /** MVP: alle Karten 'common'. Feld existiert für künftige Rarity-Filter
   *  (Phase R2-Roadmap baut Rare/Epic aus). */
  readonly rarity?: Rarity;
}
