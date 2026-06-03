import { describe, it, expect } from 'vitest';
import {
  PERKS,
  applyPerkOnChoose,
  applyPerkOnCombatMount,
  perkById,
} from '../src/systems/data/perks';
import type { SideState } from '../src/systems/combat/CombatState';
import type { Perk, RunState } from '../src/domain/Run';

const makeSide = (): SideState => ({
  baseHp: 100,
  maxBaseHp: 100,
  mana: 20,
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
});

const makeRun = (): RunState =>
  ({
    seed: 1,
    actNumber: 1,
    actColor: 'natur',
    coins: 550,
    deck: [],
    cardLevels: {},
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

const dataPerk = (id: string): Perk => {
  const p = perkById(id);
  return { id: p.id, name: p.name, description: p.description, glyph: p.glyph, color: p.color };
};

describe('Perks — onCombatMount (jedes Combat)', () => {
  it('mana_regen_x2 (umgewidmet) erhöht troopBonus um 2', () => {
    const s = makeSide();
    applyPerkOnCombatMount(dataPerk('mana_regen_x2'), s);
    expect(s.troopBonus).toBe(2);
  });

  it('max_mana_plus_20 (umgewidmet) erhöht baseHpRegen um 1', () => {
    const s = makeSide();
    applyPerkOnCombatMount(dataPerk('max_mana_plus_20'), s);
    expect(s.baseHpRegen).toBe(1);
  });

  it('hp_regen_plus_1 erhöht baseHpRegen um 1', () => {
    const s = makeSide();
    applyPerkOnCombatMount(dataPerk('hp_regen_plus_1'), s);
    expect(s.baseHpRegen).toBe(1);
  });

  it('damage_plus_5 erhöht globalDamageBonus um 5', () => {
    const s = makeSide();
    applyPerkOnCombatMount(dataPerk('damage_plus_5'), s);
    expect(s.globalDamageBonus).toBe(5);
  });

  it('extra_hand_card (umgewidmet) erhöht globalDamageBonus um 3', () => {
    const s = makeSide();
    applyPerkOnCombatMount(dataPerk('extra_hand_card'), s);
    expect(s.globalDamageBonus).toBe(3);
  });

  it('base_hp_plus_20 hat KEINEN onCombatMount — SideState unverändert', () => {
    const s = makeSide();
    applyPerkOnCombatMount(dataPerk('base_hp_plus_20'), s);
    expect(s.maxBaseHp).toBe(100);
    expect(s.baseHp).toBe(100);
  });
});

describe('Perks — onChoose (einmalig bei Auswahl)', () => {
  it('base_hp_plus_20 erhöht Run-State um 20 (max + aktuell)', () => {
    const r = makeRun();
    applyPerkOnChoose(dataPerk('base_hp_plus_20'), r);
    expect(r.maxBaseHp).toBe(120);
    expect(r.baseHp).toBe(120);
  });

  it('base_hp_plus_20 cappt baseHp bei maxBaseHp', () => {
    const r = makeRun();
    r.baseHp = 95;
    applyPerkOnChoose(dataPerk('base_hp_plus_20'), r);
    expect(r.maxBaseHp).toBe(120);
    expect(r.baseHp).toBe(115);
  });

  it('Perks ohne onChoose lassen Run-State unverändert', () => {
    for (const id of ['mana_regen_x2', 'max_mana_plus_20', 'hp_regen_plus_1', 'damage_plus_5', 'extra_hand_card']) {
      const r = makeRun();
      const before = JSON.stringify({ baseHp: r.baseHp, maxBaseHp: r.maxBaseHp, coins: r.coins });
      applyPerkOnChoose(dataPerk(id), r);
      const after = JSON.stringify({ baseHp: r.baseHp, maxBaseHp: r.maxBaseHp, coins: r.coins });
      expect(after, `Perk ${id} sollte run nicht ändern`).toBe(before);
    }
  });
});

describe('Perks — Stacking (re-apply auf jedem Combat)', () => {
  it('max_mana_plus_20 zweimal → baseHpRegen +2 (frischer Side je Combat)', () => {
    const s1 = makeSide();
    applyPerkOnCombatMount(dataPerk('max_mana_plus_20'), s1);
    applyPerkOnCombatMount(dataPerk('max_mana_plus_20'), s1);
    expect(s1.baseHpRegen).toBe(2);
  });

  it('base_hp_plus_20 onChoose zweimal → run.maxBaseHp +40 (gewollt)', () => {
    const r = makeRun();
    applyPerkOnChoose(dataPerk('base_hp_plus_20'), r);
    applyPerkOnChoose(dataPerk('base_hp_plus_20'), r);
    expect(r.maxBaseHp).toBe(140);
  });

  it('REGRESSION: base_hp_plus_20 onCombatMount mehrfach → Run-State unverändert', () => {
    const r = makeRun();
    applyPerkOnChoose(dataPerk('base_hp_plus_20'), r);
    const beforeRun = JSON.stringify({ baseHp: r.baseHp, maxBaseHp: r.maxBaseHp });
    for (let i = 0; i < 5; i++) {
      const s = makeSide();
      applyPerkOnCombatMount(dataPerk('base_hp_plus_20'), s);
    }
    const afterRun = JSON.stringify({ baseHp: r.baseHp, maxBaseHp: r.maxBaseHp });
    expect(afterRun).toBe(beforeRun);
  });
});

describe('Perks — Inventar', () => {
  it('Genau 6 Perks definiert', () => {
    expect(PERKS.length).toBe(6);
  });

  it('Jeder Perk hat mindestens onChoose ODER onCombatMount', () => {
    for (const p of PERKS) {
      const hasHook = p.onChoose !== undefined || p.onCombatMount !== undefined;
      expect(hasHook, `Perk ${p.id} hat keinen Hook`).toBe(true);
    }
  });
});
