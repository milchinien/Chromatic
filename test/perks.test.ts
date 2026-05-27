import { describe, it, expect } from 'vitest';
import { PERKS, perkById } from '../src/systems/data/perks';
import type { SideState } from '../src/systems/combat/CombatState';
import type { RunState } from '../src/domain/Run';

const makeSide = (): SideState => ({
  baseHp: 100,
  maxBaseHp: 100,
  mana: 20,
  maxMana: 20,
  manaRegen: 1,
  hand: [],
  handSize: 3,
  drawIntervalSec: 4,
  drawTimer: 0,
  deck: [],
  exp: 0,
  level: 1,
  aiDecisionCooldown: 0,
  baseHpRegen: 0,
  globalDamageBonus: 0,
});

const makeRun = (): RunState =>
  ({
    seed: 1,
    actNumber: 1,
    coins: 550,
    deck: [],
    activePerks: [],
    map: { nodes: [], startNodeId: '', bossNodeId: '' },
    currentNodeId: '',
    visitedNodes: new Set(),
    baseHp: 100,
    maxBaseHp: 100,
    roomMaps: new Map(),
    activeWorldNodeId: null,
    currentRoomNodeId: null,
    visitedRoomNodes: new Map(),
  }) as unknown as RunState;

describe('Perks', () => {
  it('mana_regen_x2 verdoppelt manaRegen', () => {
    const s = makeSide();
    perkById('mana_regen_x2').apply(s, makeRun());
    expect(s.manaRegen).toBe(2);
  });

  it('max_mana_plus_20 erhöht maxMana + füllt 20 mana auf', () => {
    const s = makeSide();
    s.mana = 10;
    perkById('max_mana_plus_20').apply(s, makeRun());
    expect(s.maxMana).toBe(40);
    expect(s.mana).toBe(30);
  });

  it('base_hp_plus_20 erhöht max+aktuelle HP auf Side UND Run', () => {
    const s = makeSide();
    const r = makeRun();
    perkById('base_hp_plus_20').apply(s, r);
    expect(s.maxBaseHp).toBe(120);
    expect(s.baseHp).toBe(120);
    expect(r.maxBaseHp).toBe(120);
    expect(r.baseHp).toBe(120);
  });

  it('hp_regen_plus_1 erhöht baseHpRegen um 1', () => {
    const s = makeSide();
    perkById('hp_regen_plus_1').apply(s, makeRun());
    expect(s.baseHpRegen).toBe(1);
  });

  it('damage_plus_5 erhöht globalDamageBonus um 5', () => {
    const s = makeSide();
    perkById('damage_plus_5').apply(s, makeRun());
    expect(s.globalDamageBonus).toBe(5);
  });

  it('extra_hand_card erhöht handSize um 1', () => {
    const s = makeSide();
    perkById('extra_hand_card').apply(s, makeRun());
    expect(s.handSize).toBe(4);
  });

  it('Stacking: zweimaliges max_mana_plus_20 ergibt +40', () => {
    const s = makeSide();
    const r = makeRun();
    perkById('max_mana_plus_20').apply(s, r);
    perkById('max_mana_plus_20').apply(s, r);
    expect(s.maxMana).toBe(60);
  });

  it('Alle 6 Perks haben einen messbaren Effekt', () => {
    expect(PERKS.length).toBe(6);
    for (const perk of PERKS) {
      const s = makeSide();
      const r = makeRun();
      const before = JSON.stringify({ s, r: { baseHp: r.baseHp, maxBaseHp: r.maxBaseHp } });
      perk.apply(s, r);
      const after = JSON.stringify({ s, r: { baseHp: r.baseHp, maxBaseHp: r.maxBaseHp } });
      expect(before, `Perk ${perk.id} hat keinen Effekt`).not.toBe(after);
    }
  });
});
