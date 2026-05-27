# Phase 2 — Combat-Sandbox ⚠️ Risiko-Phase

**Dauer:** 3–4 Tage · **Risiko:** **HOCH** — hier entscheidet sich, ob das Spiel funktioniert

## Ziel

Isolierter, in sich abgeschlossener Combat ohne Run-Kontext. Alles hardcoded. Zwei Seiten kämpfen mit ~10 Karten gegeneinander, Combo-System wirkt sichtbar, eine Seite gewinnt. **Combat-Feel muss tragen, bevor irgendetwas anderes gebaut wird.**

## 🎯 Definition of Done — Hauptziel (Gate)

> **Ein in sich funktionierender Real-Time-Combat — Start via Dev-Shortcut, beide Seiten spielen Karten, Combo-Auren wirken sichtbar, Level-Up funktioniert, ESC pausiert, eine Seite gewinnt — läuft mindestens 5 Test-Kämpfe lang reproduzierbar ohne Crash oder Logik-Fehler.**

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- Mana, Auto-Draw, Spawn, Unit-Bewegung, Targeting, Angriff, Tod, EXP, Level-Up funktionieren wie in [GAME_DESIGN.md Sektion 6](../../GAME_DESIGN.md) spezifiziert
- Combo-Aura wird korrekt berechnet (Self-Exclusion, Stacking, farblos-Sonderregel)
- KI spielt sinnvolle Karten und gibt spürbaren Gegendruck
- Pause (ESC) hält **alles** an: Mana-Regen, Auto-Draw, Bewegung, KI, Cooldowns
- Sieg- und Niederlage-Screens erscheinen korrekt, kein State-Carry-Over beim Neustart
- Alle Unit-Tests grün (mind. ManaSystem, ComboAuraSystem, AiController, ExpSystem)
- Browser-Console: 0 Errors, 0 Warnings über 5 Test-Kämpfe
- **Subjektiv:** nach 3 selbst gespielten Test-Kämpfen willst du nochmal spielen

**🚧 Solange diese Bedingungen nicht erfüllt sind, wird Phase 3 NICHT begonnen.** Combat-Bugs sind in Phase 3 doppelt teuer zu debuggen, weil Symptome dann auch in der Run-Schale auftauchen.

---

## Voraussetzungen

- Phase 1 abgeschlossen
- [GAME_DESIGN.md Sektion 6](../../GAME_DESIGN.md) gelesen (Combat-System)
- [TECH_PLAN.md Sektion 4–6](../../TECH_PLAN.md) gelesen (Combat-Loop, Aura-Algorithmus)

---

## Schritt-für-Schritt-Anleitung

### 1. Balance-Konstanten zuerst
- [ ] `src/systems/data/balance.ts` mit allen Tuning-Werten als benannte Konstanten:
  ```ts
  export const MANA_START = 20;
  export const MANA_MAX = 20;
  export const MANA_REGEN_PER_SEC = 1;
  export const HAND_SIZE = 3;
  export const DRAW_INTERVAL_SEC = 4;
  export const BASE_HP_START = 100;
  export const EXP_THRESHOLDS = [5, 15, 30, 50]; // Kumulativ
  export const COMBAT_TICK_HZ = 30;
  ```
- [ ] Regel: **Keine Magic-Numbers im Combat-Code.** Alles aus `balance.ts`.

### 2. Domain-Typen
- [ ] `src/domain/Card.ts` — `Color`, `Class`, `UnitStats`, `Card`, `PassiveEffect` (Trigger: `'onSpawn' | 'onDeath' | 'onTick' | 'onHpThreshold'`)
- [ ] `src/domain/Unit.ts` — `Unit` (cardId, side, position, baseStats, currentHp, buffs, target, attackCooldown)
- [ ] `src/domain/Side.ts` — `Side = 'player' | 'enemy'`
- [ ] Alle Typen `readonly` wo möglich

### 3. Hardcoded Karten-Set (~10 Stück)
- [ ] `src/systems/data/cards.ts` — Karten so wählen, dass **alle 5 Farben und alle 5 Klassen mindestens 2× vertreten** sind, damit Combos testbar werden. Vorschlag:

