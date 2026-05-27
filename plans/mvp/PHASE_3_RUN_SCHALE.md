# Phase 3 — Run-Schale

**Dauer:** 3 Tage · **Risiko:** mittel

## Ziel

Ein vollständiger Run vom Hauptmenü bis zum Endboss-Sieg (oder Niederlage) ist spielbar. Die Welt-Karte funktioniert, der Spieler navigiert durch Knoten, in jedem Kampf-Knoten startet die `CombatScene` mit dem Spieler-Deck aus `RunState` und einem encounter-spezifischen Gegner-Deck.

## 🎯 Definition of Done — Hauptziel (Gate)

> **Ein kompletter Run vom Hauptmenü bis zum Endboss-Sieg (oder Niederlage) ist ohne Crashes, State-Lecks oder Carry-Over zwischen Runs spielbar. RunState (Coins, Deck, Base-HP) persistiert korrekt zwischen allen Welt-Knoten.**

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- Welt-Karte rendert korrekt mit Knoten, Edges, Spieler-Position, besuchte/erreichbare Markierungen
- Kampf-Knoten starten CombatScene mit korrekten Decks (Spieler-Deck aus RunState, Encounter-Deck aus Daten)
- Combat-Ergebnis (Coins, Base-HP-Verlust) wird korrekt in RunState zurückgeschrieben
- Base-HP-Schaden aus Combat überlebt den Wechsel zur Welt-Karte
- Sieg/Niederlage führt zur richtigen Folge-Szene (VictoryScene / GameOverScene)
- Neustart eines Runs gibt frischen, kompletten RunState ohne Restbestände aus dem alten Run
- MapGenerator-Snapshot-Test grün, RunState-Tests grün
- 3 komplette Test-Runs (1× Sieg, 1× Niederlage, 1× vorzeitig abgebrochen) ohne Crash
- Browser-Console: 0 Errors, 0 Warnings über alle Test-Runs

**🚧 Solange diese Bedingungen nicht erfüllt sind, werden Phasen 4/5/6 NICHT begonnen.** Run-State-Bugs in Phase 4+ sind schwer zu lokalisieren, wenn schon die Phase-3-Schale undicht ist.

---

## Voraussetzungen

- Phase 2 abgeschlossen, Combat funktioniert in der Sandbox
- [GAME_DESIGN.md Sektion 3, 7](../../GAME_DESIGN.md) gelesen (Meta-Struktur, Run-Progression)

---

## Schritt-für-Schritt-Anleitung

### 1. RunState als zentraler Container
- [ ] `src/systems/run/RunState.ts`:
  ```ts
  interface RunState {
    seed: number;
    actNumber: number;
    coins: number;                // start 550
    deck: Card[];                 // start = starterDeck
    activePerks: Perk[];          // leer in Phase 3
    map: ActMap;                  // siehe MapGenerator
    currentNodeId: string;
    visitedNodes: Set<string>;
    baseHp: number;               // persistent zwischen Kämpfen
    maxBaseHp: number;
  }
  ```
- [ ] Factory: `createRunState(seed: number): RunState`
- [ ] Pure-Funktionen für State-Updates: `addCoins`, `addCardToDeck`, `markNodeVisited`, `setCurrentNode`, `damageBase`, `healBase`

### 2. Map-Generator (Welt-Karte Akt 1)
- [ ] `src/systems/run/MapGenerator.ts`:
  - `generateAct(actNumber: number, rng: Rng): ActMap`
  - **Akt 1 für MVP:** 5–6 Layer mit 1–2 Knoten je Layer, Endboss als letztes
  - Knoten-Typ-Verteilung (Akt 1):
    - Layer 1 (Start): immer `combat_normal`
    - Layer 2: `combat_normal` oder `treasure`
    - Layer 3: `shop`
    - Layer 4: `combat_normal` oder `combat_hard`
    - Layer 5 (Endboss): `boss`
  - Edges: jeder Knoten ist mit 1–2 Knoten der nächsten Layer verbunden, sodass Endboss von Start aus erreichbar
- [ ] Typ-Definition:
  ```ts
  type NodeType = 'combat_normal' | 'combat_hard' | 'shop' | 'treasure' | 'perk' | 'boss';
  interface MapNode { id: string; type: NodeType; layer: number; x: number; y: number; edges: string[]; }
  interface ActMap { nodes: MapNode[]; startNodeId: string; bossNodeId: string; }
  ```
- [ ] Snapshot-Test mit fixem Seed (Akt 1 reproduzierbar)

