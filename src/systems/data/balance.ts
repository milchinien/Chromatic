// Zentrale Tuning-Konstanten. KEINE Magic-Numbers im Combat-Code — alles hier.
// Iteration im Playtest passiert ausschließlich hier.

export const MANA_START = 20;
export const MANA_MAX = 20;
export const MANA_REGEN_PER_SEC = 1;

export const HAND_SIZE = 3;
export const DRAW_INTERVAL_SEC = 4;

export const BASE_HP_START = 100;
export const BASE_HP_MAX = 100;

// EXP-Schwellen kumulativ — Lv 1→2 nach 5 EXP, →3 nach 15 EXP gesamt, etc.
export const EXP_THRESHOLDS: readonly number[] = [5, 15, 30, 50, 80];
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