| Name | Farbe | Klasse | Mana | DMG | HP | Speed | Passive |
|------|-------|--------|------|-----|----|----|---------|
| Druide | nature | mage | 6 | 3 | 12 | 40 | heal +1/s an Natur-Allies |
| Jäger | nature | mount | 5 | 5 | 8 | 80 | — |
| Hain-Wächter | nature | fortress | 8 | 2 | 25 | 30 | — |
| Berserker | war | warrior | 7 | 15 | 8 | 50 | DMG ×1.5 wenn HP<50% |
| Wachposten | war | fortress | 10 | 8 | 22 | 30 | — |
| Blutreiter | war | mount | 9 | 10 | 12 | 70 | — |
| Stein-Golem | stone | fortress | 12 | 6 | 40 | 25 | — |
| Stein-Magier | stone | mage | 8 | 4 | 14 | 35 | — |
| Skelett | undead | warrior | 4 | 6 | 6 | 50 | — |
| Nekromant | undead | mage | 11 | 4 | 14 | 35 | beim Tod: Skelett spawnen |
| Meteor | colorless | mage | 15 | 25 | 5 | 60 | onSpawn: -10 DMG an alle Gegner |

- [ ] Jede Karte hat `colorBuff` und `classBuff` als `Partial<UnitStats>`-Objekt (außer farblos)
- [ ] **Starter-Deck (10 Karten)** als Subset in `src/systems/data/starterDeck.ts` (für Phase 3 wichtig, hier vorbereiten)

### 4. Seedbarer PRNG
- [ ] `src/systems/rng.ts` — `mulberry32(seed: number)` als reine Funktion, gibt `() => number` (0–1) zurück
- [ ] Alle Random-Calls im Combat gehen über injizierte RNG-Instanz (testbar)

### 5. Combat-State-Container
- [ ] `src/systems/combat/CombatState.ts` — Interface gemäß [TECH_PLAN.md Sektion 3](../../TECH_PLAN.md)
- [ ] Factory: `createCombatState(playerDeck: Card[], enemyDeck: Card[], rng: Rng): CombatState`

### 6. Einzelne Systeme (Phaser-frei, einzeln testbar)
- [ ] `ManaSystem.ts` — `tick(side, dt)`: regen, cap, helper `canAfford(side, card)`, `spend(side, card)`
- [ ] `DrawSystem.ts` — `tick(side, dt, rng)`: `drawTimer += dt`, bei Erreichen → zufällige Karte aus Deck in Hand legen, wenn `hand.length < handSize`
- [ ] `UnitSystem.ts` — `tick(state, dt)`:
  - Bewegung: Unit ohne Target läuft Richtung Gegner-Base
  - Targeting: nächster Gegner in Reichweite
  - Angriff: Cooldown läuft ab → DMG anwenden (mit Buffs)
  - Tod: HP ≤ 0 → entfernen, `onDeath`-Passive triggern, EXP gutschreiben
  - Base-Damage: erreicht Unit X-Koordinate der Gegner-Base → Damage abziehen, Unit verschwindet
- [ ] `ComboAuraSystem.ts` — `recompute(state)`: pro Seite alle Units durchgehen, color/class-Buffs aggregieren. **Nur bei Spawn/Tod aufrufen, nicht jeden Tick** (dirty-Flag).
- [ ] `ExpSystem.ts` — `processKills(state)`: bei Schwelle erreicht → `state.pendingLevelUp = side`, Combat pausiert von außen
- [ ] `AiController.ts` — Heuristik v1:
  - Alle X Sekunden eine Entscheidung treffen
  - Wenn min. eine Karte leistbar: spiele die teuerste, die mit bereits gespawnten Units eine Combo bildet; sonst die teuerste leistbare
- [ ] `combat/advance.ts` — orchestriert alle Systeme im Tick gemäß [TECH_PLAN.md Sektion 4](../../TECH_PLAN.md)

### 7. Unit-Tests (Pflicht)
- [ ] `test/manaSystem.test.ts` — Regen-Tick, Cap, Spend
- [ ] `test/comboAuraSystem.test.ts` —
  - Zwei Natur-Units → beide bekommen Color-Buff
  - Drei Natur-Units → Buff stackt mit `(N-1)`
  - Farblose Unit allein → keine Buffs, gibt keine Buffs
  - Mixed-Farbe → korrekte Trennung
