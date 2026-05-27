# Plans — Chromatic

Dieser Ordner enthält die **schrittweise Implementierungs-Anleitung** für Chromatic. Jede Datei beschreibt **eine abgeschlossene Phase** mit konkreter To-Do-Liste und einem klar definierten End-Zustand.

**Grundlagen-Dokumente:**
- [GAME_DESIGN.md](../GAME_DESIGN.md) — Vollständige Spielbeschreibung (was wird gebaut)
- [TECH_PLAN.md](../TECH_PLAN.md) — Technische Architektur (wie wird gebaut)
- [MVP_PLAN.md](../MVP_PLAN.md) — High-Level-Meilensteine (Überblick)
- **[DESIGN_REFERENCE.md](DESIGN_REFERENCE.md)** — 🎨 Visuelle Spezifikation: Farben, Fonts, Layouts pro Screen, wiederverwendbare UI-Komponenten. **Verbindlich für alle Phasen ab Phase 2.** Raw-Quellen liegen unter [`design/`](../design/).

Die Dateien in diesem Ordner sind die **ausführbaren Pläne** — wenn du eine Phase abarbeitest, hakst du die Schritte ab und prüfst am Ende die Akzeptanz-Kriterien.

---

## 🚧 Gating-Prinzip (verbindlich)

**Jede Phase hat genau ein „Hauptziel" das bug-frei implementiert sein muss, bevor die nächste Phase beginnt.**

Konkret heißt das:

- Bevor du in einer Phase die Schritt-für-Schritt-Liste abarbeitest, lies das **Hauptziel** ganz oben.
- Bugs, die während der Phase entdeckt werden, werden **in dieser Phase** behoben — nicht „später" in eine spätere Phase verschoben.
- Die **Freigabe-Checkliste** am Ende jeder Datei ist die harte Hürde: nur wenn alle Häkchen gesetzt sind, beginnt die nächste Phase.
- „Bug-frei" bedeutet: keine bekannten kritischen oder mittelschweren Bugs, alle Unit-Tests grün, Browser-Console 0 Errors / 0 Warnings, Akzeptanz-Test komplett durchgelaufen.

Hintergrund: Die Phasen bauen aufeinander auf. Phase 3 setzt voraus, dass Phase 2 stabil ist — wenn der Combat noch flackert, wird das Debugging in Phase 3 doppelt teuer, weil Symptome dann sowohl in der Run-Schale als auch im Combat auftauchen können. Phase für Phase sauber abschließen spart deutlich Zeit über den gesamten MVP.

