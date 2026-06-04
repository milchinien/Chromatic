# R4 — Combat-Tiefe

**Dauer:** ~1–2 Wochen · **Priorität:** mittel (abhängig davon, ob Combat im MVP zu seicht wirkt)

> ⚠️ **Kern-Leitplanken (verbindlich):** Festes 25-Karten-Deck (kein Sammeln/Wachstum/Entfernen, nur Upgrades) · Mana = reine Anzeige ohne Mechanik · DOM-Hybrid. Details: [README → Kern-Leitplanken](../README.md#kern-leitplanken).
>
> **🔄 angepasst:** **❌ Mana-Banking** (KI) und **❌ Karten-Entfernung** (Schmiede) entfallen. **Status-Effekte bleiben**, werden aber als **Passive auf die bestehenden 25 Karten** gehängt — **keine neuen Karten**. Boss-KI nutzt Nicht-Mana-Heuristiken (Tempo, Konter, Combo-Wahl). Überschneidet sich teils mit **R7** (Karten-Passive).

## Ziel

Combat strategisch vertiefen **ohne** Mana/neue Karten: klügere Boss-KI (Tempo/Konter), Status-Effekte als Passive auf bestehenden Karten, Karten-**Upgrade**-Tiefe. *(🔄 „Karten-Entfernung" ❌ entfällt — festes Deck.)*

## 🎯 Definition of Done — Hauptziel (Gate)

> **Boss-Encounter zeigen erkennbar klügere KI (Konter, Tempo-Wechsel, Combo-Wahl — ❌ kein Mana-Banking). Schmiede-/Shop-Räume bieten Upgraden funktional (❌ kein Entfernen). Mindestens 4 Status-Effekte sind als Passive auf bestehenden Karten integriert und im Combat sichtbar.**

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- Boss-KI gewinnt > 40% gegen Standard-Decks (Test-Fixture mit 100 Sim-Combats)
- Boss-KI ist subjektiv „herausfordernder" als normale Encounter (Playtest)
- Schmiede-/Shop-Raum: **Upgrade** funktional, Deck-Update persistiert *(❌ „Entfernen" entfällt — festes Deck)*
- Upgegradete Karten haben goldenen Rahmen in Hand und Deck-View
- Mindestens 4 Status-Effekte (Burn, Frost, Schild, Poison) implementiert + visualisiert
- Status-Icons über Units lesbar und korrekt aktualisiert
- Status-Effekte als **Passive auf bestehende Karten** gehängt *(❌ „1 neue Karte pro Status-Effekt" entfällt — keine neuen Karten)*
- TAB öffnet Deck-View ohne Crash, schließt sauber
- Tests grün (statusEffectSystem, bossAi, cardForge)
- Browser-Console: 0 Errors, 0 Warnings

**🚧 Solange diese Bedingungen nicht erfüllt sind, wird R5 NICHT begonnen.** Mechanik muss stabil sein, bevor Assets darauf aufbauen.

---

## Voraussetzungen

- R2 abgeschlossen (genug Karten-Content)
- R3 hilfreich (Achievements brauchen Combat-Variation)
- Echtes Spieler-Feedback aus Post-MVP-Phase liegt vor (sonst gefahr von „Mehr Tiefe, die niemand will")

---

## Schritt-für-Schritt-Anleitung

### 1. Verbesserte Boss-KI (3 Tage)
- [ ] Aktuelle MVP-KI: einfacher Heuristik-Agent
- [ ] Für Boss-Encounter: tiefere Logik (🔄 ohne Mana)
  - Reaktive Karten-Wahl: erkennt Spieler-Farb-Fokus, kontert mit passenden Farben
  - ❌ ~~Mana-Banking~~ — entfällt (Mana ist Deko). Stattdessen: gezielte **Combo-Wahl** (priorisiert Farb-/Klassen-Paare) + **Linien-Wahl** (Front/Hinten je nach Lage)
  - Tempo-Wechsel: aggressiv wenn vorne, defensiv wenn hinten
- [ ] Optional: Monte-Carlo-Tree-Search (MCTS) für Endboss — simuliert N Spielverläufe pro Entscheidung
- [ ] Test-Fixture: 100 Boss-Kämpfe simulieren, Win-Rate des Bosses sollte > 40% gegen Durchschnitts-Spieler-Deck sein

### 2. ❌ ~~Karten-Entfernung (Schmiede-Räume)~~ — ENTFÄLLT
> Das Deck ist **fix (25 Karten)** und wächst/schrumpft nie. Es gibt kein „unhandliches" Deck. **Stattdessen** (passt zum Kern): ein **Deck-Übersicht-Screen** (TAB-Inventar) der alle Karten + Level zeigt — reine Ansicht, keine Entfernung.
- [ ] Deck-Übersicht (TAB) als reine Ansicht (wiederverwendbar), kein Entfernen

### 3. Karten-Upgrades (3 Tage)
- [ ] Jede Karte hat optional ein `upgrade`-Feld: Statistik-Boost ODER neue Passive
- [ ] Im Schmiede-Raum: Spieler wählt Karte → wird permanent zur upgegradeten Version
- [ ] UI-Markierung: upgegradete Karten haben goldenen Rahmen
- [ ] Datenmodell:
  ```ts
  interface Card {
    ...,
    upgraded?: boolean;
    upgradeOf?: string;   // id der nicht-upgegradeten Karte
  }
  ```

### 4. Status-Effekte (4 Tage)
- [ ] Querschnitt aller Farben — bisher fehlt:
  - **Burn** (Krieg) — DoT, X DMG pro Sek. für N Sek.
  - **Frost** (Stein) — Slow auf Bewegung & Angriffstakt
  - **Schild** (Stein/Natur) — absorbiert nächsten N DMG
  - **Poison** (Untot) — DoT der mit Stacks skaliert
  - **Heal-over-Time** (Natur) — +X HP pro Sek.
  - **Stun** (Krieg/Untot) — Unit kann N Sek. nicht handeln
- [ ] Datenmodell:
  ```ts
  interface StatusEffect {
    type: 'burn' | 'frost' | 'shield' | 'poison' | 'hot' | 'stun';
    stacks: number;
    durationLeft: number;
    sourceUnit: Unit;
  }
  interface Unit { ..., statusEffects: StatusEffect[]; }
  ```
- [ ] `StatusEffectSystem.tick(state, dt)` — neue Tick-Phase im Combat-Loop
- [ ] Passive-Trigger-Erweiterung um `onApplyStatus`
- [ ] Status-Passive auf **bestehende** Karten hängen (z. B. Magier brennt nahe Gegner, Stein-Festung gibt Schild) — **❌ keine neuen Karten**
- [ ] UI: kleine Icons über Units zeigen aktive Status (max 3 Slots sichtbar, Rest unter „+N")

### 5. ❌ ~~Karten-Pool um Status-Effekt-Karten ergänzen~~ — ENTFÄLLT
> Keine neuen Karten (festes Deck). Status-Effekte kommen als **Passive auf den bestehenden 25 Karten** (siehe Schritt 4 und R7). Nur Balance-Pass nötig.

### 6. Tests
- [ ] `test/statusEffectSystem.test.ts` — alle Effekte verhalten sich korrekt
- [ ] `test/bossAi.test.ts` — KI wählt sinnvolle Plays in 5 Test-Szenarien
- [ ] `test/cardForge.test.ts` — Entfernen + Upgrade aktualisieren Deck korrekt
- [ ] Sandbox-Tests: 50 simulierte Combats für jede KI-Variante

### 7. Commit + Tag
- [ ] `git commit -m "R4: combat depth (boss AI, forge, upgrades, status effects)"`
- [ ] Tag `v0.5.0`

---

## End-Zustand

**Datei-Baum (neu/geändert):**
```
src/
├── systems/
│   ├── combat/
│   │   ├── BossAi.ts (neu, separater Agent)
│   │   ├── StatusEffectSystem.ts (neu)
│   │   └── AiController.ts (delegiert an BossAi bei Boss-Encountern)
│   └── data/
│       ├── cards.ts (Upgrade-Daten, Status-Karten)
│       └── statusEffects.ts (neu, Effekt-Definitionen)
└── scenes/
    ├── ForgeScene.ts (neu)
    └── DeckViewScene.ts (neu, TAB-Inventar)
```

**Sichtbares Verhalten:**
- Bosse spielen erkennbar klüger: kontern, sparen Mana, eskalieren
- Schmiede-Räume erscheinen 1× pro Akt — Spieler kann Karten entfernen oder upgraden
- Upgegradete Karten haben goldenen Rahmen, sind statistisch besser
- Status-Icons über Units zeigen aktive Effekte
- Karten wie „Inferno" (brennt) oder „Eismagier" (frostet) sind im Pool
- TAB öffnet Deck-Übersicht mit allen Karten

**Was noch fehlt:**
- Echte Sprites (R5)
- Steam/Mobile (R6)

---

## Akzeptanz-Test

1. Run starten, gegen Akt-3-Boss spielen → KI spielt sichtbar klüger (Konter/Tempo/Combo, ❌ kein Mana-Banking)
2. Shop/Schmiede-Raum besuchen → **Upgrade** verfügbar *(❌ „Entfernen" entfällt)*; TAB öffnet Deck-Übersicht
3. Karte upgraden → goldener Rahmen in Deck-View und im Combat
4. Karte mit Burn-Passive spielen → Gegner brennt, DoT-Damage sichtbar, Status-Icon erscheint
5. Karte mit Frost spielen → Gegner-Bewegung sichtbar verlangsamt
6. TAB drücken → Deck-Übersicht öffnet sich, alle Karten sichtbar
7. Status-Effekt-Sandbox-Tests: alle Effekte korrekt simuliert
8. Boss-KI-Tests: gegen Standard-Decks > 40% Win-Rate

---

## ✅ Freigabe-Checkliste (vor Beginn von R5)

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] Boss-KI > 40% Win-Rate im 100-Sim-Combat-Test
- [ ] Alle Status-Effekte einzeln im Combat sichtbar verifiziert (als Passive auf bestehenden Karten)
- [ ] Upgrade-Funktion bug-frei + Deck-Übersicht (TAB) *(❌ „Entfernen" entfällt)*
- [ ] `pnpm test` — alle Tests grün
- [ ] `pnpm lint` — keine Errors
- [ ] `pnpm build` — läuft fehlerfrei
- [ ] Browser-Console: 0 Errors, 0 Warnings
- [ ] Keine offenen Bugs der Schweregrade „kritisch" oder „mittel"
- [ ] Git-Tag `v0.5.0` gesetzt

**Erst wenn ALLE Häkchen gesetzt sind, beginnt R5.**

---

## Offene Fragen / Risiken

- **Komplexitäts-Explosion:** Status-Effekte multiplizieren Test-Aufwand. Bei Bedarf nur 3 statt 6 Effekte einführen
- **KI-Performance:** MCTS kann teuer sein. Wenn Frame-Drops → Heuristik-Variante als Fallback
- **Upgrade-Pfad-Balance:** Falsch balanciert führt zu „immer dieselbe Karte upgraden". Vielfalt erzwingen über limitierte Schmiede-Slots
- **UI-Überfrachtung:** Status-Icons + Combo-Rahmen + Damage-Numbers gleichzeitig kann visuell überfordern. Im Test sauber priorisieren