- [ ] `test/aiController.test.ts` — bevorzugt Combo-Partner, gibt nichts aus wenn Mana < min(handCosts)
- [ ] `test/expSystem.test.ts` — Schwelle ausgelöst, Level-Up-Flag gesetzt

### 8. CombatScene (Phaser-UI)
- [ ] `src/scenes/CombatScene.ts`:
  - **Init**: erhält `playerDeck` und `enemyDeck` aus Scene-Data (für Phase 2: über DevTools-Shortcut hardcoded)
  - **Layout** (siehe ASCII in [GAME_DESIGN.md Sektion 6.2](../../GAME_DESIGN.md)):
    - Oben links: Spieler-HP-Bar
    - Oben rechts: Gegner-HP-Bar
    - Mitte: Kampfzone, Units als farbige Rechtecke (Farbe = Karten-Farbe, Größe = HP-Anteil)
    - Unten links: Mana-Bar mit Zahl
    - Unten mittig: 3 klickbare Karten-Buttons (Name + Mana-Kosten)
  - **Update-Loop**: `combat.advance(dt)`, dann `render(state)`
  - **Click-Handler** auf Karte: wenn `canAfford` → `spend` + Unit spawnen
  - **ESC**: `isPaused` togglen, dunkler Overlay mit „PAUSE"
  - **Level-Up-Dialog**: bei `state.pendingLevelUp` → Overlay mit 6 Optionen (Sektion 6.7), Klick wählt aus, Combat resumed
  - **Sieg/Niederlage-Screens**: `enemyBaseHp ≤ 0` oder umgekehrt → Overlay mit „SIEG" / „NIEDERLAGE", Button „zurück"
- [ ] `src/ui/CardView.ts` — wiederverwendbares Karten-Render-Element (für Hand und für Shop später)
- [ ] `src/ui/HpBar.ts`, `src/ui/ManaBar.ts` — primitive Balken

### 9. Dev-Shortcut
- [ ] Im `MainMenuScene`: Tasten-Listener auf `D` (nur im DEV-Build via `import.meta.env.DEV`) → springt direkt in `CombatScene` mit hardcoded Test-Decks
- [ ] Wenn `CombatScene` ohne `init`-Data startet → fallback auf Test-Decks

### 10. Erste Playtest-Runde (1–2 Tage einplanen!)
- [ ] **Mindestens 5 komplette Test-Kämpfe gespielt**
- [ ] Spielgefühl-Fragen beantworten:
  - Fühlt sich Mana-Regen zu langsam/schnell an?
  - Ist Auto-Draw alle 4s ok oder nervig?
  - Sind Combo-Buffs spürbar oder unsichtbar?
  - Gibt die KI Gegendruck oder verliert sie immer?
- [ ] Werte in `balance.ts` iterieren, bis es sich gut anfühlt
- [ ] Wenn nach 1–2 Tagen Iteration der Combat **nicht** Spaß macht: **STOP**, Design überdenken (z. B. Hand-Size, Karten-Stats, Auto-Draw, Combo-Werte)

### 11. Commit
- [ ] `git add . && git commit -m "Phase 2: combat sandbox playable"`

---

## End-Zustand

**Datei-Baum (neue Dateien):**
```
src/
├── domain/
│   ├── Card.ts
│   ├── Unit.ts
│   └── Side.ts
├── systems/
│   ├── rng.ts
│   ├── combat/
│   │   ├── CombatState.ts
│   │   ├── ManaSystem.ts
│   │   ├── DrawSystem.ts
│   │   ├── UnitSystem.ts
│   │   ├── ComboAuraSystem.ts
│   │   ├── ExpSystem.ts
│   │   ├── AiController.ts
│   │   └── advance.ts
│   └── data/
│       ├── balance.ts
│       ├── cards.ts
│       └── starterDeck.ts
├── scenes/
│   └── CombatScene.ts (neu)
└── ui/
    ├── CardView.ts
    ├── HpBar.ts
    └── ManaBar.ts

test/
├── manaSystem.test.ts
├── comboAuraSystem.test.ts
├── aiController.test.ts
└── expSystem.test.ts
```

