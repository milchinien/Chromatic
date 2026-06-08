# 05 — Die Karten im Detail

Alle 25 Karten (5 Farben × 5 Klassen) + das beschworene Skelett. Sichtbare Stats
(Mana/DMG/HP) stammen 1:1 aus `src/systems/data/cards.ts` (Stand 2026-06-05) und werden
**nicht** geändert. `attackInterval`/`speed` sind Klassen-Defaults (siehe
[01_KLASSEN.md](01_KLASSEN.md)). Karten-**Upgrades** skalieren Stats + Truppen-Range.

**Format je Karte:** Farbe/Klasse · Stats · *Was sie macht* / *Wie* / *Besonders* /
*Verhalten* / *Was sie NICHT tun soll*.

Die meisten Karten erben ihr Verhalten 1:1 aus der Klasse. **Besondere Karten** (vom
Nutzer explizit hervorgehoben) brechen ihre Klassen-Norm — die sind unten klar markiert
mit ⭐.

---

## Klasse: Krieger (Nahkampf, normale Geschwindigkeit)

### Berserker — Krieg/Krieger · Mana 7 · DMG 15 · HP 8
- **Macht:** Standard-Frontkämpfer mit hohem Schaden, fragil.
- **Wie:** Marschiert vor, schlägt im Nahkampf. Passive: unter 50 % HP steigt der
  Grund-Schaden dauerhaft (Berserker-Wut, ×1.5).
- **Besonders:** Höchster Schaden der Krieger, aber Glaskanone.
- **Verhalten:** Frontlinie für aggressive Krieg-Spielzüge.
- **Nicht:** Nicht tanken, nicht hinten bleiben.

### ⭐ Waldläufer — Natur/Krieger · Mana 7 · DMG 15 · HP 8
- **Macht:** **Krieger, der von Weitem angreift** (Bogenschütze) — bricht die Melee-Norm.
- **Wie:** Bewegt sich wie ein Krieger nach vorne, hält aber **Distanz** zum Ziel und
  greift aus **mittlerer/großer Reichweite** an (eigene `attackRange`, ähnlich Magier,
  aber als Pfeil-Schuss, nicht als Magie-Projektil-Aura).
- **Besonders:** Einziger Krieger mit Fernangriff. Kombiniert Krieger-Combo-Zugehörigkeit
  (zählt als Krieger!) mit sicherem Distanzschaden.
- **Verhalten:** Steht etwas hinter der Front und schießt; profitiert von Frontlinien-Schutz.
- **Nicht:** Nicht in den Nahkampf laufen. **Zählt aber weiterhin als Krieger** für
  Krieger+Krieger-Combos.
- **Δ Ist-Zustand:** Aktuell normaler Melee-Krieger → Fernkampf-Verhalten muss ergänzt werden.

### ⭐ Steinbrecher — Stein/Krieger · Mana 7 · DMG 15 · HP 8
- **Macht:** **Mehr HP, dafür langsamer** als ein normaler Krieger.
- **Wie:** Melee wie Krieger, aber erhöhter HP-Wert und reduzierter Speed (zäher Brecher).
- **Besonders:** Hält die Front länger als andere Krieger.
- **Verhalten:** Vorderste Linie als zäher Anker.
- **Nicht:** Nicht schnell sein, nicht fragil spielen.
- **Δ Ist-Zustand:** Sichtbare Stats bleiben; HP-Bonus/Speed-Malus als Karten-Override
  ergänzen (heute identisch zu anderen Kriegern).

### ⭐ Grabwächter — Untot/Krieger · Mana 7 · DMG 15 · HP 8
- **Macht:** **Jede von dieser Unit getötete Unit wird zu einem freundlichen Skelett.**
- **Wie:** Melee-Krieger; tötet er einen Gegner, spawnt am Sterbeort ein eigenes Skelett
  (siehe Skelett unten). Funktioniert **unabhängig** vom Untot+Untot-Farb-Combo — der
  Grabwächter erntet immer **seine eigenen** Kills.
- **Besonders:** Persönliche Skelett-Fabrik; je mehr er killt, desto größer die eigene Armee.
- **Verhalten:** An die Front stellen, wo er viele Kills macht.
- **Nicht:** Erntet nur **eigene** Kills (nicht jeden Tod auf dem Feld — das ist der
  Untot+Untot-Combo). Skelette beschwören nicht weiter.
- **Δ Ist-Zustand:** Heute hat Grabwächter `rageOnLowHp` (Berserker-Wut). Soll: onKill →
  Skelett-Spawn als Karten-Passive.