Bei vorhandenen, aber **nicht** ziel-blockierenden Bugs (Schweregrad „niedrig"): `BUGS.md` im Repo-Root anlegen und dort als Backlog führen.

---

## Reihenfolge

### MVP — Bis zum spielbaren Mini-Run (~12–14 Personentage)

| # | Phase | Datei | Dauer | Abhängigkeit |
|---|-------|-------|-------|--------------|
| 1 | Fundament | [mvp/PHASE_1_FUNDAMENT.md](mvp/PHASE_1_FUNDAMENT.md) | ½ Tag | — |
| 2 | Combat-Sandbox ⚠️ | [mvp/PHASE_2_COMBAT_SANDBOX.md](mvp/PHASE_2_COMBAT_SANDBOX.md) | 3–4 Tage | Phase 1 |
| 3 | Run-Schale | [mvp/PHASE_3_RUN_SCHALE.md](mvp/PHASE_3_RUN_SCHALE.md) | 3 Tage | Phase 2 |
| 4 | Deck-Wachstum | [mvp/PHASE_4_DECK_WACHSTUM.md](mvp/PHASE_4_DECK_WACHSTUM.md) | 2 Tage | Phase 3 |
| 5 | Sub-Maps | [mvp/PHASE_5_SUB_MAPS.md](mvp/PHASE_5_SUB_MAPS.md) | 1 Tag | Phase 3 |
| 6 | Perks | [mvp/PHASE_6_PERKS.md](mvp/PHASE_6_PERKS.md) | 1 Tag | Phase 3 |
| 7 | Polish & Balance | [mvp/PHASE_7_POLISH.md](mvp/PHASE_7_POLISH.md) | 1–2 Tage | Alle vorherigen |

**⚠️ Phase 2 ist die Risiko-Phase.** Wenn dort der Combat-Feel nicht trägt, muss das Design zurück auf den Tisch. Erst nach erfolgreicher Phase 2 macht es Sinn, die Run-Schale (Phase 3+) drumherum zu bauen.

**Phasen 4, 5, 6 sind in beliebiger Reihenfolge tauschbar** — sie hängen alle nur von Phase 3 ab, aber nicht voneinander.

### Post-MVP — Roadmap

| # | Phase | Datei | Geschätzte Dauer |
|---|-------|-------|------------------|
| R1 | Save & Tutorial | [roadmap/R1_SAVE_TUTORIAL.md](roadmap/R1_SAVE_TUTORIAL.md) | 1 Woche |
| R2 | Content-Tiefe | [roadmap/R2_CONTENT_TIEFE.md](roadmap/R2_CONTENT_TIEFE.md) | 2–3 Wochen |
| R3 | Meta-Progression | [roadmap/R3_META_PROGRESSION.md](roadmap/R3_META_PROGRESSION.md) | 1–2 Wochen |
| R4 | Combat-Tiefe | [roadmap/R4_COMBAT_TIEFE.md](roadmap/R4_COMBAT_TIEFE.md) | 1–2 Wochen |
| R5 | Präsentation | [roadmap/R5_PRAESENTATION.md](roadmap/R5_PRAESENTATION.md) | offen (asset-getrieben) |
| R6 | Reichweite | [roadmap/R6_REICHWEITE.md](roadmap/R6_REICHWEITE.md) | offen |

Die Roadmap-Phasen sind **nach Priorität** sortiert, nicht nach harter Abhängigkeit. R1 sollte direkt nach dem MVP kommen, weil Save & Tutorial die größten UX-Lücken sind. R5/R6 sind die letzten Schritte vor einem öffentlichen Release.

---

## Lese-Anleitung pro Datei

Jede Phase-Datei hat denselben Aufbau:

1. **Ziel** — eine Zeile, was diese Phase liefert
2. **Voraussetzungen** — was vor Beginn fertig sein muss
3. **Schritt-für-Schritt-Anleitung** — konkrete Tasks in Reihenfolge
4. **End-Zustand** — wie das Spiel/der Code nach Abschluss aussieht, inkl. Datei-Liste und sichtbarem Verhalten
5. **Akzeptanz-Test** — ein manueller Test-Ablauf, der die Phase als „fertig" qualifiziert
6. **Offene Fragen / Risiken** — was noch entschieden werden muss

---

## Wichtige Design-Entscheidungen vor Phase 2

Bevor die Combat-Sandbox gebaut wird, müssen folgende Werte aus [GAME_DESIGN.md Sektion 9](../GAME_DESIGN.md) festgelegt werden — sonst hat die Sandbox keine sinnvollen Defaults:

- **Auto-Draw-Intervall:** Vorschlag **4 s**
- **Mana-Cap-Verhalten:** Vorschlag **stoppt bei Max (kein Overflow)**
- **Perk-Stacking:** Vorschlag **additiv erlaubt** (2× +20 Max-Mana = +40)
- **Hand-Size Default:** **3** (erweiterbar durch Perk)
- **Starter-Deck-Komposition:** siehe Phase 2, Schritt 3

Diese Werte sind als Konstanten in `src/systems/data/balance.ts` zu hinterlegen, damit Balancing-Iterationen über einen einzigen Ort gehen.

---

## 🎨 Visual Design — verbindliche Vorgabe

Ab Phase 2 implementiert jede Szene die in [DESIGN_REFERENCE.md](DESIGN_REFERENCE.md) festgelegten Tokens (Farben, Fonts, Layouts).

**Vor Implementierungsbeginn jeder Phase:**
1. Lies die für die Phase relevanten Screen-Specs in [DESIGN_REFERENCE.md](DESIGN_REFERENCE.md) Sektion 5
2. Öffne zusätzlich die zugehörige `.jsx`-Datei in [`design/`](../design/) — sie ist die autoritative Quelle bei Detail-Fragen
3. Spiegle alle Token-Werte in `src/systems/data/designTokens.ts` (kein Magic-Color-String im Code)

Phase 1 wurde **vor** dem Design-Handoff implementiert und hat noch einen minimalen Look. Optional: vor Phase 2 ein **Phase 1.5 — Design-Upgrade** für MainMenu/WorldMap-Platzhalter einschieben.
