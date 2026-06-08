# Phase A — Typ- & Daten-Fundament

**Ziel:** Alle Datenstrukturen und Balance-Konstanten anlegen, auf denen B–D aufbauen.
**Kein** sichtbarer Gameplay-Change am Ende dieser Phase — bestehende Tests bleiben grün.

**Voraussetzung:** keine.

---

## Schritt A1 — `domain/Card.ts` erweitern

Neue **optionale** Felder (optional ⇒ bestehende 25 Karten brechen nicht):

```ts
export type EntityKind = 'unit' | 'skeleton' | 'wall' | 'guardian' | 'summon';
export type AttackKind = 'melee' | 'ranged' | 'heal' | 'none';

export interface Card {
  // … bestehend …
  /** Angriffsart. Default aus Klasse (siehe CLASS_ATTACK_KIND). Karten dürfen
   *  überschreiben (Waldläufer: krieger aber 'ranged'). */
  readonly attackKind?: AttackKind;
  /** Reichweite in px. Default aus Klasse. Nahkampf ≈ ATTACK_RANGE. */
  readonly attackRange?: number;
  /** Optionale Stat-Overrides zusätzlich zu den Zeilen-Defaults (Steinbrecher:
   *  +HP / −speed). Greift in cards.ts beim Bauen. */
  readonly statOverride?: Partial<UnitStats>;
}
```

Neue **Passive-Trigger** ergänzen:

```ts
export type PassiveTrigger =
  | 'onSpawn' | 'onDeath' | 'onTick' | 'onHpThreshold'
  | 'onKill'        // Grabwächter: eigener Kill → Skelett
  | 'onSpawnTimer'; // Totenzitadelle/Nekromant: alle X s ein Spawn
export interface PassiveEffect {
  readonly trigger: PassiveTrigger;
  readonly hpThreshold?: number;
  readonly intervalSec?: number;       // für onSpawnTimer
  readonly apply: (self: Unit, state: CombatState, dt: number) => void;
}
```

## Schritt A2 — `domain/Unit.ts` erweitern

```ts
export interface Unit {
  // … bestehend …
  kind: EntityKind;          // default 'unit'
  attackKind: AttackKind;    // aufgelöst aus Card/Klasse beim Spawn
  attackRange: number;       // aufgelöst beim Spawn
  spawnTimer: number;        // Akkumulator für onSpawnTimer (Sek.)
  blocksAdvance?: boolean;   // true für 'wall' → Gegner kommen nicht vorbei
}
```

`effectiveStats` bleibt unverändert. (Combo-Effekte gehen nicht mehr über `buffs`,
sondern über den Tick — siehe Phase D.)

## Schritt A3 — `RoundComboState` in `CombatState.ts`

`comboBuff: Partial<UnitStats>` **ersetzen** durch einen strukturierten Runden-Zustand:

```ts
export interface RoundComboState {
  troopMultiplier: number;      // Krieg+Krieg → 2, sonst 1
  hpMultiplier: number;         // Stein+Stein → 2, sonst 1
  hotPerSec: number;            // Natur+Natur → >0, sonst 0
  deathToSkeleton: boolean;     // Untot+Untot
  kriegerDmgMult: boolean;      // Krieger+Krieger aktiv (Mult = f(Anzahl), im Tick)
  reittierFlatBonus: boolean;   // Reittier+Reittier aktiv (+1/Reittier, im Tick)
  summon: 'army' | 'guardian' | 'wall' | null; // Magier/Heiler/Festung-Combo
}
export const emptyCombo = (): RoundComboState => ({
  troopMultiplier: 1, hpMultiplier: 1, hotPerSec: 0,
  deathToSkeleton: false, kriegerDmgMult: false, reittierFlatBonus: false, summon: null,
});
```

`SideState.comboBuff` → `combo: RoundComboState`. `initialSide` und `endRound`
setzen `emptyCombo()`. **Renderer-Glow** (`Combat.ts` Z. 614–620, prüft
`Object.keys(comboBuff).length`) auf „irgendein Combo aktiv" umstellen:
`const playerCombo = isComboActive(state.player.combo)`.

