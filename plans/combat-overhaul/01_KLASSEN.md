# 01 — Die 5 Klassen

Jede Karte hat genau **eine Klasse**. Die Klasse bestimmt das **Kampfverhalten**
(Bewegung, Reichweite, Targeting). Die Farbe (siehe [02_FARBEN.md](02_FARBEN.md))
bestimmt die thematische Identität. Einzelne Karten dürfen ihre Klassen-Rolle brechen —
diese Ausnahmen stehen pro Karte in [05_KARTEN.md](05_KARTEN.md).

**Lesehilfe je Klasse:**
- **Was sie macht** — die Kurzrolle
- **Wie sie es macht** — konkretes Bewegungs-/Angriffs-Verhalten
- **Was sie besonders macht** — das, was nur diese Klasse kann
- **Verhalten im Spiel** — wie es sich für den Spieler anfühlt
- **Was sie NICHT machen soll** — harte Anti-Patterns
- **Δ Ist-Zustand** — was im Code (Stand 2026-06-05) noch anders ist

---

## ⚔️ Krieger

- **Was sie macht:** Nahkämpfer. Geht mit **normaler Geschwindigkeit** nach vorne und
  greift im Nahkampf an. Das Rückgrat jeder Armee.
- **Wie sie es macht:** Spawnt, marschiert Richtung Gegner-Base mit mittlerem Speed
  (Default `speed ≈ 50`), sucht das nächste Gegner-Ziel, schlägt im Nahkampf
  (`ATTACK_RANGE`) im eigenen Angriffstakt zu.
- **Was sie besonders macht:** Solider Allrounder mit dem höchsten Grund-Schaden der
  „normalen" Klassen. Trägt die Frontlinie und nimmt den ersten Aufprall.
- **Verhalten im Spiel:** Verlässlicher Vorwärtsdruck. Der Spieler stellt Krieger als
  Frontlinie auf, um Raum zu gewinnen und Gegner zu binden.
- **Was sie NICHT machen soll:** Nicht aus der Distanz schießen (außer
  **Waldläufer**, siehe Ausnahme). Nicht hinten kampieren. Nicht schneller sein als ein
  Reittier.
- **Δ Ist-Zustand:** Bereits korrekt (Melee-Marsch). Keine Änderung nötig.

---

## 🏰 Festung

- **Was sie macht:** Statischer Verteidiger. **Bleibt hinten** bei der eigenen Base und
  **beschießt** anrückende Gegner aus der Distanz.
- **Wie sie es macht:** Spawnt nahe der eigenen Base und **bewegt sich (fast) nicht**.
  Greift Gegner an, sobald sie in ihre **große Schuss-Reichweite** kommen — ein
  Geschoss/Bolzen pro Angriffstakt. Höchste HP aller Klassen, langsamer Takt.
- **Was sie besonders macht:** Verwandelt die eigene Base-Zone in eine Todeszone.
  Bietet der Festung+Festung-Combo (zerstörbare Mauer, siehe
  [03_COMBO_KLASSEN.md](03_COMBO_KLASSEN.md)) den Anker.
- **Verhalten im Spiel:** „Turm-Defense"-Gefühl. Der Spieler legt Festungen in die
  **Hinten-Linie** und lässt sie die Base halten, während Krieger/Reittier vorne pushen.
- **Was sie NICHT machen soll:** Nicht nach vorne marschieren. Nicht in den Nahkampf
  laufen, um anzugreifen. Nicht die Base verlassen (außer eine Karte beschreibt es
  ausdrücklich).
- **Δ Ist-Zustand:** **Umbau nötig.** Aktuell läuft Festung mit `speed 28` nach vorne und
  schlägt melee. Soll: `speed ≈ 0` (statisch an Base-nahem Spawn) + **Fernangriff** mit
  großer Reichweite (eigene `attackRange`, deutlich > `ATTACK_RANGE`). Targeting: nächster
  Gegner innerhalb Schuss-Reichweite, sonst warten.

---

## 🐎 Reittier

- **Was sie macht:** Stürmt mit **VOLLER Geschwindigkeit** nach vorne. Schneller
  Nahkämpfer mit **weniger Schaden**.
- **Wie sie es macht:** Höchster Speed im Spiel (Default `speed ≈ 75+`). Rast an der
  Frontlinie vorbei Richtung Gegner-Base, engagiert nur, wenn ein Gegner direkt im Weg
  steht (Flankieren). Niedriger Schaden pro Treffer, aber häufig.
- **Was sie besonders macht:** Reichweiten-Brecher. Kommt schnell an die feindlichen
  Magier/Heiler/Festungen in der Hinten-Linie heran und an die Base.
- **Verhalten im Spiel:** Aggressives Tempo-Werkzeug. Der Spieler nutzt Reittiere, um
  die Base zu rushen oder hintere Support-Units zu zerreißen.
- **Was sie NICHT machen soll:** Nicht im Frontline-Stau stehenbleiben. Nicht hohen
  Einzelschaden austeilen (Tempo statt Wucht). Nicht aus der Distanz angreifen.
