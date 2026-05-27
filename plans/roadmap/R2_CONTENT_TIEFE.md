# R2 — Content-Tiefe

**Dauer:** ~2–3 Wochen · **Priorität:** hoch

## Ziel

Das Spiel von einer einzigen Akt-Wiederholung zu einem echten Roguelite mit Replay-Value ausbauen: mehr Karten, mehrere Akte, bessere Map-Generierung, mehr Encounter-Variation.

## 🎯 Definition of Done — Hauptziel (Gate)

> **3 Akte sind nahtlos hintereinander spielbar mit eskalierender Schwierigkeit. Karten-Pool ≥ 40 Karten mit funktionierendem Rarity-System. Map-Generator erzeugt mit verschiedenen Seeds visuell und strategisch unterschiedliche Karten, die alle Constraints erfüllen.**

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- Akt 1 → 2 → 3 läuft ohne Crashes, Schwierigkeit eskaliert messbar (KI-Mana, Gegner-Stats)
- Jeder Akt hat einen erkennbar anderen Boss-Stil
- Karten-Pool ≥ 40 Karten, balanciert (keine offensichtlich überpowered / nutzlosen Karten)
- Rarity-Verteilung statistisch korrekt (Test mit 1000 Draws bestätigt)
- Map-Generator-Constraints: jeder Pfad enthält mind. 1 Schatz, jeder Akt enthält mind. 1 Shop und 1 Perk-Raum, Pfade kreuzen sich nicht
- Event- und Choice-Knoten funktional, alle Outcomes getestet
- Mindestens 3 komplette 3-Akt-Runs durchgespielt
- Tests grün (mapGeneratorV2, rarityDrop)
- Browser-Console: 0 Errors, 0 Warnings

**🚧 Solange diese Bedingungen nicht erfüllt sind, wird R3 NICHT begonnen.** Meta-Progression macht ohne ausreichenden Content keinen Sinn.

---

## Voraussetzungen

- R1 fertig (Save + Tutorial)
- MVP-Balancing als stabile Basis

---

## Schritt-für-Schritt-Anleitung

### 1. Akt 2 + Akt 3 (1 Woche)
- [ ] `MapGenerator.generateAct(2)` und `(3)` mit eskalierender Schwierigkeit:
  - Akt 2: 8 Knoten, mehr Sub-Knoten pro Welt-Raum, neue Encounter-Decks
  - Akt 3: 10 Knoten, noch mehr Sub-Knoten, neuer Boss