### Söldner — Farblos/Krieger · Mana 7 · DMG 15 · HP 8
- **Macht:** Neutraler Standard-Krieger ohne Farb-Identität.
- **Wie:** Melee wie Berserker.
- **Besonders:** Löst nie einen Farb-Combo aus, ist aber perfekter **Krieger-Combo-Partner**.
- **Verhalten:** Flexible Front-Einheit, wenn man Krieger+Krieger ohne Farb-Festlegung will.
- **Nicht:** Keinen Farb-Combo erwarten.

---

## Klasse: Festung (statisch, Weitkampf, bleibt hinten)

### Kriegsfeste — Krieg/Festung · Mana 6 · DMG 20 · HP 25
- **Macht:** Aggressive Geschütz-Festung mit hohem Schuss-Schaden.
- **Wie:** Statisch an der Base, beschießt anrückende Gegner aus großer Reichweite.
- **Besonders:** Höchster Schuss-Schaden der Festungen.
- **Verhalten:** Hinten-Linie, hält die Base und straft die Anmarschzone.
- **Nicht:** Nicht vorrücken.

### Wurzelbastion — Natur/Festung · Mana 6 · DMG 20 · HP 25
- **Macht:** Zähe Verteidiger-Festung.
- **Wie:** Statisch, Fernschuss. Passive: langsame Selbst-Reparatur.
- **Besonders:** Hält dank Natur-Sustain extrem lange.
- **Verhalten:** Anker der Hinten-Linie.
- **Nicht:** Nicht vorrücken.

### Steinfestung — Stein/Festung · Mana 6 · DMG 20 · HP 25
- **Macht:** Die zäheste Festung (HP-Identität Stein).
- **Wie:** Statisch, Fernschuss, Selbst-Reparatur.
- **Besonders:** Mit Stein+Stein (HP ×2) praktisch unzerstörbar.
- **Verhalten:** Unverrückbares Bollwerk.
- **Nicht:** Nicht vorrücken.

### ⭐ Totenzitadelle — Untot/Festung · Mana 6 · DMG 20 · HP 25
- **Macht:** **Spawnt alle 3 Sekunden 1 Skelett.**
- **Wie:** Statische Festung; ein onTick-Timer erzeugt alle 3 s ein freundliches Skelett
  an der Zitadelle, das nach vorne marschiert.
- **Besonders:** Passive Dauer-Truppenquelle, solange sie steht.
- **Verhalten:** Hinten stehen lassen und Skelette pumpen, während sie auch schießt.
- **Nicht:** Nicht vorrücken. Spawnt **nicht** schneller als alle 3 s.
- **Δ Ist-Zustand:** Heute `selfRepair`. Soll: onTick-Skelett-Spawn alle 3 s (statt/zusätzlich).

### Handelsposten — Farblos/Festung · Mana 6 · DMG 20 · HP 25
- **Macht:** Wirtschafts-Festung. **Pro Handelsposten auf dem Feld mehr XP-Zuwachs.**
- **Wie:** Statisch, schießt schwach. Solange er steht, erhöht er den EXP-Gewinn der
  eigenen Seite (additiv pro Handelsposten-Unit).
- **Besonders:** Beschleunigt Level-Ups im Combat — ein Tempo-/Skalierungs-Tool.
- **Verhalten:** Hinten stellen, früh ausspielen, um schneller zu leveln.
- **Nicht:** Nicht vorrücken. Kein Kampf-Fokus — der Wert ist das XP-Bonus.
- **Δ Ist-Zustand:** Heute `selfRepair`. Soll: XP-Multiplikator/Bonus pro Handelsposten
  in `ExpSystem` einhängen.

---

## Klasse: Reittier (volle Geschwindigkeit, Nahkampf, wenig DMG)

### Kriegspferd — Krieg/Reittier · Mana 5 · DMG 12 · HP 10
- **Macht:** Schneller Stürmer.
- **Wie:** Volle Geschwindigkeit zur Base/zu hinteren Gegnern, Melee, niedriger Schaden,
  hoher Takt. Passive: unter 50 % HP Panik-Galopp (+Speed).
- **Besonders:** Stärkstes Tempo-Tool in Krieg-Decks.
- **Verhalten:** Rusht hintere Gegner-Reihen.
- **Nicht:** Nicht stehenbleiben, nicht Einzelschaden erwarten.

