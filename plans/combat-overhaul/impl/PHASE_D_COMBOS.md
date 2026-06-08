# Phase D — Combo-Mechaniken

**Ziel:** Die alten Flat-Stat-Buffs vollständig ersetzen durch die 5 Farb- und 5
Klassen-Combos aus [../03_COMBO_KLASSEN.md](../03_COMBO_KLASSEN.md) /
[../04_COMBO_FARBEN.md](../04_COMBO_FARBEN.md). **Farb- und Klassen-Combo greifen
gleichzeitig** (Entscheidung 2026-06-05).

**Voraussetzung:** Phase A (`RoundComboState`), B (Rollen/Projektile), C (Skelett-Spawns).

---

## Schritt D1 — `computeCombo` neu: `RoundComboState` statt `Partial<UnitStats>`

`RoundSystem.computeCombo(picked, selectedIdx)` baut den Runden-Zustand:

```ts
export const computeCombo = (picked, sel): RoundComboState => {
  const a = picked[sel[0]], b = picked[sel[1]];
  const c = emptyCombo();
  if (!a || !b) return c;
  // --- Farb-Combo (≠ farblos) ---
  if (a.card.color !== 'farblos' && a.card.color === b.card.color) {
    switch (a.card.color) {
      case 'krieg': c.troopMultiplier = KRIEG_TROOP_MULT; break;
      case 'stein': c.hpMultiplier   = STEIN_HP_MULT;    break;
      case 'natur': c.hotPerSec      = NATUR_HOT_PER_SEC;break;
      case 'untot': c.deathToSkeleton = true;            break;
    }
  }
  // --- Klassen-Combo (greift ZUSÄTZLICH) ---
  if (a.card.class === b.card.class) {
    switch (a.card.class) {
      case 'krieger': c.kriegerDmgMult = true; break;
      case 'reittier': c.reittierFlatBonus = true; break;
      case 'magier':  c.summon = 'army'; break;
      case 'heiler':  c.summon = 'guardian'; break;
      case 'festung': c.summon = 'wall'; break;
    }
  }
  return c;
};
```

`confirmSelection` setzt `state.player.combo` / `state.enemy.combo` (statt `comboBuff`).
**Alte Pfade entfernen:** `addPartial`, `COLOR_ARMY_BONUS`/`CLASS_ARMY_BONUS`-Import und
der Combo-Block in `UnitSystem.spawn` (Z. 45–50, der `combo.damage/hp/speed` auf
`baseStats` addiert) entfallen.

## Schritt D2 — Deploy-Effekte in `spawnSelected` (RoundSystem)