### 3. Starter-Deck festlegen
- [ ] `src/systems/data/starterDeck.ts` exportiert 10 Karten-IDs (Subset aus `cards.ts`)
- [ ] Komposition: 2× Natur, 2× Krieg, 2× Stein, 1× Untot, 3× farbloss-billig — sorgt für Combo-Möglichkeiten ohne zu fokussiert zu sein
- [ ] Diese Auswahl ist eine **Design-Entscheidung**; siehe [GAME_DESIGN.md Sektion 9](../../GAME_DESIGN.md) (offene Punkte)

### 4. Encounter-Daten
- [ ] `src/systems/data/encounters.ts`:
  ```ts
  interface Encounter {
    id: string;
    deck: string[];        // Card-IDs
    startMana?: number;
    coinReward: number;
    cardDropChance?: number;
  }
  export const encounters = {
    combat_normal_act1: { ... },   // 8 Karten, 30 Coins
    combat_hard_act1: { ... },     // 12 Karten, 60 Coins
    boss_act1: { ... },            // 15 Karten, 150 Coins
  };
  ```
- [ ] Decks handgemacht, sodass sie Combos in sich tragen (z. B. der Akt-1-Boss spielt aggressiv Krieg-Karten)

### 5. WorldMapScene mit echter Karten-Darstellung
- [ ] `src/scenes/WorldMapScene.ts` neu:
  - Empfängt `runState` als Init-Parameter
  - Rendert alle Knoten der `runState.map` als Kreise (Farbe nach Typ: rot=combat, grün=treasure, gelb=shop, lila=perk, schwarz=boss)
  - Edges als graue Linien
  - Aktueller Knoten hervorgehoben (gelber Ring)
  - Besuchte Knoten dunkler gefärbt
  - Erreichbare Nachbar-Knoten klickbar (Pulsen-Animation)
  - Coins-Anzeige oben rechts
  - Base-HP-Anzeige oben links
  - Klick auf erreichbaren Knoten → Knoten-Aktion auslösen (siehe Schritt 6)
- [ ] `src/ui/NodeGraphRenderer.ts` — wiederverwendbar für RoomMapScene später

### 6. Knoten-Aktion-Dispatcher
- [ ] Helper `enterNode(runState, nodeId, scene)` in `src/systems/run/`:
  - `combat_normal` / `combat_hard` / `boss` → `scene.scene.start('CombatScene', { runState, encounter })`
  - `treasure` / `shop` / `perk` kommen in Phasen 4/6 dazu — für Phase 3 erstmal als „nicht implementiert"-Hinweis und Knoten wird einfach als besucht markiert
- [ ] `currentNodeId` updaten, `visitedNodes` ergänzen

### 7. CombatScene an RunState anschließen
- [ ] `CombatScene.init({ runState, encounter })`:
  - `playerDeck = runState.deck`
  - `enemyDeck = encounter.deck.map(id => cards[id])`
  - Spieler-Base-HP = `runState.baseHp` (persistent!)
- [ ] Bei Sieg:
  - `runState.coins += encounter.coinReward`
  - `runState.baseHp = combatState.player.baseHp` (Schaden persistiert)
  - `scene.scene.start('WorldMapScene', { runState })`
- [ ] Bei Niederlage:
  - `scene.scene.start('GameOverScene', { runState })`
