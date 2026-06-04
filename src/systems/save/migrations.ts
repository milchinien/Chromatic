// Save-Migrations-Strategie.
//
// Aktuell existiert nur SAVE_VERSION = 1 (siehe SaveService.ts) — es gibt also
// nichts zu migrieren. Diese Datei hält die Strategie fest, damit ein späterer
// Schema-Bruch nicht zu Daten-Verlust beim Spieler führt.
//
// Vorgehen bei Schema-Änderung:
//   1. `SAVE_VERSION` in SaveService.ts erhöhen (z. B. 1 → 2).
//   2. Hier eine Migrations-Funktion `migrateV1ToV2(raw)` ergänzen, die die
//      alte JSON-Form in die neue überführt.
//   3. In `loadRun` (SaveService) vor der Versions-Prüfung die passende
//      Migrationskette anwenden, statt das Save sofort zu verwerfen.
//
// Solange keine Migration definiert ist, gilt: Save einer fremden Version wird
// sauber gelöscht (kein Crash) — siehe `loadRun`.

export interface SaveMigration {
  readonly from: number;
  readonly to: number;
  readonly migrate: (raw: Record<string, unknown>) => Record<string, unknown>;
}

/** Registrierte Migrationen, aufsteigend nach `from`. Für Version 1 leer. */
export const MIGRATIONS: readonly SaveMigration[] = [];
