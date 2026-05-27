import type { Perk } from '../../domain/Run';
import type { RunState } from '../../domain/Run';
import type { SideState } from '../combat/CombatState';

// Reine Daten-Definition für die 6 MVP-Perks aus GAME_DESIGN Sektion 4.2.
// Die `apply`-Funktion lebt hier (nicht im Perk-Interface), weil Function-Pointer
// schlecht in `domain/`-Typen passen (Phaser-frei, ggf. Serialisierung später).

export type PerkApply = (sideState: SideState, runState: RunState) => void;

interface PerkDef extends Perk {
  readonly apply: PerkApply;
}

export const PERKS: readonly PerkDef[] = [
  {
    id: 'mana_regen_x2',
    name: 'Adern der Welt',
    description: 'Mana regeneriert doppelt so schnell.',
    glyph: '⟳',
    color: 'var(--mana)',
    apply: (side) => {
      side.manaRegen *= 2;
    },
  },
  {
    id: 'max_mana_plus_20',
    name: 'Quell des Geistes',
    description: 'Maximales Mana um 20 erhöht.',
    glyph: '◉',
    color: 'var(--mana)',
    apply: (side) => {
      side.maxMana += 20;
      side.mana = Math.min(side.maxMana, side.mana + 20);
    },
  },
  {
    id: 'base_hp_plus_20',
    name: 'Eiserne Bindung',
    description: 'Basis-HP um 20 erhöht — heilt auch um 20.',
    glyph: '♥',
    color: 'var(--c-natur)',
    apply: (side, run) => {
      side.maxBaseHp += 20;
      side.baseHp += 20;
      run.maxBaseHp += 20;
      run.baseHp += 20;
    },
  },
  {
    id: 'hp_regen_plus_1',
    name: 'Stetige Heilung',
    description: 'Base-HP regeneriert +1 pro Sekunde.',
    glyph: '✚',
    color: 'var(--c-natur)',
    apply: (side) => {
      side.baseHpRegen += 1;
    },
  },
  {
    id: 'damage_plus_5',
    name: 'Geschärfte Klingen',
    description: 'Alle befreundeten Units +5 Damage.',
    glyph: '⚔',
    color: 'var(--c-krieg)',
    apply: (side) => {
      side.globalDamageBonus += 5;
    },
  },
  {
    id: 'extra_hand_card',
    name: 'Vier-Karten-Hand',
    description: '+1 Karte in der Hand.',
    glyph: '✦',
    color: 'var(--gold-hi)',
    apply: (side) => {
      side.handSize += 1;
    },
  },
];

export const perkById = (id: string): PerkDef => {
  const p = PERKS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown perk id: ${id}`);
  return p;
};

export const applyPerk = (perk: Perk, side: SideState, run: RunState): void => {
  const def = perkById(perk.id);
  def.apply(side, run);
};
