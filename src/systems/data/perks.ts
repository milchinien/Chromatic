import type { Perk } from '../../domain/Run';
import type { RunState } from '../../domain/Run';
import type { SideState } from '../combat/CombatState';

// Reine Daten-Definition für die 6 MVP-Perks aus GAME_DESIGN Sektion 4.2.
//
// Zwei Hooks pro Perk, um Double-Apply-Bug zu vermeiden:
//  - onChoose(run): einmalig im PerkSelect-Screen, modifiziert RunState
//    permanent. Idempotent darf NICHT sein — wird genau einmal aufgerufen.
//  - onCombatMount(side): jedes Mal beim Combat-Mount aufgerufen, modifiziert
//    den frischen SideState (der eh bei jedem Mount neu erstellt wird).
//
// Trennung verhindert, dass Felder wie run.maxBaseHp bei jedem Combat erneut
// um +20 wachsen — das wäre ein klassischer "Buff stacks ad infinitum"-Bug.

export type OnChoose = (run: RunState) => void;
export type OnCombatMount = (side: SideState) => void;

interface PerkDef extends Perk {
  readonly onChoose?: OnChoose;
  readonly onCombatMount?: OnCombatMount;
}

export const PERKS: readonly PerkDef[] = [
  {
    id: 'mana_regen_x2',
    name: 'Lebende Legion',
    description: '+2 Truppen pro gespielter Karte.',
    glyph: '⟳',
    color: 'var(--c-natur)',
    onCombatMount: (side) => {
      // Mana ist inert — Perk auf Truppen umgewidmet.
      side.troopBonus += 2;
    },
  },
  {
    id: 'max_mana_plus_20',
    name: 'Quell des Geistes',
    description: 'Base regeneriert +1 HP/Sek.',
    glyph: '◉',
    color: 'var(--c-natur)',
    onCombatMount: (side) => {
      side.baseHpRegen += 1;
    },
  },
  {
    id: 'base_hp_plus_20',
    name: 'Eiserne Bindung',
    description: 'Basis-HP um 20 erhöht — heilt auch um 20.',
    glyph: '♥',
    color: 'var(--c-natur)',
    onChoose: (run) => {
      // Permanent: Run-State-Maximum + aktuelle HP.
      run.maxBaseHp += 20;
      run.baseHp = Math.min(run.maxBaseHp, run.baseHp + 20);
    },
    // Kein onCombatMount — Combat liest beim Mount run.maxBaseHp/baseHp und
    // sieht den Buff bereits dort. Side wird daraus initialisiert.
  },
  {
    id: 'hp_regen_plus_1',
    name: 'Stetige Heilung',
    description: 'Base-HP regeneriert +1 pro Sekunde.',
    glyph: '✚',
    color: 'var(--c-natur)',
    onCombatMount: (side) => {
      side.baseHpRegen += 1;
    },
  },
  {
    id: 'damage_plus_5',
    name: 'Geschärfte Klingen',
    description: 'Alle befreundeten Units +5 Damage.',
    glyph: '⚔',
    color: 'var(--c-krieg)',
    onCombatMount: (side) => {
      side.globalDamageBonus += 5;
    },
  },
  {
    id: 'extra_hand_card',
    name: 'Geschulte Hand',
    description: 'Alle befreundeten Units +3 Damage.',
    glyph: '✦',
    color: 'var(--gold-hi)',
    // Hand-Größe ist im Runden-Modell fix (5→3→2). Perk umgewidmet auf Damage,
    // bis das endgültige Perk-Rework (Schritt 7) greift.
    onCombatMount: (side) => {
      side.globalDamageBonus += 3;
    },
  },
];

export const perkById = (id: string): PerkDef => {
  const p = PERKS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown perk id: ${id}`);
  return p;
};

/** Beim Wählen eines Perks (PerkSelect-Confirm) aufgerufen — modifiziert
 *  RunState permanent. Wird genau einmal pro Wahl ausgeführt. */
export const applyPerkOnChoose = (perk: Perk, run: RunState): void => {
  perkById(perk.id).onChoose?.(run);
};

/** Beim Combat-Mount aufgerufen — modifiziert den frischen SideState. */
export const applyPerkOnCombatMount = (perk: Perk, side: SideState): void => {
  perkById(perk.id).onCombatMount?.(side);
};