**Sichtbares Verhalten:**
- Im Dev-Build: `D` im Hauptmenü → Combat startet mit Test-Decks
- Links erscheinen Spieler-Karten in der Hand (3 Stück, Farbe sichtbar, Mana-Kosten sichtbar)
- Mana-Bar regeneriert sichtbar pro Sekunde
- Klick auf Karte (wenn leistbar) → farbiges Rechteck spawnt links, marschiert nach rechts
- Gegner spawnt parallel eigene Units (rechts → links)
- Units treffen sich, kämpfen sichtbar, sterben sichtbar
- Combo-Auras erkennbar (z. B. größere DMG-Zahlen, oder im Hover-Tooltip auf einer Unit)
- HP-Bars beider Basen sinken
- Bei genug EXP → Combat pausiert, 6 Optionen zur Auswahl, Klick → Combat geht weiter
- Eine Seite gewinnt → Overlay „SIEG" oder „NIEDERLAGE", Button zurück zum Hauptmenü
- ESC während Combat → Pause-Overlay, alles steht still, ESC erneut → läuft weiter
- Alle 4 Unit-Tests grün

**Was noch fehlt (kommt in späteren Phasen):**
- Combat ist nicht eingebettet in einen Run (Phase 3)
- Coins/Belohnungen werden nicht ausgezahlt (Phase 3)
- Karten-Pool ist nur hardcoded (Shop folgt in Phase 4)
- Keine Sub-Maps (Phase 5)
- Keine Perks (Phase 6)

---

## Akzeptanz-Test (manuell)

1. Im Hauptmenü `D` drücken → CombatScene startet
2. Mindestens eine Karte spielen → Unit spawnt sichtbar, Mana wird abgezogen
3. Warten bis Gegner mindestens 2 Units gespawnt hat → Combat zwischen Units sichtbar
4. Zwei gleichfarbige Units gleichzeitig auf eigener Seite haben → DMG-Werte sichtbar erhöht (im Tooltip oder als Anzeige)
5. 5+ Gegner-Kills → Level-Up-Dialog erscheint, Combat pausiert
6. Eine der 6 Optionen wählen → Effekt sichtbar (z. B. Mana-Bar wächst bei „+20 Max-Mana")
7. ESC → Pause, ESC erneut → weiter
8. Spiel zu Ende führen (Sieg ODER Niederlage) → korrekter Overlay
9. Zurück zum Hauptmenü → erneut `D` → frischer Combat startet (kein Reste-State)
10. `pnpm test` — alle 4+ Test-Files grün

**Subjektives Kriterium (am wichtigsten):**
Nach 3 selbst gespielten Test-Runden willst du nochmal spielen. Wenn nicht: **Phase 2 ist NICHT fertig**, weiter balancen oder Design anpassen.

---

## ✅ Freigabe-Checkliste (vor Beginn von Phase 3)

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] Subjektives Kriterium erfüllt: nach 3 Test-Kämpfen willst du nochmal spielen
- [ ] `pnpm test` — alle Combat-Tests grün
- [ ] `pnpm lint` — keine Errors
- [ ] `pnpm build` — läuft fehlerfrei
- [ ] Browser-Console: 0 Errors, 0 Warnings über 5 Test-Kämpfe
- [ ] Keine offenen Bugs der Schweregrade „kritisch" oder „mittel"
- [ ] Balance-Werte in `balance.ts` zentralisiert (keine Magic-Numbers im Code)
- [ ] Phase-Commit erstellt

**Erst wenn ALLE Häkchen gesetzt sind, beginnt Phase 3. Wenn der Combat-Feel nicht trägt: zurück zum Design, NICHT in Phase 3 weitermachen.**

---

## Offene Fragen / Risiken

- **Combat-Feel:** Größtes Risiko. Plan B falls Auto-Draw nervt: Manueller Draw mit Cooldown statt automatisch.
- **KI-Schwäche:** Die Heuristik kann zu dumm sein. Falls Combat zu einfach: KI bekommt Mana-Boost und/oder besseren Karten-Pool, nicht klügere Logik (im MVP).
- **Buff-Visualisierung:** Schwierig, dem Spieler zu zeigen, dass Combos aktiv sind. Vorschlag: dünner farbiger Rahmen um Units, der bei aktiver Combo aufleuchtet — wenn das nicht reicht, in Phase 7 mit Glow-Effekt nachbessern.
- **Performance:** Bei >30 Units pro Seite kann der O(n²) Aura-Recompute teuer werden. Cap setzen falls nötig.