- **Δ Ist-Zustand:** Größtenteils vorhanden (Flanker-Logik, hoher Speed in
  `findClosestEnemy`/`moveTowards`). Feinschliff: sicherstellen, dass „volle
  Geschwindigkeit" deutlich über Krieger liegt und der Schaden bewusst niedriger ist.

---

## ✨ Magier

- **Was sie macht:** Weitkämpfer. Rückt nach vorne, **aber nie in den Nahkampf** —
  schießt **Projektile** (Feuerbälle, Steinkugeln, …) aus mittlerer Entfernung.
- **Wie sie es macht:** Marschiert bis auf **mittlere Distanz** an den nächsten Gegner
  heran und **stoppt dort**, statt weiter vorzulaufen. Feuert pro Angriffstakt ein
  Projektil, das zum Ziel fliegt und dort Schaden macht. Kommt ein Gegner zu nah,
  weicht der Magier eher zurück / hält Abstand, statt zu prügeln.
- **Was sie besonders macht:** Konstanter Distanzschaden. Visuelles Markenzeichen sind
  die farbthematischen Geschosse (Feuermagier = Feuerball, Steinbeschwörer = Steinkugel).
- **Verhalten im Spiel:** Sicheres Damage-Backline-Element. Der Spieler stellt Magier
  in die Hinten-Linie hinter eine Krieger/Festung-Front, sie zermürben den Gegner aus
  der Distanz.
- **Was sie NICHT machen soll:** Nicht in den Nahkampf laufen. Nicht an die Front
  vorrücken. Keine instant-AoE-Aura ohne Projektil (das war die alte Mechanik).
  **Ausnahme:** Nekromant ist Beschwörer statt Direktschütze (siehe Karte).
- **Δ Ist-Zustand:** **Umbau nötig.** Aktuell nutzt Magier eine `damageAura(radius)` —
  unsichtbarer Radius-DoT — und läuft melee-artig mit. Soll: **stehenbleiben auf
  mittlerer Distanz** + **sichtbare Projektile** (eigenes Projectile-System auf dem
  Canvas) mit Einzel-Ziel-Schaden im Takt.

---

## ➕ Heiler

- **Was sie macht:** Support. **Bleibt hinten** wie der Magier und **heilt eigene
  Units**, **priorisiert die mit den wenigsten HP**.
- **Wie sie es macht:** Hält sich in der Hinten-Linie, bewegt sich kaum vorwärts.
  Sucht pro Heil-Takt das **eigene verwundete Ziel mit dem niedrigsten HP-Anteil** in
  großer Heil-Reichweite und stellt dessen HP wieder her. **Jede Klasse heilt ihre
  eigene Klasse besser** — ein Heiler heilt einen anderen Heiler stärker, ein
  Krieger-Heiler (Kriegssanitäter) heilt Krieger stärker (siehe Karten-Detail).
- **Was sie besonders macht:** Hält teure Frontkämpfer am Leben und macht aus einer
  knappen Schlacht eine gewonnene. Ankert die Heiler+Heiler-Combo (Wächter-Beschwörung).
- **Verhalten im Spiel:** Force-Multiplier hinter der Front. Der Spieler kombiniert
  Heiler mit zähen Frontlinien, damit diese nicht sterben.
- **Was sie NICHT machen soll:** Nicht vorrücken. Nicht angreifen (Heiler macht keinen
  oder vernachlässigbaren Schaden). Nicht „reihum / zufällig" heilen — **immer zuerst
  das niedrigste HP-Ziel**. Nicht Gegner heilen.
- **Δ Ist-Zustand:** **Umbau nötig.** Aktuell `healAura(radius, perSec)` heilt **alle**
  Eigenen im Radius gleichmäßig, ohne Low-HP-Priorisierung und ohne Klassen-Affinität.
  Soll: gezielte Einzel-Heilung des niedrigsten HP-Ziels pro Takt + Klassen-Bonus-Faktor
  („heilt eigene Klasse besser").

---

## Stat-Defaults pro Klasse (tunebar in `balance.ts`)

Die sichtbaren Werte (Mana/DMG/HP) stehen pro Karte fest (siehe
[05_KARTEN.md](05_KARTEN.md)). `attackInterval`, `speed` und die neuen Felder
`attackRange` / Projektil-Flag sind Klassen-Defaults:

| Klasse | Takt (s) | Speed | Reichweite | Bewegt sich? | Angriffsart |
|--------|----------|-------|------------|--------------|-------------|
| Krieger | ~1.0 | mittel (~50) | Nahkampf | ja, vorwärts | Melee |
| Festung | ~1.6 | **0 (statisch)** | **groß (Fernschuss)** | nein | Geschoss |
| Reittier | ~0.9 | **hoch (~75+)** | Nahkampf | ja, voll vorwärts | Melee (wenig DMG) |
| Magier | ~1.3 | niedrig, stoppt auf Distanz | **mittel** | nur bis Distanz | **Projektil** |
| Heiler | ~1.4 | ~0, bleibt hinten | groß (Heil) | nein | Heilung (kein Schaden) |
