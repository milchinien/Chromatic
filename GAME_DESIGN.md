# VOLLSTÄNDIGE SPIELBESCHREIBUNG — Chromatic

---

## 0. TECH-STACK

- **Plattform:** Web (Browser)
- **Sprache:** TypeScript
- **Rendering:** Canvas / Phaser
- **Build/Run:** lokal im Browser, kein nativer Client

---

## 1. HAUPTMENÜ

Beim Start des Spiels landet der Spieler im **Hauptmenü**. Es enthält:

- **SPIELEN** — Startet einen neuen Run
- **OPTIONEN** — Lautstärke, Steuerung, Grafik
- **CREDITS** — Entwickler-Infos
- **BEENDEN** — Schließt das Spiel

Klick auf **SPIELEN** → Übergang zur **Welt-Karte (Run-Map)**.

---

## 2. STEUERUNG (GLOBAL)

- **Maus** — Knoten auf Welt-/Raum-Map klicken, Karten auswählen, UI bedienen, Hover für Karten-Infos
- **ESC** — Pause-Menü (Fortsetzen / Zum Hauptmenü)
- **TAB** — Inventar / aktive Perks anzeigen

---

## 3. SPIEL-AUFBAU (META-STRUKTUR)

Das Spiel ist ein **Roguelite-Run** in zwei Ebenen:

### Ebene A — Welt-Karte (Macro-Navigation)

Ein linearer Pfad mit Verzweigungen vom Spieler-Start bis zum Endboss. **Alle Räume sind von Anfang an sichtbar** (Slay-the-Spire-Stil) — der Spieler kann seine Route strategisch planen.

```
[Spieler] → [Normaler Raum] → [Zauber-Raum / Perk]
                                      ↓
                              ┌───────┴───────┐
                       [Normaler Raum]   [Normaler Raum]
                              ↓                 ↓
                       [Schwerer Kampf]      [Shop]
                              └───────┬───────┘
                                      ↓
                                  [ENDBOSS]
```

Der Spieler hat **550 Coins** als Startkapital (Anzeige oben rechts).

### Ebene B — Raum-Karte (Micro-Navigation)

Jeder „Raum" auf der Welt-Karte ist intern eine **Node-Map** mit mehreren verbundenen Sub-Knoten — kein eigenes 2D-Level, sondern ein Graph wie auf der Welt-Karte, nur in klein:

```
              [Zwischenboss]
                    │
        ┌───────────┼───────────┐
     [   ]    [Schatz-Raum]   [Kampf]
        │           │           │
        └───────────┼───────────┘
                 [   ]
                    │
              [Schwere Kampf]
                    │
              [Spieler + Spawn]
```

**Anzahl der Sub-Knoten:** zufällig generiert. **Je weiter der Spieler im Run fortschreitet, desto mehr Sub-Knoten** enthält jeder Welt-Raum.

Sub-Knoten-Typen:
- **Spieler-Spawn** — Eintrittspunkt
- **Normaler Kampf** — Standard-Combat-Encounter
- **Schwerer Kampf** — Stärkere Gegner, bessere Belohnung
- **Schatz-Raum** — Garantierte Belohnung (Coins, Karten, Heilung)
- **Zwischenboss** — Pflicht-Encounter, gibt Schlüssel/Zugang zum nächsten Welt-Raum

Der Spieler **wählt per Klick** den nächsten Knoten (analog Welt-Karte). Tritt er in einen Kampf-Knoten → **Combat-Fenster** öffnet sich (siehe Abschnitt 6).

### Ebene C — Akt-Struktur (Macro-Run)

Nach dem **Endboss** eines Akts ist der Run **nicht zu Ende**. Stattdessen:

- Sieg über Endboss → **neues, zufallsgeneriertes Welt-Karten-Fenster**
- Jeder neue Akt hat **mehr Räume** als der vorherige
- Jeder Akt endet mit einem neuen, stärkeren Endboss
- Schwierigkeit skaliert mit jedem Akt

So entsteht ein wiederholbarer, immer schwerer werdender Run-Aufbau.

---

## 4. RAUM-TYPEN IM DETAIL

