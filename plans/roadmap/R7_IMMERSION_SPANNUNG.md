# R7 — Immersion & Spannung (Combat-Feel)

**Dauer:** ~2–3 Wochen · **Priorität:** hoch (Spieler-Wunsch: „mehr wie ein gutes Spiel")

> ⚠️ **Kern-Leitplanken (verbindlich):** Festes 25-Karten-Deck (kein Sammeln/Wachstum) · **Mana = reine Anzeige ohne Mechanik** · DOM-Hybrid. Details: [README → Kern-Leitplanken](../README.md#kern-leitplanken).
>
> **🔄 angepasst (wichtig):** Die Feldherren-Befehle (AP1) laufen **NICHT über Mana**, sondern **cooldown-basiert** (z. B. 1 Befehl pro Runde + Abkling-Timer). Mana bleibt reine Deko. AP2-Passive hängen an den **bestehenden 25 Karten** — keine neuen Karten.

## Ziel

Das Spiel — und besonders den rundenbasierten Combat — **immersiver, spannender und wertiger** machen. Drei Stoßrichtungen: (1) der Echtzeit-Phase echte Spieler-Agency geben, (2) Karten von „bunten Stat-Blobs" in eine taktische Armee mit Identität verwandeln, (3) das Ganze über Game-Feel, Audio und Boss-Inszenierung *fühlbar* machen.

> **Architektur-Hinweis:** Das Spiel ist DOM+Canvas-Hybrid (kein Phaser). Combat-Feld ist Vanilla-Canvas. Alle Tuning-Werte gehören nach [`src/systems/data/balance.ts`](../../src/systems/data/balance.ts). FX-Hooks existieren bereits in [`CombatState`](../../src/systems/combat/CombatState.ts): `damageNumbers`, `screenShake`, `spawnFxQueue`, `deathFxQueue`, `baseHitFxQueue`, `pendingSpawns`.

## 🎯 Definition of Done — Hauptziel (Gate)

> **Die Resolve-Phase ist interaktiv (cooldown-basierte Feldherren-Befehle, KEIN Mana), mindestens 6 Karten haben distinkte Passive, Combos sind audiovisuell fühlbar, und mindestens ein Boss zeigt eine eigene Phasen-Mechanik. Der Combat fühlt sich subjektiv „wie ein gutes Spiel" an (Playtest).**

Konkret abgeschlossen, wenn:
- Spieler kann in der Resolve-Phase mind. 2 verschiedene Befehle ausgeben (cooldown-gated, **kein Mana**); KI nutzt sie ebenfalls
- Mind. 6 Karten haben sichtbar wirkende Passive (Heal-Beam, Rage, Summon, Projektil, Taunt, Charge)
- Combo-Auslösung zeigt Banner + Armee-Aura + Sound; in der Select-Phase gibt es eine Combo-Vorschau
- Mind. 1 Boss hat eine 50 %-Phasen-Mechanik mit Intro und Phasen-Healthbar
- Low-HP-Dramatik (Vignette + Audio) greift unter Schwelle
- Layered-Audio: Combat-Musik + Impact-SFX + mind. 1 Boss-Stinger
- Tests grün (`commandSystem`, `cardPassives`, `bossPhases`), Browser-Console 0 Errors/Warnings
- Playtest-Notiz: „spannender als vorher" von mind. 1 Tester bestätigt

**🚧 Solange dieses Hauptziel nicht erfüllt ist, gilt R7 als offen.**

---

## Voraussetzungen

- MVP-Combat stabil (rundenbasiert läuft, 71 Tests grün)
- Boss-Auswahl-Screen + Hintergründe vorhanden (bereits gebaut)
- Audio-System vorhanden ([`src/systems/audio`](../../src/systems/audio), `sfx.click`, Mute-Toggle)
- Entscheidung: Mana wird von „Platzhalter" zu **Befehls-Energie** umgedeutet (siehe AP1)

---

## Schritt-für-Schritt-Anleitung

Aufgeteilt in 8 Arbeitspakete (AP). AP1–AP3 sind das Herzstück (Hauptziel-Gate). AP4–AP8 vertiefen.

### AP1 — Feldherren-Befehle (Echtzeit-Agency, **cooldown-basiert — KEIN Mana**) · ~3 Tage

Die Resolve-Phase ist aktuell „zuschauen" — der schwächste Moment → größter Hebel. **Wichtig (Kern-Leitplanke):** Mana bleibt **reine Deko**. Befehle werden **nicht** über Mana bezahlt, sondern über **Cooldown / begrenzte Ladungen pro Runde**.

- [ ] **Kein** Mana-Reaktivieren. Stattdessen: pro Runde **1 Befehls-Ladung** (oder Cooldown-Timer), der in der Resolve-Phase tickt.
- [ ] Befehls-Definitionen in neuer Datei `src/systems/data/commands.ts`:
  ```ts
  export interface Command {
    id: string; name: string; glyph: string;
    cooldownSec: number;          // 🔄 KEIN manaCost — cooldown-gated
    apply: (state: CombatState, side: Side) => void;
  }
  ```
  Start-Set (4):
  - **Verstärkung** — schiebt N Extra-Truppen der zuletzt gespielten Front-Karte nach (nutzt `UnitSystem.spawn` + `spawnFxQueue`)
  - **Sturmsignal** — eigener Front-Stack kurz +Speed/+Damage (temporärer Buff-Timer auf Units)
  - **Schildwall** — eigene Base absorbiert nächste X Sek. keinen Schaden
  - **Magierschlag** — kleiner AoE-Damage auf die dichteste Gegner-Gruppe (`damageNumbers` + `deathFxQueue`)
- [ ] UI: Befehls-Leiste unten in der Resolve-Phase mit **Cooldown-Overlay** (die Mana-Bar bleibt unverändert reine Deko oder wird ausgeblendet)
- [ ] KI nutzt Befehle: Erweiterung in [`AiController`](../../src/systems/combat/AiController.ts) — z. B. Schildwall wenn Base < 40 %, Sturmsignal wenn vorne
- [ ] Balance-Konstanten nach `balance.ts` (`COMMAND_*`, inkl. Cooldowns)

### AP2 — Karten-Passive & pro-Karte Combo-Werte · ~4 Tage

Vision 6.4/6.6: jede Karte hat eine **Passive** und **eigene** Combo-Buffs. Aktuell alles generisch (`COLOR_ARMY_BONUS`/`CLASS_ARMY_BONUS` in `balance.ts`). Das ist der Tiefen-Hebel.

- [ ] Datenmodell erweitern (`src/domain/Card.ts`):
  ```ts
  type PassiveTrigger = 'onTick' | 'onSpawn' | 'onDeath' | 'onHpThreshold';
  interface CardPassive { trigger: PassiveTrigger; id: string; /* params */ }
  interface Card { ...; passive?: CardPassive; colorBuff?: Partial<UnitStats>; classBuff?: Partial<UnitStats>; }
  ```
- [ ] `PassiveSystem.ts` im Combat-Loop (neue Tick-Phase). 6 Start-Passive:
  - **Heiler** (`onTick`): heilt Units im Radius +X HP/s (Heal-Beam-FX)
  - **Berserker** (`onHpThreshold` <50 %): Damage ×1.5 (Rage-Glow)
  - **Nekromant** (`onDeath`): beschwört Skelett → **`pendingSpawns` existiert bereits**
  - **Magier** (`onTick`): Fernkampf-Projektil statt Nahkampf (neuer Angriffs-Typ)
  - **Festung** (`onSpawn`): Taunt-Aura, zieht Gegner-Targeting
  - **Reittier** (`onSpawn`): Charge — erste N Sek. +Speed
- [ ] `computeCombo` ([`RoundSystem`](../../src/systems/combat/RoundSystem.ts)) auf pro-Karte `colorBuff`/`classBuff` umstellen (Fallback auf Pauschalen, bis alle 25 Karten Werte haben)
- [ ] Migration: 25 Karten in [`cards.ts`](../../src/systems/data/cards.ts) mit Passive + Combo-Werten füllen

### AP3 — Game-Feel / Juice (sofort spürbar) · ~3 Tage

FX-Queues sind da, werden aber unterausgenutzt.

- [ ] **Hit-Stop**: 2–3 Frames Freeze beim Base-Treffer (`baseHitFxQueue`) + stärkerer `screenShake`
- [ ] **Combo-Feedback**: bei Auslösung goldener Banner „⚔ ALLIANZ KRIEG · +4 DMG" + farbiges Aura-Glühen auf allen eigenen Units (aktuell wirkt der Buff *stumm*)
- [ ] **Klassen-Silhouetten/Animation** statt gleicher Kreise: Magier wirft, Reittier galoppiert, Heiler-Beam, Festung steht, Krieger stürmt
- [ ] **Slow-Mo-Finish**: letzter Base-Treffer in Zeitlupe + Aufblitzen + Base-Bersten
- [ ] Tuning nach `balance.ts` (`HITSTOP_FRAMES`, `SLOWMO_*`)

### AP4 — Audio (größter Immersions-Boost pro Aufwand) · ~2 Tage

- [ ] Layered Combat-Musik (Loop + Intensitäts-Stem, der bei niedriger HP / Boss hochfährt)
- [ ] Impact-SFX (Treffer, Tod, Base-Hit), UI-SFX (Pick/Confirm/Combo)
- [ ] Boss-Stinger beim Boss-Intro
- [ ] Lautstärke-Mix + Mute respektieren (vorhandenes Audio-System)

### AP5 — Spannung & Pacing · ~2 Tage

- [ ] **Low-HP-Dramatik**: Base < ~30 % → roter Vignette-Puls + Herzschlag-SFX + Musik-Intensität hoch
- [ ] **Scrying** (gegen „Blind-Pick"-Frust): eine der 5 verdeckten Karten kurz aufdecken — als Untot-Klassenfähigkeit oder Perk
- [ ] **Runden-Telegraf**: dezenter Vorbote der Gegner-Linie (Staub/Schatten), damit Front/Hinten-Wahl Gewicht bekommt

### AP6 — Boss-Identität im Kampf · ~3 Tage

Die schönen Boss-Auswahl-Bilder existieren — Identität in den Kampf übertragen.

- [ ] **Boss-Intro**: Name/Titel + Kamera + Stinger beim Combat-Start gegen Boss
- [ ] **Phasen-Healthbar** mit Markern (50 %)
- [ ] **Pro-Farbe Boss-Mechanik** bei 50 % HP (Infra: `pendingSpawns`, onDeath, Command-System aus AP1):
  - Untot-Boss: Massen-Beschwörung
  - Stein-Boss: schildet sich/Armee
  - Krieg-Boss: Enrage (+Damage)
  - Natur-Boss: Heilwelle
  - Farblos-Boss: Elite-Verstärkung
- [ ] Boss-Encounter erkennt Phasen-Wechsel in der Loop, triggert Skript-Event einmalig

### AP7 — Run-Abwechslung & Meta · ~3 Tage

- [ ] Neue Knoten-Typen: **Event/Schrein** (Risiko-Belohnung), **Elite** (Modifikator), **Fluch/Segen** — in [`MapGenerator`](../../src/systems/run/MapGenerator.ts)/[`RoomMapGenerator`](../../src/systems/run/RoomMapGenerator.ts)
- [ ] **Relikte** (passive Run-Trigger zusätzlich zu Perks) → prägen Builds, „Build-Craving"
- [ ] **Schatz-Raum-Varianz**: mehr als die 3 generischen Optionen (z. B. seltenes Relikt, Doppel-Upgrade gegen HP-Kosten)
- [ ] **Meta-Progression** zwischen Runs (freischaltbare Karten/Bosse) — optional, Gate-unabhängig

### AP8 — UX/Klarheit (damit Tiefe nicht in Verwirrung untergeht) · ~2 Tage

- [ ] **Combo-Vorschau** in der Select-Phase: „diese 2 → Krieg-Allianz +4 DMG"
- [ ] **Front/Hinten** visuell eindeutig beschriften
- [ ] **Outcome-Preview**: geschätzte Truppenstärke beider Linien
- [ ] Kurz-Tooltips für Karten-Passive & Befehle

### AP9 — Tests & Verifikation

- [ ] `test/commandSystem.test.ts` — Befehle wirken korrekt, Mana/Cooldown stimmen
- [ ] `test/cardPassives.test.ts` — alle 6 Passive simuliert (inkl. Nekromant-Summon)
- [ ] `test/bossPhases.test.ts` — Phasen-Event triggert einmalig bei 50 %
- [ ] `computeCombo`-Tests auf pro-Karte-Werte erweitern
- [ ] Preview-Verifikation eval-basiert (Headless-Quirk: Screenshots timeouten, RAF in hidden Tabs gedrosselt → `setInterval`-Loops & Eval nutzen)

---

## End-Zustand

**Datei-Baum (neu/geändert):**
```
src/
├── systems/
│   ├── combat/
│   │   ├── CommandSystem.ts      (neu — Feldherren-Befehle)
│   │   ├── PassiveSystem.ts      (neu — Karten-Passive)
│   │   ├── BossPhaseSystem.ts    (neu — Phasen-Mechaniken)
│   │   ├── AiController.ts       (Befehls-Nutzung)
│   │   └── RoundSystem.ts        (pro-Karte Combo)
│   ├── data/
│   │   ├── commands.ts           (neu)
│   │   ├── cards.ts              (Passive + Combo-Werte)
│   │   └── balance.ts            (Command/Hitstop/Slowmo/Phase-Tuning)
│   └── audio/                    (Layered-Musik, SFX-Bank)
├── screens/
│   └── Combat.ts                 (Befehls-Leiste, Combo-Banner, Low-HP-Vignette, Boss-Intro)
└── ui/
    └── (Klassen-Silhouetten-Renderer fürs Canvas)
```

**Sichtbares Verhalten:**
- Resolve-Phase ist interaktiv: Befehlsleiste mit Cooldowns (🔄 kein Mana)
- Karten fühlen sich unterschiedlich an (Heal-Beam, Rage, Skelett-Summon, Projektile)
- Combo blitzt mit Banner + Aura + Sound auf; Select zeigt Vorschau
- Bosse haben Intro, Phasen-Healthbar und eine 50 %-Mechanik
- Niedrige HP: roter Puls + Herzschlag + intensivere Musik
- Audio überall (Treffer, UI, Boss-Stinger)

**Was noch fehlt (spätere Iteration):**
- Echte Sprite-Sheets statt Form-Silhouetten (asset-getrieben)
- Volle Relikt-/Meta-Tiefe (eigene Phase)

---

## Akzeptanz-Test

1. Combat starten → in Resolve-Phase Befehl ausgeben (z. B. Magierschlag) → AoE sichtbar + Befehl geht auf Cooldown (kein Mana-Abzug)
2. Heiler spielen → benachbarte Units heilen sichtbar (Beam)
3. Karte mit Nekromant-Passive → bei Tod erscheint Skelett
4. Combo-Paar spielen → Banner + Armee-Aura + Sound; Select zeigt vorab die Combo
5. Boss-Encounter → Intro + Phasen-Healthbar; bei 50 % triggert Mechanik einmalig
6. Base auf < 30 % bringen → Vignette-Puls + Herzschlag + Musik intensiver
7. KI gibt mind. einen Befehl aus (Schildwall bei niedriger Boss-Base)
8. Tests grün: `commandSystem`, `cardPassives`, `bossPhases`, `computeCombo`

---

## ✅ Freigabe-Checkliste

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] Resolve-Phase nachweislich interaktiv (Spieler + KI)
- [ ] 6 Passive einzeln im Combat verifiziert
- [ ] Combo-Feedback (Banner/Aura/Sound) + Select-Vorschau sichtbar
- [ ] Mind. 1 Boss-Phasen-Mechanik bug-frei
- [ ] Low-HP-Dramatik + Layered-Audio aktiv
- [ ] `npx vitest run` — alle Tests grün
- [ ] `npx tsc --noEmit` — keine Fehler
- [ ] Browser-Console: 0 Errors, 0 Warnings
- [ ] Playtest-Notiz „spannender als vorher" vorhanden

---

## Offene Fragen / Risiken

- **Befehle zu stark:** könnten den Kampf trivialisieren → Cooldowns/Ladungen konservativ starten, im Playtest tunen (🔄 ohne Mana-Kosten, rein cooldown-gated)
- **Komplexitäts-Explosion:** 6 Passive × Combos × Befehle × Boss-Phasen = viel Interaktion. Inkrementell bauen, je Feature sofort testen
- **Canvas-Performance:** Silhouetten-Animation + viele Truppen-Stacks (~20/Karte) → Profiling; ggf. Anzahl Units pro Stack visuell zusammenfassen
- **UI-Überfrachtung:** Befehlsleiste + Combo-Banner + Damage-Numbers + Status gleichzeitig → klare visuelle Priorität, Eval-Verifikation
- **Audio-Assets:** Layered-Musik braucht Quellen (Lizenz/Eigenproduktion) — früh klären
- **Scope:** AP7 (Meta) ist Gate-unabhängig und kann in eine eigene Phase ausgelagert werden, wenn R7 sonst zu groß wird
