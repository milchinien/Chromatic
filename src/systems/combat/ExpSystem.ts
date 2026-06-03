import type { Side } from '../../domain/Side';
import type { Rng } from '../rng';
import { EXP_THRESHOLDS } from '../data/balance';
import { type CombatState, type SideState, logEvent } from './CombatState';

const thresholdForLevel = (level: number): number | null => {
  const idx = level - 1;
  return idx >= 0 && idx < EXP_THRESHOLDS.length ? EXP_THRESHOLDS[idx]! : null;
};

export const ExpSystem = {
  /** Prüft beide Seiten. Bei Level-Up: state.pendingLevelUp wird gesetzt und
   *  Caller (advance.ts) pausiert den Loop bzw. lässt die KI selbst wählen. */
  check(state: CombatState): void {
    if (state.pendingLevelUp) return;
    if (checkSide(state.player)) {
      state.pendingLevelUp = 'player';
      logEvent(state, `🆙 Spieler erreicht Stufe ${state.player.level + 1}`);
      return;
    }
    if (checkSide(state.enemy)) {
      state.pendingLevelUp = 'enemy';
      logEvent(state, `🆙 Gegner erreicht Stufe ${state.enemy.level + 1}`);
    }
  },
};

const checkSide = (side: SideState): boolean => {
  const next = thresholdForLevel(side.level);
  if (next === null) return false;
  return side.exp >= next;
};

// =====================================================================
// LEVEL-UP-VORTEILE mit RARITÄT
// Beim Level-Up werden 3 Vorteile aus einem Pool gerollt; jeder hat eine
// Rarität (höher = stärker). Spieler wählt 1; KI nimmt den stärksten.
// =====================================================================

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const RARITY_ORDER: readonly Rarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Gewöhnlich',
  uncommon: 'Ungewöhnlich',
  rare: 'Selten',
  epic: 'Episch',
  legendary: 'Legendär',
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#b9b2a4',
  uncommon: '#5fbf6a',
  rare: '#5aa9e6',
  epic: '#b06ee6',
  legendary: '#e6a93a',
};

// Auswahl-Gewichte (Summe 100). Selteneres ist unwahrscheinlicher.
const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  uncommon: 27,
  rare: 14,
  epic: 7,
  legendary: 2,
};

// Pro Rarität ein Stufen-Index 0..4 für die Magnitude-Tabellen der Vorteile.
const rarityTier = (r: Rarity): number => RARITY_ORDER.indexOf(r);

interface AdvantageType {
  id: string;
  label: string;
  /** Magnitude je Rarität (Index = Tier). */
  values: readonly number[];
  desc: (v: number) => string;
  apply: (side: SideState, v: number) => void;
}

const ADVANTAGE_TYPES: readonly AdvantageType[] = [
  {
    id: 'damage',
    label: '+Damage',
    values: [2, 4, 7, 10, 16],
    desc: (v) => `Alle befreundeten Units +${v} Damage.`,
    apply: (s, v) => {
      s.globalDamageBonus += v;
    },
  },
  {
    id: 'troops',
    label: '+Truppen',
    values: [2, 4, 6, 8, 12],
    desc: (v) => `+${v} Truppen pro gespielter Karte.`,
    apply: (s, v) => {
      s.troopBonus += v;
    },
  },
  {
    id: 'baseHp',
    label: '+Max Base-HP',
    values: [10, 20, 35, 50, 80],
    desc: (v) => `Max Base-HP +${v} (heilt auch um ${v}).`,
    apply: (s, v) => {
      s.maxBaseHp += v;
      s.baseHp += v;
    },
  },
  {
    id: 'heal',
    label: 'Sofort-Heilung',
    values: [15, 30, 52, 75, 120],
    desc: (v) => `Sofort +${v} Base-HP.`,
    apply: (s, v) => {
      s.baseHp = Math.min(s.maxBaseHp, s.baseHp + v);
    },
  },
  {
    id: 'hpRegen',
    label: '+HP-Regen',
    values: [1, 1, 2, 3, 5],
    desc: (v) => `Base heilt +${v} HP/Sek.`,
    apply: (s, v) => {
      s.baseHpRegen += v;
    },
  },
];

export interface RolledAdvantage {
  typeId: string;
  label: string;
  desc: string;
  rarity: Rarity;
  value: number;
}

const rollRarity = (rng: Rng): Rarity => {
  let pick = rng() * 100;
  for (const r of RARITY_ORDER) {
    pick -= RARITY_WEIGHTS[r];
    if (pick <= 0) return r;
  }
  return 'common';
};

const toRolled = (t: AdvantageType, rarity: Rarity): RolledAdvantage => {
  const value = t.values[rarityTier(rarity)] ?? t.values[0]!;
  return { typeId: t.id, label: t.label, desc: t.desc(value), rarity, value };
};

/** 3 distinkte Vorteils-Typen rollen, jeder mit eigener (gewichteter) Rarität. */
export const rollAdvantages = (rng: Rng, count = 3): RolledAdvantage[] => {
  const pool = [...ADVANTAGE_TYPES];
  // Fisher-Yates Teil-Shuffle für distinkte Typen.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, count).map((t) => toRolled(t, rollRarity(rng)));
};

/** Gewählten Vorteil anwenden: Stufe hoch, Effekt anwenden, Pending lösen. */
export const applyAdvantage = (state: CombatState, side: Side, adv: RolledAdvantage): void => {
  const s = side === 'player' ? state.player : state.enemy;
  const t = ADVANTAGE_TYPES.find((x) => x.id === adv.typeId);
  if (t) t.apply(s, adv.value);
  s.level += 1;
  state.pendingLevelUp = null;
  logEvent(state, `Level-Up ${side}: ${RARITY_LABEL[adv.rarity]} ${adv.label} (+${adv.value})`);
};

export const applyHpRegen = (state: CombatState, dt: number): void => {
  for (const side of [state.player, state.enemy]) {
    if (side.baseHpRegen > 0 && side.baseHp < side.maxBaseHp) {
      side.baseHp = Math.min(side.maxBaseHp, side.baseHp + side.baseHpRegen * dt);
    }
  }
};
