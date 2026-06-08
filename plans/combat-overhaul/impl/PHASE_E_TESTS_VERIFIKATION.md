# Phase E — Tests & Verifikation

**Ziel:** Den Overhaul gegen die Spec und die 4 User-Journeys absichern — Unit-Tests +
manuelle Preview-Verifikation. Erst wenn alles grün ist, gilt der Overhaul als fertig.

**Voraussetzung:** Phasen A–D.

---

## Schritt E1 — Alten Combo-Test ersetzen

`test/comboArmyBonus.test.ts` testet die **alten** Flat-Buffs (`COLOR_ARMY_BONUS`,
`CLASS_ARMY_BONUS`) und `comboBuff` in `baseStats`. Da Phase D dieses Modell ersetzt:

- Datei umbenennen/ersetzen → `test/comboMechanics.test.ts`.
- Front-/Hinten-Linien-Test (Z. 66–88) **behalten** (Linien-Logik unverändert) — in den
  neuen Test übernehmen.

## Schritt E2 — Unit-Tests: `computeCombo` → `RoundComboState`

Je ein Test (Seed-fest via `mulberry32`):

```ts
// Farb-Combos
krieg+krieg  → troopMultiplier === 2
stein+stein  → hpMultiplier === 2
natur+natur  → hotPerSec > 0
untot+untot  → deathToSkeleton === true
farblos+farblos → emptyCombo() (alles neutral)
// Klassen-Combos
krieger+krieger → kriegerDmgMult === true
reittier+reittier → reittierFlatBonus === true
magier+magier → summon === 'army'
heiler+heiler → summon === 'guardian'
festung+festung → summon === 'wall'
// Doppel (Journey A): zwei identische Berserker
berserker+berserker → troopMultiplier===2 && kriegerDmgMult===true
// Negativ
berserker+naturheiler → emptyCombo()
```

## Schritt E3 — Unit-Tests: Deploy- & Tick-Wirkung

- **Krieg ×2 Truppen:** `confirmSelection` mit Krieg-Paar ⇒ doppelt so viele eigene Units
  wie ohne Combo (gleicher Seed, `troops` vergleichen).
- **Stein ×2 HP:** gespawnte Units haben `baseStats.hp === 2 · leveledStats.hp`.
- **Natur HoT:** verwundete Unit gewinnt über mehrere Ticks HP zurück.
- **Untot:** eine sterbende Unit erzeugt ein `kind:'skeleton'` auf der Combo-Seite.
- **Krieger-Mult:** Schaden steigt mit Unit-Anzahl, Cap greift (`KRIEGER_DMG_MULT_CAP`).
- **Reittier:** +1 DMG pro Reittier (3 Reittiere ⇒ +3).
- **Beschwörungen:** Magier-Paar ⇒ `MAGIER_SUMMON_COUNT` summons; Heiler-Paar ⇒ genau 1
  guardian mit `GUARDIAN_HP_FACTOR`-HP; Festung-Paar ⇒ 1 wall mit `blocksAdvance`.

## Schritt E4 — Unit-Tests: Rollen & Spezial-Karten

- **Festung** bewegt sich über N Ticks nicht (`x` konstant), schießt Projektil bei Gegner
  in Range.
- **Magier** stoppt auf Stopp-Distanz (läuft nicht in `ATTACK_RANGE`).
- **Heiler** heilt das Ziel mit dem niedrigsten HP-% zuerst; eigene Klasse `×HEAL_AFFINITY_MULT`.
- **onSpawnTimer:** Totenzitadelle spawnt nach 3 s, Nekromant nach 2 s (Akkumulator-Test
  mit fixem dt).
- **onKill:** Grabwächter-Kill erzeugt Skelett.
- **Handelsposten:** EXP-Gewinn ×(1 + 0.25·Anzahl).
- **Waldläufer:** `attackKind === 'ranged'`, aber `card.class === 'krieger'` (zählt für
  Krieger-Combo — Regressionsschutz).

## Schritt E5 — Manuelle Preview-Verifikation (Journey-Durchlauf)

Per Preview-Server + **`preview_eval`** (Screenshots timeouten headless — siehe
Projekt-Memory). Sim-Loop ist `setInterval`, läuft also auch headless.

Für jede Journey den Combat mit gestelltem Deck/Seed öffnen und State per `eval` prüfen:

- **Journey A (Rote Flut):** zwei Berserker spielen → `state.player.combo.troopMultiplier===2`
  && `kriegerDmgMult===true`; `state.units.filter(player).length` ≈ doppelt; Gegner-Base-HP
  fällt schnell.
- **Journey B (Bollwerk):** Festung-Paar → eine `kind:'wall'`; Gegner-Units werden an
  Wall-X geclamped, bis Wall tot; danach Heiler-Paar → genau 1 `kind:'guardian'`, dessen
  HP von den Heilern aufgefüllt wird.
- **Journey C (Totenheer):** Untot-Paar + Nekromant → Skelett-Zahl steigt über Zeit;
  jeder Tod erzeugt Skelett; keine Spawn-Explosion (Skelette beschwören nicht).
- **Journey D (Schützen):** Steinbrecher-Front hält, Feuermagier feuert Projektile aus
  Distanz, gerät nie in Nahkampf (`magier.x` bleibt > Stopp-Distanz vor Gegner).

## Schritt E6 — Freigabe-Checkliste

- [ ] `pnpm tsc --noEmit` fehlerfrei.
- [ ] `pnpm test` komplett grün (neue + bestehende Tests; alter Combo-Test ersetzt).
- [ ] Browser-Console: 0 Errors / 0 Warnings über einen kompletten Encounter.
- [ ] Alle 4 Journeys per `eval` reproduziert.
- [ ] Keine Nutzung von `COLOR_ARMY_BONUS`/`CLASS_ARMY_BONUS` mehr im Combat-Code
      (Konstanten dürfen jetzt entfernt werden — eigener Aufräum-Commit).
- [ ] Balance-Werte ausschließlich aus `balance.ts` (keine Magic-Numbers).

## Hinweis: Balance kommt nach Korrektheit

Diese Phase prüft **Korrektheit** (greift der Effekt?), nicht Feintuning. Zahlenbalance
(Mult-Kurve, Wächter-HP, Spawn-Raten) ist eine eigene Iteration über `balance.ts`, nachdem
alle Mechaniken nachweislich funktionieren.