### 4.1 Normaler Raum
- Standard-Dungeon mit Kampf-Encountern
- Mehrere Sub-Knoten (Anzahl skaliert mit Fortschritt)
- Coins als Hauptbelohnung

### 4.2 Zauber-Raum (Permanenter Perk)
Ein **spezieller Raum**, in dem der Spieler einen permanenten Vorteil für den restlichen Run wählt.

UI:
- Mehrere Perk-Karten werden auf einem Sockel präsentiert
- Hover über eine Karte → **Perk-Info** wird rechts eingeblendet
- Klick → Perk wird gewählt (gehoverter Perk wird hervorgehoben)
- Bestätigung → Perk ist **permanent aktiv** für den Rest des Runs

Beispiel-Perks:
- +2× Mana-Regeneration
- +20 Max-Mana
- +20 Base-HP
- +1 HP-Regeneration
- +5 Damage aller Units
- Eine zusätzliche Hand-Karte (4 statt 3)

### 4.3 Shop
UI-Aufbau:
- Oben links: Spieler-Coins
- Mitte: Reihe von **kaufbaren Karten** (4–6 Stück)
- Eine Karte kann **ausgewählt** werden (hervorgehoben)
- Rechts: **Info-Feld** mit Karten-Details beim Hovern (Farbe, Klasse, Damage, HP, Fähigkeiten)
- Kauf-Button → Coins werden abgezogen, Karte wandert ins Deck

Funktion: Hier baut der Spieler sein Deck strategisch aus.

### 4.4 Schatz-Raum
- Garantierte Belohnung ohne Kampf
- Coins, eine zufällige Karte oder Heilung der Base-HP

### 4.5 Zwischenboss
- Stärkerer Gegner-Encounter
- Belohnt mit Coins + Karte + Zugang zum nächsten Welt-Raum

### 4.6 Endboss
- Finaler Kampf des aktuellen Akts
- Sieg = neuer, zufallsgenerierter Akt mit **mehr Räumen** und stärkeren Gegnern

---

## 5. WÄHRUNGEN & RESSOURCEN

| Ressource | Wo verwendet | Wie verdient |
|-----------|--------------|--------------|
| **Coins** (550 Start) | Shop | Gegner besiegen, Schatz-Räume |
| **Mana** (20 Start) | Karten spielen im Combat | Auto-Regen (1/Sek.) |
| **EXP** | Level-Up im Combat | Gegner-Units töten |
| **Base-HP** (100 Start) | Überleben des Combats | Heilung in Schatz-Räumen |

---

## 6. COMBAT-SYSTEM

### 6.1 Konzept
**Deck-Building + Real-Time Combat Hybrid**. Der Spieler ist kein Action-Held, sondern **Feldmarschall der Magie** — er gibt Befehle, seine Einheiten führen sie aus.

**Kernidee:** Kombinationen sind alles. Zwei Karten gleicher Farbe oder Klasse verstärken sich gegenseitig.

**Combat-Modell:**
- **Real-Time:** Mana regeneriert kontinuierlich, neue Hand-Karten werden in festem Intervall automatisch nachgezogen (Auto-Draw).
- **Karten jederzeit spielbar**, sobald genug Mana vorhanden ist — keine festen Runden.
- **Units persistent** (wie Clash Royale): Gespawnte Units bleiben auf dem Feld, marschieren und kämpfen bis sie sterben. Das Feld füllt sich mit der Zeit.

### 6.2 Spielfeld (2D Side-Scroller, Super-Mario-Perspektive)

```
┌─────────────────────────────────────────────────────────┐
│ HP-Freundlich 100/100        HP-Feindlich 10/20         │
│                                                         │
│  [SPIELER BASE 🛡️]              [GEGNER BASE 🏰]      │
│                                                         │
│  👤👤👤  →  KAMPFZONE  ←  👹👹👹                       │
│                                                         │
│  Mana 15/20 ▓▓▓▓▓▓▓░░                                   │
│  [Karte 1] [Karte 2] [Karte 3]                          │
│       ↑ Hand des Spielers (unten)                       │
└─────────────────────────────────────────────────────────┘
```

