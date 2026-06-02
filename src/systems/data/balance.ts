// Zentrale Tuning-Konstanten. KEINE Magic-Numbers im Combat-Code — alles hier.
// Iteration im Playtest passiert ausschließlich hier.

export const MANA_START = 20;
export const MANA_MAX = 20;
export const MANA_REGEN_PER_SEC = 1;

export const HAND_SIZE = 4;
export const DRAW_INTERVAL_SEC = 3;

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
