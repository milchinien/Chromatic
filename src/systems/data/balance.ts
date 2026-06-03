// Zentrale Tuning-Konstanten. KEINE Magic-Numbers im Combat-Code — alles hier.
// Iteration im Playtest passiert ausschließlich hier.

import type { UnitStats } from '../../domain/Card';
import type { Rng } from '../rng';

// --- Mana ist seit dem Runden-Redesign nur noch Platzhalter-Ressource ---
// (Bar/Wert bleiben sichtbar, gaten aber NICHT das Spielen — pro Runde 2 Karten).
export const MANA_START = 20;
export const MANA_MAX = 20;
export const MANA_REGEN_PER_SEC = 1;

export const HAND_SIZE = 3;
export const DRAW_INTERVAL_SEC = 4;

export const BASE_HP_START = 100;
export const BASE_HP_MAX = 100;

// EXP-Schwellen kumulativ. Reichweite so gewählt, dass ein mittleres Encounter
// (~8 Kills) maximal Lv 2-3 erreicht — Lv 4+ ist Boss-Territorium.
export const EXP_THRESHOLDS: readonly number[] = [10, 30, 60, 100, 150];
// EXP-Ertrag pro Kill skaliert grob mit Mana-Kosten.
export const EXP_PER_KILL = (manaCost: number): number =>
  manaCost <= 5 ? 5 : manaCost <= 10 ? 15 : 30;

// Render-Loop läuft mit RAF, aber Combat-State erwartet feste dt-Begrenzung
// damit unbegrenzte Tabs/Hintergrundlauf keine 5-Sekunden-Sprünge bauen.
export const MAX_DT_SEC = 0.1;

// Spielfeld-Geometrie (Canvas-Koordinaten relativ zum Battlefield-Canvas).
export const FIELD_WIDTH = 960;
export const FIELD_HEIGHT = 220;
export const PLAYER_BASE_X = 40;
export const ENEMY_BASE_X = FIELD_WIDTH - 40;
export const UNIT_RADIUS = 16;
export const ATTACK_RANGE = 28; // Reichweite, ab der eine Unit angreift statt zu laufen

// KI: alle X Sekunden eine Entscheidung treffen.
export const AI_DECISION_INTERVAL_SEC = 1.5;

// Lane-Spawn-Variation, damit Units nicht 1:1 aufeinander stehen.
export const SPAWN_LANE_JITTER = 70; // ± Pixel auf Y-Achse

// Visual-FX-Timings (Phase 7 — Polish)
export const SPAWN_FLASH_SEC = 0.25;
export const DEATH_ANIM_SEC = 0.4;
export const DAMAGE_NUMBER_LIFE_SEC = 0.9;
export const SCREEN_SHAKE_DECAY_SEC = 0.3;
export const SCREEN_SHAKE_MAX_PX = 6;

// =====================================================================
// RUNDENBASIERTES COMBAT (Redesign)
// =====================================================================

// Pro Runde: 5 verdeckte Karten ziehen → blind PICK_COUNT picken → aufdecken
// → PLAY_COUNT spielen. Gegner zieht direkt DRAW_OPTIONS-unabhängig 3 und spielt 2.
export const DRAW_OPTIONS = 5; // verdeckte Karten zur Auswahl (nur Spieler)
export const PICK_COUNT = 3; // blind gepickte Karten → kommen auf die Hand
export const PLAY_COUNT = 2; // gespielte Karten pro Runde (Combo bei Match)
export const ROUND_BANNER_SEC = 1.2; // Anzeigedauer des „Runde N"-Banners
export const RESOLVE_MAX_SEC = 30; // Safety-Cap: Runde endet spätestens nach X s

// Truppen pro Karte (in 2er-Schritten). Stärkere Karte (höhere Mana) = weniger
// Truppen. Karten-Level (Upgrade) erhöht Min & Max um +2 pro Stufe über 1.
export const TROOP_STEP = 2;
export const troopRangeFor = (manaCost: number, level = 1): { min: number; max: number } => {
  const baseMax = manaCost <= 4 ? 20 : manaCost <= 6 ? 14 : 10;
  const bonus = TROOP_STEP * Math.max(0, level - 1);
  return { min: TROOP_STEP + bonus, max: baseMax + bonus };
};
export const rollTroopCount = (manaCost: number, level: number, rng: Rng): number => {
  const { min, max } = troopRangeFor(manaCost, level);
  const steps = Math.floor((max - min) / TROOP_STEP) + 1;
  const idx = Math.floor(rng() * steps);
  return min + idx * TROOP_STEP;
};

// Karten-Upgrade: Level skaliert Stats (Damage/HP) UND Truppen-Range (oben).
export const UPGRADE_STAT_FACTOR_PER_LEVEL = 0.15; // +15 % Damage/HP pro Stufe
export const leveledStats = (base: UnitStats, level: number): UnitStats => {
  const f = 1 + UPGRADE_STAT_FACTOR_PER_LEVEL * Math.max(0, level - 1);
  return {
    damage: Math.round(base.damage * f),
    hp: Math.round(base.hp * f),
    attackInterval: base.attackInterval,
    speed: base.speed,
  };
};

// Upgrade-Kosten im Shop (Coins), steigend mit aktuellem Level.
export const upgradeCostFor = (level: number): number => 60 + 40 * level;

// Truppen-Stacks können groß werden (bis ~20 Units/Karte) → kleinerer Radius
// für gute Lesbarkeit auf dem schmalen Feld.
export const STACK_UNIT_RADIUS = 9;