- [ ] `encounters.ts` ergänzt um `*_act2`, `*_act3`-Varianten
- [ ] Schwierigkeits-Skalierung: KI-Mana-Start +5 pro Akt, KI-Decks aggressiver
- [ ] Boss-Encounter pro Akt:
  - Akt 1: bestehender Boss
  - Akt 2: neuer Boss-Design (z. B. „Combo-Focus" — spawnt nur eine Farbe, sehr aggressiv)
  - Akt 3: neuer Boss-Design (z. B. „Multi-Farben-Generalist" mit großem Deck)
- [ ] VictoryScene erweitert: nach Akt-Sieg Wahl „Weiter zu Akt N+1" oder „Aufhören (Run beenden)"

### 2. Karten-Pool auf ~40–60 Karten ausbauen (1 Woche)
- [ ] Pro Farbe ~10 Karten, pro Klasse ~8 Karten
- [ ] **Rarity-System aktiv schalten:**
  - `common` (40%), `rare` (15%), `epic` (5%) in Drop-Wahrscheinlichkeit
  - Shop zeigt rarity-gewichteten Pool
  - Schwere Kämpfe / Mini-Bosse können `rare` droppen
  - Endbosse droppen garantiert `epic`
- [ ] Karten-Daten-Tooling: Idealerweise `cards.ts` aus einer CSV/JSON-Datei generieren, damit Designer ohne TypeScript-Knowledge editieren können
- [ ] Karten-Balance-Pass: jede neue Karte mit existierenden im Sandbox-Modus getestet

### 3. Constraint-basierte Map-Generierung (3 Tage)
- [ ] Aktueller MapGenerator: einfacher Layered-Random
- [ ] Neuer Algorithmus à la Slay-the-Spire:
  - Pfade kreuzen sich nicht
  - Mindestens 2 verschiedene Pfade pro Akt
  - Schatz-Räume garantiert auf jedem Pfad
  - Shop garantiert mindestens 1× pro Akt
  - Perk-Raum mindestens 1× pro Akt
- [ ] Snapshot-Tests für mehrere Seeds, Lesbarkeits-Test (Karten sehen interessant aus, nicht nur linear)

### 4. Neue Encounter- und Sub-Knoten-Typen (3 Tage)
- [ ] **Elite-Combat**: zwischen normalem Kampf und Boss, gibt überdurchschnittliche Belohnung
- [ ] **Event-Knoten**: textbasiertes Mini-Ereignis mit 2–3 Auswahlmöglichkeiten („Du findest einen alten Magier — willst du 100 Coins gegen einen Perk tauschen?")
- [ ] **Choice-Knoten**: Spieler wählt zwischen 3 unterschiedlichen Karten zum kostenlosen Hinzufügen
- [ ] Eigene Szenen pro Typ, gleiche Architektur wie Shop/Treasure

### 5. Karten-Drop-Pool pro Encounter-Typ (1 Tag)
- [ ] `encounters.ts` definiert pro Encounter ein eigenes `cardDropPool`
- [ ] Bestimmte Karten droppen nur aus bestimmten Encountern (z. B. „Schatten-Schwingen" nur aus Untot-Boss)
- [ ] Belohnt thematisches Run-Building

### 6. Tests
- [ ] `test/mapGeneratorV2.test.ts` — Constraint-Tests (Schatz-Garantie, Pfad-Anzahl, kein Cross)
- [ ] `test/rarityDrop.test.ts` — Wahrscheinlichkeits-Verteilung über 1000 Draws
- [ ] Akzeptanz-Run pro Akt mindestens 3× komplett gespielt

### 7. Commit + Tag
- [ ] `git commit -m "R2: content depth (acts 2-3, 60 cards, slay-the-spire map)"`
- [ ] Tag `v0.3.0`

---

## End-Zustand

**Datei-Baum (neu/geändert):**
```
src/
├── systems/
│   ├── data/
│   │   ├── cards.ts (40-60 Karten, evtl. aus generierter Quelle)
│   │   ├── encounters.ts (act2, act3 Encounter)
│   │   └── events.ts (neue Event-Knoten-Inhalte)
│   └── run/
│       └── MapGenerator.ts (constraint-basiert)
└── scenes/
    ├── EventScene.ts (neu)
    ├── ChoiceScene.ts (neu)
    └── VictoryScene.ts (Akt-Wechsel-UI)

tools/
└── generateCards.ts (optional: CSV→TS-Generator)
```

**Sichtbares Verhalten:**
- Nach Akt-1-Sieg fragt das Spiel, ob Akt 2 begonnen wird
- Akt 2 hat erkennbar mehr Knoten, härtere Gegner, bessere Belohnungen
- Akt 3 ebenso
- Welt-Karte zeigt verschlungenere Pfade (Slay-the-Spire-Style)
- Karten-Pool ist deutlich diverser, Rare/Epic-Karten sind sichtbar besonders
- Event-Knoten überraschen den Spieler mit Text-Entscheidungen
- Choice-Knoten geben kostenlos eine von 3 Karten

**Was noch fehlt:**
- Meta-Progression zwischen Runs (R3)
- Bessere KI für Boss-Encounter (R4)
- Echte Sprites (R5)

---

## Akzeptanz-Test

1. Run starten, alle 3 Akte hintereinander durchspielen → Schwierigkeit eskaliert sichtbar
2. In jedem Akt mind. 1× einen Event-Knoten getroffen → 2–3 Optionen mit jeweils unterschiedlichem Outcome
3. Choice-Knoten getroffen → 3 Karten zur Wahl, eine wird ins Deck übernommen
4. Mindestens 1× eine Epic-Karte aus einem Boss bekommen
5. Map-Generator: 5 verschiedene Seeds → 5 visuell deutlich unterschiedliche Karten, alle mit Schatz/Shop garantiert
6. Alle neuen Test-Files grün
7. Karten-Tabelle (40–60 Stück) liegt in einer maintainbaren Quelle vor

---

## ✅ Freigabe-Checkliste (vor Beginn von R3)

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] Mindestens 3 komplette 3-Akt-Runs durchgespielt
- [ ] Karten-Pool ≥ 40 Karten, alle balanciert getestet (keine offensichtlichen Overpowered/Useless)
- [ ] Map-Generator-Constraints alle eingehalten (mehrere Seeds verglichen)
- [ ] `pnpm test` — alle Tests grün
- [ ] `pnpm lint` — keine Errors
- [ ] `pnpm build` — läuft fehlerfrei
- [ ] Browser-Console: 0 Errors, 0 Warnings
- [ ] Keine offenen Bugs der Schweregrade „kritisch" oder „mittel"
- [ ] Git-Tag `v0.3.0` gesetzt

**Erst wenn ALLE Häkchen gesetzt sind, beginnt R3.**

---

## Offene Fragen / Risiken

- **Content-Erstellung-Aufwand:** 40–60 Karten balanciert zu schreiben ist Wochenarbeit. Wenn Zeit knapp: erstmal 30 Karten und Rarity-System hinten an stellen
- **Akt-3-Schwierigkeits-Spike:** Spätspiel muss spielbar bleiben. Playtests mit echten Spielern essentiell
- **Event-Inhalte:** Storytelling-Qualität in den Events ist schwer ohne Writer. Vorerst funktionale Texte, polierte Variante in R5
- **Map-Algorithmus:** Slay-the-Spire-Style ist nicht-trivial. Falls Aufwand explodiert, einfachere Heuristik akzeptieren (z. B. „mindestens 2 Pfade, mindestens 1 Schatz")