- **Links** = Spieler-Seite, Units spawnen hier und marschieren nach rechts
- **Rechts** = Gegner-Seite, spiegelverkehrt
- **Mitte** = Kampfzone
- **Unten** = Handkarten + Mana-Leiste
- **Gegner sieht deine Kartenauswahl NICHT**

### 6.3 Mana-System
- **Max:** 20 (am Anfang), erweiterbar durch Perks
- **Regeneration:** +1 Mana/Sek. (ohne Upgrades)
- **Kosten:**
  - Schwache Karten: 3–5 Mana
  - Mittlere Karten: 7–12 Mana
  - Starke Karten: 15+ Mana
  - Farblose Super-Karten: oft sehr teuer, aber **keine Combo nötig**

Bei zu wenig Mana: **warten** auf Regen. **Neumischen der Hand ist nicht möglich.**

**Karten-Ziehen:** Jede Karte in der Hand wird **unabhängig zufällig** aus dem Deck gezogen (Random-Pool, **kein Discard-Pile, kein Reshuffle**). Dieselbe Karte kann mehrfach hintereinander erscheinen; eine Karte ist nicht zwangsläufig „verbraucht", nur weil sie gespielt wurde.

### 6.4 Karten-Struktur
Jede Karte hat:

**1. Farbe (thematische Rolle):**
- **Natur** (Grün) — Healing, Support, Buffs
- **Krieg** (Rot) — Aggro, Direct Damage, High HP
- **Stein** (Grau) — Tanking, Defense, Shield
- **Untot** (Lila) — Debuffs, Sacrifice, Dark Magic
- **Farblos** — keine Farbe, oft sehr stark

**2. Klasse (Kampfstil):**
- **Krieger** — High Damage, Melee
- **Festung** — High HP, Tanking
- **Reittier** — Speed, Evasion
- **Magier** — AoE Damage, Debuffs
- **Heiler** — Healing, Support

**3. Stats:**
- Damage (Schaden pro Angriff)
- Angriffstakt (Sek. zwischen Angriffen)
- HP (Lebenspunkte)
- Bewegungs-Geschwindigkeit

**4. Mana-Kosten** — was die Karte beim Spielen kostet (typ. 3–18, siehe 6.3)

**5. Passive Fähigkeit** — triggert automatisch (z. B. auf Tick, bei Spawn, bei Tod, bei HP-Schwelle)

**6. Combo-Boni (kartenspezifisch)** — Jede Karte definiert ihre **eigenen** Buff-Werte für Farb- und Klassen-Combos (z. B. `colorBuff: { damage: +4 }`, `classBuff: { hp: +5 }`). Es gibt keine globalen Default-Werte pro Farbe/Klasse — die Werte stehen pro Karte fest.

**Beispiele:**
- **Druide** (Natur/Magier) — 7 DMG, 12 HP — „Heilt alle befreundeten Natur-Units um 1 HP/Sek."
- **Beserker** (Krieg/Krieger) — 15 DMG, 8 HP — „Wenn HP < 50 %, Damage ×1.5"

### 6.5 Combo-System (Field-Aura-Modell)

Combos sind **persistent und aurabasiert**, kein einmaliger Spawn-Trigger:

- **Trigger:** Jede befreundete Unit auf dem Feld gewährt ihren **Color-Buff** an alle anderen befreundeten Units derselben **Farbe** und ihren **Class-Buff** an alle derselben **Klasse**.
- **Dynamisch:** Buffs werden bei jeder Feld-Änderung neu berechnet (Spawn, Tod). Stirbt der einzige Combo-Partner, fällt der Buff weg.
- **Self-Exclusion:** Eine Unit gibt sich nicht selbst ihren Buff — es braucht mindestens eine zweite Unit derselben Farbe/Klasse.
- **Stacking:** Bei N befreundeten Units gleicher Farbe gewährt jede *Andere* einen Color-Buff → der Buff einer Unit skaliert mit `(N-1) × eigener Color-Buff-Wert`. Class-Buffs analog.
- **Farblos:** Karten ohne Farbe lösen keinen Color-Buff aus und empfangen keinen — sie sind so balanciert, dass sie auch solo stark sind.

