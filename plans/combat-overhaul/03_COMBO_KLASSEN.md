# 03 — Klassen-Combos (gleiche Klasse 2×)

Spielt der Spieler (oder Gegner) zwei Karten **derselben Klasse**, feuert der
**Klassen-Combo**. Er gilt **nur für die laufende Runde** und wirkt **armee-weit**
(auf beide gespielten Stacks + alle in der Runde beschworenen Units, soweit sinnvoll).

> **Verbindlich (siehe [README.md](README.md)):** Die *Wirkung* jedes Combos ist fixiert.
> Nur die Zahlen (Multiplikatoren, HP/Anzahl der Beschwörungen) sind in `balance.ts`
> tunebar.

> **Gleichzeitigkeit:** Teilen die zwei Karten zusätzlich die Farbe, greift der
> Farb-Combo ([04_COMBO_FARBEN.md](04_COMBO_FARBEN.md)) **zusätzlich**.

> **Δ Ist-Zustand:** Heute ist jeder Klassen-Combo nur ein Flat-Stat-Buff
> (`CLASS_ARMY_BONUS`, z. B. Krieger → +4 DMG). Diese Tabelle **entfällt**; die Combos
> werden zu den unten beschriebenen Mechaniken umgebaut.

---

## ⚔️ Krieger + Krieger — „Übermacht"

- **Was es macht:** Schadens-Multiplikator auf alle eigenen Units, der **mit der Anzahl
  der Units steigt** — *je mehr Units, desto höher der DMG-Mult*.
- **Wie es wirkt:** Beim Spawn wird die Gesamtzahl der eigenen Units gezählt; daraus
  ergibt sich ein Multiplikator auf den Grund-Schaden aller eigenen Units. Mehr Truppen
  → höherer Multiplikator (skalierende Kurve, gedeckelt gegen Explosion).
- **Vorschlagswert (tunebar):** `dmgMult = 1 + 0.02 × Anzahl_eigener_Units`, Cap bei
  z. B. ×2.0. (20 Units → ×1.4; 50 Units → Cap.)
- **Spielgefühl:** Belohnt breite, zahlreiche Aufstellungen. Glänzt zusammen mit
  **Krieg + Krieg** (Truppen verdoppeln) — erst verdoppeln, dann skaliert der Mult auf
  die größere Masse.
- **Was es NICHT tut:** Kein Flat-+X-Schaden; der Bonus ist **anzahl-abhängig**. Heilt
  nicht, beschwört nicht.

---

## 🏰 Festung + Festung — „Mauer"

- **Was es macht:** Baut eine **zerstörbare Mauer** vor die eigenen Festungen, die der
  Gegner **erst zerstören muss**, bevor er durchkommt.
- **Wie es wirkt:** Beim Spawn entsteht ein statisches Mauer-Objekt (ein oder mehrere
  Segmente) auf der eigenen Feldhälfte vor der Hinten-Linie. Die Mauer hat eigene HP,
  bewegt sich nicht, greift nicht an. Gegner-Units müssen die Mauer als Ziel angreifen
  und zerstören, um vorbeizukommen; eigene Units passieren sie frei.
- **Vorschlagswert (tunebar):** 1 Mauer-Segment pro Festungs-Stack, HP ≈ Summe der
  HP-Werte der Festungs-Karte. Verschwindet am Rundenende.
- **Spielgefühl:** Klassisches Bollwerk — kauft Zeit, damit Festungen + Magier von
  hinten alles wegschießen. Brutal mit **Stein + Stein** (doppelte Mauer-HP, wenn die
  Mauer-HP von Unit-HP abgeleitet wird).
- **Was es NICHT tut:** Die Mauer greift nicht an und heilt nicht. Sie ist kein
  permanentes Gebäude — nur diese Runde.

---

## 🐎 Reittier + Reittier — „Wilde Herde"

- **Was es macht:** **+1 Schaden für jede Unit, die ein Reittier ist.**
- **Wie es wirkt:** Beim Spawn (und bei späteren Reittier-Spawns in der Runde) wird die
  Anzahl eigener Reittier-Units gezählt; jede Reittier-Unit erhält `+1 × Anzahl_Reittiere`
  Schaden. Je größer die Herde, desto härter tritt jedes einzelne Reittier.
- **Vorschlagswert (tunebar):** genau `+1 DMG je Reittier-Unit` (linear). Optionaler Cap,
  falls Tests Explosion zeigen.
