# Chromatic

Ein Roguelite-Deckbuilder mit Real-Time-Combat im Browser. TypeScript + Vite, kein Backend, kein Save (MVP).

> **„Du bist Feldmarschall der Magie. Karten spielen, Units kommandieren, Endboss besiegen — und sterben, ohne nochmal zu retten."**

## Spielen

```bash
pnpm install
pnpm dev          # öffnet http://localhost:5173
```

## Steuerung

| Taste / Aktion | Effekt |
|----------------|--------|
| **Klick auf SPIELEN** | Neuer Run startet, Welt-Karte erscheint |
| **Klick auf Knoten** | Nächsten Raum betreten (nur erreichbare Nachbarn klickbar) |
| **Klick auf Karte (im Combat)** | Unit spawnen, Mana wird abgezogen |
| **ESC** | Combat pausieren / fortsetzen |
| **M** | Sound an / aus |
| **D** (nur DEV-Build) | Direkt in die Combat-Sandbox springen |

## Spielablauf

1. **Welt-Karte:** Ein DAG aus 5 Layern (Start → Kampf/Schatz/Shop/Zauber → Endboss). Du wählst deinen Pfad.
2. **Raum-Karte:** Jeder Kampf-Welt-Knoten enthält 3 Sub-Knoten (Eintritt → Sub-Kampf/Schatz → Ausgang oder Zwischenboss).
3. **Combat:** Real-Time. Mana regeneriert kontinuierlich, alle 4s wird automatisch eine Karte gezogen. Units marschieren von deiner Base nach rechts, kämpfen gegen Gegner-Units, treffen am Ende die Gegner-Base.
4. **Combos:** Zwei befreundete Units gleicher Farbe stärken sich gegenseitig (Color-Aura). Gleiche Klasse gibt Klassen-Buff. Buffs stapeln mit jeder weiteren passenden Unit.
5. **Belohnung:** Kämpfe geben Coins. Im Shop neue Karten kaufen. Im Schatz-Raum würfelt das Spiel zwischen +50 Coins, einer Karte, oder +30 HP. Im Zauber-Raum wählst du einen permanenten Perk.
6. **Sieg:** Endboss besiegen → Akt geschafft, zurück zum Hauptmenü.
7. **Niederlage:** Base-HP auf 0 → Game-Over, Run vorbei.

## Karten-System

- **5 Farben:** Natur, Krieg, Stein, Untot, Farblos (kein Combo-Color-Buff)
- **5 Klassen:** Krieger, Festung, Reittier, Magier, Heiler
- **Combo-Buffs:** Jede Karte bringt ihren eigenen Color- und Class-Buff mit, der als Aura an alle befreundeten Units gleicher Farbe/Klasse weitergegeben wird (Self-Exclusion: man buffd sich nicht selbst).
- **Starter-Deck:** 10 Karten gemischt — wächst durch Shop und Schatz-Räume.

## Architektur

- DOM + Canvas-Hybrid (HUD/Hand als DOM, Spielfeld als `<canvas>`). Phaser ist als Dependency installiert, aber bewusst nicht eingesetzt — siehe [TECH_PLAN.md](TECH_PLAN.md).
- Pure-TypeScript-Systeme in `src/systems/` (Combat-Logik, Map-Gen, RNG, RunState) — alle Phaser-frei und unit-testbar.
- Screens als reine Funktionen `(host, ctx) => Cleanup` registriert beim Mini-Router in [src/router.ts](src/router.ts).
- Design-Tokens als CSS-Variablen in [src/styles.css](src/styles.css) und JS-Spiegel in [src/systems/data/designTokens.ts](src/systems/data/designTokens.ts).
- SFX prozedural via Web-Audio-API ([src/systems/audio.ts](src/systems/audio.ts)) — kein Asset-Download, keine Lizenz-Fragen.

## Dev-Skripte

```bash
pnpm dev          # Vite-Dev-Server (HMR)
pnpm build        # Production-Build → dist/
pnpm preview      # Build lokal hosten
pnpm test         # Vitest (59 Unit-Tests)
pnpm test:watch   # Watch-Modus
pnpm lint         # ESLint
pnpm format       # Prettier
```

## Status

**MVP — Phase 7 Polish abgeschlossen.** Spielbar vom Hauptmenü bis Endboss-Sieg. 59 Unit-Tests grün, 0 Lint-Errors, 0 Build-Warnings, 0 Console-Errors über alle Test-Runs.

Nächste Schritte (Post-MVP):
- **R1:** Save-System + Tutorial — [plans/roadmap/R1_SAVE_TUTORIAL.md](plans/roadmap/R1_SAVE_TUTORIAL.md)
- **R2:** Content-Tiefe (mehr Karten/Perks/Akte) — [plans/roadmap/R2_CONTENT_TIEFE.md](plans/roadmap/R2_CONTENT_TIEFE.md)
- **R3–R6:** Meta-Progression, Combat-Tiefe, echte Assets, Release-Pipeline

## Dokumente

- [GAME_DESIGN.md](GAME_DESIGN.md) — vollständige Spielbeschreibung
- [TECH_PLAN.md](TECH_PLAN.md) — technische Architektur
- [MVP_PLAN.md](MVP_PLAN.md) — High-Level-Meilensteine
- [plans/](plans/) — Phase-für-Phase-Implementierungs-Anleitungen
- [plans/DESIGN_REFERENCE.md](plans/DESIGN_REFERENCE.md) — visuelle Tokens (Farben, Fonts, Layouts)
- [src/assets/CREDITS.md](src/assets/CREDITS.md) — Asset- und Sound-Lizenzen
