# Phase 1 — Fundament

**Dauer:** ½ Tag · **Risiko:** niedrig

## Ziel

Lauffähiges, leeres Projekt-Skelett mit funktionierendem Tooling, in dem das Hauptmenü auf eine leere Welt-Karte verlinkt.

## 🎯 Definition of Done — Hauptziel (Gate)

> **Ein leerer, lauffähiger Projekt-Rumpf mit funktionierendem Build/Test/Lint-Tooling, der eine klickbare Szenen-Navigation Hauptmenü → leere Welt-Karte → Hauptmenü bietet.**

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint` laufen alle ohne Errors
- Hauptmenü und Welt-Karten-Platzhalter rendern ohne visuelle Fehler
- Szenen-Wechsel in beide Richtungen funktioniert ohne State-Lecks
- Keine bekannten Bugs der Schweregrade „kritisch" oder „mittel"
- Browser-Console während aller manuellen Tests: 0 Errors, 0 Warnings
- Smoke-Test grün

**🚧 Solange diese Bedingungen nicht erfüllt sind, wird Phase 2 NICHT begonnen.** Auftauchende Bugs werden hier behoben, nicht in Phase 2 verschoben.

---

## Voraussetzungen

- Node.js ≥ 20 installiert
- `pnpm` global installiert (`npm i -g pnpm`)
- Git-Repo bereits initialisiert (✓ erledigt)
- Design-Defaults aus [../README.md](../README.md) festgelegt (Auto-Draw, Mana-Cap, Perk-Stacking)

---

## Schritt-für-Schritt-Anleitung

### 1. Projekt initialisieren
- [ ] `pnpm create vite . --template vanilla-ts` im Repo-Root ausführen
- [ ] `package.json` prüfen: `"type": "module"`, `"name": "chromatic"`, Version `0.1.0`
- [ ] `pnpm install` ausführen
- [ ] `node_modules/`, `dist/` zu `.gitignore` hinzufügen

### 2. Engine und Dev-Dependencies installieren
- [ ] `pnpm add phaser@3`
- [ ] `pnpm add -D vitest @vitest/ui @types/node`
- [ ] `pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier`

### 3. Tooling konfigurieren
- [ ] `tsconfig.json` auf **strict mode** setzen (`"strict": true`, `"noUncheckedIndexedAccess": true`)
- [ ] `vite.config.ts` mit Phaser-freundlichen Defaults (Port 5173)
- [ ] `.eslintrc.json` mit `@typescript-eslint/recommended` + `prettier`
- [ ] `.prettierrc.json` mit Standard-Settings (semi: true, singleQuote: true, printWidth: 100)
- [ ] `package.json` Scripts: `dev`, `build`, `test`, `lint`, `format`

### 4. Ordnerstruktur anlegen (leer, mit `.gitkeep`)
Gemäß [TECH_PLAN.md Sektion 2](../../TECH_PLAN.md):
- [ ] `src/scenes/`
- [ ] `src/systems/combat/`
- [ ] `src/systems/run/`
- [ ] `src/systems/data/`
- [ ] `src/domain/`
- [ ] `src/ui/`
- [ ] `src/assets/`
- [ ] `test/`

### 5. Entry-Point bauen
- [ ] `src/main.ts` — Phaser-Game mit Config: Breite 1280, Höhe 720, Renderer AUTO, Scenes: `[MainMenuScene, WorldMapScene]`
- [ ] `index.html` — minimal mit `<div id="app">` und `<script type="module" src="/src/main.ts">`

### 6. Erste zwei Szenen (Platzhalter)
- [ ] `src/scenes/MainMenuScene.ts`
  - Hintergrund schwarz
  - Text „CHROMATIC" zentriert oben
  - Button „SPIELEN" mittig (Phaser-Text mit `setInteractive()`)
  - Klick → `this.scene.start('WorldMapScene')`
- [ ] `src/scenes/WorldMapScene.ts`
  - Hintergrund dunkelgrau
  - Text „Welt-Karte (Platzhalter)" zentriert
  - Text „ESC → Hauptmenü" als Hinweis
  - ESC-Key-Listener → zurück zu `MainMenuScene`

### 7. Erste Test-Datei
- [ ] `test/smoke.test.ts` — ein triviales `expect(true).toBe(true)` damit Vitest verifiziert läuft

### 8. Sanity-Check
- [ ] `pnpm dev` — Browser öffnet sich auf `localhost:5173`, Hauptmenü erscheint
- [ ] „SPIELEN" anklicken → Welt-Karte erscheint
- [ ] ESC → zurück ins Hauptmenü
- [ ] `pnpm test` — Smoke-Test grün
- [ ] `pnpm lint` — keine Errors
- [ ] `pnpm build` — Production-Build läuft durch, `dist/` enthält Output

### 9. Commit
- [ ] `git add . && git commit -m "Phase 1: project foundation"`

---

## End-Zustand

**Datei-Baum (gekürzt):**
```
/
├── .eslintrc.json
├── .gitignore
├── .prettierrc.json
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts
│   ├── scenes/
│   │   ├── MainMenuScene.ts
│   │   └── WorldMapScene.ts
│   ├── systems/{combat,run,data}/.gitkeep
│   ├── domain/.gitkeep
│   ├── ui/.gitkeep
│   └── assets/.gitkeep
└── test/
    └── smoke.test.ts
