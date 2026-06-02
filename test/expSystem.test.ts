import { describe, it, expect } from 'vitest';
import { ExpSystem, applyLevelUp } from '../src/systems/combat/ExpSystem';
import { createCombatState } from '../src/systems/combat/CombatState';
import { mulberry32 } from '../src/systems/rng';

describe('ExpSystem', () => {
  it('setzt pendingLevelUp wenn Spieler-EXP die Schwelle übersteigt', () => {
    const s = createCombatState([], [], mulberry32(0));
    s.player.exp = 10; // erste Schwelle
    ExpSystem.check(s);
    expect(s.pendingLevelUp).toBe('player');
  });

  it('priorisiert Spieler vor Gegner bei gleichzeitigem Level-Up', () => {
    const s = createCombatState([], [], mulberry32(0));
    s.player.exp = 10;
    s.enemy.exp = 10;
    ExpSystem.check(s);
    expect(s.pendingLevelUp).toBe('player');
  });

  it('applyLevelUp erhöht Level und konsumiert pendingLevelUp', () => {
    const s = createCombatState([], [], mulberry32(0));
    s.player.exp = 10;
    ExpSystem.check(s);
    applyLevelUp(s, 'player', 'maxMana');
    expect(s.player.level).toBe(2);
    expect(s.player.maxMana).toBe(40);
    expect(s.pendingLevelUp).toBeNull();
  });

  it('damage-Choice setzt globalDamageBonus +5 (gilt für alle befreundeten Units)', () => {
    const s = createCombatState([], [], mulberry32(0));
    s.units.push({
      id: 'u1',
      card: {} as never,
      side: 'player',
      x: 0,
      y: 0,
      baseStats: { damage: 5, attackInterval: 1, hp: 10, speed: 50 },
      buffs: {},
      currentHp: 10,
      target: null,
      attackCooldown: 0,
      alive: true,
      hpThresholdFired: false,
      spawnAge: 0,
      deathAge: null,
      laneY: 0,
    });
    s.player.exp = 10;
    ExpSystem.check(s);
    applyLevelUp(s, 'player', 'damage');
    expect(s.player.globalDamageBonus).toBe(5);
    // baseStats unverändert — der Bonus wird im UnitSystem.tick beim Angriff addiert.
    expect(s.units[0]!.baseStats.damage).toBe(5);
  });
});
