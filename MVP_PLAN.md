# MVP-PLAN — Chromatic

Referenziert [GAME_DESIGN.md](GAME_DESIGN.md) und [TECH_PLAN.md](TECH_PLAN.md).

**MVP-Ziel:** Ein vollständiger, spielbarer Mini-Run — ein einziger Akt mit ~6 Räumen, einfacher Combat, funktionierendem Deck-Building, Game-Over und Restart. Kein Polish, keine echten Assets, keine Meta-Progression.

**Definition „MVP fertig":** Ein neuer Spieler kann das Spiel starten, einen ganzen Akt durchspielen (Sieg über Endboss → kurze Win-Anzeige → zurück ins Hauptmenü), oder verlieren und neu starten. Combat fühlt sich nach Real-Time-Combo-Druck an. Mindestens 2 Encounter-Typen und 10 verschiedene Karten existieren.

---

## Meilenstein 0 — Projekt-Setup (½ Tag)

**Liefert:** Lauffähiges leeres Projekt.

- [ ] `pnpm init`, Vite + TypeScript-Template, Phaser 3, Vitest installiert
- [ ] ESLint + Prettier konfiguriert
- [ ] Ordnerstruktur aus TECH_PLAN.md angelegt
- [ ] `MainMenuScene` mit Button „SPIELEN" → leeres `WorldMapScene`
- [ ] `pnpm dev` startet, `pnpm test` läuft

**Akzeptanz:** Browser zeigt Hauptmenü, Klick auf „SPIELEN" wechselt zur (leeren) Welt-Karte.

---

## Meilenstein 1 — Combat-Sandbox (3–4 Tage)

**Liefert:** Isolierter Combat ohne Run-Kontext. Alles Hardcoded.

- [ ] `domain/Card.ts`, `domain/Unit.ts` Typen
- [ ] `cards.ts` mit ~10 hardcoded Karten (alle 5 Farben, alle 5 Klassen abgedeckt)
- [ ] `CombatState` + `advance(dt)`-Loop
- [ ] `ManaSystem` (Regen, Cap, Cost-Abzug)
- [ ] `DrawSystem` (Random-Pool, Auto-Draw alle 4 s, Hand-Size 3)
- [ ] `UnitSystem` (Spawn, Bewegung links→rechts, Targeting nächster Gegner, Angriff im Takt, Tod)
- [ ] `ComboAuraSystem` (Field-Aura-Berechnung on-change)
- [ ] `AiController` Heuristik v1: „spielt teuerste leistbare Karte, wenn cooldown abgelaufen"
- [ ] `ExpSystem` (Kill → EXP, Schwelle → Pause + Level-Up-Dialog mit 6 Optionen aus Sektion 6.7)
- [ ] `CombatScene` UI: Hand unten (3 klickbare Karten), Mana-Bar, beide Base-HP-Bars, Units als farbige Rechtecke mit HP-Indikator, Sieg/Niederlage-Screens
- [ ] ESC pausiert Combat-Tick
- [ ] **Unit-Tests** für ManaSystem, ComboAuraSystem, AiController

**Akzeptanz:** Combat-Scene direkt starten (DevTools-Shortcut), beide Seiten spielen Karten, Units kämpfen sichtbar, eine Seite gewinnt, Level-Up-Auswahl funktioniert, ESC pausiert.

---

## Meilenstein 2 — Run-Loop (3 Tage)

**Liefert:** Spielbarer Akt-Durchlauf vom Hauptmenü bis Endboss.

- [ ] `RunState` (Coins, Deck, aktive Perks, aktuelle Position auf Map)
- [ ] `MapGenerator.generateAct(1)` — DAG mit ~6 Knoten, Endboss als Finale
- [ ] `WorldMapScene` — Knoten als klickbare Punkte, Verbindungen als Linien, aktueller Spieler-Knoten hervorgehoben, nur erreichbare Nachbarn klickbar, alle Räume sichtbar
- [ ] `starterDeck.ts` — 10 fixe Karten
- [ ] `encounters.ts` — handgemachte Decks für „normaler Kampf", „schwerer Kampf", „Endboss"
- [ ] `CombatScene` empfängt Spieler-Deck (aus `RunState`) und Encounter-Deck (aus Raum)
- [ ] Sieg → zurück zur `WorldMapScene`, Coins-Belohnung addiert
- [ ] Niederlage → `GameOverScene` → Hauptmenü
- [ ] Sieg über Endboss → kurze „Akt geschafft"-Anzeige → Hauptmenü (Akt 2 später)

**Akzeptanz:** Kompletter Run vom Hauptmenü bis Endboss-Sieg oder Niederlage. Coins werden korrekt gesammelt. Deck-Änderungen persistieren über Räume.