Beim Deploy der Runde, **bevor**/**während** gespawnt wird:

- **Krieg ×2 Truppen:** `const troops = d.troops * side.combo.troopMultiplier;` in der
  Spawn-Schleife.
- **Stein ×2 HP:** beim Spawn `baseStats.hp *= hpMultiplier; currentHp = baseStats.hp;`
  (in `UnitSystem.spawn` nach Stat-Auflösung, vor `currentHp`-Init). Gilt auch für
  beschworene Entities (Wand/Wächter) ⇒ Journey B („doppelte Mauer-HP").
- **Beschwörungen (`summon`)** nach dem regulären Spawn der zwei Stacks:
  - `'army'` (Magier+Magier): `MAGIER_SUMMON_COUNT` schwache `kind:'summon'`-Units an der
    **Front-Linie** spawnen.
  - `'guardian'` (Heiler+Heiler): **1** `kind:'guardian'`-Unit, HP =
    `normaleUnitHP · GUARDIAN_HP_FACTOR`, `speed = GUARDIAN_SPEED`, Melee, hoher DMG.
  - `'wall'` (Festung+Festung): **1** `kind:'wall'`-Unit, `blocksAdvance:true`,
    `attackKind:'none'`, `speed 0`, HP = Σ Festungs-HP · `WALL_HP_FROM_FESTUNG`. Platzierung
    vor der Hinten-Linie.

## Schritt D3 — Tick-Effekte in `UnitSystem.tick`

Pro Seite einmal je Tick (vor der Unit-Schleife) die aktiven Multiplikatoren bestimmen:

- **Krieger-Mult:** wenn `side.combo.kriegerDmgMult`:
  `mult = min(KRIEGER_DMG_MULT_CAP, 1 + KRIEGER_DMG_MULT_PER_UNIT · aliveOwnUnits)`.
  Im Angriffs-Schaden: `dmg = (stats.damage + globalDamageBonus) · mult`. (Anzahl jeden
  Tick neu zählen ⇒ skaliert mit „rote Flut".)
- **Reittier-Bonus:** wenn `side.combo.reittierFlatBonus`:
  `bonus = REITTIER_BONUS_PER_REITTIER · countOwnReittier`; nur auf Units mit
  `card.class === 'reittier'` additiv zum Schaden.
- **Natur-HoT:** wenn `side.combo.hotPerSec > 0`: jede lebende eigene Unit
  `currentHp = min(maxHp, currentHp + hotPerSec · dt)` (analog `applyHpRegen`, aber für
  Units). Kann als eigene `applyUnitHot(state, dt)` in `advance.ts resolve` laufen.
- **Untot Skelett-Ernte:** im Tod-Sammel-Loop, wenn **irgendeine** Unit stirbt: für jede
  Seite mit `combo.deathToSkeleton` ein `SKELETT` auf **dieser** Seite am Sterbeort
  pushen. (Edge: beide Seiten aktiv ⇒ je ein Skelett pro Seite. In Tests fixieren.)

## Schritt D4 — Wand-Blockade (`blocksAdvance`)

Damit „die Mauer muss erst zerstört werden":

- In `findClosestEnemy`: steht zwischen Unit und Gegner-Base eine lebende gegnerische
  `wall` in X-Reichweite, wird **die Wand zum Ziel** (Priorität vor dahinterliegenden
  Units).
- In der Bewegung: eine Gegner-Unit darf ihre X-Position **nicht** über die Wand-X hinaus
  schieben, solange die Wand lebt (Clamp an `wall.x − UNIT_RADIUS`). Eigene Units der
  Wand-Seite ignorieren die Wand.
- MVP-Vereinfachung erlaubt: nur **eine** Wand-Linie pro Seite; keine Pfadfindung drumherum.

## Schritt D5 — Renderer (`Combat.ts`)

- `kind:'wall'` als breites Rechteck/Balken zeichnen (Festungsfarbe) mit eigenem HP-Balken.
- `kind:'guardian'` als großer Kreis (Radius ~2.5×) mit dickem Rand.
- `kind:'summon'` wie normale, leicht transparente Mini-Units.
- Combo-Glow (Z. 614) bleibt: leuchten, wenn `isComboActive(side.combo)`.

## End-Zustand Phase D

Alle 10 Combos wirken laut Spec; bei mono-farbigem Klassen-Paar (z. B. zwei identische
Berserker aus dem Pool-Draw mit Zurücklegen) feuern **beide** gleichzeitig.

## Akzeptanz

- [ ] Tests je Combo (siehe Phase E): Krieg verdoppelt Truppen, Stein verdoppelt HP,
      Natur heilt über Zeit, Untot erntet Skelette, Krieger-Mult skaliert mit Anzahl,
      Reittier +1/Reittier, Magier-Army/Heiler-Wächter/Festung-Wand werden gespawnt,
      Farblos = nichts.
- [ ] **Doppel-Combo-Test:** zwei identische Berserker ⇒ `troopMultiplier===2` **und**
      `kriegerDmgMult===true`.
- [ ] `COLOR_ARMY_BONUS`/`CLASS_ARMY_BONUS` werden im Combat-Code nicht mehr gelesen.
- [ ] Browser: Wand blockt, Wächter tankt, rote Flut überrennt. Console 0 Errors.

## Journey-Bezug

Vollständige **Journey A** (Rote Flut: ×2 Truppen + Krieger-Mult) und die Combo-Teile von
**Journey B** (Wand + HP×2 + Wächter) und **Journey C** (Untot jeder Tod → Skelett).