```

**Sichtbares Verhalten:**
- `pnpm dev` startet einen Server auf Port 5173
- Browser zeigt schwarzes Hauptmenü mit Titel „CHROMATIC" und klickbarem „SPIELEN"-Button
- Klick auf „SPIELEN" wechselt zur dunkelgrauen Welt-Karten-Platzhalter-Szene
- ESC bringt zurück zum Hauptmenü
- `pnpm test`, `pnpm lint`, `pnpm build` laufen alle ohne Fehler durch

**Was noch fehlt (kommt in späteren Phasen):**
- Echte Welt-Karte mit Knoten (Phase 3)
- Combat (Phase 2)
- Buttons für „Optionen", „Credits", „Beenden" (Post-MVP)

---

## Akzeptanz-Test (manuell)

1. `pnpm install` frisch in einer leeren `node_modules`-Situation → läuft fehlerfrei
2. `pnpm dev` öffnet Hauptmenü
3. „SPIELEN" → Welt-Karte
4. ESC → Hauptmenü
5. F12 Console — **keine Errors, keine Warnings**
6. `pnpm test` — alle Tests grün
7. `pnpm build` — `dist/index.html` existiert und ist im Browser öffenbar (über `pnpm preview`)

Wenn alle 7 Punkte erfüllt sind: **Phase 1 abgeschlossen.**

---

## ✅ Freigabe-Checkliste (vor Beginn von Phase 2)

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] `pnpm test` — alle Tests grün
- [ ] `pnpm lint` — keine Errors
- [ ] `pnpm build` — läuft fehlerfrei
- [ ] Browser-Console: 0 Errors, 0 Warnings
- [ ] Keine offenen Bugs der Schweregrade „kritisch" oder „mittel"
- [ ] Phase-Commit erstellt
- [ ] Alle Häkchen in den Schritt-Listen oben gesetzt

**Erst wenn ALLE Häkchen gesetzt sind, beginnt Phase 2.**

---

## Offene Fragen / Risiken

- **Phaser-Version:** Wenn Phaser 4 zum Implementierungs-Zeitpunkt stable ist, prüfen, ob Migration sinnvoll ist. Für MVP reicht Phaser 3.
- **TypeScript-Strict-Settings:** `noUncheckedIndexedAccess: true` ist streng — kann bei Bedarf vor Phase 2 zurückgenommen werden, wenn Array-Zugriffe im Combat-Loop unhandlich werden.
