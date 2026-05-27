# R1 — Save & Tutorial

**Dauer:** ~1 Woche · **Priorität:** sehr hoch (erste Post-MVP-Phase)

## Ziel

Die zwei größten UX-Lücken des MVP schließen: Spieler verlieren nicht mehr ihren Run-Fortschritt bei Browser-Refresh, und neue Spieler verstehen den Combat ohne externes Wissen.

## 🎯 Definition of Done — Hauptziel (Gate)

> **Save-System persistiert den vollständigen Run-Zustand über Browser-Refresh und Tab-Schließen. Tutorial-Run führt einen neuen Spieler ohne externes Wissen durch alle Kern-Mechaniken bis zum Sieg.**

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- Save-Datei wird nach jedem Encounter-Ende automatisch geschrieben
- Browser-Refresh mitten im Run → „FORTSETZEN" lädt **exakten** Zustand (Map, Coins, Deck, Perks, HP, besuchte Knoten)
- Save-Schema-Version wird geprüft, inkompatible Saves sauber gelöscht ohne Crash
- Niederlage und Sieg löschen das Save automatisch
- Tutorial-Run: alle 5+ Overlay-Schritte funktional, kein Step übersprungen, kein Hänger
- Tutorial-Boss ist schaffbar für einen Anfänger (in echtem Playtest mit fremder Person verifiziert)
- `hasPlayedTutorial`-Flag persistiert in LocalStorage
- Tests grün (saveService, tutorialFlow)
- Browser-Console: 0 Errors, 0 Warnings

**🚧 Solange diese Bedingungen nicht erfüllt sind, wird R2 NICHT begonnen.** Save-Bugs in R2 würden Content-Erweiterungen blockieren.

---

## Voraussetzungen

- MVP fertig (Tag `v0.1.0-mvp` gesetzt)
- Mindestens 5 fremde Personen haben das MVP getestet → Feedback liegt vor (zeigt, welche Tutorial-Punkte am dringendsten sind)

---

## Schritt-für-Schritt-Anleitung

### 1. Save-System (2 Tage)
- [ ] `src/systems/save/SaveService.ts`:
  - `saveRun(runState: RunState): void` — schreibt nach `localStorage` als JSON
  - `loadRun(): RunState | null`
  - `clearRun(): void`
  - Versionsfeld im Save (`saveVersion: 1`) — bei Schema-Bruch erkennt der Loader Inkompatibilität und löscht
- [ ] Serialisierung: `Map<string, RoomMap>` → `Array<[string, RoomMap]>`, `Set<string>` → `Array<string>`
- [ ] Auto-Save bei jedem WorldMap-Eintritt (also nach jedem Encounter)
- [ ] **Kein** Save während des Combats — Combat ist atomar
- [ ] Hauptmenü: Button „FORTSETZEN" erscheint, wenn `loadRun()` ein gültiges Save zurückgibt
- [ ] Niederlage → `clearRun()`
- [ ] Tests: Round-Trip-Save+Load, Versions-Mismatch löscht

### 2. Save-Migrations-Strategie (¼ Tag)
- [ ] Bei Schema-Änderung: `saveVersion` erhöhen
- [ ] Migrations-Funktionen pro Version (`migrateV1ToV2`, …)
- [ ] Für R1 nur Version 1 — Strategie aber dokumentiert

### 3. Tutorial-Run (3 Tage)
- [ ] Eigener Akt-Typ „tutorial" mit fester Map (kein Zufall):
  - Knoten 1: Tutorial-Combat (handgemachter Encounter, sehr einfach)
  - Knoten 2: Schatz (gibt 1 Karte für Combo-Demo)
  - Knoten 3: Combat mit Combo-Möglichkeit
  - Knoten 4: Shop (Erklärung)
  - Knoten 5: Perk-Raum (Erklärung)
  - Knoten 6: Boss (Tutorial-Boss, schaffbar)
- [ ] Tutorial-Overlays als eigenes UI-System `src/ui/TutorialOverlay.ts`:
  - Mit `nextStep()` und `skipTutorial()` versehen
  - Pfeile auf wichtige UI-Elemente, kurze Text-Bubbles
  - Combat-Pause während Overlay sichtbar
- [ ] Tutorial-Schritte:
  - „Klicke eine Karte, um eine Einheit zu spawnen"
  - „Diese Leiste ist dein Mana — Karten kosten Mana"
  - „Zwei Einheiten gleicher Farbe verstärken sich gegenseitig" (im 2. Combat)
  - „Verliere keine Base-HP — die persistiert über alle Kämpfe"
  - „Im Shop kannst du Karten kaufen"
  - „Perks gelten bis zum Run-Ende"
