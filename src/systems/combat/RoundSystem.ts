import type { Side } from '../../domain/Side';
import type { DeckEntry } from '../../domain/Run';
import type { Rng } from '../rng';
import {
  DRAW_OPTIONS,
  ENEMY_BASE_X,
  PICK_COUNT,
  PLAY_COUNT,
  PLAYER_BASE_X,
  ROUND_BANNER_SEC,
  STACK_UNIT_RADIUS,
  leveledStats,
  rollTroopCount,
} from '../data/balance';
import {
  type CombatState,
  type DrawnCard,
  type SideState,
  getSide,
  logEvent,
} from './CombatState';
import { UnitSystem } from './UnitSystem';

const drawEntries = (deck: DeckEntry[], n: number, rng: Rng): DeckEntry[] => {
  if (deck.length === 0) return [];
  return Array.from({ length: n }, () => deck[Math.floor(rng() * deck.length)]!);
};

const rollDrawn = (entry: DeckEntry, rng: Rng, bonus = 0): DrawnCard => ({
  card: entry.card,
  level: entry.level,
  troops: rollTroopCount(entry.card.manaCost, entry.level, rng) + bonus,
});

/** Combo wenn zwei Karten Farbe (nicht farblos) ODER Klasse teilen. */
const sharesCombo = (a: DrawnCard, b: DrawnCard): boolean =>
  (a.card.color !== 'farblos' && a.card.color === b.card.color) ||
  a.card.class === b.card.class;

/** Gegner wählt 2 der 3 — bevorzugt ein Combo-Paar, sonst die zwei truppenstärksten. */
const enemySelect = (picked: DrawnCard[]): number[] => {
  for (let i = 0; i < picked.length; i++) {
    for (let j = i + 1; j < picked.length; j++) {
      if (sharesCombo(picked[i]!, picked[j]!)) return [i, j];
    }
  }
  const byTroops = picked
    .map((d, idx) => ({ idx, troops: d.troops }))
    .sort((a, b) => b.troops - a.troops);
  return byTroops.slice(0, PLAY_COUNT).map((x) => x.idx);
};

export const RoundSystem = {
  /** Banner-Phase abgelaufen → neue Runde aufsetzen (Spieler 5 verdeckt,
   *  Gegner zieht direkt 3 und wählt 2). */
  startDraw(state: CombatState): void {
    const p = state.player;
    p.drawOptions = drawEntries(p.deck, DRAW_OPTIONS, state.rng);
    p.pickedIdx = [];
    p.picked = [];
    p.selectedIdx = [];

    const e = state.enemy;
    e.drawOptions = [];
    e.pickedIdx = [];
    e.picked = drawEntries(e.deck, PICK_COUNT, state.rng).map((entry) =>
      rollDrawn(entry, state.rng, e.troopBonus),
    );
    e.selectedIdx = enemySelect(e.picked);

    state.roundPhase = 'draw';
    logEvent(state, `Runde ${state.roundNumber}: ziehen`);
  },

  /** Spieler pickt/entpickt eine verdeckte Option (blind). Max PICK_COUNT. */
  togglePick(state: CombatState, optionIdx: number): void {
    if (state.roundPhase !== 'draw') return;
    const p = state.player;
    if (optionIdx < 0 || optionIdx >= p.drawOptions.length) return;
    const at = p.pickedIdx.indexOf(optionIdx);
    if (at >= 0) p.pickedIdx.splice(at, 1);
    else if (p.pickedIdx.length < PICK_COUNT) p.pickedIdx.push(optionIdx);
    if (p.pickedIdx.length === PICK_COUNT) RoundSystem.reveal(state);
  },

  /** Die 3 gepickten verdeckten Karten aufdecken (Truppen rollen) → select. */
  reveal(state: CombatState): void {
    const p = state.player;
    p.picked = p.pickedIdx.map((i) => rollDrawn(p.drawOptions[i]!, state.rng, p.troopBonus));
    p.drawOptions = [];
    p.pickedIdx = [];
    p.selectedIdx = [];
    state.roundPhase = 'select';
  },

  /** Spieler wählt/abwählt eine der 3 Karten zum Spielen. Max PLAY_COUNT. */
  toggleSelect(state: CombatState, pickIdx: number): void {
    if (state.roundPhase !== 'select') return;
    const p = state.player;
    if (pickIdx < 0 || pickIdx >= p.picked.length) return;
    const at = p.selectedIdx.indexOf(pickIdx);
    if (at >= 0) p.selectedIdx.splice(at, 1);
    else if (p.selectedIdx.length < PLAY_COUNT) p.selectedIdx.push(pickIdx);
  },

  canConfirm(state: CombatState): boolean {
    return state.roundPhase === 'select' && state.player.selectedIdx.length === PLAY_COUNT;
  },

  /** Beide Seiten deployen ihre 2 Karten → Echtzeit-Gefecht beginnt. */
  confirmSelection(state: CombatState): void {
    if (!RoundSystem.canConfirm(state)) return;
    spawnSelected(state, 'player');
    spawnSelected(state, 'enemy');
    state.resolveTimer = 0;
    state.roundPhase = 'resolve';
    logEvent(state, `Runde ${state.roundNumber}: Gefecht!`);
  },

  /** Runde vorbei: Feld komplett leeren, Zähler hoch, Banner für nächste Runde. */
  endRound(state: CombatState): void {
    state.units = [];
    state.auraDirty = true;
    state.roundNumber += 1;
    state.bannerTimer = ROUND_BANNER_SEC;
    state.player.picked = [];
    state.player.selectedIdx = [];
    state.enemy.picked = [];
    state.enemy.selectedIdx = [];
    state.roundPhase = 'banner';
  },
};

const spawnSelected = (state: CombatState, side: Side): void => {
  const s: SideState = getSide(state, side);
  for (const idx of s.selectedIdx) {
    const d = s.picked[idx];
    if (!d) continue;
    const stats = leveledStats(d.card.stats, d.level);
    for (let i = 0; i < d.troops; i++) {
      // Truppen-Stack hinter der eigenen Base breit verteilen, kleinerer Radius.
      const bandX =
        side === 'player'
          ? PLAYER_BASE_X + STACK_UNIT_RADIUS + state.rng() * 70
          : ENEMY_BASE_X - STACK_UNIT_RADIUS - state.rng() * 70;
      UnitSystem.spawn(state, d.card, side, bandX, undefined, stats);
    }
    logEvent(state, `${side === 'player' ? '⊕' : '⊖'} ${d.card.name} ×${d.troops}`);
  }
};
