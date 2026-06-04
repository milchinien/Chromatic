# Phase 6 — Zauber-Räume & Perks

**Dauer:** 1 Tag · **Risiko:** niedrig

> ⚠️ **Kern-Leitplanken (Stand 2026-06):** Historischer MVP-Bau-Plan. Verbindlicher **aktueller Kern**: festes 25-Karten-Deck (kein Sammeln/Wachstum, nur Upgrades) · Mana = reine Anzeige ohne Mechanik · Shop upgradet (kein Kartenkauf) · DOM-Hybrid (kein Phaser). Perk-Effekte dürfen **kein Mana** nutzen. Details: [README → Kern-Leitplanken](../README.md#kern-leitplanken).

## Ziel

Zauber-Räume tauchen auf der Welt-Karte auf. Der Spieler wählt dort einen permanenten Perk für den restlichen Run aus, der in jedem folgenden Combat aktiv ist (Mana-Boost, Max-HP, etc.).

## 🎯 Definition of Done — Hauptziel (Gate)

> **Im Perk-Raum erscheinen 3 Perk-Optionen, eine wird gewählt und bestätigt. Der gewählte Perk-Effekt ist im nächsten Combat messbar (Stats verändert) und persistiert über alle folgenden Combats des Runs.**

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- Alle 6 Perks aus [GAME_DESIGN.md Sektion 4.2](../../GAME_DESIGN.md) implementiert und einzeln getestet
- Jeder Perk hat im Combat einen sichtbar messbaren Effekt (Mana-Bar-Größe, HP-Anzeige, Hand-Size, DMG, Regen)
- Perk-Auswahl-UI ist klar: Hover zeigt Beschreibung, Auswahl ist markiert, Bestätigen nur nach Auswahl möglich
- Bestätigter Perk wandert in `runState.activePerks` und persistiert bis Run-Ende
- Mehrere Perks im selben Run stapeln korrekt (gemäß Stacking-Entscheidung)
- Tests grün (perks, perkSelection)
- Browser-Console: 0 Errors, 0 Warnings

**🚧 Solange diese Bedingungen nicht erfüllt sind, wird die nächste Phase NICHT begonnen.**

---

## Voraussetzungen

- Phase 3 abgeschlossen
- [GAME_DESIGN.md Sektion 4.2](../../GAME_DESIGN.md) gelesen (Zauber-Raum)

---

## Schritt-für-Schritt-Anleitung

### 1. Perk-Daten
- [ ] `src/domain/Perk.ts`:
  ```ts
  interface Perk {
    id: string;
    name: string;
    description: string;
    apply: (sideState: SideState, runState: RunState) => void;
  }
  ```
- [ ] `src/systems/data/perks.ts` — die 6 Perks aus [GAME_DESIGN.md Sektion 4.2](../../GAME_DESIGN.md):
  - `mana_regen_x2`: `sideState.manaRegen *= 2`
  - `max_mana_plus_20`: `sideState.maxMana += 20`
  - `base_hp_plus_20`: `runState.maxBaseHp += 20; runState.baseHp += 20`
  - `hp_regen_plus_1`: setzt `sideState.baseHpRegen = 1` (neues Feld!)
  - `damage_plus_5`: globaler Stat-Modifier auf alle Units der Spielerseite (`sideState.globalDamageBonus = 5`)
  - `extra_hand_card`: `sideState.handSize += 1`

### 2. SideState-Felder erweitern
- [ ] `CombatState.SideState` bekommt:
  - `baseHpRegen: number` (default 0)
  - `globalDamageBonus: number` (default 0)
- [ ] `ManaSystem` und `UnitSystem` lesen diese Felder

### 3. Perk-Anwendung in Combat
- [ ] In `CombatScene.init`: nach Erstellen des `CombatState` über alle `runState.activePerks` iterieren und `perk.apply(combatState.player, runState)` aufrufen
- [ ] HP-Regen pro Sekunde via Combat-Tick (neuer Mini-System: `BaseHpRegenSystem`)

### 4. PerkSelectScene
- [ ] `src/scenes/PerkSelectScene.ts`:
  - **Init**: erhält `runState`
  - **Verhalten**:
    - 3 zufällige Perks aus `perks.ts` ziehen (deterministisch über Seed + Knoten-ID, exclusive der bereits gewählten Perks falls Stacking deaktiviert ist — siehe „Offene Fragen")
    - 3 Karten-Sockel in der Mitte, mit Perk-Namen
    - Hover über einen Sockel → Info-Panel rechts mit `perk.description`
    - Klick → Sockel hervorgehoben (Auswahl-Marker)
    - „BESTÄTIGEN"-Button unten → `runState.activePerks.push(perk)` und zurück zur WorldMapScene
- [ ] Wenn Spieler den Zauber-Raum verlässt **ohne** zu wählen: nicht möglich, der „BESTÄTIGEN"-Button ist erst nach Auswahl klickbar

### 5. MapGenerator erweitern
- [ ] Akt 1: 1 Perk-Raum pro Akt platzieren (z. B. immer in Layer 3, alternativ zu Shop)
- [ ] Knoten-Typ `perk` als lila Knoten visuell unterscheidbar
- [ ] Snapshot-Test updated

### 6. nodeDispatcher erweitern
- [ ] `perk` → `scene.scene.start('PerkSelectScene', { runState })`

### 7. Tests
- [ ] `test/perks.test.ts` — alle 6 Perks haben sichtbaren Effekt auf `SideState` oder `RunState` nach `apply()`
- [ ] `test/perkSelection.test.ts` — 3 verschiedene Perks gezogen, deterministisch mit Seed

### 8. Manueller Test
- [ ] Run mit Perk-Raum spielen
- [ ] Vor und nach Perk-Auswahl Stats des nächsten Combats vergleichen (z. B. mit Max-Mana-Perk: Mana-Bar geht jetzt bis 40 statt 20)

### 9. Commit
- [ ] `git commit -m "Phase 6: perks and spell rooms"`

---

## End-Zustand

**Datei-Baum (neue/geänderte Dateien):**
```
src/
├── domain/
│   └── Perk.ts (neu)
├── systems/
│   ├── combat/
│   │   ├── CombatState.ts (Felder erweitert)
│   │   └── BaseHpRegenSystem.ts (neu, falls hp_regen-Perk)
│   ├── data/
│   │   └── perks.ts (neu)
│   └── run/
│       └── MapGenerator.ts (perk-Knoten ergänzt)
└── scenes/
    └── PerkSelectScene.ts (neu)

test/
├── perks.test.ts
└── perkSelection.test.ts
```

**Sichtbares Verhalten:**
- Welt-Karte zeigt einen oder mehrere lila Perk-Knoten
- Klick → PerkSelectScene öffnet sich, 3 Sockel mit Perk-Namen sichtbar
- Hover → Info-Panel rechts zeigt Beschreibung
- Klick auf Sockel → markiert, „BESTÄTIGEN" wird klickbar
- Bestätigung → zurück zur Welt-Karte, Knoten als besucht
- Im nächsten Combat: Perk-Effekt sichtbar (z. B. größere Mana-Bar, +DMG-Indikator über Units, oder Hand-Size von 3 auf 4)

**Was noch fehlt:**
- Klickbare Perk-Anzeige im Pause-Menü / TAB-Inventar (Phase 7 oder Post-MVP)
- Mehr als 6 Perks (R2 Content-Tiefe)
- Visualisierung von Perk-Effekten auf Units (z. B. dauerhafter Glow bei +DMG-Perk) — Phase 7

---

## Akzeptanz-Test (manuell)

1. Run starten, bis zum Perk-Knoten navigieren
2. PerkSelectScene zeigt 3 verschiedene Perks
3. Über jeden hovern → Beschreibung erscheint
4. Einen auswählen + bestätigen → zurück zur Welt-Karte
5. In den nächsten Combat gehen → Effekt verifizieren:
   - Mana-Perk: Mana-Bar größer / regeneriert schneller
   - HP-Perk: Base-HP-Anzeige zeigt 120/120
   - DMG-Perk: Units machen mehr Schaden (im Tooltip oder am Gegner-HP-Verlauf erkennbar)
   - Hand-Perk: 4 statt 3 Karten in der Hand
6. Beide Test-Files grün

---

## ✅ Freigabe-Checkliste (vor Beginn von Phase 7)

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] Alle 6 Perks einzeln getestet, sichtbare Wirkung im Combat verifiziert
- [ ] Mehrere Perks im selben Run stapeln korrekt
- [ ] `pnpm test` — alle Tests grün
- [ ] `pnpm lint` — keine Errors
- [ ] `pnpm build` — läuft fehlerfrei
- [ ] Browser-Console: 0 Errors, 0 Warnings
- [ ] Keine offenen Bugs der Schweregrade „kritisch" oder „mittel"
- [ ] Phase-Commit erstellt

**Erst wenn ALLE Häkchen gesetzt sind, beginnt Phase 7.**

---

## Offene Fragen / Risiken

- **Perk-Stacking:** Vorschlag aus Plan-Index: additiv erlaubt. Wenn der Spieler den Max-Mana-Perk zweimal nimmt → +40. Aktuell unverhindert. Wenn das im Test überpowered wirkt → Stacking deaktivieren (gezogene Perks aus Pool entfernen)
- **HP-Regen-Implementierung:** Neuer Tick-System, klein aber zusätzliche Test-Oberfläche. Wenn Zeit knapp → diesen einen Perk weglassen und nur 5 Perks anbieten
- **Visualisierung „+5 DMG"-Perk:** Schwierig sichtbar zu machen. Mögliche Lösung in Phase 7: kleines „+5"-Icon neben der Mana-Anzeige als statisches Reminder