- [ ] Hauptmenü-Button „TUTORIAL" (separat von „SPIELEN"), wird beim ersten Start automatisch hervorgehoben (LocalStorage-Flag `hasPlayedTutorial`)

### 4. Onboarding-Tipps im Hauptlauf (½ Tag)
- [ ] Erste 3 normalen Runs: dezente Tipp-Toasts (z. B. „Tipp: ESC pausiert", „Tipp: Karten in deiner Hand werden zufällig nachgezogen")
- [ ] Nach 3 Runs werden Tipps deaktiviert

### 5. Tests
- [ ] `test/saveService.test.ts` — Round-Trip, Version-Mismatch, Cleared State
- [ ] `test/tutorialFlow.test.ts` — alle Tutorial-Schritte sind via `nextStep()` erreichbar

### 6. Commit + Tag
- [ ] `git commit -m "R1: save system + tutorial run"`
- [ ] Tag `v0.2.0`

---

## End-Zustand

**Datei-Baum (neu):**
```
src/
├── systems/
│   ├── save/
│   │   ├── SaveService.ts
│   │   └── migrations.ts
│   └── tutorial/
│       ├── TutorialState.ts
│       └── tutorialSteps.ts
└── ui/
    └── TutorialOverlay.ts

test/
├── saveService.test.ts
└── tutorialFlow.test.ts
```

**Sichtbares Verhalten:**
- Beim allerersten Start des Spiels wird der „TUTORIAL"-Button hervorgehoben
- Tutorial führt durch alle Kern-Mechaniken mit Overlays + Pfeilen
- Bei einem normalen Run: Browser-Refresh → Hauptmenü zeigt „FORTSETZEN"-Button → Klick lädt exakten Zustand (Welt-Karte, Coins, Deck, Perks, HP)
- Niederlage löscht das Save automatisch
- In den ersten 3 Runs: dezente Tipps tauchen auf
- Bestehende MVP-Funktionalität unverändert

**Was noch fehlt:**
- Optionen-Menü (Lautstärke-Regler etc.) — Teil von R1.5 falls Bedarf, sonst R5
- Daily-Seed-Run (kleines Feature, kann Teil von R1 sein wenn Zeit übrig)

---

## Akzeptanz-Test

1. Frischer Browser (LocalStorage leer) → Hauptmenü zeigt „TUTORIAL" hervorgehoben
2. Tutorial-Run komplett durchspielen → alle Overlay-Schritte funktional, kein Crash
3. Tutorial abgeschlossen → `hasPlayedTutorial`-Flag gesetzt
4. Normaler Run starten, 2 Knoten weiter, Browser-Refresh → „FORTSETZEN"-Button erscheint
5. Klick → Welt-Karte erscheint in exakt demselben Zustand
6. Run absichtlich verlieren → Save weg, neuer Start nötig
7. Save-Datei manuell mit alter Version-Nummer in LocalStorage editieren → Loader erkennt + löscht
8. Tests grün

---

## ✅ Freigabe-Checkliste (vor Beginn von R2)

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] Tutorial mit fremder Test-Person erfolgreich gespielt (verstanden ohne Erklärung)
- [ ] Save-System: Round-Trip-Test (Refresh mitten im Run) erfolgreich
- [ ] `pnpm test` — alle Tests grün
- [ ] `pnpm lint` — keine Errors
- [ ] `pnpm build` — läuft fehlerfrei
- [ ] Browser-Console: 0 Errors, 0 Warnings
- [ ] Keine offenen Bugs der Schweregrade „kritisch" oder „mittel"
- [ ] Git-Tag `v0.2.0` gesetzt

**Erst wenn ALLE Häkchen gesetzt sind, beginnt R2.**

---

## Offene Fragen / Risiken

- **Tutorial-Reizüberflutung:** Wenn zu viele Overlays, Spieler überspringen alles. Lieber 5 kurze Hinweise als 15 lange
- **Save-Korruption:** Wenn der Spieler im Pause-Menü „Hauptmenü" klickt — wird der Run gelöscht oder bleibt er ladbar? Designentscheidung treffen, hier Vorschlag: bleibt ladbar (kein Verlust)
- **Tutorial-Wartung:** Bei jeder UI-Änderung muss das Tutorial mit-angepasst werden. In R2 evtl. überarbeiten