> ⚠️ **Bruch:** `comboBuff` wird in `UnitSystem.spawn`, `RoundSystem.computeCombo/
> confirmSelection`, `Combat.ts` und `test/comboArmyBonus.test.ts` referenziert. In
> Phase A nur das Feld umbenennen/ergänzen und **neutral** befüllen (alle Multiplikatoren
> = 1, keine Effekte), damit das Verhalten unverändert bleibt; die echten Werte setzt
> Phase D. Den alten Test in dieser Phase auf „grün, aber neutral" anpassen oder mit
> `describe.skip` parken, bis Phase D ihn ersetzt (siehe Phase E).

## Schritt A4 — Balance-Konstanten in `balance.ts`

Neu hinzufügen (Werte tunebar, Vorschläge aus der Spec):

```ts
// Klassen-Angriffs-Defaults (Phase B)
export const CLASS_ATTACK_KIND: Record<CardClass, AttackKind> = {
  krieger: 'melee', festung: 'ranged', reittier: 'melee', magier: 'ranged', heiler: 'heal',
};
export const CLASS_ATTACK_RANGE: Record<CardClass, number> = {
  krieger: ATTACK_RANGE, festung: 320, reittier: ATTACK_RANGE, magier: 180, heiler: 160,
};
export const FESTUNG_SPEED = 0;          // statisch
export const PROJECTILE_SPEED = 260;     // px/s
export const HEAL_AFFINITY_MULT = 1.5;   // Heiler heilt eigene Klasse besser
export const HEAL_PER_TICK = 4;          // Basis-Heilung pro Heil-Takt

// Combo-Mechaniken (Phase D)
export const KRIEG_TROOP_MULT = 2;
export const STEIN_HP_MULT = 2;
export const NATUR_HOT_PER_SEC = 2;
export const KRIEGER_DMG_MULT_PER_UNIT = 0.02; // 1 + 0.02·Anzahl …
export const KRIEGER_DMG_MULT_CAP = 2.0;       // … gedeckelt
export const REITTIER_BONUS_PER_REITTIER = 1;
export const MAGIER_SUMMON_COUNT = 5;
export const GUARDIAN_HP_FACTOR = 10;    // × normaler Unit-HP
export const GUARDIAN_SPEED = 18;
export const WALL_HP_FROM_FESTUNG = 1.0; // Faktor auf Festungs-HP-Summe

// Spezial-Karten (Phase C)
export const TOTENZITADELLE_SPAWN_SEC = 3;
export const NEKROMANT_SPAWN_SEC = 2;
export const HANDELSPOSTEN_XP_BONUS = 0.25; // +25 % EXP pro Handelsposten
```

> **Nicht löschen, aber als deprecated markieren:** `COLOR_ARMY_BONUS` /
> `CLASS_ARMY_BONUS` bleiben physisch in der Datei (Tests/Verweise), bekommen aber einen
> Kommentar `// DEPRECATED ab Combat-Overhaul Phase D — nicht mehr im Combat genutzt`.
> Phase D entfernt die letzten Nutzungen; die Konstanten dürfen danach in einem
> Aufräum-Commit fallen.

## End-Zustand Phase A

- Typen kompilieren, `pnpm test` grün (Verhalten unverändert, Combos neutral).
- Keine sichtbare Spiel-Änderung. `RoundComboState` existiert und wird neutral durchgereicht.

## Akzeptanz

- [ ] `pnpm tsc --noEmit` ohne Fehler.
- [ ] `pnpm test` grün (alter Combo-Test angepasst/geparkt).
- [ ] Combat startet, Units spawnen, kämpfen wie vorher (Regressionsfreiheit).

## Journey-Bezug

Legt nur das Fundament — keine Journey direkt sichtbar. Ermöglicht `RoundComboState` für
Journey A (Doppel-Combo) in Phase D.
