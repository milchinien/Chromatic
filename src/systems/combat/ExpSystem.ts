import type { Side } from '../../domain/Side';
import { EXP_THRESHOLDS } from '../data/balance';
import { type CombatState, type SideState, logEvent } from './CombatState';

const thresholdForLevel = (level: number): number | null => {
  // Lv 1 erwartet Threshold 0 (Index 0), Lv 2 = Index 1 etc.
  const idx = level - 1;
  return idx >= 0 && idx < EXP_THRESHOLDS.length ? EXP_THRESHOLDS[idx]! : null;
};

export const ExpSystem = {
  /** Prüft beide Seiten. Bei Level-Up: state.pendingLevelUp wird gesetzt und
   *  Caller (advance.ts) pausiert den Loop. */
  check(state: CombatState): void {
    if (state.pendingLevelUp) return;
    const player = checkSide(state.player);
    if (player) {
      state.pendingLevelUp = 'player';
      logEvent(state, `🆙 Spieler erreicht Stufe ${state.player.level + 1}`);
      return;
    }
    const enemy = checkSide(state.enemy);
    if (enemy) {
      // KI wählt automatisch (siehe AiController.applyLevelUp), state.pendingLevelUp
      // bleibt 'enemy' nur einen Tick zur Anzeige.
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

export type LevelUpChoice =
  | 'manaRegen'
  | 'maxMana'
  | 'baseHp'
  | 'hpRegen'
  | 'instantHeal'
  | 'damage';

export const LEVEL_UP_CHOICES: ReadonlyArray<{
  id: LevelUpChoice;
  label: string;
  desc: string;
}> = [
  { id: 'manaRegen', label: '+2× Mana-Regen', desc: 'Doppelte Mana-Regeneration' },
  { id: 'maxMana', label: '+20 Max-Mana', desc: 'Mana-Cap auf 40' },
  { id: 'baseHp', label: '+20 Base-HP', desc: 'Max-HP & HP +20' },
  { id: 'hpRegen', label: '+1 HP-Regen', desc: 'Heilt +1 HP/Sek.' },
  { id: 'instantHeal', label: 'Sofort-Heilung', desc: '+20 HP jetzt' },
  { id: 'damage', label: '+5 Damage', desc: 'Alle Units +5 DMG' },
];

export const applyLevelUp = (state: CombatState, side: Side, choice: LevelUpChoice): void => {
  const s = side === 'player' ? state.player : state.enemy;
  s.level += 1;
  switch (choice) {
    case 'manaRegen':
      s.manaRegen *= 2;
      break;
    case 'maxMana':
      s.maxMana += 20;
      break;
    case 'baseHp':
      s.maxBaseHp += 20;
      s.baseHp += 20;
      break;
    case 'hpRegen':
      s.baseHpRegen += 1;
      break;
    case 'instantHeal':
      s.baseHp = Math.min(s.maxBaseHp, s.baseHp + 20);
      break;
    case 'damage':
      // Sofort-Anpassung + persistenter Side-Bonus für künftige Spawns.
      s.globalDamageBonus += 5;
      break;
  }
  state.pendingLevelUp = null;
  logEvent(state, `Level-Up ${side}: ${choice}`);
};

export const applyHpRegen = (state: CombatState, dt: number): void => {
  for (const side of [state.player, state.enemy]) {
    if (side.baseHpRegen > 0 && side.baseHp < side.maxBaseHp) {
      side.baseHp = Math.min(side.maxBaseHp, side.baseHp + side.baseHpRegen * dt);
    }
  }
};
