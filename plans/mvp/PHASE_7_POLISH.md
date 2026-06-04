# Phase 7 — Polish & Balance-Pass

**Dauer:** 1–2 Tage · **Risiko:** niedrig (aber zeitkritisch)

> ⚠️ **Kern-Leitplanken (Stand 2026-06):** Historischer MVP-Bau-Plan. Verbindlicher **aktueller Kern**: festes 25-Karten-Deck (kein Sammeln/Wachstum, nur Upgrades) · Mana = reine Anzeige ohne Mechanik · Shop upgradet (kein Kartenkauf) · DOM-Hybrid (kein Phaser). Details: [README → Kern-Leitplanken](../README.md#kern-leitplanken).

## Ziel

Den MVP von „läuft" zu „macht Spaß zum Wiederholen" bringen. Balance-Iteration, Bugfixes, visuelles Feedback, Sound. **Kein neues Feature, keine echten Sprites — nur das Vorhandene besser machen.**

## 🎯 Definition of Done — Hauptziel (Gate) — **MVP-Abschluss**

> **Der „MVP-Demo-Run" (siehe Akzeptanz-Test) ist vollständig durchspielbar. Mindestens einer von 3 Test-Runs endet mit Boss-Sieg. Alle UX-Elemente (Pause, Sound, visuelles Feedback, Hover-States) sind funktional. 0 kritische Bugs. MVP ist auslieferungsreif.**

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- 3 vollständige Test-Runs durchgespielt, mindestens **einer gewonnen**
- Combat-Feel ist „gut genug zum Weiterspielen" (subjektiv — ehrlich beantworten)
- Damage-Numbers, Tod-Animation, Combo-Glow, Spawn-Effekte sichtbar und konsistent
- Mindestens 7 SFX integriert, Mute-Toggle (M) funktional
- Pause-Menü mit Fortsetzen/Hauptmenü funktional
- Hover-States auf allen klickbaren Elementen
- Browser-Console: **0 Errors, 0 Warnings** über alle 3 Test-Runs
- Keine offenen Bugs der Schweregrade „kritisch" oder „mittel"
- `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm preview` alle grün
- README mit Spielanleitung aktualisiert
- Git-Tag `v0.1.0-mvp` gesetzt

**🚧 Solange diese Bedingungen nicht erfüllt sind, gilt der MVP NICHT als fertig.** R1 wird NICHT begonnen, solange der MVP-Demo-Run nicht reproduzierbar funktioniert. Wenn der MVP nach 2 Polish-Tagen nicht Spaß macht: zurück zu Phase 2 (Combat-Design), nicht hier mehr Glanz draufpacken.

---

## Voraussetzungen

- Phasen 1–6 abgeschlossen
- Mindestens 3 komplette Test-Runs durchgespielt vor dieser Phase

---

## Schritt-für-Schritt-Anleitung

### 1. Balance-Iteration (½ Tag)
- [ ] Mindestens 5 weitere komplette Test-Runs spielen
- [ ] Notizen führen zu:
  - Verhältnis Coins:Karten-Preise (kann sich der Spieler im Run sinnvoll Karten leisten?)
  - Encounter-Schwierigkeit pro Stufe (sind „schwere Kämpfe" wirklich schwerer?)
  - Boss-Schwierigkeit (zu leicht? zu hart?)
  - Combo-Häufigkeit (kommen Combos im Schnitt 1-2× pro Kampf zustande?)
- [ ] Tuning nur in `src/systems/data/balance.ts`, `cards.ts`, `encounters.ts`
- [ ] **Regel:** keine Code-Änderungen für Balance, nur Daten

### 2. Visuelles Feedback (½ Tag)
- [ ] **Damage-Numbers:** Bei jedem Hit ein kurzlebiger weißer Text mit Schaden-Wert über der getroffenen Unit (Phaser-Tween: nach oben fadende Zahl)
- [ ] **Tod-Animation:** Unit blitzt rot auf und shrinkt 200ms lang bevor sie entfernt wird
- [ ] **Combo-Glow:** Units mit aktiver Color-Combo bekommen einen 2px dicken Rahmen in ihrer Farbe (additiv für Class-Combo: zweiter Rahmen aussen)
- [ ] **Spawn-Effekt:** kurzer weißer Flash beim Erscheinen einer Unit
- [ ] **Base-Hit-Effekt:** Wenn Base getroffen wird, Screen-Shake (klein) + roter Flash auf HP-Bar
- [ ] **Mana-Voll-Indikator:** Mana-Bar pulsiert dezent wenn voll

### 3. Sound (1–2 Stunden)
- [ ] Freie SFX-Quellen: freesound.org, kenney.nl, opengameart.org
- [ ] Mindest-Set:
  - Karten-Klick (UI-Click)
  - Unit-Spawn (kurzer Whoosh)
  - Unit-Hit (Schlag-SFX)
  - Unit-Tod (Crunch)
  - Sieg (kurze Fanfare)
  - Niederlage (absteigender Ton)
  - Coin-Pickup (Cha-Ching)
- [ ] Phaser-Sound-Manager-Integration via `this.sound.add(...).play()`
- [ ] Globaler Mute-Toggle mit `M`-Taste

### 4. Pause-Menü
- [ ] `src/scenes/PauseScene.ts` als Overlay-Scene (transparenter Hintergrund)
- [ ] `CombatScene.ESC`: startet `PauseScene` als overlay statt nur Boolean-Toggle
- [ ] Buttons: „FORTSETZEN" (schließt Overlay), „HAUPTMENÜ" (verlässt Run, zurück zu MainMenu)
- [ ] Combat-Tick steht still während Pause

### 5. UI-Polish
- [ ] Konsistente Fonts (eine einzige Web-Font wählen, z. B. via Google Fonts, statt Phaser-Default)
- [ ] Hover-States auf allen klickbaren Elementen (Mauszeiger ändert sich, leichter Color-Shift)
- [ ] Übergangs-Fades zwischen Szenen (Phaser-Camera-Fade 200ms)
- [ ] Coin- und HP-Anzeigen mit kleinem Icon links neben der Zahl

### 6. Bugfix-Runde
- [ ] Console im Browser auf 0 Errors/Warnings bringen
- [ ] Edge-Cases prüfen:
  - Was passiert wenn der Spieler im Combat keine Karte spielt (nur durch KI verliert)?
  - Was passiert beim Klick-Spam auf eine Karte (Mana-Doppelt-Abzug)?
  - Was passiert bei gleichzeitigem Tod beider Basen?
  - Niederlage gegen Boss → führt korrekt zu GameOver?
  - Sieg über Boss → führt korrekt zu Victory → Hauptmenü?
  - Browser-Refresh mitten im Run → Hauptmenü erscheint (RunState ist weg, OK fürs MVP)

### 7. MVP-Akzeptanz
- [ ] Mindestens 3 weitere vollständige Test-Runs nach allem Polish
- [ ] **Mindestens einer dieser Test-Runs wurde gewonnen**
- [ ] Keine kritischen Bugs offen
- [ ] README aktualisieren mit Spielanleitung (kurz: „Klick auf Karten zum Spawnen, ESC für Pause, Ziel: Endboss besiegen")

### 8. Final Commit
- [ ] `git commit -m "Phase 7: MVP polish, balance pass, sound, pause menu"`
- [ ] Git-Tag `v0.1.0-mvp` setzen

---

## End-Zustand

**Datei-Baum (neue/geänderte Dateien):**
```
src/
├── scenes/
│   └── PauseScene.ts (neu, Overlay)
├── assets/
│   └── sfx/ (~7 .wav/.mp3 Dateien)
├── ui/
│   ├── DamageNumber.ts (neu)
│   └── (CardView, HpBar, ManaBar gepolisht)
└── systems/
    └── data/
        ├── balance.ts (final getunt)
        ├── cards.ts (Stats getunt)
        └── encounters.ts (Decks getunt)

README.md (Spielanleitung)
```

**Sichtbares Verhalten — der MVP-Kandidat:**
- Vom Hauptmenü aus startet ein neuer Run
- Welt-Karte mit ~6 Knoten + Sub-Maps im Inneren
- Combat fühlt sich responsiv an: Karten-Klick gibt akustisches + visuelles Feedback
- Combos sind sichtbar (Farb-Glow auf Units, sichtbar erhöhte DMG-Numbers)
- Pause funktioniert sauber, Sound an/aus per `M`
- Shop, Schatz, Perk-Raum alle erreichbar und funktional
- Endboss als finaler Encounter, Sieg führt zu Victory-Screen
- Niederlage in jeder Phase → GameOver → Hauptmenü
- **3 Test-Runs bestätigen: mindestens einer endet mit Boss-Sieg, alle ohne kritische Bugs**

**MVP ist fertig wenn:**
- Ein neuer Spieler kann das Spiel starten, einen ganzen Akt durchspielen, gewinnen oder verlieren, neu starten
- Combat fühlt sich nach Real-Time-Combo-Druck an
- ≥ 2 Encounter-Typen, ≥ 10 verschiedene Karten existieren
- Keine kritischen Bugs

---

## Akzeptanz-Test (manuell)

**„MVP-Demo-Run" — Komplett-Durchlauf:**
1. `pnpm dev`, Browser öffnet Hauptmenü
2. „SPIELEN" klicken → Welt-Karte
3. Ersten Combat gewinnen → Coins +30
4. Zum Shop → Karte kaufen → Coins ziehen ab
5. Zum Perk-Raum → einen Perk wählen
6. Schatz besuchen → Belohnung erhalten
7. „Schwerer Kampf" gewinnen → Coins +60
8. Endboss-Encounter → Sieg
9. Victory-Screen → zurück zum Hauptmenü
10. Sound war an, Combos waren visuell, Pause hat funktioniert
11. F12 Console: 0 Errors, 0 Warnings
12. `pnpm test` alle grün
13. `pnpm build` läuft, `pnpm preview` zeigt das Spiel funktional

Wenn alles erfüllt: **MVP fertig. Tag `v0.1.0-mvp` setzen, R1 starten.**

---

## ✅ Freigabe-Checkliste — **MVP-Auslieferung**

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] „MVP-Demo-Run"-Akzeptanz-Test komplett grün
- [ ] Mindestens 1 von 3 Test-Runs mit Boss-Sieg beendet
- [ ] Subjektives Kriterium erfüllt: das Spiel macht Spaß zum Wiederholen
- [ ] `pnpm test` — alle Tests grün
- [ ] `pnpm lint` — keine Errors
- [ ] `pnpm build` — läuft fehlerfrei
- [ ] `pnpm preview` — gebauter Build im Browser spielbar
- [ ] Browser-Console: 0 Errors, 0 Warnings über alle Test-Runs
- [ ] Keine offenen Bugs der Schweregrade „kritisch" oder „mittel"
- [ ] README mit Spielanleitung aktualisiert
- [ ] Asset-Lizenzen in `src/assets/CREDITS.md` dokumentiert
- [ ] Git-Tag `v0.1.0-mvp` gesetzt

**Erst wenn ALLE Häkchen gesetzt sind, ist der MVP ausgeliefert und R1 darf beginnen.**

---

## Offene Fragen / Risiken

- **Zeitbudget:** Polish frisst gerne mehr Zeit als geplant. Wenn nach 2 Tagen noch nicht fertig: harte Cuts — Sound auf 3 SFX reduzieren, UI-Polish minimal halten, Bugfix priorisieren
- **Subjektive Qualität:** Wenn der MVP nach Polish immer noch nicht „Spaß macht", liegt das Problem nicht im Polish, sondern im Combat-Design. Zurück zu Phase 2 / Balance, nicht hier mehr Glanz draufpacken
- **Asset-Lizenzen:** Bei jeder SFX-Quelle Lizenz dokumentieren (CC0 / CC-BY) in `src/assets/CREDITS.md`
