# Combat Overhaul — Chromatic

> **Status:** Verbindliche Design-Spezifikation. Erstellt 2026-06-05 nach Nutzer-Vorgabe.
> Dies ist die **autoritative Quelle** für Klassen-Rollen, Farb-Identitäten, Combos und
> Spezial-Units. Bei Konflikt mit älteren Dokumenten (GAME_DESIGN.md §6, balance.ts)
> gilt **dieses Verzeichnis**.

---

## ⛓️ VERBINDLICHE LEITPLANKE (darf nie aufgeweicht werden)

Die in diesem Verzeichnis definierten **Combos (Klassen- und Farb-Buffs)** und
**Klassen-Rollen** sind **dauerhaft fixiert**. Sie sind das Herz des Spielgefühls.
Zukünftige Iterationen dürfen **Zahlenwerte tunen** (in `balance.ts`), aber **niemals**
die *qualitative Wirkung* eines Combos oder einer Rolle ändern.

Konkret heißt „fixiert":
- **Krieg + Krieg** verdoppelt **immer** die Truppenzahl. (Nicht: „+50 % Truppen".)
- **Stein + Stein** verdoppelt **immer** die HP jeder Unit.
- **Untot + Untot** verwandelt **immer** jede sterbende Unit (Freund + Feind) in ein freundliches Skelett.
- **Natur + Natur** ist **immer** eine dauerhafte Heilung-über-Zeit.
- **Farblos + Farblos** gibt **immer** keinen Buff.
- **Krieger + Krieger** → Schadens-Multiplikator, der **mit der Truppenzahl steigt**.
- **Festung + Festung** → baut **immer** eine zerstörbare Mauer vor die Festungen.
- **Reittier + Reittier** → **+1 Schaden pro Reittier-Unit** auf dem Feld.
- **Magier + Magier** → beschwört **immer** eine kleine Armee vorne.
- **Heiler + Heiler** → beschwört **immer** einen großen, langsamen, zähen Wächter.

Und die Rollen:
- **Krieger** = Nahkampf, normale Geschwindigkeit (Ausnahmen pro Karte erlaubt).
- **Festung** = statisch, bleibt hinten, Weitkampf auf Gegner (Ausnahmen pro Karte erlaubt).
- **Reittier** = Nahkampf, **volle** Geschwindigkeit, weniger Schaden.
- **Magier** = Weitkampf mit Projektilen, rückt vor aber **nie in den Nahkampf**.
- **Heiler** = bleibt hinten wie Magier, heilt eigene Units, **priorisiert die mit weniger HP**.

---

## 🔀 Combo-Modell (Entscheidungen 2026-06-05)

1. **Neue Combos ersetzen die alten Stat-Buffs vollständig.** Die bisherigen
   armee-weiten Flat-Buffs (`COLOR_ARMY_BONUS` / `CLASS_ARMY_BONUS` in `balance.ts`)
   **entfallen**. Ein Combo ist ab jetzt ein **Spezial-Effekt / eine Mechanik**, kein
   stiller `+4 DMG` mehr.
2. **Farb-Combo und Klassen-Combo greifen gleichzeitig.** Teilen die 2 gespielten
   Karten Farbe **und** Klasse (z. B. zwei Krieg-Krieger), feuern **beide** Combos.
   Das belohnt mono-farbige Spielzüge stark — passend dazu, dass Akt-Gegner ohnehin
   mono-farbig sind.
3. **Pro Runde gültig.** Wie bisher: Combos gelten nur für die laufende Runde; beim
   Feld-Reset verfallen sie. Beschworene Einheiten verschwinden mit dem Rundenende.

---

## 📁 Datei-Index

| Datei | Inhalt |
|-------|--------|
| [01_KLASSEN.md](01_KLASSEN.md) | Die 5 Klassen — Rolle, Verhalten, Was-nicht, Δ zum Ist-Code |
| [02_FARBEN.md](02_FARBEN.md) | Die 5 Farben — Identität, Rolle im Deck, Verhalten |
| [03_COMBO_KLASSEN.md](03_COMBO_KLASSEN.md) | Klassen-Combos (gleiche Klasse 2×) — die 5 Mechaniken |
| [04_COMBO_FARBEN.md](04_COMBO_FARBEN.md) | Farb-Combos (gleiche Farbe 2×) — die 5 Mechaniken |
| [05_KARTEN.md](05_KARTEN.md) | Alle 25 Karten + Skelett + Spezial-Units im Detail |
| [06_USER_JOURNEY.md](06_USER_JOURNEY.md) | Beispiel-Spielzüge: wie man Combos & Klassen einsetzt |
| [impl/](impl/README.md) | **Implementierungsplan** — phasenweise Code-Schritte (A–E), die diese Spec umsetzen |

---

## 🧭 Verhältnis zum aktuellen Code (Ist-Zustand 2026-06-05)

Das Spiel ist ein **DOM + Vanilla-Canvas-Hybrid** (kein Phaser). Combat-Logik liegt in
`src/systems/combat/`, Daten in `src/systems/data/`. Der **aktuelle** Code weicht von
diesem Overhaul ab — alle Klassen marschieren melee-artig nach vorne, Combos sind reine
Flat-Stat-Buffs, Magier nutzen eine AoE-Aura statt Projektilen, Heiler heilen pauschal im
Radius ohne Priorisierung. Jede Klassen- und Combo-Datei enthält einen **„Δ Ist-Zustand"**-
Block, der benennt, was umgebaut werden muss. Dieser Overhaul beschreibt das **Soll**;
die Implementierung folgt in einer eigenen Phase.

**Unveränderte Kern-Leitplanken** (aus [../README.md](../README.md)): festes 25-Karten-Deck
(kein Wachstum, nur Upgrades), Mana = reine Anzeige, Shop upgradet, rundenbasiert
(5 verdeckt → blind 3 → 2 spielen), Front/Hinten-Linien, mono-farbige Akt-Gegner.
