# Phase 4 — Deck-Wachstum (Shop & Schatz)

**Dauer:** 2 Tage · **Risiko:** niedrig

## Ziel

Der Spieler kann sein Deck im Laufe eines Runs erweitern: durch Karten-Kauf im Shop und durch Belohnungen aus Schatz-Räumen. Die hinzugefügten Karten werden in folgenden Combat-Encountern tatsächlich gezogen.

## 🎯 Definition of Done — Hauptziel (Gate)

> **Spieler kann im laufenden Run im Shop Karten kaufen und im Schatz-Raum Belohnungen erhalten. Gekaufte/gefundene Karten erscheinen im nächsten Combat im Random-Draw-Cycle. Coins werden korrekt verrechnet.**

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- Shop zeigt 4 Karten mit korrekten Preisen und Hover-Info
- Kauf zieht Coins korrekt ab, Doppelt-Kauf derselben Karte verhindert (Karte ausgegraut)
- Gekaufte Karte ist im Deck und kann im nächsten Combat auftauchen
- Schatz-Raum vergibt jede der 3 Belohnungs-Typen (Coins / Karte / HP) während des Testens mindestens einmal
- Schatz-Belohnung wird bei Wiederbetretung nicht erneut vergeben
- HP-Heilung respektiert `maxBaseHp` (kein Overheal)
- Alle Tests grün (dropPool, shopPricing, runStateDeck)
- Browser-Console: 0 Errors, 0 Warnings

**🚧 Solange diese Bedingungen nicht erfüllt sind, wird die nächste Phase NICHT begonnen.** Coin-Berechnungs-Bugs lecken in alle Folge-Phasen.

---

## Voraussetzungen

- Phase 3 abgeschlossen, Run-Loop funktioniert
- [GAME_DESIGN.md Sektion 4.3 + 4.4](../../GAME_DESIGN.md) gelesen (Shop, Schatz-Raum)

---

## Schritt-für-Schritt-Anleitung