- [ ] Bei Boss-Sieg:
  - `scene.scene.start('VictoryScene', { runState })` (kurze „Akt 1 geschafft"-Anzeige, dann Hauptmenü)

### 8. Neue Szenen
- [ ] `src/scenes/GameOverScene.ts` — Text „NIEDERLAGE", Stats (Coins gesammelt, Räume besucht), Button → Hauptmenü
- [ ] `src/scenes/VictoryScene.ts` — Text „AKT 1 GESCHAFFT", Button → Hauptmenü
- [ ] Beide registrieren in `main.ts`

### 9. Hauptmenü-„SPIELEN" anschließen
- [ ] Klick auf „SPIELEN" generiert neuen `runState` mit zufälligem Seed und startet `WorldMapScene`
- [ ] Dev-Shortcut `D` aus Phase 2 bleibt für isolierten Combat-Test erhalten

### 10. Manueller Run-Test
- [ ] Mindestens 3 komplette Runs gespielt: Sieg, Niederlage, vorzeitiger Abbruch
- [ ] Bugs gefunden + behoben (typisch: State-Carry-over zwischen Runs, falsche Coin-Berechnung, Combat-Daten nicht zurückgesetzt)

### 11. Commit
- [ ] `git add . && git commit -m "Phase 3: full run loop playable"`

---

## End-Zustand

**Datei-Baum (neue/geänderte Dateien):**
```
src/
├── systems/
│   ├── run/
│   │   ├── RunState.ts
│   │   ├── MapGenerator.ts
│   │   └── nodeDispatcher.ts
│   └── data/
│       └── encounters.ts (neu)
├── scenes/
│   ├── WorldMapScene.ts (massiv erweitert)
│   ├── CombatScene.ts (init-Hook erweitert)
│   ├── GameOverScene.ts (neu)
│   └── VictoryScene.ts (neu)
└── ui/
    └── NodeGraphRenderer.ts (neu)

test/
├── mapGenerator.test.ts (Snapshot mit Seed)
└── runState.test.ts (Coin-Addition, Karten-Add)
```

**Sichtbares Verhalten:**
- Hauptmenü → „SPIELEN" → Welt-Karte mit sichtbarem DAG aus ~6 Knoten
- Spieler-Position als gelb umrandeter Knoten am Anfang
- Coins-Anzeige zeigt 550
- Base-HP-Anzeige zeigt 100/100
- Klick auf erreichbaren Nachbar-Knoten → bei Kampf-Knoten startet CombatScene
- Combat zu Ende → zurück zur Welt-Karte, Coins um Belohnung erhöht, alter Knoten als „besucht" gefärbt, neue Nachbarn klickbar
- Base-HP-Schaden aus Combat persistiert auf der Welt-Karte
- Boss-Sieg → VictoryScene → Hauptmenü
- Niederlage in jedem Kampf → GameOverScene → Hauptmenü
- Neuer Run beginnt mit frischem RunState (kein Carry-Over)

**Was noch fehlt (kommt in späteren Phasen):**
- Shop/Treasure/Perk-Knoten zeigen nur Platzhalter (Phase 4 + 6)
- Sub-Knoten-Maps innerhalb eines Welt-Knotens (Phase 5)
- Akt 2+ (Post-MVP)

---

## Akzeptanz-Test (manuell)

1. „SPIELEN" → Welt-Karte erscheint, 5–6 Knoten sichtbar
2. Start-Knoten ist gelb umrandet, Coins zeigen 550, HP zeigt 100/100
3. Klick auf einen Nachbar-Kampf-Knoten → CombatScene startet mit korrektem Spieler-Deck (10 Starter-Karten) und encounter-spezifischem Gegner-Deck
4. Combat gewinnen → zurück zur Welt-Karte, Coins erhöht (z. B. +30), aktueller Knoten verschoben, alter Knoten als besucht gefärbt
5. Bis zum Boss durchspielen → Boss-Encounter sichtbar härter → bei Sieg „AKT 1 GESCHAFFT"-Screen → Hauptmenü
6. Neuen Run starten → frische Welt-Karte (anderer Seed möglich), Coins zurück auf 550, HP zurück auf 100
7. Run absichtlich verlieren → GameOverScene → Hauptmenü → neuer Run möglich
8. Map-Generator-Snapshot-Test grün

---

## ✅ Freigabe-Checkliste (vor Beginn von Phase 4/5/6)

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] 3 komplette Test-Runs (Sieg, Niederlage, Abbruch) ohne Crash
- [ ] `pnpm test` — alle Tests grün (MapGenerator-Snapshot, RunState)
- [ ] `pnpm lint` — keine Errors
- [ ] `pnpm build` — läuft fehlerfrei
- [ ] Browser-Console: 0 Errors, 0 Warnings über alle Test-Runs
- [ ] Keine State-Carry-Over zwischen Runs verifiziert
- [ ] Keine offenen Bugs der Schweregrade „kritisch" oder „mittel"
- [ ] Phase-Commit erstellt

**Erst wenn ALLE Häkchen gesetzt sind, beginnt Phase 4 (oder 5 oder 6 — diese drei sind in beliebiger Reihenfolge möglich).**

---

## Offene Fragen / Risiken

- **Coin-Belohnung pro Encounter-Typ:** Vorschlag `combat_normal=30, combat_hard=60, boss=150` — muss in Phase 7 mit Shop-Preisen abgestimmt werden
- **Base-HP-Heilung:** In Phase 3 gibt es keine Heilung. Spieler kann durch unglückliche Kämpfe sterben, ohne Chance zu regenerieren. Phase 4 löst das (Treasure heilt).
- **Map-Layout-Algorithmus:** Aktuell einfacher Layered-Random. Slay-the-Spire-Style mit Pfad-Crossing-Verboten kommt erst Post-MVP (R2).