### Hirsch des Waldes — Natur/Reittier · Mana 5 · DMG 12 · HP 10
- **Macht:** Schneller, zäher Stürmer.
- **Wie:** Wie Kriegspferd; Natur-Identität für Natur-Combo.
- **Besonders:** Profitiert von Natur-Dauerheilung beim Durchbrechen.
- **Verhalten:** Tempo + Sustain.
- **Nicht:** Nicht stehenbleiben.

### Steinwolf — Stein/Reittier · Mana 5 · DMG 12 · HP 10
- **Macht:** Etwas langsamerer, härterer Stürmer (Stein = HP).
- **Wie:** Wie Reittier, leicht reduzierter Speed-Default, mehr Stehvermögen.
- **Besonders:** Überlebt den Sturm dank Stein-HP.
- **Verhalten:** Durchbruch-Reittier.
- **Nicht:** Nicht als Tank vorne parken.

### Knochenross — Untot/Reittier · Mana 5 · DMG 12 · HP 10
- **Macht:** Schneller Untoten-Stürmer.
- **Wie:** Wie Kriegspferd; Untot-Identität.
- **Besonders:** Top mit Untot-Combo (stirbt es, füttert es das Totenheer).
- **Verhalten:** Aggressives Tempo in Untot-Decks.
- **Nicht:** Nicht stehenbleiben.

### Wanderkamel — Farblos/Reittier · Mana 5 · DMG 12 · HP 10
- **Macht:** Neutraler Stürmer.
- **Wie:** Wie Reittier, kein Farb-Combo.
- **Besonders:** Reiner Reittier-Combo-Partner ohne Farbbindung.
- **Verhalten:** Tempo-Füller.
- **Nicht:** Keinen Farb-Combo erwarten.

---

## Klasse: Magier (Projektile, mittlere Distanz, nie Nahkampf)

### Feuermagier — Krieg/Magier · Mana 4 · DMG 10 · HP 6
- **Macht:** Distanz-Schütze, wirft **Feuerbälle**.
- **Wie:** Rückt auf mittlere Distanz vor, stoppt, feuert Feuerball-Projektile pro Takt.
- **Besonders:** Rotes Geschoss-Markenzeichen; solider Dauerschaden.
- **Verhalten:** Hinten-Linie hinter der Front.
- **Nicht:** Nicht in den Nahkampf.

### Waldweiser — Natur/Magier · Mana 4 · DMG 10 · HP 6
- **Macht:** Distanz-Schütze, Natur-Identität.
- **Wie:** Projektile aus mittlerer Distanz.
- **Besonders:** Gut mit Natur-Dauerheilung (überlebt als fragiler Caster).
- **Verhalten:** Hinten-Linie.
- **Nicht:** Nicht in den Nahkampf.

### Steinbeschwörer — Stein/Magier · Mana 4 · DMG 10 · HP 6
- **Macht:** Distanz-Schütze, wirft **Steinkugeln**.
- **Wie:** Projektile aus mittlerer Distanz.
- **Besonders:** Steiniges Geschoss; profitiert von Stein-HP-Verdopplung (sonst fragil).
- **Verhalten:** Hinten-Linie.
- **Nicht:** Nicht in den Nahkampf.

### ⭐ Nekromant — Untot/Magier · Mana 4 · DMG 10 · HP 6
- **Macht:** **Jeder Nekromant beschwört alle 2 Sekunden 1 (schlechtes) Skelett.**
- **Wie:** Bleibt hinten (Magier-Position), schießt schwach **oder** verzichtet auf den
  Direktschuss zugunsten der Beschwörung — der Kern ist der 2-Sekunden-Skelett-Spawn.
  Mehrere Nekromanten = mehrere Spawn-Quellen.
- **Besonders:** Verwandelt Zeit in Truppen — die einzige Magier-Karte, die beschwört
  statt zu schießen.
- **Verhalten:** Hinten sicher halten und Skelett-Strom aufbauen.
- **Nicht:** Nicht in den Nahkampf. Spawnt **nicht** schneller als alle 2 s pro Nekromant.
  Skelette beschwören nicht weiter (keine Ketten).
- **Δ Ist-Zustand:** Heute `raiseSkeletonOnDeath` (Skelett bei eigenem Tod). Soll: onTick
  alle 2 s ein Skelett, solange der Nekromant lebt.

### Zeitweiser — Farblos/Magier · Mana 4 · DMG 10 · HP 6
- **Macht:** Neutraler Distanz-Schütze.
- **Wie:** Projektile aus mittlerer Distanz, kein Farb-Combo.
- **Besonders:** Reiner Magier-Combo-Partner (Magier+Magier-Beschwörung) ohne Farbbindung.
- **Verhalten:** Hinten-Linie.
- **Nicht:** Nicht in den Nahkampf; keinen Farb-Combo erwarten.

