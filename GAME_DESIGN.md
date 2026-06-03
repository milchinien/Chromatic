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

**Boss-Auswahl vor jedem Akt:** Bevor die Weltkarte erscheint, wählt der Spieler zwischen **2 zufälligen Farb-Bossen** (Wiederholung über Akte möglich). Die gewählte Farbe wird zur **Akt-Farbe** — **alle Gegner des Akts** (normale Kämpfe, Mini-Bosse, Boss) ziehen ausschließlich Karten dieser Farbe.

Nach dem **Endboss** eines Akts ist der Run **nicht zu Ende**:

- Sieg über Endboss → neue **Boss-Auswahl** → **neues, zufallsgeneriertes Welt-Karten-Fenster**
- Schwierigkeit skaliert mit jedem Akt (Gegner-Karten-Level: Stats + Truppen)
- Der Run läuft **endlos**, bis der Spieler verliert

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

Beispiel-Perks (mana-frei, da Mana nur Platzhalter ist):
- +2 Truppen pro gespielter Karte
- +1 HP-Regeneration
- +20 Base-HP
- +5 Damage aller Units

### 4.3 Shop (Upgrade-Schmiede)
**Kein Karten-Kauf mehr.** Hier **upgradet** der Spieler seine eigenen Deck-Karten.
- Oben rechts: Spieler-Coins
- Mitte: die **eigenen Deck-Karten** mit aktuellem Level + Upgrade-Kosten
- Rechts: **Info-Feld** zeigt aktuelle vs. nächste Stats (Damage/HP) und Truppen-Range
- Upgrade-Button → Coins werden abgezogen (`60 + 40·Level`), Karten-Level +1

Funktion: Der Spieler verstärkt sein **festes** Deck strategisch.

### 4.4 Schatz-Raum
- Garantierte Belohnung ohne Kampf — der Spieler **wählt eine** von:
  - **1 gratis Karten-Upgrade**
  - **Heilung** der Base-HP (+30)
  - **Coins** (+50)

### 4.5 Zwischenboss
- Stärkerer Gegner-Encounter
- Belohnt mit Coins + **gratis Karten-Upgrade** + Zugang zum nächsten Welt-Raum

### 4.6 Endboss
- Finaler Kampf des aktuellen Akts
- Sieg = neue Boss-Auswahl + neuer, zufallsgenerierter Akt mit stärkeren Gegnern

---

## 5. WÄHRUNGEN & RESSOURCEN

| Ressource | Wo verwendet | Wie verdient |
|-----------|--------------|--------------|
| **Coins** (550 Start) | Shop (Karten-Upgrades) | Gegner besiegen, Schatz-Räume |
| **Mana** (20 Start) | *Platzhalter* — aktuell ohne Funktion | Auto-Regen (1/Sek.) |
| **EXP** | Level-Up im Combat | Gegner-Units töten |
| **Base-HP** (100 Start) | Überleben des Combats | Heilung in Schatz-Räumen |

---

## 6. COMBAT-SYSTEM (RUNDENBASIERT)

### 6.1 Konzept
**Deck-Building + rundenbasierter Truppen-Combat**. Der Spieler ist **Feldmarschall der Magie** — pro Runde wählt er zwei Karten, die als Truppen-Stacks ins Feld ziehen.

**Kernidee:** Kombinationen sind alles. Die zwei pro Runde gespielten Karten verstärken sich gegenseitig, wenn sie **Farbe oder Klasse** teilen.

**Combat-Modell:**
- **Rundenbasiert:** Jede Runde beginnt mit einem großen **„Runde N"**-Banner, dann Ziehen → Auswählen → Echtzeit-Gefecht.
- **Truppen pro Karte:** Jede gezogene Karte enthält eine **zufällige Truppenzahl** (gerade Zahlen; stärkere Karte = weniger Truppen). Beim Spielen spawnt sie entsprechend viele Einheiten desselben Typs.
- **Feld-Reset pro Runde:** Das Echtzeit-Gefecht läuft, bis keine lebenden Einheiten mehr da sind; danach wird das Feld geleert und die nächste Runde beginnt. Zugefügter Base-Schaden bleibt.
- **Mana** ist aktuell nur **Platzhalter-Ressource** (sichtbar, regeneriert) — es gated das Spielen nicht. Konkrete Nutzung folgt später.

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

### 6.3 Ziehen & Auswählen (pro Runde)
Jede Runde:
1. Es werden **5 verdeckte Karten** aus dem Deck gezogen (unabhängig zufällig, Random-Pool — kein Discard, kein Reshuffle).
2. Der Spieler **pickt blind 3** davon (er sieht erst danach, welche er gezogen hat).
3. Die 3 werden aufgedeckt (mit ihrer gewürfelten Truppenzahl) → der Spieler **spielt 2 davon**.
4. Teilen die 2 gespielten Karten **Farbe oder Klasse**, greift die **Combo** (siehe 6.5). Andernfalls werden einfach zwei Stacks ohne Bonus gespielt.

**Gegner:** zieht direkt **3 zufällige** Karten aus seinem (mono-farbigen) Akt-Deck — ohne den 5er-Blind-Pick — und spielt 2 (bevorzugt ein Combo-Paar). Alles außer dem Deck ist zufällig.

