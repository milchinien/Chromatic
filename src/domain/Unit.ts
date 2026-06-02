import type { Card, UnitStats } from './Card';
import type { Side } from './Side';

export interface Unit {
  id: string;
  card: Card;
  side: Side;
  x: number;
  y: number;
  baseStats: UnitStats;
  buffs: Partial<UnitStats>;
  currentHp: number;
  target: Unit | null;
  attackCooldown: number;
  alive: boolean;
  hpThresholdFired: boolean;
  /** Sekunden seit Spawn — Renderer nutzt das für Spawn-Flash. */
  spawnAge: number;
  /** Sekunden seit Tod (null solange alive). Renderer nutzt das für Shrink/Fade.
   *  Sobald > DEATH_ANIM_SEC wird die Unit aus state.units gefiltert. */
  deathAge: number | null;
  /** Bevorzugte Y-Position (Lane nach Klasse). Bewegung zieht zur Lane, damit
   *  Reittiere flankieren statt im Frontline-Stau zu blockieren. */
  laneY: number;
}

export const effectiveStats = (u: Unit): UnitStats => ({
  damage: u.baseStats.damage + (u.buffs.damage ?? 0),
  attackInterval: Math.max(0.1, u.baseStats.attackInterval - (u.buffs.attackInterval ?? 0)),
  hp: u.baseStats.hp + (u.buffs.hp ?? 0),
  speed: u.baseStats.speed + (u.buffs.speed ?? 0),
});
