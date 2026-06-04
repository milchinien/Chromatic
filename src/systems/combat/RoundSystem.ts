import type { Side } from '../../domain/Side';
import type { DeckEntry } from '../../domain/Run';
import type { UnitStats } from '../../domain/Card';
import type { Rng } from '../rng';
import {
  BACK_LINE_OFFSET,
  CLASS_ARMY_BONUS,
  COLOR_ARMY_BONUS,
  DRAW_OPTIONS,
  ENEMY_BASE_X,
  FRONT_LINE_OFFSET,
  LINE_SPAWN_SPREAD,
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

const STAT_KEYS: readonly (keyof UnitStats)[] = ['damage', 'attackInterval', 'hp', 'speed'];
const addPartial = (target: Partial<UnitStats>, src: Partial<UnitStats>): void => {
  for (const k of STAT_KEYS) {
    const v = src[k];
    if (v !== undefined) target[k] = (target[k] ?? 0) + v;
  }
};

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

/**
 * Armee-weiter Combo-Bonus (Poker-Warlords-Stil): teilen die 2 gespielten Karten
 * Farbe → COLOR_ARMY_BONUS, Klasse → CLASS_ARMY_BONUS. Beides möglich.
 */
export const computeCombo = (picked: DrawnCard[], selectedIdx: number[]): Partial<UnitStats> => {
  const a = picked[selectedIdx[0]!];
  const b = picked[selectedIdx[1]!];
  const buff: Partial<UnitStats> = {};
  if (!a || !b) return buff;
  if (a.card.color !== 'farblos' && a.card.color === b.card.color) {
    addPartial(buff, COLOR_ARMY_BONUS[a.card.color]);
  }
  if (a.card.class === b.card.class) {
    addPartial(buff, CLASS_ARMY_BONUS[a.card.class]);
  }
  return buff;
};

/** Gegner wählt 2 der 3 (bevorzugt Combo-Paar) und ordnet sie Front/Hinten zu
 *  (tankigere Karte = Front). Rückgabe: [frontIdx, backIdx]. */
const enemySelect = (picked: DrawnCard[]): number[] => {
  let pair: number[] | null = null;
  for (let i = 0; i < picked.length && !pair; i++) {
    for (let j = i + 1; j < picked.length; j++) {
      if (sharesCombo(picked[i]!, picked[j]!)) {
        pair = [i, j];
        break;
      }
    }
  }
  if (!pair) {
    pair = picked
      .map((d, idx) => ({ idx, troops: d.troops }))
      .sort((a, b) => b.troops - a.troops)
      .slice(0, PLAY_COUNT)
      .map((x) => x.idx);
  }
  // Front = höhere Basis-HP (tankiger).
  return pair.sort((x, y) => picked[y]!.card.stats.hp - picked[x]!.card.stats.hp);
};

const lineSpawnX = (side: Side, front: boolean, rng: Rng): number => {
  const offset = front ? FRONT_LINE_OFFSET : BACK_LINE_OFFSET;
  const spread = rng() * LINE_SPAWN_SPREAD;
  return side === 'player'
    ? PLAYER_BASE_X + STACK_UNIT_RADIUS + offset + spread
    : ENEMY_BASE_X - STACK_UNIT_RADIUS - offset - spread;
};

export const RoundSystem = {
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

  togglePick(state: CombatState, optionIdx: number): void {
    if (state.roundPhase !== 'draw') return;
    const p = state.player;
    if (optionIdx < 0 || optionIdx >= p.drawOptions.length) return;
    const at = p.pickedIdx.indexOf(optionIdx);
    if (at >= 0) p.pickedIdx.splice(at, 1);
    else if (p.pickedIdx.length < PICK_COUNT) p.pickedIdx.push(optionIdx);
    if (p.pickedIdx.length === PICK_COUNT) RoundSystem.reveal(state);
  },

  reveal(state: CombatState): void {
    const p = state.player;
    p.picked = p.pickedIdx.map((i) => rollDrawn(p.drawOptions[i]!, state.rng, p.troopBonus));
    p.drawOptions = [];
    p.pickedIdx = [];
    p.selectedIdx = [];
    state.roundPhase = 'select';
  },

  /** Spieler wählt eine Karte: erste Wahl = Front, zweite = Hinten (Reihenfolge!). */
  toggleSelect(state: CombatState, pickIdx: number): void {
    if (state.roundPhase !== 'select') return;
    const p = state.player;
    if (pickIdx < 0 || pickIdx >= p.picked.length) return;
    const at = p.selectedIdx.indexOf(pickIdx);
    if (at >= 0) p.selectedIdx.splice(at, 1);
    else if (p.selectedIdx.length < PLAY_COUNT) p.selectedIdx.push(pickIdx);
  },

  /** Front/Hinten der 2 gewählten Karten tauschen. */
  swapLines(state: CombatState): void {
    const sel = state.player.selectedIdx;
    if (sel.length === 2) sel.reverse();
  },

  canConfirm(state: CombatState): boolean {
    return state.roundPhase === 'select' && state.player.selectedIdx.length === PLAY_COUNT;
  },

  confirmSelection(state: CombatState): void {
    if (!RoundSystem.canConfirm(state)) return;
    // Armee-weiten Combo-Bonus VOR dem Spawn setzen (UnitSystem.spawn liest ihn).
    state.player.comboBuff = computeCombo(state.player.picked, state.player.selectedIdx);
    state.enemy.comboBuff = computeCombo(state.enemy.picked, state.enemy.selectedIdx);
    spawnSelected(state, 'player');
    spawnSelected(state, 'enemy');
    state.resolveTimer = 0;
    state.roundPhase = 'resolve';
    logEvent(state, `Runde ${state.roundNumber}: Gefecht!`);
  },

  endRound(state: CombatState): void {
    state.units = [];
    state.roundNumber += 1;
    state.bannerTimer = ROUND_BANNER_SEC;
    for (const s of [state.player, state.enemy]) {
      s.picked = [];
      s.selectedIdx = [];
      s.drawOptions = [];
      s.pickedIdx = [];
      s.comboBuff = {};
    }
    state.roundPhase = 'banner';
  },
};

const spawnSelected = (state: CombatState, side: Side): void => {
  const s: SideState = getSide(state, side);
  s.selectedIdx.forEach((idx, line) => {
    const d = s.picked[idx];
    if (!d) return;
    const front = line === 0; // selectedIdx[0] = Front, [1] = Hinten
    const stats = leveledStats(d.card.stats, d.level);
    for (let i = 0; i < d.troops; i++) {
      UnitSystem.spawn(state, d.card, side, lineSpawnX(side, front, state.rng), undefined, stats);
    }
    logEvent(state, `${side === 'player' ? '⊕' : '⊖'} ${front ? 'Front' : 'Hinten'}: ${d.card.name} ×${d.troops}`);
  });
};
