# TECH-PLAN — Chromatic

Referenziert [GAME_DESIGN.md](GAME_DESIGN.md). Dieser Plan beschreibt die technische Umsetzung, nicht das Gameplay.

---

## 1. Stack & Tooling

| Komponente | Wahl | Begründung |
|------------|------|------------|
| Sprache | **TypeScript (strict)** | Typsicherheit für Karten/Units/State |
| Engine | **Phaser 3** | Reife 2D-Engine, gute Doku, Side-Scroller-tauglich |
| Build | **Vite** | Schneller Dev-Server, einfaches Setup, ESM-nativ |
| Tests | **Vitest** | Vite-nativ, schnell, Jest-API-kompatibel |
| Linting | **ESLint + Prettier** | Standard |
| Package-Manager | **pnpm** | Schneller, Disk-effizient |
| Versionskontrolle | **Git** | bereits initialisiert |

Kein Backend. Kein Save-System für MVP (Runs sind ephemer, Hauptmenü-Niederlage löscht Run-State).

---

## 2. Projekt-Struktur

```
/src
  /scenes              # Phaser-Szenen (UI-Ebenen)
    MainMenuScene.ts
    WorldMapScene.ts
    RoomMapScene.ts
    CombatScene.ts
    ShopScene.ts
    PerkSelectScene.ts
    TreasureScene.ts
    GameOverScene.ts
  /systems             # Reine Game-Logik, Phaser-frei
    /combat
      CombatState.ts        # zentraler Combat-State
      ManaSystem.ts
      DrawSystem.ts         # Auto-Draw aus Random-Pool
      UnitSystem.ts         # Bewegung, Targeting, Tod
      ComboAuraSystem.ts    # Field-Aura-Berechnung
      ExpSystem.ts
      AiController.ts       # Gegner-KI
    /run
      RunState.ts           # Coins, Deck, aktive Perks, Karte
      MapGenerator.ts       # World- + Sub-Knoten-Graphen
      RewardSystem.ts
    /data
      cards.ts              # Karten-Definitionen (Daten)
      perks.ts              # Perk-Definitionen
      encounters.ts         # Gegner-Decks pro Encounter-Typ
      starterDeck.ts        # Fix-Deck (~10 Karten)
  /domain                # Typen & Pure-Models
    Card.ts
    Unit.ts
    Room.ts
    Perk.ts
    Encounter.ts
  /ui                    # Phaser-UI-Komponenten
    CardView.ts
    ManaBar.ts
    HpBar.ts
    NodeGraphRenderer.ts
  /assets                # Sprites, Sounds (MVP: Platzhalter)
  main.ts                # Phaser-Game-Entry
/test                    # Vitest-Specs
/index.html
/vite.config.ts
/tsconfig.json
/package.json
```

**Regel:** `systems/` und `domain/` haben **keine Phaser-Imports**. Sie sind reine TypeScript-Module und einzeln testbar. Phaser wird nur in `scenes/`, `ui/` und `main.ts` benutzt.

---

## 3. Daten-Modell (Kern-Typen)

```ts
// domain/Card.ts
type Color = 'nature' | 'war' | 'stone' | 'undead' | 'colorless';
type Class = 'warrior' | 'fortress' | 'mount' | 'mage' | 'healer';

interface Card {
  id: string;
  name: string;
  color: Color;
  class: Class;
  manaCost: number;
  stats: {
    damage: number;
    attackInterval: number;   // Sek.
    hp: number;
    speed: number;            // px/Sek.
  };
  colorBuff: Partial<UnitStats>;   // z. B. { damage: +4 }
  classBuff: Partial<UnitStats>;   // z. B. { hp: +5 }
  passive?: PassiveEffect;
}

// domain/Unit.ts
interface Unit {
  id: string;
  cardId: string;
  side: 'player' | 'enemy';
  position: { x: number; y: number };
  baseStats: UnitStats;
  currentHp: number;
  buffs: UnitStats;            // aggregiert aus ComboAuraSystem
  target: Unit | 'base' | null;
  attackCooldown: number;
}

// systems/combat/CombatState.ts
interface CombatState {
  tick: number;
  isPaused: boolean;
  player: SideState;
  enemy: SideState;
  units: Unit[];
}
interface SideState {
  baseHp: number;
  mana: number;
  maxMana: number;
  manaRegen: number;
  hand: Card[];
  handSize: number;
  drawIntervalSec: number;
  drawTimer: number;
  deck: Card[];                // bei Spieler: ganzes Deck. KI: Encounter-Pool
  exp: number;
  level: number;
}
```

---

## 4. Combat-Loop (Tick-Architektur)

Phaser läuft mit ~60 FPS. Combat-State wird in einem **fixen Tick** (z. B. 30 Hz / dt = 33 ms) aktualisiert, um determinstische Logik vom Rendering zu trennen.

