import { describe, it, expect } from 'vitest';
import {
  ExpSystem,
  applyAdvantage,
  rollAdvantages,
  RARITY_ORDER,
  type RolledAdvantage,
} from '../src/systems/combat/ExpSystem';
import { createCombatState } from '../src/systems/combat/CombatState';
import { mulberry32 } from '../src/systems/rng';

describe('ExpSystem', () => {
  it('setzt pendingLevelUp wenn Spieler-EXP die Schwelle übersteigt', () => {
    const s = createCombatState([], [], mulberry32(0));
    s.player.exp = 10;
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

  it('rollAdvantages liefert 3 distinkte Typen mit gültiger Rarität', () => {
    const rolled = rollAdvantages(mulberry32(5));
    expect(rolled.length).toBe(3);
    const types = new Set(rolled.map((a) => a.typeId));
    expect(types.size).toBe(3);
    for (const a of rolled) expect(RARITY_ORDER).toContain(a.rarity);
  });

  it('applyAdvantage erhöht Level, konsumiert pending und wendet den Effekt an', () => {
    const s = createCombatState([], [], mulberry32(0));
    s.player.exp = 10;
    ExpSystem.check(s);
    const adv: RolledAdvantage = {
      typeId: 'damage',
      label: '+Damage',
      desc: '',
      rarity: 'common',
      value: 5,
    };
    applyAdvantage(s, 'player', adv);
    expect(s.player.level).toBe(2);
    expect(s.player.globalDamageBonus).toBe(5);
    expect(s.pendingLevelUp).toBeNull();
  });

  it('Truppen-Vorteil erhöht troopBonus', () => {
    const s = createCombatState([], [], mulberry32(0));
    const adv: RolledAdvantage = {
      typeId: 'troops',
      label: '+Truppen',
      desc: '',
      rarity: 'rare',
      value: 6,
    };
    applyAdvantage(s, 'player', adv);
    expect(s.player.troopBonus).toBe(6);
  });
});
