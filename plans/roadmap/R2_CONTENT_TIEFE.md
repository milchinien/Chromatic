# R2 — Content-Tiefe

**Dauer:** ~2–3 Wochen · **Priorität:** hoch

> ⚠️ **Kern-Leitplanken (verbindlich):** Festes 25-Karten-Deck (kein Sammeln/Wachstum, nur Upgrades) · Mana = reine Anzeige ohne Mechanik · Shop upgradet (kein Kartenkauf) · DOM-Hybrid (kein Phaser). Details: [README → Kern-Leitplanken](../README.md#kern-leitplanken).
>
> **🔄 R2 stark angepasst:** Dieser Plan war ursprünglich auf **Karten-Sammeln** ausgelegt — das widerspricht dem festen Deck und bräuchte zudem 40+ neue Karten-Art-PNGs (existieren nicht). Daher **❌ entfällt**: ≥40-Karten-Pool, Rarity-Drop-System, Choice-Knoten (Karten hinzufügen), Karten-Drop-Pools pro Encounter. **Content-Tiefe kommt stattdessen** aus: Akt-2/3-Politur, besserer Map-Generierung sowie **Event-** und **Elite-Knoten** (Belohnungen = Coins/Heilung/Upgrades, **nie** Karten).

## Ziel

Mehr Replay-Value **ohne** das feste Deck anzutasten: mehrere Akte mit eskalierender Schwierigkeit, bessere Map-Generierung, sowie neue **Event-** und **Elite-Knoten**. *(Ursprüngliches Ziel „mehr Karten" ❌ entfällt — Kern: festes 25-Karten-Deck.)*

## 🎯 Definition of Done — Hauptziel (Gate)

> **3 Akte sind nahtlos hintereinander spielbar mit eskalierender Schwierigkeit. Map-Generator erzeugt mit verschiedenen Seeds visuell und strategisch unterschiedliche Karten, die alle Constraints erfüllen. Event- und Elite-Knoten bereichern jeden Akt.** *(🔄 „Karten-Pool ≥ 40 + Rarity-System" ❌ entfällt — festes 25-Karten-Deck.)*

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- Akt 1 → 2 → 3 läuft ohne Crashes, Schwierigkeit eskaliert messbar (KI-Mana, Gegner-Stats)
- Jeder Akt hat einen erkennbar anderen Boss-Stil
- ❌ ~~Karten-Pool ≥ 40 Karten~~ — entfällt (festes 25-Karten-Deck)
- ❌ ~~Rarity-Verteilung (1000 Draws)~~ — entfällt (keine Karten-Drops)
- Map-Generator-Constraints: jeder Pfad enthält mind. 1 Schatz, jeder Akt enthält mind. 1 Shop und 1 Perk-Raum, Pfade kreuzen sich nicht *(Schatz-/Shop-/Perk-Garantien bereits in `MapGenerator.ts`/`RoomMapGenerator.ts` umgesetzt)*
- **Event-** und **Elite-Knoten** funktional, alle Outcomes getestet *(🔄 „Choice-Knoten zum Karten-Hinzufügen" ❌ entfällt → stattdessen Event-Knoten mit Coins/Heilung/Perk-Outcomes)*
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

### 2. ❌ ~~Karten-Pool auf ~40–60 Karten ausbauen~~ — ENTFÄLLT
> Widerspricht dem festen 25-Karten-Deck und bräuchte 40+ neue Art-PNGs. **Stattdessen** (passt zum Kern): Balance-Politur der bestehenden 25 Karten + ihrer **Upgrade-Kurven** (`balance.ts`), damit jede Karte eine Rolle hat. Kein Rarity-Drop, kein CSV-Karten-Generator, kein neuer Karten-Content.
- [ ] Balance-Pass der 25 bestehenden Karten + Upgrade-Skalierung im Sandbox-Modus

### 3. Constraint-basierte Map-Generierung (3 Tage)
- [ ] Aktueller MapGenerator: einfacher Layered-Random
- [ ] Neuer Algorithmus à la Slay-the-Spire:
  - Pfade kreuzen sich nicht
  - Mindestens 2 verschiedene Pfade pro Akt
  - Schatz-Räume garantiert auf jedem Pfad
  - Shop garantiert mindestens 1× pro Akt
  - Perk-Raum mindestens 1× pro Akt
- [ ] Snapshot-Tests für mehrere Seeds, Lesbarkeits-Test (Karten sehen interessant aus, nicht nur linear)

### 4. Neue Knoten-Typen (3 Tage) — **Kern dieser angepassten R2**
- [ ] **Elite-Combat**: zwischen normalem Kampf und Boss, härter, gibt überdurchschnittliche **Coin-Belohnung + gratis Karten-Upgrade** (keine neue Karte)
- [ ] **Event-Knoten**: textbasiertes Mini-Ereignis mit 2–3 Auswahlmöglichkeiten. Outcomes nur aus dem Kern-Ökonomie-Repertoire: **Coins, Heilung, Perk, gratis Upgrade, Risiko/Belohnung** („Ein alter Magier bietet: 100 Coins gegen einen Perk?"). **❌ niemals Karten-Drops.**
- [ ] ❌ ~~Choice-Knoten (3 Karten kostenlos hinzufügen)~~ — entfällt (festes Deck)
- [ ] Eigene DOM-Screens pro Typ (`src/screens/Event.ts`, `Elite` als Encounter-Variante), gleiche Architektur wie Shop/Treasure; in `MapGenerator` als neue `NodeType` integrieren

### 5. ❌ ~~Karten-Drop-Pool pro Encounter-Typ~~ — ENTFÄLLT
> Es gibt keine Karten-Drops (festes Deck). Thematisches Run-Building läuft über **Akt-Farbe** (Boss-Auswahl) + **Upgrade-Schwerpunkte** im Shop, nicht über Karten-Sammeln.

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
2. In jedem Akt mind. 1× einen Event-Knoten getroffen → 2–3 Optionen mit jeweils unterschiedlichem Outcome (Coins/Heilung/Perk/Upgrade)
3. Elite-Knoten getroffen → härterer Kampf, überdurchschnittliche Coin/Upgrade-Belohnung *(❌ Choice-Karten-Knoten entfällt)*
4. ❌ ~~Epic-Karte aus Boss~~ — entfällt (Boss gibt Coins + gratis Upgrade)
5. Map-Generator: 5 verschiedene Seeds → 5 visuell deutlich unterschiedliche Karten, alle mit Schatz/Shop garantiert
6. Alle neuen Test-Files grün
7. ❌ ~~Karten-Tabelle (40–60 Stück)~~ — entfällt (festes 25-Karten-Deck)

---

## ✅ Freigabe-Checkliste (vor Beginn von R3)

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] Mindestens 3 komplette 3-Akt-Runs durchgespielt
- [ ] ❌ ~~Karten-Pool ≥ 40~~ — stattdessen: die 25 bestehenden Karten + Upgrade-Kurven balanciert
- [ ] Event-/Elite-Knoten funktional, alle Outcomes getestet (keine Karten-Drops)
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
