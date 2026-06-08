# Combat Overhaul — Implementierungsplan

Dieser Ordner übersetzt die **Design-Spec** in [../](../) (Klassen, Farben, Combos,
Karten, User-Journey) in **konkrete Code-Schritte**. Die Spec-Dateien bleiben unberührt
und sind weiterhin die autoritative *Was/Warum*-Quelle; dieser Ordner ist das *Wie*.

> **Wichtig:** Die alten Spec-Dateien werden **nicht** gelöscht. Bei Konflikt gewinnt die
> Spec; dieser Plan darf eine fixierte Combo-/Rollen-**Wirkung** nie ändern (siehe
> [../README.md](../README.md) → Leitplanke).

---

## Ausgangslage (Ist-Code, Stand 2026-06-05)

- **DOM + Vanilla-Canvas-Hybrid** (kein Phaser). Sim-Loop läuft via `setInterval`
  (`Combat.ts` ~Z. 690) → `advance(state, dt)`.
- Combat-Logik: `src/systems/combat/{advance,UnitSystem,RoundSystem,CombatState,ExpSystem}.ts`.
- Daten: `src/systems/data/{cards,balance}.ts`. Renderer: `src/screens/Combat.ts`
  (`drawBattlefield`, Unit-Loop ~Z. 617).
- Combo = `computeCombo()` liefert ein `Partial<UnitStats>`, das in `UnitSystem.spawn`
  in `baseStats` **eingebacken** wird (`comboBuff` auf `SideState`). Werte aus
  `COLOR_ARMY_BONUS` / `CLASS_ARMY_BONUS` in `balance.ts`.
- Alle Klassen marschieren melee; Magier nutzt `damageAura`, Heiler `healAura` (Radius,
  ohne Priorisierung); Festung läuft mit `speed 28` vor. Keine Projektile, keine Wände,
  keine Beschwörungen außer Nekromant-onDeath-Skelett.

## Kern-Umbau in einem Satz

Das Combo-Modell wechselt von **„Stat-Partial in baseStats backen"** zu
**„Runden-Effekt-Zustand (`RoundComboState`) am Deploy + im Tick anwenden"** — denn die
neuen Combos sind Mechaniken (×2 Truppen, Wand, Beschwörung, HoT, Skelett-Ernte), keine
Flat-Stats mehr.

---

## Phasen & Reihenfolge

| Phase | Datei | Liefert | Abhängig von |
|-------|-------|---------|--------------|
| A | [PHASE_A_FUNDAMENT.md](PHASE_A_FUNDAMENT.md) | Typ-/Daten-Fundament: `EntityKind`, `attackRange`, neue Passive-Trigger, `RoundComboState`, Balance-Konstanten. **Kein Gameplay-Change.** | — |
| B | [PHASE_B_KLASSEN_ROLLEN.md](PHASE_B_KLASSEN_ROLLEN.md) | Klassen-Rollen: Festung statisch+Fernschuss, Magier Projektile, Heiler Ziel-Heilung (niedrigste HP + Klassen-Affinität), Reittier-Tuning. Projektil-System + Rendering. | A |
| C | [PHASE_C_SPEZIAL_KARTEN.md](PHASE_C_SPEZIAL_KARTEN.md) | Spezial-Karten: Waldläufer (Fernkampf), Steinbrecher (HP/Speed), Grabwächter (onKill→Skelett), Totenzitadelle (3 s), Handelsposten (+XP), Nekromant (2 s). | A, B |
| D | [PHASE_D_COMBOS.md](PHASE_D_COMBOS.md) | Combo-Mechaniken: alte Flat-Buffs raus; 5 Farb- + 5 Klassen-Combos rein; beide greifen gleichzeitig. Wand/Wächter/Beschwörungs-Entities. | A, B, C |
| E | [PHASE_E_TESTS_VERIFIKATION.md](PHASE_E_TESTS_VERIFIKATION.md) | Unit-Tests je Combo/Rolle, Journey-Akzeptanztests, Preview-Verifikation. | A–D |

**Gating** (wie [../../README.md](../../README.md#-gating-prinzip-verbindlich)): Jede Phase
muss bug-frei + Tests grün + Browser-Console sauber sein, bevor die nächste beginnt.

```
A (Fundament)
 └─> B (Rollen) ──> C (Spezial-Karten)
                      └─> D (Combos) ──> E (Tests/Verifikation)
```

---

## User-Journey-Verankerung

Die 4 Journeys aus [../06_USER_JOURNEY.md](../06_USER_JOURNEY.md) sind die
**Akzeptanz-Szenarien**. Jede Phase nennt am Ende, welchen Journey-Teil sie ermöglicht;
Phase E prüft alle 4 end-to-end:

| Journey | Braucht aus Phase … |
|---------|---------------------|
| **A — Rote Flut** (Krieg ×2 + Krieger-Mult, zwei identische Berserker aus Pool-Draw) | D (beide Combos gleichzeitig), A (RoundComboState) |
| **B — Bollwerk** (Festung-Mauer + Stein-HP×2 + Heiler-Wächter) | B (Festung statisch/Fernschuss, Heiler), D (Mauer, HP×2, Wächter) |
| **C — Totenheer** (Untot jeder Tod→Skelett + Nekromant 2 s + Grabwächter) | C (Nekromant, Grabwächter), D (Untot-Combo) |
| **D — Schützen hinter Schilden** (zäh vorne, Distanz hinten, ohne Combo) | B (Magier-Projektile, Distanz-Stopp), C (Waldläufer, Steinbrecher) |

---

## Globale Hinweise für alle Phasen

- **Keine Magic-Numbers im Combat-Code** — neue Tuning-Werte ausschließlich in
  `balance.ts` (wie bisher).
- **Render-Loop:** `setInterval`, nicht RAF (Headless-Preview throttelt RAF — siehe
  Projekt-Memory). Neue Render-Elemente (Projektile etc.) in `drawBattlefield` einhängen.
- **Determinismus:** Sim nutzt `state.rng` (mulberry32) — neue Zufalls-Effekte über
  `state.rng()` ziehen, damit Tests mit Seed reproduzierbar bleiben.
- **`MAX_DT_SEC`-Clamp** beachten: Timer-basierte Spawns (Totenzitadelle/Nekromant) über
  Akkumulator pro Unit, nicht über Wall-Clock.
