import { describe, it, expect, beforeEach } from 'vitest';
import { ManaSystem } from '../src/systems/combat/ManaSystem';
import type { SideState } from '../src/systems/combat/CombatState';
import type { Card } from '../src/domain/Card';

const makeSide = (overrides: Partial<SideState> = {}): SideState => ({
  baseHp: 100,
  maxBaseHp: 100,
  mana: 10,
  maxMana: 20,
  manaRegen: 1,
  deck: [],
  drawOptions: [],
  pickedIdx: [],
  picked: [],
  selectedIdx: [],
  exp: 0,
  level: 1,
  baseHpRegen: 0,
  globalDamageBonus: 0,
  troopBonus: 0,
  comboBuff: {},
  ...overrides,
});

const card = (manaCost: number): Card =>
  ({
    id: 't',
    name: 'T',
    color: 'natur',
    class: 'krieger',
    manaCost,
    stats: { damage: 1, attackInterval: 1, hp: 1, speed: 1 },
    colorBuff: {},
    classBuff: {},
  }) as Card;

describe('ManaSystem', () => {
  let s: SideState;
  beforeEach(() => {
    s = makeSide();
  });

  it('regeneriert Mana proportional zu dt', () => {
    ManaSystem.tick(s, 1);
    expect(s.mana).toBe(11);
    ManaSystem.tick(s, 0.5);
    expect(s.mana).toBe(11.5);
  });

  it('cappt bei maxMana', () => {
    s.mana = 19;
    ManaSystem.tick(s, 5);
    expect(s.mana).toBe(20);
  });

  it('canAfford prüft Schwelle', () => {
    s.mana = 5;
    expect(ManaSystem.canAfford(s, card(5))).toBe(true);
    expect(ManaSystem.canAfford(s, card(6))).toBe(false);
  });

  it('spend zieht ab und gibt false zurück bei zu wenig Mana', () => {
    s.mana = 5;
    expect(ManaSystem.spend(s, card(3))).toBe(true);
    expect(s.mana).toBe(2);
    expect(ManaSystem.spend(s, card(3))).toBe(false);
    expect(s.mana).toBe(2);
  });
});