Beispiele (Werte illustrativ, exakte Werte stehen auf den Karten):

| Karte 1 | Karte 2 | Combo? | Effekt |
|---------|---------|--------|--------|
| Druide (Natur/Magier) | Skelett (Untot/Krieger) | NEIN | Keine Buffs |
| Druide (Natur/Magier) | Jäger (Natur/Reittier) | JA — Farbe | Beide bekommen Color-Buff voneinander |
| Beserker (Krieg/Krieger) | Wachposten (Krieg/Festung) | JA — Farbe | Beide bekommen Color-Buff voneinander |
| Beserker (Krieg/Krieger) | Blutfuror (Krieg/Krieger) | JA — Farbe + Klasse | Beide bekommen Color- *und* Class-Buff |

### 6.6 Combat-Flow (Real-Time)

Der Combat läuft **kontinuierlich** ab — keine festen Phasen. Folgende Systeme laufen parallel:

**Spieler-Aktionen (jederzeit möglich):**
- Spieler hat **3 Karten in der Hand** (Default; erweiterbar durch Perks).
- Klick auf eine Karte → Mana wird abgezogen → Unit spawnt links und marschiert nach rechts.
- Karten können gespielt werden, **sobald genug Mana** vorhanden ist.

**Auto-Draw:**
- In festem Intervall (Vorschlag: **~4 Sekunden**, final TBD) wird eine zufällig gezogene neue Karte in die Hand nachgelegt, falls Platz ist.
- **Random-Pool:** Jede Ziehung ist unabhängig zufällig aus dem Deck (kein Discard, kein Reshuffle).

**Mana-Tick:**
- Mana regeneriert kontinuierlich (+1/Sek., Default). Erreicht Max → stoppt (kein Overflow).

