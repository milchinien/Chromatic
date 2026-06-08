# Phase C — Spezial-Karten

**Ziel:** Die 6 vom Nutzer hervorgehobenen Karten brechen ihre Klassen-Norm wie in
[../05_KARTEN.md](../05_KARTEN.md) beschrieben.

**Voraussetzung:** Phase A (Passive-Trigger `onKill`/`onSpawnTimer`, `statOverride`),
Phase B (Projektile, `attackKind`/`attackRange`).

Alle Änderungen sitzen in `CARD_SPECS` / Karten-Definition in `cards.ts` plus den
Trigger-Hooks in `UnitSystem.tick`.

---

## Schritt C1 — Trigger-Hooks in `UnitSystem.tick`

Zusätzlich zu den bestehenden Triggern:

- **`onSpawnTimer`:** pro lebender Unit `u.spawnTimer += dt`; wenn
  `u.spawnTimer >= passive.intervalSec` → `passive.apply(u, state, dt)` und
  `u.spawnTimer -= intervalSec`. (Akkumulator ⇒ unabhängig von `MAX_DT_SEC`/Throttling.)
- **`onKill`:** Im Angriffs-/Projektil-Einschlag-Code, wenn ein Treffer das Ziel auf
  `currentHp <= 0` bringt, merken, **wer** getötet hat. Nach dem Tod-Sammeln: trägt der
  Killer ein `onKill`-Passive, `apply(killer, state, 0)` mit dem Sterbeort. Praktisch:
  beim Setzen von `u.target.currentHp -= dmg` prüfen, ob es tödlich war, und in eine
  `state.killEvents`-Queue `{ killerId, x, y }` schreiben; im Tod-Loop abarbeiten.

## Schritt C2 — Waldläufer (Natur/Krieger) → Fernkampf-Krieger

In `cards.ts` der Karte `waldlaeufer` setzen:
`attackKind: 'ranged'`, `attackRange: 200`. Bleibt **Klasse `krieger`** (zählt für
Krieger-Combo!). Bewegt sich vorwärts wie ein Krieger, hält aber Distanz (B4-Stopp-Logik
greift über `attackKind 'ranged'`). Projektil = Pfeil-Optik (B2).

## Schritt C3 — Steinbrecher (Stein/Krieger) → mehr HP, langsamer

`steinbrecher`: `statOverride: { hp: +X, speed: -Y }` (z. B. `hp: 8 → effektiv höher`,
`speed: −20`). Sichtbarer DMG/HP-Grundwert bleibt laut Spec; der Override addiert
Tankigkeit. Melee wie Krieger.

> Hinweis: Der sichtbare HP-Wert (8) ist niedrig; falls „mehr HP" sichtbar sein soll,
> stattdessen den Zeilen-Stat **dieser einen Karte** anheben statt `statOverride`. Mit
> dem Nutzer abstimmen, ob sichtbarer Stat oder verdeckter Bonus — Default: sichtbarer
> Karten-HP-Wert hoch (transparenter).

## Schritt C4 — Grabwächter (Untot/Krieger) → eigene Kills → Skelett

`grabwaechter`: bestehendes `rageOnLowHp` **ersetzen** durch ein `onKill`-Passive:

```ts
const raiseSkeletonOnKill: PassiveEffect = {
  trigger: 'onKill',
  apply: (self, state) => {
    state.pendingSpawns.push({ card: SKELETT, side: self.side, x: self.x, y: self.y });
  },
};
```

Wirkt **unabhängig** vom Untot+Untot-Combo (der erntet *jeden* Tod; der Grabwächter nur
*seine* Kills).

## Schritt C5 — Totenzitadelle (Untot/Festung) → Skelett alle 3 s

`totenzitadelle`: Passive `selfRepair` **ersetzen** (oder ergänzen) durch:

```ts
{ trigger: 'onSpawnTimer', intervalSec: TOTENZITADELLE_SPAWN_SEC,
  apply: (self, state) => state.pendingSpawns.push(
    { card: SKELETT, side: self.side, x: self.x, y: self.y }) }
```

Bleibt statische Festung (schießt zusätzlich, B3). Spawn-Rate exakt 3 s pro Zitadelle.

## Schritt C6 — Nekromant (Untot/Magier) → Skelett alle 2 s

`nekromant`: bestehendes `raiseSkeletonOnDeath` **ersetzen** durch `onSpawnTimer`
(`intervalSec: NEKROMANT_SPAWN_SEC = 2`). Der Nekromant bleibt hinten (Magier-Position),
schießt schwach oder gar nicht — Kern ist der 2-s-Spawn. Mehrere Nekromanten = mehrere
Quellen (jede Unit hat eigenen `spawnTimer`).

## Schritt C7 — Handelsposten (Farblos/Festung) → +XP pro Stück

Zwei Teile:
1. `handelsposten`: Passive entfällt funktional (statische Festung, schwacher Schuss).
2. **EXP-Hook:** In `ExpSystem`/`UnitSystem` bei EXP-Gutschrift (`winnerSide.exp += …`)
   einen Faktor `1 + HANDELSPOSTEN_XP_BONUS · countHandelsposten(side)` multiplizieren.
   `countHandelsposten` = lebende eigene Units mit `card.id === 'handelsposten'`.

## End-Zustand Phase C

- Waldläufer schießt aus Distanz, zählt aber als Krieger.
- Steinbrecher hält länger, läuft langsamer.
- Grabwächter erzeugt bei eigenen Kills Skelette.
- Totenzitadelle/Nekromant pumpen Skelette im 3-/2-Sekunden-Takt.
- Mehr Handelsposten ⇒ schnelleres Leveln.

## Akzeptanz

- [ ] Unit-Tests: `onSpawnTimer` spawnt nach genau `intervalSec`; `onKill` erzeugt
      Skelett; Handelsposten-Faktor korrekt (1 Posten = +25 % EXP).
- [ ] Browser: Skelett-Ströme sichtbar; Waldläufer-Projektil; keine Spawn-Explosion
      (Ketten verhindert: Skelett hat kein Passive).
- [ ] Console 0 Errors.

## Journey-Bezug

Liefert **Journey C** (Nekromant-2-s-Skelette, Grabwächter-Kills) und den
Waldläufer/Steinbrecher-Teil von **Journey D**.
