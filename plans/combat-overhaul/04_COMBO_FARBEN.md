# 04 — Farb-Combos (gleiche Farbe 2×)

Spielt der Spieler (oder Gegner) zwei Karten **derselben Farbe (≠ farblos)**, feuert der
**Farb-Combo**. Er gilt **nur für die laufende Runde** und wirkt **armee-weit**.

> **Verbindlich (siehe [README.md](README.md)):** Die *Wirkung* jedes Farb-Combos ist
> dauerhaft fixiert. Nur Zahlen sind tunebar (und selbst die kaum — „verdoppeln" heißt ×2).

> **Gleichzeitigkeit:** Teilen die zwei Karten zusätzlich die Klasse, greift der
> Klassen-Combo ([03_COMBO_KLASSEN.md](03_COMBO_KLASSEN.md)) **zusätzlich**.

> **Δ Ist-Zustand:** Heute ist jeder Farb-Combo nur ein Flat-Stat-Buff
> (`COLOR_ARMY_BONUS`, z. B. Krieg → +4 DMG, Stein → +8 HP). Diese Tabelle **entfällt**;
> die Combos werden zu den unten beschriebenen Mechaniken umgebaut.

---

## 🟥 Krieg + Krieg — „Heeresbann"

- **Was es macht:** **Verdoppelt die Anzahl der freundlichen Truppen auf dem Platz.**
- **Wie es wirkt:** Beim Spawn der Runde wird die eigene Truppenzahl ×2 erzeugt — jeder
  eigene Stack spawnt mit doppelt so vielen Units. (Implementierung: Truppenzahl der
  gespielten Stacks ×2 beim Deploy.)
- **Vorschlagswert:** exakt **×2**. Fix.
- **Spielgefühl:** Pure Übermacht. Das Feld füllt sich mit roten Einheiten. Stärkster
  Enabler für **Krieger + Krieger** (Mult skaliert mit Anzahl) und **Reittier + Reittier**
  (mehr Reittiere = mehr +DMG).
- **Was es NICHT tut:** Verdoppelt nicht Stats, nur die **Anzahl**. Wirkt auf die
  eigene Armee, nicht auf beschworene Boss-Wächter (genau ein Wächter bleibt einer).

---

## 🟩 Natur + Natur — „Lebensquell"

- **Was es macht:** **Dauerhafte Heilung über Zeit** für die ganze eigene Armee, solange
  die Runde läuft.
- **Wie es wirkt:** Über die gesamte Resolve-Phase regeneriert jede eigene Unit
  kontinuierlich HP (Tick-basiert, bis zum jeweiligen HP-Maximum). Unabhängig von
  Heiler-Units — der Combo selbst heilt.
- **Vorschlagswert (tunebar):** z. B. `+2 HP/Sek.` auf alle eigenen Units.
- **Spielgefühl:** Macht die Armee unermüdlich. Kombiniert mit zähen Klassen
  (Festung/Heiler) und besonders mit dem **Heiler-Wächter** (heilt sich quasi selbst voll).
- **Was es NICHT tut:** Kein Burst, keine Wiederbelebung Toter, kein Schaden. Nur
  laufende Regeneration lebender Units.

---

## ⬜ Stein + Stein — „Steinhaut"

- **Was es macht:** **Verdoppelt die HP jeder Unit** der eigenen Armee für die Runde.
- **Wie es wirkt:** Beim Spawn werden Max-HP und aktuelle HP jeder eigenen Unit ×2
  gesetzt. (Gilt für alle eigenen Units der Runde, inkl. Beschwörungen, soweit sinnvoll.)
- **Vorschlagswert:** exakt **×2 HP**. Fix.
- **Spielgefühl:** Macht aus jeder Aufstellung eine Wand. Absurd stark auf Festungen
  (doppelte Riesen-HP) und auf die **Festung-Mauer** / den **Heiler-Wächter**, deren HP
  von Unit-HP abgeleitet sind.
- **Was es NICHT tut:** Heilt nicht (verdoppelt nur das Maximum + füllt initial), gibt
  keinen Schaden, keine Regeneration.

---

## 🟪 Untot + Untot — „Totenheer"

- **Was es macht:** **Jede sterbende Unit — freundlich ODER feindlich — wird zu einem
  (schwachen) freundlichen Skelett.**
- **Wie es wirkt:** Während die Runde läuft, wird bei **jedem** Tod (egal welche Seite)
  am Sterbeort ein freundliches **Skelett** (siehe [05_KARTEN.md](05_KARTEN.md)) auf der
  eigenen Seite erzeugt. Das Schlachtfeld wird so zur wachsenden Untoten-Armee.
- **Vorschlagswert:** 1 Skelett je Tod. Skelette sind bewusst schwach.
- **Spielgefühl:** Snowball aus Leichen — je blutiger das Gefecht, desto mehr eigene
  Skelette. Brutal in langen Schlachten und gegen zahlreiche Gegner.
- **Was es NICHT tut:** Belebt keine Originaltruppe wieder (es entsteht ein generisches
  Skelett, nicht die getötete Karte). Skelette lösen keine weiteren Combos aus und
  beschwören selbst nichts (keine Ketten).

---

## ◻️ Farblos + Farblos — „Kein Buff"

- **Was es macht:** **Nichts.** Bewusst leer.
- **Wie es wirkt:** Zwei farblose Karten lösen **keinen** Farb-Combo aus. (Ein
  **Klassen**-Combo kann trotzdem greifen, wenn beide dieselbe Klasse haben.)
- **Spielgefühl:** Farblos ist der neutrale Pfad — man spielt es für Klassen-Combos oder
  rohe Stats, nicht für einen Farb-Effekt.
- **Was es NICHT tut:** Gibt nie einen Farb-Bonus, auch nicht abgeschwächt.

---

## Synergie-Landkarte (welche Combos sich gegenseitig verstärken)

| Farb-Combo | Verstärkt besonders … |
|---|---|
| **Krieg ×2 Truppen** | Krieger-Combo (DMG-Mult skaliert mit Anzahl), Reittier-Combo (+1/Reittier) |
| **Natur Dauerheilung** | Heiler-Wächter (hält ewig), Festung-Mauer, alles Zähe |
| **Stein ×2 HP** | Festung-Mauer (doppelte Mauer-HP), Heiler-Wächter, teure Frontkämpfer |
| **Untot Skelett-Ernte** | lange Schlachten, viele Gegner; Grabwächter & Nekromant (siehe Karten) |
| **Farblos** | — (kein Farb-Effekt) |