```
PhaserScene.update(dt) {
  combat.advance(dt);
  renderer.draw(combat.state);
}

CombatState.advance(dt) {
  ManaSystem.tick(player, dt);
  ManaSystem.tick(enemy, dt);
  DrawSystem.tick(player, dt);
  DrawSystem.tick(enemy, dt);
  AiController.tick(enemy, state, dt);
  UnitSystem.tick(units, dt);          // Movement, Targeting, Attack
  ComboAuraSystem.recompute(units);    // wenn dirty
  ExpSystem.processKills(state);
  checkVictoryLoss(state);
}
```

**ComboAuraSystem.recompute** wird nur aufgerufen, wenn sich das Unit-Set geändert hat (Spawn oder Tod), nicht jeden Tick — Performance-Optimierung.

---

## 5. Combo-Aura-Algorithmus (Field-Aura)

```ts
recompute(units: Unit[]) {
  for (const side of ['player', 'enemy']) {
    const friendly = units.filter(u => u.side === side);
    for (const u of friendly) {
      const otherSameColor = friendly.filter(o => o !== u && o.color === u.color && u.color !== 'colorless');
      const otherSameClass = friendly.filter(o => o !== u && o.class === u.class);
      u.buffs = sum(
        otherSameColor.map(o => o.colorBuff),
        otherSameClass.map(o => o.classBuff),
      );
    }
  }
}
```

Komplexität: O(n²) pro Seite. Mit n ≤ ~20 Units in der Praxis problemlos.

---

## 6. Karten-Daten

Karten sind **statische Daten** in `systems/data/cards.ts` als Const-Array. Keine Class-Hierarchie, keine Polymorphie — Behavior steckt in `passive`-Funktionen, die der `UnitSystem` zur passenden Lifecycle-Phase aufruft.

```ts
interface PassiveEffect {
  trigger: 'onSpawn' | 'onDeath' | 'onTick' | 'onHpThreshold';
  apply: (self: Unit, state: CombatState, dt: number) => void;
}
```

Beispiel Druide:
```ts
{
  trigger: 'onTick',
  apply: (self, state, dt) => {
    const allies = state.units.filter(u => u.side === self.side && u.color === 'nature');
    allies.forEach(a => a.currentHp = Math.min(a.baseStats.hp, a.currentHp + 1 * dt));
  }
}
```

---

## 7. Map-Generierung

`MapGenerator.generateAct(actNumber)` erzeugt einen DAG (Directed Acyclic Graph) von Knoten:

- Layered Layout: 5–8 Layer (skaliert mit Akt-Nummer)
- Jeder Layer 1–3 Knoten, mit Edges zur nächsten Layer
- Knoten-Typ-Verteilung gewichtet (z. B. 50 % Kampf, 15 % Shop, 15 % Schatz, 10 % Zauber, 10 % Schwerer Kampf)
- Endboss als finaler Layer-Knoten
- Sub-Knoten-Map analog, aber kleiner (3–6 Knoten)

MVP nutzt einfache Layered-Random-Generierung; spätere Iterationen können Constraint-basierten Slay-the-Spire-Algorithmus übernehmen.

---

## 8. State-Management

**Kein externes State-Lib.** Run-State ist ein einzelnes Objekt (`RunState`), das zwischen Szenen über `scene.scene.start('NextScene', { runState })` durchgereicht wird. Combat-State lebt nur innerhalb der `CombatScene` und schreibt das Ergebnis (Sieg/Niederlage, gewonnene Coins/Karten) zurück in `RunState`.

Begründung: Single-Player, kein Netzwerk, keine Undo-Funktion — Redux/MobX/Zustand wäre Overkill.

---

## 9. Testing-Strategie

- **Unit-Tests** für `systems/`-Module (ManaSystem, ComboAuraSystem, MapGenerator, AiController-Entscheidungen). Pure-Logik, ohne Phaser.
- **Snapshot-Tests** für deterministisches Map-Gen (festgelegte Seeds).
- **Manuelle Spiel-Tests** für UI/Combat-Feel.
- **Keine E2E-Tests** für MVP — Aufwand-Nutzen-Verhältnis schlecht.

Determinismus: `MapGenerator` und KI nutzen einen seedfähigen PRNG (z. B. mulberry32), kein `Math.random()` direkt. Erlaubt reproduzierbare Tests und potentiell „Daily-Seeds".

---

## 10. Risiken & offene Tech-Entscheidungen

| Risiko | Maßnahme |
|--------|----------|
| Performance bei vielen Units (>30 pro Seite) | Aura-Recompute nur on-change; Unit-Cap als Notfalls |
| Karten-Daten-Wartung (viele Karten = viel Tipparbeit) | Daten-Tooling später, MVP kommt mit ~15 Karten aus |
| Save-State zwischen Browser-Sessions | LocalStorage, später; MVP ohne Save |
| Asset-Pipeline | MVP nutzt Phaser-Shapes (Rechtecke, Kreise), echte Sprites später |
| Audio | MVP optional, Phaser-Sound-Manager wenn nötig |

---

## 11. Build & Run

```
pnpm install
pnpm dev      # Vite Dev-Server, HMR
pnpm build    # Production-Build → /dist
pnpm test     # Vitest
pnpm lint
```

Deployment: statisches Hosting (Netlify/Vercel/GitHub Pages) — `/dist` enthält alles.
