# Phase B — Klassen-Rollen

**Ziel:** Die 5 Klassen verhalten sich wie in [../01_KLASSEN.md](../01_KLASSEN.md):
Festung statisch + Fernschuss, Magier Projektile auf Distanz, Heiler Ziel-Heilung
(niedrigste HP + Klassen-Affinität), Reittier volle Speed/wenig DMG, Krieger unverändert.

**Voraussetzung:** Phase A (Typen `attackKind`/`attackRange`/`kind`, Balance-Konstanten).

---

## Schritt B1 — Attack-Kind/Range beim Spawn auflösen

In `UnitSystem.spawn` (nach Stat-Setup):

```ts
unit.attackKind = card.attackKind ?? CLASS_ATTACK_KIND[card.class];
unit.attackRange = card.attackRange ?? CLASS_ATTACK_RANGE[card.class];
unit.kind = 'unit';
unit.spawnTimer = 0;
```

`statOverride` (Steinbrecher, Phase C) hier auf `baseStats` anwenden, **bevor** der
Combo-`hpMultiplier` greift (Phase D).

## Schritt B2 — Projektil-System (neu)

Neue Datei `src/systems/combat/ProjectileSystem.ts` + Feld `state.projectiles` in
`CombatState`:

```ts
export interface Projectile {
  x: number; y: number; tx: number; ty: number; // Start + Ziel-Snapshot
  targetId: string; side: Side; damage: number; speed: number;
  color: string; age: number; alive: boolean;
}
```

- **Erzeugen:** Wenn eine Unit mit `attackKind === 'ranged'` ein Ziel in `attackRange`
  hat und der Cooldown 0 ist → statt direktem `currentHp -=` ein Projektil pushen
  (Farbe = `colorToCss(card.color)`). Schaden wirkt beim **Einschlag**, nicht beim Abschuss.
- **Tick:** `ProjectileSystem.tick(state, dt)` bewegt jedes Projektil `speed·dt` Richtung
  Ziel; bei Erreichen (oder Ziel tot) → Schaden anwenden, `alive=false`, Damage-Number
  pushen. Aufruf in `advance.ts` `resolve`-Zweig direkt nach `UnitSystem.tick`.
- **Render:** in `Combat.ts drawBattlefield` nach der Unit-Schleife eine
  Projektil-Schleife (kleiner gefüllter Kreis in Projektil-Farbe, ggf. Glow). Farb-Thema:
  Feuermagier rot, Steinbeschwörer grau, Waldläufer pfeil-artig (kleiner Strich).

## Schritt B3 — Festung: statisch + Fernschuss

In `UnitSystem.tick` Bewegungs-/Angriffsblock:

- Festung **bewegt sich nicht** (`speed 0` via `CLASS_STAT_DEFAULTS.festung.speed = 0`
  **oder** Sonderfall `if (u.card.class === 'festung') skip move`). Spawn bleibt
  base-nah (Hinten-Linie).
- Targeting: nächster Gegner **innerhalb `attackRange`** (groß). Außerhalb → nicht
  bewegen, warten. Angriff = Projektil (B2).

> **Δ:** `CLASS_STAT_DEFAULTS.festung.speed` von 28 → 0 in `cards.ts`. `findClosestEnemy`
> für Festung auf `maxDist = attackRange` heben.

## Schritt B4 — Magier: Projektile auf Distanz, nie Nahkampf

- `damageAura`-Passive der 4 Magier-Karten **entfernen** (Feuermagier, Waldweiser,
  Steinbeschwörer, Zeitweiser) — Schaden kommt jetzt aus dem normalen Projektil-Angriff
  (`attackKind 'ranged'`). Nekromant: siehe Phase C (Beschwörer, kein Schütze).
- **Distanz halten:** In `moveTowards`/Targeting für Magier eine **Stopp-Distanz**
  (`attackRange · 0.9`): ist das Ziel näher als das, läuft der Magier **nicht weiter vor**
  (optional: kleines Kiting zurück). So gerät er nie in den Nahkampf.

## Schritt B5 — Heiler: Ziel-Heilung niedrigste HP + Klassen-Affinität

`healAura` (Radius-Gießkanne) **ersetzen** durch eine `onTick`-Heilung, die **ein** Ziel
wählt:

```ts
// Pseudocode im Heiler-Passive (oder generisch für attackKind==='heal'):
const allies = state.units.filter(o => o.alive && o.side === self.side
  && o.id !== self.id && o.currentHp < o.baseStats.hp
  && dist(self,o) <= self.attackRange);
if (allies.length && self.attackCooldown === 0) {
  allies.sort((a,b) => a.currentHp/a.baseStats.hp - b.currentHp/b.baseStats.hp); // niedrigste %
  const tgt = allies[0];
  const affinity = tgt.card.class === self.card.class ? HEAL_AFFINITY_MULT : 1;
  tgt.currentHp = Math.min(tgt.baseStats.hp, tgt.currentHp + HEAL_PER_TICK * affinity);
  self.attackCooldown = effectiveStats(self).attackInterval;
}
```

- Heiler **bewegt sich kaum** (bleibt hinten wie Magier — Stopp-Distanz wie B4).
- Heiler macht **keinen** Angriffs-Schaden (`attackKind 'heal'` ⇒ überspringt den
  Damage-Zweig in `UnitSystem.tick`).

## Schritt B6 — Reittier-Feinschliff

- Sicherstellen: `CLASS_STAT_DEFAULTS.reittier.speed` deutlich > krieger (z. B. 80 vs 50)
  und Reittier-DMG bewusst niedrig (Karten-Stat DMG 12 bleibt). Flanker-Logik
  (`findClosestEnemy` `maxDist = 60`) bleibt.

## End-Zustand Phase B

- Festungen stehen an der Base und schießen sichtbare Projektile auf anrückende Gegner.
- Magier stehen auf Distanz und werfen farbige Projektile, laufen nie in den Nahkampf.
- Heiler heilen gezielt die am stärksten verwundete eigene Unit, eigene Klasse stärker.
- Reittiere überholen die Front sichtbar.

## Akzeptanz

- [ ] `pnpm test` grün (neue Tests: Projektil trifft & macht Schaden; Heiler wählt
      niedrigstes-HP-Ziel; Festung bewegt sich nicht).
- [ ] Browser: Festung-Projektile sichtbar, Magier hält Abstand, Heiler-Heilung sichtbar
      (HP-Balken füllt sich). Console 0 Errors.
- [ ] Keine Regression in Krieger/Reittier-Marsch.

## Journey-Bezug

Ermöglicht **Journey D** (Steinbrecher-Front + Feuermagier wirft Feuerbälle aus der
Distanz; Waldläufer-Variante kommt in Phase C). Liefert die Heiler-/Festung-Rollen, die
**Journey B** (Bollwerk) braucht.