### 1. Karten-Drop-Pool definieren
- [ ] `src/systems/data/cards.ts` erweitern: jede Karte bekommt ein `rarity: 'common' | 'rare'` Feld (MVP: alle „common", aber Feld einbauen für später)
- [ ] `src/systems/data/dropPool.ts`:
  ```ts
  export function getRandomDrops(pool: Card[], n: number, rng: Rng): Card[]
  export const shopPool: Card[] = [...alle 'common'-Karten];
  export const treasurePool: Card[] = [...alle 'common'-Karten];
  ```

### 2. ShopScene
- [ ] `src/scenes/ShopScene.ts`:
  - **Init**: erhält `runState`
  - **Layout**:
    - Oben links: Coins-Anzeige
    - Mitte: 4 Karten als `CardView` nebeneinander
    - Rechts: Info-Panel (zeigt Stats der gehoverten Karte)
    - Unten: „VERLASSEN"-Button
  - **Verhalten**:
    - 4 zufällige Karten aus `shopPool` ziehen (Seed aus Knoten-ID, damit Wiederbetreten gleichen Shop zeigt)
    - Karten-Preis nach Stat-Heuristik: `cost = 50 + manaCost * 10` (einfache MVP-Formel)
    - Hover → Info-Panel füllt sich mit Karten-Details
    - Klick auf Karte: wenn Coins ≥ Preis → Coins abziehen, `runState.deck` ergänzen, Karte ausgrauen (gekauft)
    - „VERLASSEN" → zurück zur WorldMapScene mit aktualisiertem RunState
- [ ] Wiederverwendung: `CardView` aus Phase 2 mit Erweiterung um „Kauf-Indikator" (Preis sichtbar)

### 3. TreasureScene
- [ ] `src/scenes/TreasureScene.ts`:
  - **Init**: erhält `runState`, würfelt EIN Belohnungs-Typ via Seed
  - **Belohnungs-Typen** (jeweils 1/3 Wahrscheinlichkeit):
    - **Coins**: +50 Coins, Anzeige „+50 Coins erhalten"
    - **Karte**: 1 zufällige Karte aus `treasurePool`, wird automatisch zum Deck hinzugefügt, Anzeige zeigt die Karte
    - **Heilung**: +30 Base-HP (gekappt bei `maxBaseHp`), Anzeige „+30 HP geheilt"
  - **Button „WEITER"** → zurück zur WorldMapScene
- [ ] Schatz wird beim Wiederbetreten **nicht** neu vergeben (Knoten in `visitedNodes` → Schatz schon eingesammelt → Knoten zeigt nur „Leer")

### 4. MapGenerator-Update
- [ ] `MapGenerator.generateAct(1)` darf jetzt Shop- und Schatz-Knoten platzieren:
  - Layer 2: 50% `combat_normal`, 30% `treasure`, 20% `combat_normal`
  - Layer 3: 50% `shop`, 50% `combat_normal`
  - Layer 4: 60% `combat_normal`, 20% `treasure`, 20% `combat_hard`
- [ ] Snapshot-Test aktualisieren

### 5. nodeDispatcher erweitern
- [ ] `treasure` → `scene.scene.start('TreasureScene', { runState })`
- [ ] `shop` → `scene.scene.start('ShopScene', { runState })`
- [ ] Beim Verlassen kehrt jede Szene zur WorldMap zurück

### 6. RunState-Update bei Karten-Erwerb
- [ ] `addCardToDeck(state, card)` Pure-Funktion testen
- [ ] Sicherstellen: gekaufte Karte erscheint im nächsten Combat im Random-Pool

### 7. Tests
- [ ] `test/dropPool.test.ts` — gibt n verschiedene Karten zurück, deterministisch mit Seed
- [ ] `test/shopPricing.test.ts` — Preise korrekt nach Formel
- [ ] `test/runStateDeck.test.ts` — Karte hinzugefügt → erscheint im Deck

### 8. Manueller Test
- [ ] Run starten, Shop besuchen, Karte kaufen, in nächsten Kampf gehen — die Karte muss in der Hand erscheinen können (Zufalls-Draw)
- [ ] Schatz besuchen, jeden der 3 Belohnungs-Typen einmal getroffen haben

### 9. Commit
- [ ] `git commit -m "Phase 4: shop and treasure rooms"`

---

## End-Zustand

**Datei-Baum (neue/geänderte Dateien):**
```
src/
├── systems/
│   └── data/
│       ├── cards.ts (rarity-Feld ergänzt)
│       └── dropPool.ts (neu)
├── scenes/
│   ├── ShopScene.ts (neu)
│   └── TreasureScene.ts (neu)
└── ui/
    └── CardView.ts (Preis-Anzeige ergänzt)

test/
├── dropPool.test.ts
├── shopPricing.test.ts
└── runStateDeck.test.ts
```

**Sichtbares Verhalten:**
- Welt-Karte enthält gelbe (Shop) und grüne (Schatz) Knoten
- Klick auf Shop-Knoten → ShopScene öffnet sich, 4 Karten + Preise sichtbar
- Hover über eine Karte → rechts Info mit Stats
- Kauf-Klick → Coins werden abgezogen, Karte verschwindet aus Auswahl, Deck wächst
- „VERLASSEN" → zurück zur Welt-Karte, gekaufter Knoten als besucht markiert
- Klick auf Schatz-Knoten → TreasureScene öffnet sich, eine der 3 Belohnungen wird zufällig vergeben und sichtbar bestätigt
- Im nächsten Combat: gekaufte/gefundene Karten erscheinen mit Wahrscheinlichkeit (deckabhängig) in der Hand

**Was noch fehlt:**
- Sub-Maps in Welt-Knoten (Phase 5)
- Perks (Phase 6)
- Rarity-System ist noch flach (alle „common") — R2 baut Rare/Epic aus

---

## Akzeptanz-Test (manuell)

1. Run starten, zum Shop gehen → 4 verschiedene Karten mit Preisen sichtbar
2. Eine Karte hovern → Info erscheint rechts mit allen Stats
3. Kaufen → Coins ziehen sich ab, Karte ausgegraut
4. Shop verlassen → Welt-Karte, Knoten als besucht
5. Zum Schatz-Knoten → Belohnung wird vergeben und angezeigt, Effekt im RunState messbar (Coins +50 ODER Karte im Deck ODER HP geheilt)
6. Im nächsten Combat das gekaufte Karten-Modell mind. einmal im Hand-Cycle gesehen haben (kann mehrere Kämpfe brauchen — Random-Draw)
7. Alle 3 Test-Files grün

---

## ✅ Freigabe-Checkliste (vor Beginn der nächsten Phase)

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] Jede der 3 Schatz-Belohnungen mindestens einmal getroffen
- [ ] Gekaufte Karte im nächsten Combat in der Hand gesehen
- [ ] `pnpm test` — alle Tests grün
- [ ] `pnpm lint` — keine Errors
- [ ] `pnpm build` — läuft fehlerfrei
- [ ] Browser-Console: 0 Errors, 0 Warnings
- [ ] Keine offenen Bugs der Schweregrade „kritisch" oder „mittel"
- [ ] Phase-Commit erstellt

**Erst wenn ALLE Häkchen gesetzt sind, beginnt die nächste Phase.**

---

## Offene Fragen / Risiken

- **Shop-Preis-Formel:** `50 + manaCost*10` ist eine erste Schätzung. Wenn der Spieler im Test-Run nicht genug Coins hat oder zu viele übrig, in Phase 7 (Balance-Pass) anpassen
- **Schatz: Karten-Belohnung-Pool:** Aktuell gleich wie Shop-Pool. Späterer Iteration kann Schatz exklusive Karten geben (Anreiz, Schatz-Pfade zu wählen)
- **Wiederbetretbarkeit:** Aktuell verbieten wir das implizit über `visitedNodes`. Sauber wäre, in der MapScene besuchte Knoten gar nicht klickbar zu machen — schon in Phase 3 abgedeckt, hier nochmal verifizieren