- **Spielgefühl:** Verwandelt die „viel Tempo, wenig Wucht"-Schwäche der Reittiere in
  Stärke, sobald man eine große Herde fährt. Top mit **Krieg + Krieg** (mehr Reittiere =
  höherer Bonus pro Stück).
- **Was es NICHT tut:** Buff gilt nur für **Reittier**-Units, nicht für andere Klassen
  in der Armee. Erhöht nicht den Speed.

---

## ✨ Magier + Magier — „Beschwörung"

- **Was es macht:** Beschwört eine **kleine Armee** vorne (zusätzliche Einheiten als
  Vorhut).
- **Wie es wirkt:** Beim Spawn werden N zusätzliche, schwache Einheiten an der
  **Front-Linie** der eigenen Seite erzeugt — eine beschworene Mini-Welle, die vorrückt
  und den Gegner bindet, während die Magier von hinten schießen.
- **Vorschlagswert (tunebar):** N ≈ 4–6 schwache Beschwörungen (eigene „Magier-Konstrukt"-
  Stats, niedrige HP/DMG). Verschwinden am Rundenende.
- **Spielgefühl:** Gibt den verletzlichen Magiern eine eigene Frontlinie, sodass sie
  nicht ungeschützt dastehen. Die kleine Armee zerfällt schnell, kauft aber Zeit.
- **Was es NICHT tut:** Beschwört keine Magier (keine Projektil-Ketten). Die Beschworenen
  sind Wegwerf-Frontlinie, kein dauerhaftes Heer.

---

## ➕ Heiler + Heiler — „Großer Wächter"

- **Was es macht:** Beschwört **einen großen, langsamen Wächter**, der angreift und
  **viel aushält**.
- **Wie es wirkt:** Beim Spawn entsteht **eine** einzelne Boss-artige Einheit auf der
  eigenen Seite: sehr hohe HP, langsame Bewegung, schlägt im Nahkampf hart zu. Er
  marschiert nach vorne und absorbiert enorm viel Schaden, während die Heiler ihn
  (und die Armee) am Leben halten.
- **Vorschlagswert (tunebar):** 1 Wächter, HP ≈ 8–12× einer normalen Unit, niedriger
  Speed, hoher Einzelschaden, langsamer Takt.
- **Spielgefühl:** Die Defensiv-Heiler bekommen eine massive Frontfigur, die sie aktiv
  hochheilen — ein nahezu unsterblicher Brecher, solange die Heiler leben. Synergie mit
  **Natur + Natur** (Dauerheilung) und **Stein + Stein** (doppelte Wächter-HP).
- **Was es NICHT tut:** Beschwört nicht mehrere Wächter (genau einer pro Combo). Heilt
  nicht von selbst — der Wächter braucht die Heiler, um wirklich zu glänzen.

---

## Stacking-Hinweis

Da Farb- und Klassen-Combo **gleichzeitig** greifen, sind mono-farbige Klassen-Paare die
stärksten Spielzüge. Beispiele:

| 2 gespielte Karten | Klassen-Combo | Farb-Combo |
|---|---|---|
| Berserker + Kriegspferd (beide Krieg) | — (versch. Klasse) | **Krieg**: Truppen ×2 |
| Berserker + Söldner (beide Krieger) | **Krieger**: DMG-Mult | — (Farblos) |
| Berserker + Kriegsfeste? *(versch. Klasse)* | — | **Krieg**: Truppen ×2 |
| Zwei Steinfestungen-äquivalent (gibt's nur 1× je Karte) | — | — |
| Steinbrecher + Steinfestung (beide Stein, versch. Klasse) | — | **Stein**: HP ×2 |
| Steinbrecher + Söldner *(beide Krieger, versch. Farbe)* | **Krieger**: DMG-Mult | — |

> Hinweis: Das Deck hat **je Karte genau ein Exemplar** (25 unterschiedliche Karten),
> aber der Runden-Draw zieht aus einem **Random-Pool mit Zurücklegen** (`drawEntries` in
> `RoundSystem.ts`). Dieselbe Karte kann also **zweimal** gezogen und gespielt werden —
> z. B. zwei Berserker. Genau dann teilen die zwei gespielten Karten Farbe *und* Klasse,
> und **beide Combos feuern gleichzeitig** (hier: Krieg-Truppen ×2 **und** Krieger-DMG-Mult).
> Das ist der Hauptweg zum Doppel-Combo und der Grund, warum die „beide greifen"-Regel
> fix verankert ist.