**Mana:** Platzhalter-Ressource (Bar sichtbar, regeneriert +1/Sek.), gated das Spielen aber **nicht**.

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

**4. Mana-Kosten** — aktuell nur Anzeige/Platzhalter (kein Spiel-Gate). Dient zugleich als Stärke-Maß für die Truppenzahl.

**5. Passive Fähigkeit** — triggert automatisch (z. B. auf Tick, bei Spawn, bei Tod, bei HP-Schwelle)

**6. Combo-Boni (kartenspezifisch)** — Jede Karte definiert ihre **eigenen** Buff-Werte für Farb- und Klassen-Combos (z. B. `colorBuff: { damage: +4 }`, `classBuff: { hp: +5 }`). Es gibt keine globalen Default-Werte pro Farbe/Klasse — die Werte stehen pro Karte fest.

**7. Truppenzahl (pro Ziehung gewürfelt)** — Beim Aufdecken erhält die Karte eine zufällige Truppenzahl in **2er-Schritten**. **Stärkere Karten (höhere Mana) = weniger Truppen** (z. B. schwach 2–20, stark 2–10). Karten-**Upgrades** erhöhen diesen Range (siehe 6.9). Die Zahl wird auf der Karte angezeigt; beim Spielen spawnen so viele Einheiten.

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

### 6.6 Combat-Flow (rundenbasiert)

Eine Runde durchläuft feste Phasen:

1. **Banner:** Großes **„Runde N"** wird kurz eingeblendet.
2. **Ziehen:** 5 verdeckte Karten, Spieler pickt blind 3 (siehe 6.3).
3. **Auswählen:** Die 3 werden mit Truppenzahl aufgedeckt; Spieler wählt 2 und bestätigt. Der Gegner hat parallel schon 3 gezogen und 2 gewählt.
4. **Gefecht (Echtzeit):** Beide Seiten deployen ihre Truppen-Stacks (Combo-Aura greift sofort, siehe 6.5). Dann läuft die Simulation:
   - **Bewegung:** Units laufen Richtung gegnerischer Base mit ihrer Speed.
   - **Targeting/Angriff:** Treffen sie Gegner, kämpfen sie im jeweiligen Angriffstakt.
   - **Tod & EXP:** Stirbt eine Unit → entfernt, EXP-Anteil wandert zum Gegner-Spieler.
   - **Base-Damage:** Erreicht eine Unit die gegnerische Base → Base-HP-Schaden, Unit verschwindet.
   - **Level-Up-Check:** EXP-Schwelle erreicht → Gefecht pausiert, Spieler wählt einen Vorteil (siehe 6.7).
5. **Rundenende:** Sind keine lebenden Units mehr da (Safety-Cap ~30 s), wird das **Feld geleert** und die nächste Runde beginnt mit dem Banner. Base-Schaden bleibt erhalten.

**Gegner-KI:** zieht aus dem **mono-farbigen Akt-Deck** (alle Gegner eines Akts = Akt-Farbe), wählt 2 (bevorzugt Combo-Paar). Härte skaliert über das **Gegner-Karten-Level** (Stats + Truppen) pro Akt.

**Pause-Verhalten:** ESC pausiert die komplette Simulation.

### 6.7 Level-Up im Combat (mit Rarität)
Bei genug EXP → Level-Up. Es werden **3 Vorteile aus einem größeren Pool gerollt**, der Spieler wählt **einen**. Jeder Vorteil hat eine **Rarität** — höher = stärkerer Effekt:

| Rarität | Gewicht (≈) |
|---------|------------|
| Gewöhnlich (Common) | 50 % |
| Ungewöhnlich (Uncommon) | 27 % |
| Selten (Rare) | 14 % |
| Episch (Epic) | 7 % |
| Legendär (Legendary) | 2 % |

Vorteils-Pool (Magnitude skaliert mit Rarität): **+Damage**, **+Truppen** (pro Karte), **+Max Base-HP**, **Sofort-Heilung**, **+HP-Regen**. Die KI nimmt automatisch den seltensten gerollten Vorteil.

### 6.8 Sieg / Niederlage im Combat
- **Sieg:** Gegner-Base HP = 0 → zurück zur Raum-/Welt-Karte. Belohnung: Coins (skaliert mit Encounter-Typ und Akt); **Boss/Mini-Boss zusätzlich: ein gratis Karten-Upgrade**.
- **Niederlage:** Spieler-Base HP = 0 → Run beendet, zurück zum Hauptmenü.
- **Reset zwischen Kämpfen:** EXP, Combat-Level und Truppen-/Schaden-Boni werden nach jedem Encounter zurückgesetzt. Base-HP wird **nicht** automatisch geheilt — Heilung nur in Schatz-Räumen oder durch Perks/Level-Ups.

### 6.9 Deck-Aufbau & Starter-Deck

- **Starter-Deck:** Jeder Run startet mit einem **festen Starter-Deck von ~10 Karten** (identisch über alle Runs), bewusst **mehrfarbig**, damit Combos möglich sind.
- **Kein Wachstum:** Das Deck **wächst nie**. Shop, Schatz-Räume und Boss-Belohnungen geben ausschließlich **Karten-Upgrades**.
- **Upgrade:** Ein Karten-Level erhöht **Stats (Damage/HP, +15 %/Stufe)** UND den **Truppen-Range (+2 Min/Max pro Stufe)**.
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