**Gegner-KI:**
- KI spielt im Hintergrund nach demselben Modell — **handgemachter Encounter-Karten-Pool pro Encounter-Typ** (Normaler Kampf, Schwerer Kampf, Zwischenboss, Endboss), eigene Mana-Leiste, eigener Auto-Draw.
- KI-Schwierigkeit (Reaktionszeit, Karten-Wahl, Mana-Effizienz) skaliert mit Fortschritt im Run.
- KI-Verhaltensmodell für MVP: einfacher Heuristik-Agent (z. B. „spiele die teuerste leistbare Karte alle X Sek., bevorzuge Karten, die mit bereits gespawnten eine Combo bilden"). Tieferer Planungs-Agent später.

**Combat-Tick (laufend):**
1. **Combo-Aura (Field-Aura):** Bei jedem Spawn/Tod werden alle Combo-Auras neu berechnet (siehe 6.5).
2. **Bewegung:** Units laufen Richtung gegnerischer Base mit ihrer eigenen Speed.
3. **Targeting:** Trifft eine Unit auf einen Gegner → Kampf beginnt, Angriffe laufen im jeweiligen Angriffstakt.
4. **Tod & EXP:** Stirbt eine Unit → entfernt, EXP-Anteil (5 / 15 / 30+) wandert zum Spieler.
5. **Base-Damage:** Erreicht eine Unit die gegnerische Base → Damage in Base-HP, Unit verschwindet (single hit & despawn).
6. **Level-Up-Check:** EXP-Schwelle erreicht → Combat pausiert, Spieler wählt temporären Vorteil (siehe 6.7).

**Pause-Verhalten:** ESC pausiert die komplette Real-Time-Simulation (Mana-Regen, Auto-Draw, Unit-Bewegung, KI-Aktionen).

### 6.7 Level-Up im Combat
Bei genug EXP → Level-Up. Spieler wählt einen **temporären Vorteil für den restlichen Kampf**:

| Vorteil | Effekt |
|---------|--------|
| +2× Mana-Regen | 2 Mana/Sek. statt 1 |
| +20 Max-Mana | 20 → 40 |
| +20 Base-HP | 100 → 120 |
| +1 HP-Regen | Heilt 1 HP/Sek. |
| Sofort-Heilung | +20 HP jetzt |
| +5 Damage | Alle Units +5 DMG |

Level-Schwellen: Lv 1 → 2 nach ~5 Kills, → 3 nach ~10 weiteren, etc.

### 6.8 Sieg / Niederlage im Combat
- **Sieg:** Gegner-Base HP = 0 → zurück zur Raum-Karte. Belohnung: Coins (skaliert mit Encounter-Typ und Akt), evtl. Karten-Drop (Boss/Schwerer Kampf).
- **Niederlage:** Spieler-Base HP = 0 → Run beendet, zurück zum Hauptmenü.
- **Reset zwischen Kämpfen:** EXP und Combat-Level werden nach jedem Encounter zurückgesetzt. Mana startet jeden Kampf bei Start-Mana. Base-HP wird **nicht** automatisch geheilt — Heilung nur in Schatz-Räumen oder durch Perks/Level-Ups, deren Effekt persistent ist (z. B. Sofort-Heilung).

### 6.9 Deck-Aufbau & Starter-Deck

- **Starter-Deck:** Jeder Run startet mit einem **festen Starter-Deck von ~10 Karten** (identisch über alle Runs).
- **Wachstum:** Das Deck wird im Run durch **Shop, Schatz-Räume und Zwischenboss-Belohnungen** erweitert.
- **Keine Entfernung:** Karten können **nicht** aus dem Deck entfernt werden — das Deck wächst monoton.
- **Konsequenz:** Mit fortschreitendem Run wird das Deck größer und damit unvorhersehbarer (Random-Pool-Draw). Strategische Karten-Auswahl im Shop ist entscheidend.

---

## 7. RUN-PROGRESSION (KOMPLETT)

```
[Hauptmenü]
    ↓ klick SPIELEN
[Welt-Karte Akt 1] — 550 Coins Start
    ↓ Klick auf nächsten Raum
[Normaler Raum] → interne Sub-Knoten → Kämpfe → Belohnung
    ↓
[Zauber-Raum] → Permanenter Perk wählen
    ↓
[Verzweigung: Schwerer Kampf ODER Shop]
    ↓
[Endboss Akt 1]
    ↓ Sieg
[Welt-Karte Akt 2] — mehr Räume, stärkere Gegner
    ↓
[Endboss Akt 2]
    ↓ Sieg
[Welt-Karte Akt 3] — noch mehr Räume, noch stärker
    ↓
... (immer weiter, eskalierend)

  Niederlage in jeder Phase → zurück zum Hauptmenü
```

---

## 8. SCHWIERIGKEITS-SKALIERUNG

Mit jedem Fortschritt im Run wachsen mehrere Faktoren:

| Faktor | Skalierung |
|--------|-----------|
| Anzahl Sub-Räume pro Welt-Raum | Steigt mit jedem Akt |
| KI-Schwierigkeit (Gegner-Karten-Wahl) | Steigt mit Fortschritt |
| Gegner-HP & Damage | Steigt mit jedem Akt |
| Belohnungen (Coins, Karten) | Steigt mit Schwierigkeit |
| Endboss-Stärke | Steigt mit jedem Akt |

---

## 9. NOCH OFFEN (FÜR SPÄTERE ITERATIONEN)

- **Auto-Draw-Intervall** — konkrete Sekunden (aktueller Vorschlag: ~4 Sek.)
- **Perk-Stacking** — Stacken permanente Perks (z. B. 2× +20 Max-Mana = 60)?
- **Mana-Cap-Verhalten** — Vorschlag: stoppt bei Max (kein Overflow); bestätigen.
- **Räume pro Akt 1** — Beispiel-Layout zeigt ~6 Knoten, finale Zielgröße noch offen.
- **Konkrete Starter-Deck-Komposition** — welche 10 Karten exakt?
- **Konkrete Coin-Belohnungen** pro Encounter-Typ und Akt
- **Karten-Drop-Pool** — welche Karten droppen aus Schatz/Boss, mit welcher Rarität?
- **Map-Generierungs-Algorithmus** — exakte Regeln (Slay-the-Spire-Style)
- **Meta-Progression zwischen Runs** — z. B. freischaltbare Karten oder permanente Boni
