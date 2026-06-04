# Phase 5 — Sub-Maps (Raum-Karte, Ebene B)

**Dauer:** 1 Tag · **Risiko:** niedrig

> ⚠️ **Kern-Leitplanken (Stand 2026-06):** Historischer MVP-Bau-Plan. Verbindlicher **aktueller Kern**: festes 25-Karten-Deck (kein Sammeln/Wachstum, nur Upgrades) · Mana = reine Anzeige ohne Mechanik · Shop upgradet (kein Kartenkauf) · DOM-Hybrid (kein Phaser). Details: [README → Kern-Leitplanken](../README.md#kern-leitplanken).

## Ziel

Jeder Welt-Knoten ist intern eine eigene Raum-Karte mit 3–5 Sub-Knoten. Der Spieler navigiert durch diese Sub-Karte, durchläuft alle (oder ein Zwischenboss-Exit), und kehrt erst dann zur Welt-Karte zurück. Dadurch fühlt sich jeder Welt-Raum nach mehreren Encountern an, nicht nach einem einzelnen Kampf.

## 🎯 Definition of Done — Hauptziel (Gate)

> **Jeder Welt-Kampfknoten öffnet eine Sub-Map mit mindestens 3 Sub-Knoten. Spieler durchläuft Sub-Encounters und kehrt erst über Exit-Knoten (oder Mini-Boss-Sieg) zur Welt-Karte zurück. Boss-Welt-Knoten überspringt die Sub-Map und startet direkt den Boss-Combat.**

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- Sub-Map-Generator erzeugt deterministisch (Snapshot-Test grün) und garantiert erreichbares Exit
- Spieler kann innerhalb einer Sub-Map nicht „stecken" (jeder Sub-Knoten hat erreichbaren Weiterweg)
- Wechsel Welt-Karte → Sub-Map → Combat → Sub-Map → Welt-Karte funktioniert ohne State-Verlust
- Boss-Welt-Knoten startet **direkt** Boss-Combat, ohne Sub-Map dazwischen
- Sub-Map wird bei Wiederbetretung (während desselben Welt-Knotens) konsistent angezeigt
- Mini-Boss-Sieg führt korrekt zurück zur Welt-Karte
- Tests grün (roomMapGenerator)
- Browser-Console: 0 Errors, 0 Warnings über 2 komplette Test-Runs

**🚧 Solange diese Bedingungen nicht erfüllt sind, wird die nächste Phase NICHT begonnen.**

---

## Voraussetzungen

- Phase 3 abgeschlossen (Welt-Karte funktioniert)
- Phase 4 ist parallel möglich, aber Sub-Maps ohne Shop/Schatz funktionieren auch
- [GAME_DESIGN.md Sektion 3 Ebene B](../../GAME_DESIGN.md) gelesen

---

## Schritt-für-Schritt-Anleitung

### 1. Sub-Map-Typen und Generator
- [ ] `src/systems/run/RoomMapGenerator.ts`:
  - `generateRoom(worldNode: MapNode, actNumber: number, rng: Rng): RoomMap`
  - **Anzahl Sub-Knoten:** `3 + (actNumber - 1)` (Akt 1: 3, Akt 2: 4, ...)
  - **Layout:**
    - Layer 1: Spieler-Spawn (immer)
    - Layer 2 + 3: Mix aus `sub_combat`, `sub_treasure` (gewichtet 70/30)
    - Letzter Layer: bei Boss-Knoten → `boss`, bei `combat_hard`-Knoten → `mini_boss`, sonst → `exit`
  - Typ-Definition:
    ```ts
    type SubNodeType = 'sub_combat' | 'sub_treasure' | 'mini_boss' | 'exit';
    interface SubNode { id: string; type: SubNodeType; layer: number; x: number; y: number; edges: string[]; }
    interface RoomMap { nodes: SubNode[]; startNodeId: string; exitNodeId: string; }
    ```
- [ ] Snapshot-Test mit fixem Seed

### 2. RoomMapScene
- [ ] `src/scenes/RoomMapScene.ts`:
  - **Init**: erhält `runState` und `worldNodeId`
  - **Verhalten**:
    - Generiert (oder lädt aus Cache) die `RoomMap` für diesen Welt-Knoten
    - Rendert mit demselben `NodeGraphRenderer` wie Welt-Karte, aber kleiner und in eigenem Stil (anderer Hintergrund)
    - Spieler startet am `startNodeId`
    - Klick auf erreichbaren Sub-Knoten → analog zur Welt-Karte
    - Bei Klick auf `exit`-Knoten: zurück zur `WorldMapScene`, Welt-Knoten als „besucht" markiert
    - Bei `mini_boss`-Sieg: zurück zur `WorldMapScene` (mini_boss ist das Exit-Gate)
  - **Cache:** RoomMap wird einmal generiert (deterministisch über `seed + worldNodeId`) und ggf. in `runState.roomMaps` zwischengespeichert, damit der Spieler beim Verlassen+Wiederbetreten dieselbe Sub-Map sieht

### 3. RunState erweitern
- [ ] `runState.roomMaps: Map<worldNodeId, RoomMap>` (kann lazy gefüllt werden)
- [ ] `runState.currentRoomNodeId?: string` für aktuellen Sub-Knoten innerhalb des aktuellen Welt-Knotens

### 4. nodeDispatcher aktualisieren
- [ ] Statt direkt `CombatScene` zu starten, bei Kampf-Welt-Knoten zuerst `RoomMapScene` öffnen
- [ ] Innerhalb von `RoomMapScene` startet dann pro Sub-Knoten die jeweilige Szene (`CombatScene`, `TreasureScene`)
- [ ] Boss-Welt-Knoten (Endboss) hat **keine** Sub-Map, sondern startet direkt die `CombatScene` mit dem Boss-Encounter — die Ebene B macht hier keinen Sinn

### 5. Encounter-Varianz im Sub-Knoten
- [ ] `sub_combat` nutzt den `combat_normal_act1`-Encounter
- [ ] `mini_boss` nutzt einen neuen Encounter `mini_boss_act1` in `encounters.ts` (etwas schwächer als Endboss, etwa 100 Coins Belohnung)
- [ ] `sub_treasure` nutzt dieselbe TreasureScene wie auf Welt-Ebene

### 6. Visuelle Unterscheidung
- [ ] WorldMapScene-Hintergrund: dunkelgrau
- [ ] RoomMapScene-Hintergrund: dunkelblau (oder ähnlich) — damit der Spieler sieht, dass er „in einem Raum" ist
- [ ] Optionaler Header in RoomMapScene: „Raum: [Welt-Knoten-Typ]"

### 7. Test
- [ ] `test/roomMapGenerator.test.ts` — deterministisch, 3 Sub-Knoten für Akt 1, Exit erreichbar
- [ ] Manuell: 2 komplette Runs gespielt, in jedem Welt-Raum die Sub-Map durchlaufen

### 8. Commit
- [ ] `git commit -m "Phase 5: sub-maps (rooms with internal node graphs)"`

---

## End-Zustand

**Datei-Baum (neue/geänderte Dateien):**
```
src/
├── systems/
│   └── run/
│       ├── RoomMapGenerator.ts (neu)
│       └── RunState.ts (roomMaps + currentRoomNodeId)
├── scenes/
│   └── RoomMapScene.ts (neu)
└── systems/
    └── data/
        └── encounters.ts (mini_boss_act1 ergänzt)

test/
└── roomMapGenerator.test.ts
```

**Sichtbares Verhalten:**
- Klick auf Welt-Karten-Kampf-Knoten → RoomMapScene öffnet sich mit andersfarbigem Hintergrund
- Sub-Karte zeigt 3 Sub-Knoten in DAG-Form
- Spieler startet am Spawn, klickt sich durch Sub-Kämpfe und Sub-Schätze
- Bei Erreichen des Exit-Knotens (oder Sieg über Mini-Boss) → zurück zur Welt-Karte, der Welt-Knoten ist als besucht markiert
- Boss-Welt-Knoten überspringt die Sub-Map und startet direkt den Boss-Encounter

**Was noch fehlt:**
- Sub-Knoten-Skalierung über Akte (mehr Knoten in Akt 2+): bleibt für Post-MVP, hier nur Akt 1
- Visuelle Polish (Phase 7)

---

## Akzeptanz-Test (manuell)

1. Run starten, ersten Kampf-Welt-Knoten anklicken → RoomMapScene öffnet sich
2. 3 Sub-Knoten sichtbar, Spawn-Knoten markiert
3. Sub-Kampf durchspielen → zurück zur RoomMap, alter Sub-Knoten als besucht
4. Sub-Schatz besuchen → TreasureScene öffnet sich, Belohnung vergeben
5. Exit-Knoten erreichen → zurück zur Welt-Karte, Welt-Knoten ist nun besucht
6. Welt-Knoten kein zweites Mal betretbar (nicht klickbar)
7. Boss-Welt-Knoten betreten → **direkt** CombatScene, keine Sub-Map
8. Snapshot-Test grün

---

## ✅ Freigabe-Checkliste (vor Beginn der nächsten Phase)

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] 2 komplette Test-Runs durch alle Sub-Maps ohne Crash
- [ ] Boss-Knoten überspringt Sub-Map korrekt
- [ ] Wiederbetretung eines Welt-Knotens verboten/sauber gehandhabt
- [ ] `pnpm test` — alle Tests grün
- [ ] `pnpm lint` — keine Errors
- [ ] `pnpm build` — läuft fehlerfrei
- [ ] Browser-Console: 0 Errors, 0 Warnings
- [ ] Keine offenen Bugs der Schweregrade „kritisch" oder „mittel"
- [ ] Phase-Commit erstellt

**Erst wenn ALLE Häkchen gesetzt sind, beginnt die nächste Phase.**

---

## Offene Fragen / Risiken

- **State-Persistenz innerhalb eines Welt-Knotens:** Wenn der Spieler die Welt-Karte verlässt (z. B. Browser-Refresh), ist der aktuelle Sub-Map-Fortschritt weg. Im MVP akzeptabel (kein Save-System), in R1 sauber gelöst.
- **Bottleneck-Empfindung:** Wenn Sub-Maps sich repetitiv anfühlen (immer 3 Kämpfe), in R2 mehr Sub-Knoten-Typen einführen
- **Mini-Boss-Encounter:** Vorerst handgemacht. Wenn zu schwer/leicht → Phase 7 Balance