---

## Meilenstein 3 — Shop & Schatz-Räume (2 Tage)

**Liefert:** Deck-Wachstum.

- [ ] `ShopScene` — 4 Karten zum Kauf, Coins-Anzeige, Hover-Info, Kauf zieht Coins ab und fügt Karte zu `RunState.deck`
- [ ] `TreasureScene` — drei Belohnungs-Typen (Coins / Karte / Base-HP-Heilung), randomisiert
- [ ] Karten-Drop-Pool als einfache Liste in `cards.ts` mit Rarität-Tag (für MVP nur „common")
- [ ] `MapGenerator` platziert Shop und Schatz als eigene Knoten-Typen

**Akzeptanz:** Im Run lassen sich Karten kaufen und finden. Das wirkt sich im nächsten Combat aus (Random-Draw zieht potenziell neue Karten).

---

## Meilenstein 4 — Sub-Knoten-Maps (1 Tag)

**Liefert:** Ebene B aus dem Design.

- [ ] Beim Eintreten in einen Welt-Knoten: `RoomMapScene` öffnet sich mit kleinerem DAG (3–5 Sub-Knoten)
- [ ] Verschiedene Sub-Knoten-Typen (Kampf, Schatz, evtl. Zwischenboss)
- [ ] Alle Sub-Knoten müssen durchlaufen werden, bevor man zur Welt-Karte zurückkehrt (oder: Zwischenboss als „Exit-Gate")
- [ ] Erweiterung von `MapGenerator` für Sub-Maps

**Akzeptanz:** Ein Welt-Raum besteht aus mehreren Sub-Encountern, Spieler navigiert durch Klicks, kehrt nach Abschluss zur Welt-Karte zurück.

---

## Meilenstein 5 — Zauber-Räume & Perks (1 Tag)

**Liefert:** Permanente Run-Buffs.

- [ ] `perks.ts` mit den 6 Perks aus Sektion 4.2
- [ ] `PerkSelectScene` — 3 zufällige Perks zur Auswahl, Hover-Info, Klick-Bestätigung
- [ ] Gewählter Perk wandert in `RunState.activePerks`
- [ ] Combat liest aktive Perks und wendet sie auf Start-Mana/Max-HP/etc. an
- [ ] `MapGenerator` platziert Zauber-Räume

**Akzeptanz:** Zauber-Raum öffnet sich, Perk wird gewählt, Effekt ist im nächsten Combat messbar (z. B. 40 Max-Mana statt 20).

---

## Meilenstein 6 — Polish & Balance-Pass (1–2 Tage)

**Liefert:** Spielbarkeit, nicht Hübschheit.

- [ ] Erste Balance-Iteration: Mana-Kosten / Stats / Auto-Draw-Intervall mit echtem Playtest tunen
- [ ] Visuelles Feedback (Damage-Numbers, Tod-Animation, Combo-Glow auf Units)
- [ ] Sound-Effekte für Kartenspiel, Hit, Tod, Sieg (freie Assets)
- [ ] Pause-Menü mit „Fortsetzen / Hauptmenü"-Buttons
- [ ] Bugfix-Runde

**Akzeptanz:** Drei vollständige Test-Runs durchgespielt, mindestens einer gewonnen, keine kritischen Bugs.

---

## Bewusst NICHT im MVP

- Echte Sprite-Grafiken — alles bleibt geometrische Formen + Farbe
- Akt 2+, Schwierigkeits-Skalierung über mehrere Akte
- Meta-Progression / Unlocks zwischen Runs
- Save-System (Browser-Refresh = Run weg)
- Audio-Mixing / Optionen-Menü mit Lautstärke-Reglern
- Tutorial / Onboarding
- Optimierung für >20 Units gleichzeitig auf dem Feld

Diese Punkte kommen in Post-MVP-Iterationen.

---

## Zeit-Schätzung (gesamt)

- M0: 0.5 Tage
- M1: 3–4 Tage  ← Risiko-Meilenstein, Combat-Mechanik ist neu
- M2: 3 Tage
- M3: 2 Tage
- M4: 1 Tag
- M5: 1 Tag
- M6: 1–2 Tage

**Summe:** ~12–14 Personentage. Realistisch bei Vollzeit: 3 Wochen. Bei Hobby-Tempo (1–2 h/Tag): 6–10 Wochen.

---

## Reihenfolge-Logik

M1 zuerst, weil Combat das einzige unbekannte Risiko ist — wenn der Combat-Feel nicht stimmt, ist das ganze Spiel kaputt. Erst danach Run-Loop drum herum bauen. Shop/Treasure/Perks/Sub-Maps sind alle in beliebiger Reihenfolge austauschbar und tragen jeder eigene Akzeptanz-Kriterien.