---

## Klasse: Heiler (bleibt hinten, heilt niedrigste HP zuerst)

> Grundregel aller Heiler: heilt **eigene Units**, **priorisiert die mit den wenigsten
> HP**, und **heilt die eigene Klasse besser** (Klassen-Affinitäts-Faktor, z. B. ×1.5 auf
> Ziele derselben Klasse wie der Heiler). Macht keinen / vernachlässigbaren Schaden.

### Kriegssanitäter — Krieg/Heiler · Mana 3 · DMG 8 · HP 12
- **Macht:** Heiler, der **Krieger besonders gut heilt** (Krieg-Affinität).
- **Wie:** Hinten, heilt niedrigstes HP-Ziel; Bonus-Heilung auf Krieg-/Krieger-Frontkämpfer.
- **Besonders:** Idealer Begleiter aggressiver Krieg-Fronten.
- **Verhalten:** Hinter die Krieger-Front stellen.
- **Nicht:** Nicht vorrücken, nicht angreifen, nicht Gegner heilen.

### Naturheiler — Natur/Heiler · Mana 3 · DMG 8 · HP 12
- **Macht:** Reinrassiger Support-Heiler.
- **Wie:** Hinten, heilt niedrigstes HP-Ziel; stärkste Grund-Heilung.
- **Besonders:** Kern jedes Natur-Sustain-Decks; doppelt stark mit Natur-Dauerheilung.
- **Verhalten:** Hinten-Linie.
- **Nicht:** Nicht vorrücken / angreifen.

### Steinhüter — Stein/Heiler · Mana 3 · DMG 8 · HP 12
- **Macht:** Zäher Heiler.
- **Wie:** Hinten, heilt niedrigstes HP-Ziel; eigene erhöhte HP.
- **Besonders:** Überlebt Reittier-Rushes auf die Backline besser als andere Heiler.
- **Verhalten:** Hinten-Linie.
- **Nicht:** Nicht vorrücken / angreifen.

### Seelenheiler — Untot/Heiler · Mana 3 · DMG 8 · HP 12
- **Macht:** Untoten-Heiler.
- **Wie:** Hinten, heilt niedrigstes HP-Ziel; Untot-Identität.
- **Besonders:** Hält in Untot-Decks das (oft sterbeanfällige) Heer am Leben.
- **Verhalten:** Hinten-Linie.
- **Nicht:** Nicht vorrücken / angreifen.

### Gebetswirker — Farblos/Heiler · Mana 3 · DMG 8 · HP 12
- **Macht:** Neutraler Heiler.
- **Wie:** Hinten, heilt niedrigstes HP-Ziel, kein Farb-Combo.
- **Besonders:** Reiner Heiler-Combo-Partner (Heiler+Heiler-Wächter) ohne Farbbindung.
- **Verhalten:** Hinten-Linie.
- **Nicht:** Keinen Farb-Combo erwarten; nicht vorrücken / angreifen.

---

## Beschworene Einheit: Skelett (nicht im Deck)

- **Herkunft:** Nur via Beschwörung — Untot+Untot-Combo (jeder Tod), Grabwächter (eigene
  Kills), Totenzitadelle (alle 3 s), Nekromant (alle 2 s).
- **Stats (Ist):** Untot/Krieger · DMG 5 · HP 6 · schnell. Bewusst **schwach**.
- **Macht:** Wegwerf-Nahkämpfer, der nach vorne marschiert und Gegner bindet.
- **Besonders:** Masse statt Klasse — Skelette gewinnen über Zahl.
- **Nicht:** **Löst keine Combos aus, beschwört nichts** (keine Ketten / Endlos-Spawns).
  Verschwindet am Rundenende.

---

## Spezial-Karten-Übersicht (vom Nutzer hervorgehoben)

| Karte | Norm-Bruch / Besonderheit |
|---|---|
| **Waldläufer** | Krieger, der von Weitem angreift (Fernkampf) |
| **Steinbrecher** | Krieger mit mehr HP, dafür langsamer |
| **Grabwächter** | seine eigenen Kills → freundliche Skelette |
| **Totenzitadelle** | Festung, spawnt alle 3 s 1 Skelett |
| **Handelsposten** | Festung, +XP-Zuwachs pro Handelsposten |
| **Nekromant** | Magier, spawnt alle 2 s 1 (schlechtes) Skelett |
