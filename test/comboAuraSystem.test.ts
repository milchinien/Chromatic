import { describe, it, expect } from 'vitest';
import { ComboAuraSystem } from '../src/systems/combat/ComboAuraSystem';
import type { CombatState } from '../src/systems/combat/CombatState';
import type { Card, Color, CardClass } from '../src/domain/Card';
import type { Unit } from '../src/domain/Unit';

const card = (
  id: string,
  color: Color,
  cls: CardClass,
  colorBuff: Partial<Card['colorBuff']> = {},
  classBuff: Partial<Card['classBuff']> = {},
): Card => ({
  id,
  name: id,
  color,
  class: cls,
  manaCost: 5,
  stats: { damage: 5, attackInterval: 1, hp: 10, speed: 50 },
  colorBuff,
  classBuff,
});

const unit = (id: string, side: 'player' | 'enemy', c: Card): Unit => ({
  id,
  card: c,
  side,
  x: 0,
  y: 0,
  baseStats: { ...c.stats },
  buffs: {},
  currentHp: c.stats.hp,
  target: null,
  attackCooldown: 0,
  alive: true,
  hpThresholdFired: false,
});

const stateWith = (units: Unit[]): CombatState =>
  ({ units, auraDirty: true }) as unknown as CombatState;

describe('ComboAuraSystem', () => {
  it('zwei Natur-Units geben sich gegenseitig Color-Buff', () => {
    const a = unit('a', 'player', card('A', 'natur', 'magier', { damage: 4 }));
    const b = unit('b', 'player', card('B', 'natur', 'krieger', { damage: 6 }));
    const s = stateWith([a, b]);
    ComboAuraSystem.recompute(s);
    expect(a.buffs.damage).toBe(6); // bekommt B's Color-Buff
    expect(b.buffs.damage).toBe(4); // bekommt A's Color-Buff
  });

  it('Stacking mit N Units: Buff = Σ aller anderen', () => {
    const c = card('X', 'natur', 'krieger', { damage: 2 });
    const a = unit('a', 'player', c);
    const b = unit('b', 'player', c);
    const d = unit('d', 'player', c);
    const s = stateWith([a, b, d]);
    ComboAuraSystem.recompute(s);
    // Jede Unit bekommt 2× Color-Buff (von 2 anderen). Klassen-Buff fehlt hier (=0).
    expect(a.buffs.damage).toBe(4);
    expect(b.buffs.damage).toBe(4);
    expect(d.buffs.damage).toBe(4);
  });

  it('Self-Exclusion: einzelne Unit erhält keinen Buff', () => {
    const a = unit('a', 'player', card('A', 'natur', 'magier', { damage: 4 }, { hp: 5 }));
    const s = stateWith([a]);
    ComboAuraSystem.recompute(s);
    expect(a.buffs.damage ?? 0).toBe(0);
    expect(a.buffs.hp ?? 0).toBe(0);
  });

  it('Farblos: gibt keinen Color-Buff und bekommt keinen', () => {
    const a = unit('a', 'player', card('A', 'farblos', 'magier', { damage: 10 }));
    const b = unit('b', 'player', card('B', 'farblos', 'krieger', { damage: 10 }));
    const s = stateWith([a, b]);
    ComboAuraSystem.recompute(s);
    expect(a.buffs.damage ?? 0).toBe(0);
    expect(b.buffs.damage ?? 0).toBe(0);
  });

  it('Klassen-Combo trennt von Farbe', () => {
    const a = unit('a', 'player', card('A', 'natur', 'krieger', { hp: 2 }, { damage: 3 }));
    const b = unit('b', 'player', card('B', 'krieg', 'krieger', { hp: 2 }, { damage: 5 }));
    const s = stateWith([a, b]);
    ComboAuraSystem.recompute(s);
    expect(a.buffs.damage).toBe(5); // B's classBuff (gleiche Klasse)
    expect(b.buffs.damage).toBe(3); // A's classBuff
    expect(a.buffs.hp ?? 0).toBe(0); // unterschiedliche Farbe → kein color-Buff
  });

  it('Gegner-Units geben einander Buffs, nicht aber dem Spieler', () => {
    const enemyA = unit('a', 'enemy', card('A', 'natur', 'krieger', { damage: 4 }));
    const enemyB = unit('b', 'enemy', card('B', 'natur', 'magier', { damage: 4 }));
    const playerC = unit('c', 'player', card('C', 'natur', 'krieger', { damage: 4 }));
    const s = stateWith([enemyA, enemyB, playerC]);
    ComboAuraSystem.recompute(s);
    expect(enemyA.buffs.damage).toBe(4);
    expect(playerC.buffs.damage ?? 0).toBe(0); // Solo auf Spieler-Seite
  });
});
