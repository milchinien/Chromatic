# R3 — Meta-Progression

**Dauer:** ~1–2 Wochen · **Priorität:** mittel-hoch

> ⚠️ **Kern-Leitplanken (verbindlich):** Festes 25-Karten-Deck (kein Sammeln/Wachstum, nur Upgrades) · Mana = reine Anzeige ohne Mechanik · Shop upgradet (kein Kartenkauf) · DOM-Hybrid. Details: [README → Kern-Leitplanken](../README.md#kern-leitplanken).
>
> **🔄 angepasst:** **❌ Karten-Freischaltung entfällt** — alle 25 Karten sind immer verfügbar. Meta-Progression läuft über **freischaltbare Starter-Deck-Varianten** (verschiedene Zusammenstellungen **aus den 25 bestehenden Karten**), **Perks** (nicht-Mana) und **Achievements/Statistiken**. Perk-Beispiele dürfen **kein Mana** referenzieren.

## Ziel

Replay-Grund nach Sieg/Niederlage: freischaltbare **Starter-Deck-Varianten** (aus den bestehenden 25 Karten) + Perks + Achievements + Statistiken. *(🔄 „freigeschaltete Karten" ❌ entfällt — Karten sind immer alle verfügbar.)*

## 🎯 Definition of Done — Hauptziel (Gate)

> **Spieler hat über Runs hinweg sichtbare Progression: Achievements werden korrekt ausgelöst, Karten/Perks/Starter-Decks werden freigeschaltet, Statistik-Screen zeigt Karriere-Überblick. Meta-Save überlebt Run-Niederlagen und Browser-Refresh.**

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- Meta-Save separater LocalStorage-Key, überlebt Run-Save-Löschung
- Alle ≥ 10 Achievements korrekt triggerbar (Trigger-Test durchgelaufen)
- Achievement-Toast erscheint genau einmal pro Erfolg, nicht dauerhaft
- Mindestens 1 Perk und 1 **Starter-Deck-Variante** initial gesperrt und in Tests freischaltbar *(❌ „1 Karte freischaltbar" entfällt — alle Karten immer verfügbar)*
- Gesperrte Perks/Starter-Decks tauchen erst nach Unlock auf *(❌ „gesperrte Karten" entfällt)*
- Starter-Deck-Auswahl-Screen funktional, mehrere Decks wählbar (verschiedene Zusammenstellungen aus den 25 Karten, mit echten Combat-Unterschieden)
- Statistik-Screen zeigt korrekte Werte, Hover-Info für Unlocks-Bedingungen
- Tests grün (metaSave, unlocks, achievements)
- Browser-Console: 0 Errors, 0 Warnings

**🚧 Solange diese Bedingungen nicht erfüllt sind, wird R4 NICHT begonnen.**

---

## Voraussetzungen

- R1 fertig (Save-System existiert, kann erweitert werden)
- R2 fertig (genug Karten-Content, dass Freischalten Sinn ergibt)

---

## Schritt-für-Schritt-Anleitung

### 1. Meta-Save (separate Datei)
- [ ] `src/systems/save/MetaSave.ts`:
  ```ts
  interface MetaSave {
    metaVersion: 1;
    runsCompleted: number;
    runsWon: number;
    actsBeaten: { act1: number; act2: number; act3: number };
    // ❌ unlockedCards entfällt — alle 25 Karten sind immer verfügbar
    unlockedPerks: string[];
    unlockedStarterDecks: string[]; // Varianten aus den bestehenden 25 Karten
    achievements: string[];
    favoriteCard: { id: string; playCount: number };
    longestRun: number;          // Sekunden
    bestRunCoinsCollected: number;
  }
  ```
- [ ] Getrennt von Run-Save (`localStorage` Key `chromatic.meta`)
- [ ] Migration analog R1

### 2. Unlock-Bedingungen (3 Tage)
- [ ] `src/systems/meta/unlocks.ts` — pro Perk/Starter-Deck eine Funktion `isUnlocked(meta: MetaSave): boolean`
- [ ] Beispiele (🔄 ohne Mana, ohne Karten-Freischaltung):
  - Perk „Geschärfte Klingen+" (mehr Damage) — Unlock nach `runsWon >= 5`
  - Starter-Deck „Untot-Fokus" (Untot-lastige Auswahl aus den 25 Karten) — Unlock nach 50 Untot-Karten gespielt
  - Starter-Deck „Stein-Festung" (Tank-lastig) — Unlock nach `actsBeaten.act3 >= 1`
- [ ] Im Perk-Raum / Starter-Deck-Wahl: gesperrte Einträge erscheinen nicht *(❌ „gesperrte Karten im Shop filtern" entfällt — keine gesperrten Karten)*

### 3. Statistik-Tracking während Runs (1 Tag)
- [ ] In `RunState` ein Tracking-Subobjekt:
  ```ts
  stats: { startTime: number; cardsPlayed: Map<string, number>; coinsCollected: number; ... }
  ```
- [ ] Bei Run-Ende (Sieg/Niederlage): `mergeIntoMeta(stats)`

### 4. Statistik-Screen im Hauptmenü (2 Tage)
- [ ] Neuer Hauptmenü-Eintrag „STATISTIKEN"
- [ ] `src/scenes/StatsScene.ts` zeigt:
  - Runs gespielt / gewonnen / Win-Rate
  - Bestzeit, meiste Coins gesammelt
  - Lieblings-Karte (am häufigsten gespielt)
  - Akte besiegt
  - Unlocks-Übersicht: was schon frei, was noch nicht (+ Bedingung)
- [ ] Buttons: „ZURÜCK"

### 5. Mehrere Starter-Decks (2 Tage)
- [ ] Starter-Deck-Wahl im Hauptmenü vor Run-Start
- [ ] Initial verfügbar: „Generalist" (das bisherige Starter-Deck)
- [ ] Unlock-bar:
  - „Krieg-Spezialist" — Deck-Fokus auf Krieg/Krieger
  - „Stein-Festung" — Tank-fokussiert
  - „Untot-Sacrifice" — Hochrisiko-Synergien
- [ ] `src/systems/data/starterDecks.ts` mit 4–5 vorgefertigten Decks

### 6. Achievement-System (2 Tage)
- [ ] `src/systems/meta/achievements.ts` — Liste mit ~10 Erfolgen:
  - „Erster Sieg" — Akt 1 besiegt
  - „Combo-Meister" — 50 Combos in einem Combat
  - „Untot-Held" — Akt 3 mit Untot-Deck besiegt
  - „Pazifist" — Sieg ohne Schatz-Heilung
  - …
- [ ] Trigger-Hooks im Combat / Run-Code
- [ ] Toast-Notification beim Freischalten
- [ ] Liste in StatsScene sichtbar

### 7. Tests
- [ ] `test/metaSave.test.ts` — Round-Trip
- [ ] `test/unlocks.test.ts` — Bedingungen korrekt geprüft
- [ ] `test/achievements.test.ts` — alle Trigger funktional

### 8. Commit + Tag
- [ ] `git commit -m "R3: meta-progression (unlocks, starter decks, achievements, stats)"`
- [ ] Tag `v0.4.0`

---

## End-Zustand

**Datei-Baum (neu):**
```
src/
├── systems/
│   ├── save/
│   │   └── MetaSave.ts (neu)
│   ├── meta/
│   │   ├── unlocks.ts
│   │   └── achievements.ts
│   └── data/
│       └── starterDecks.ts (mehrere)
└── scenes/
    └── StatsScene.ts (neu)
```

**Sichtbares Verhalten:**
- Hauptmenü hat neuen Eintrag „STATISTIKEN"
- Vor Run-Start: Auswahl-Screen für Starter-Deck (initial nur „Generalist", weitere freischaltbar)
- Während des Spiels: Achievement-Toasts erscheinen bei Erfüllung
- Statistik-Screen zeigt Karriere-Übersicht, Unlocks mit Bedingungen
- Gesperrte **Perks / Starter-Deck-Varianten** tauchen erst nach Unlock auf *(❌ keine gesperrten Karten — alle 25 immer verfügbar)*
- Meta-Save überlebt Run-Niederlagen und Browser-Refreshs

---

## Akzeptanz-Test

1. Frischer Browser → nur „Generalist"-Starter verfügbar, 0 Achievements
2. Akt 1 gewinnen → Achievement-Toast „Erster Sieg" erscheint
3. StatsScene öffnen → Achievement gelistet, runsWon=1
4. Mehrere Runs zum Freischalten eines neuen Starter-Decks
5. Bei nächstem Run-Start: neues Starter-Deck wählbar
6. Mit dem neuen Deck spielen → andere Karten in der Hand
7. Browser-Refresh → Meta-Save persistiert, Run-Save (während aktivem Run) ebenfalls separat
8. Alle Test-Files grün

---

## ✅ Freigabe-Checkliste (vor Beginn von R4)

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] Alle ≥ 10 Achievements via Trigger-Test ausgelöst und im Stats-Screen sichtbar
- [ ] Mindestens 1 Perk und 1 Starter-Deck-Variante in Tests freigeschaltet *(❌ Karten-Freischaltung entfällt)*
- [ ] Meta-Save überlebt Run-Niederlage und Browser-Refresh
- [ ] `pnpm test` — alle Tests grün
- [ ] `pnpm lint` — keine Errors
- [ ] `pnpm build` — läuft fehlerfrei
- [ ] Browser-Console: 0 Errors, 0 Warnings
- [ ] Keine offenen Bugs der Schweregrade „kritisch" oder „mittel"
- [ ] Git-Tag `v0.4.0` gesetzt

**Erst wenn ALLE Häkchen gesetzt sind, beginnt R4.**

---

## Offene Fragen / Risiken

- **Grind-Gefühl:** Unlock-Bedingungen müssen erreichbar wirken, sonst frustriert. Vorschlag: jeder zweite Run sollte mind. ein Unlock bringen
- **Meta-Save-Korruption:** Verlust des Meta-Saves wäre frustrierend. Optional: Export/Import als Text-String anbieten
- **Skalierung Achievements:** 10 ist guter Start, später per Patch erweiterbar
- **Cheat-Schutz:** Im Browser-Spiel kein echter Cheat-Schutz möglich. LocalStorage manuell editierbar → bewusst akzeptieren, keine Server-Verifikation
