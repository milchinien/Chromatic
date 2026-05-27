# R5 — Präsentation

**Dauer:** offen (asset-getrieben) · **Priorität:** mittel-niedrig (wichtig vor Release, nicht davor)

## Ziel

Vom „programmierten Prototyp mit geometrischen Shapes" zum „verkaufbar wirkenden Spiel". Echte Sprites, Partikel-Effekte, Musik, vertonte Boss-Lines. Optisches/akustisches Niveau hoch genug für einen Steam-Release.

## 🎯 Definition of Done — Hauptziel (Gate)

> **Alle Units sind animierte Sprites, Karten haben echtes Artwork, Welt-Karte hat thematische Hintergründe pro Akt, Musik wechselt zwischen Akten und Boss-Combats, Optionen-Menü mit Lautstärke/Vollbild/Rebinding ist funktional. Spiel sieht und klingt auslieferungsreif.**

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- Jede Karte hat min. 4 Animations-Zustände (Idle/Walk/Attack/Death), alle laufen ohne Frame-Drops
- Preloader-Scene mit funktionierendem Progress-Bar
- Welt-Karte hat Akt-spezifische Hintergründe, Knoten als illustrierte Icons
- Karten-Hand: echte Karten-Artworks mit Frame, Stats, Mana-Cost-Gem
- Musik spielt durchgehend, Crossfade bei Akt-Wechsel sauber
- Optionen-Menü: alle Settings funktional, persistieren in LocalStorage
- Credits-Screen listet alle Asset-Lizenzen
- Performance ≥ 50 FPS auf einem 2017er Laptop (Test-Baseline)
- Keine fehlenden Asset-Verweise (404 in Browser-Network)
- Browser-Console: 0 Errors, 0 Warnings

**🚧 Solange diese Bedingungen nicht erfüllt sind, wird R6 NICHT begonnen.** Ein Spiel mit Asset-Bugs sollte nicht auf Steam landen.

---

## Voraussetzungen

- R4 abgeschlossen (Gameplay-Iteration ist stabil — bevor man Assets baut, sollte das Mechanik-Skelett festgezurrt sein)
- Idealerweise: Artist im Boot (oder Asset-Paket gekauft) — Solo-Programmierer-Aufgabe ist das nicht

---

## Schritt-für-Schritt-Anleitung

### 1. Style-Guide festlegen (1 Woche, Vorarbeit)
- [ ] Visueller Stil definieren — 3 Referenzen sammeln (z. B. Slay the Spire, Inscryption, Loop Hero)
- [ ] Farb-Palette pro Karten-Farbe formalisieren (Hex-Codes für Natur/Krieg/Stein/Untot/Farblos)
- [ ] Schrift-Familie wählen (eine Haupt-, eine UI-Font)
- [ ] Asset-Anforderungen-Dokument: Pixel-Auflösung, Stil (Pixel-Art vs. Vector vs. handgemalt), Anzahl Animationsframes

### 2. Unit-Sprites (Asset-Phase, extern getrieben)
- [ ] Pro Karte: Sprite-Sheet mit:
  - Idle-Animation (2–4 Frames)
  - Walk-Animation (4–6 Frames)
  - Attack-Animation (3–4 Frames)
  - Death-Animation (3–4 Frames)
- [ ] 40+ Karten × ~16 Frames = viel Arbeit. Plan B: weniger Animations-Frames pro Karte
- [ ] Phaser-Integration: `this.anims.create({ ... })` pro Unit-Typ in einem zentralen `src/systems/assets/animations.ts`
- [ ] Lade-Logik: Vorab in `Preloader`-Scene mit Progress-Bar

### 3. UI-Redesign
- [ ] Karten-Design im Hand: statt textbasierten Buttons → echte Karten-Artwork mit Frame, Stats-Overlay, Mana-Cost-Gem
- [ ] HP-Bars: stilisierte Balken mit Texturen statt flacher Rechtecke
- [ ] Welt-Karte: Knoten als illustrierte Icons (Schwerter für Combat, Truhe für Schatz, etc.)
- [ ] Hintergründe pro Akt: dunkler Wald (Akt 1), Höhle (Akt 2), Schloss (Akt 3)

### 4. Partikel-Effekte
- [ ] Phaser-Partikel-Emitter pro:
  - Karten-Spawn (farbige Funken in Karten-Farbe)
  - Combo-Aktivierung (Aura-Ring um Units)
  - Hit (Spritzer in Schaden-passender Farbe — rot, blau, etc.)
  - Status-Effekt-Trigger (Burn: Flammen, Frost: Eiskristalle)
  - Tod (Auflösungs-Partikel)
  - Sieg (Konfetti-Effekt)

### 5. Audio-Pass
- [ ] Musik pro Akt (3 Tracks, looping, ~3-5 Min lang)
- [ ] Boss-Battle-Musik (separates Stück)
- [ ] Menü-Musik (1 Track)
- [ ] SFX-Pass: alle MVP-SFX durch qualitativ bessere ersetzen
- [ ] Voicelines (optional): Boss-Eröffnungs-Line („Du wagst es?")
- [ ] `src/systems/audio/MusicManager.ts` mit Crossfade zwischen Tracks
- [ ] Optionen-Menü mit Lautstärke-Reglern (Music / SFX getrennt)

### 6. Optionen-Menü
- [ ] `src/scenes/OptionsScene.ts`:
  - Lautstärke Music + SFX (Slider)
  - Vollbild-Toggle
  - Auflösung-Wahl
  - Tasten-Rebinding (ESC, TAB, M, …)
  - Reset-to-Default
- [ ] Settings in LocalStorage persistiert

### 7. Credits-Screen
- [ ] `src/scenes/CreditsScene.ts` mit Liste aller Asset-Quellen + Lizenzen
- [ ] Code-Mitwirkende
- [ ] Sound-Quellen + CC-Lizenzen

### 8. Loading-Polish
- [ ] Splash-Screen mit Spiel-Logo (3 Sek.)
- [ ] Preloader-Scene mit Fortschritts-Balken (Assets laden ist mit echten Sprites nicht mehr instantan)

### 9. Tests
- [ ] Visuelle Regression-Tests (optional, mit Playwright-Screenshots)
- [ ] Sound-Mute-Test (alle Settings persistieren)

### 10. Commit + Tag
- [ ] `git commit -m "R5: presentation pass (sprites, audio, options)"`
- [ ] Tag `v0.6.0`

---

## End-Zustand

**Datei-Baum (neu):**
```
src/
├── assets/
│   ├── sprites/ (alle Unit-Sprite-Sheets)
│   ├── ui/ (Karten-Frames, Icons, Hintergründe)
│   ├── music/ (3-5 Tracks)
│   └── sfx/ (vollständige Sammlung)
├── systems/
│   ├── assets/
│   │   ├── animations.ts
│   │   └── Preloader.ts
│   └── audio/
│       └── MusicManager.ts
└── scenes/
    ├── PreloaderScene.ts
    ├── SplashScene.ts
    ├── OptionsScene.ts
    └── CreditsScene.ts
```

**Sichtbares Verhalten:**
- Spiel beim Start: Splash → Preloader (mit Fortschritt) → Hauptmenü
- Alle Units sind echte animierte Sprites, keine Rechtecke mehr
- Karten in der Hand haben Artwork-Frames
- Welt-Karte sieht illustriert aus, mit thematischem Hintergrund pro Akt
- Musik spielt durchgehend, wechselt bei Akt-Übergängen, Boss-Track im Endboss-Combat
- Optionen-Menü vollständig
- Credits-Screen würdigt alle Mitwirkenden

---

## Akzeptanz-Test

1. Spiel startet mit Splash + Preloader (echte Asset-Ladezeit sichtbar)
2. Im Combat sehen Units animiert aus (Idle, Walk, Attack, Death erkennbar)
3. Karten-Hand zeigt illustrierte Karten statt Text-Buttons
4. Beim Sieg über einen Boss: spürbare Audio-Steigerung (Fanfare, Konfetti)
5. Optionen-Menü: Lautstärke senken → hörbar leiser, Setting bleibt nach Refresh
6. Credits-Screen lädt ohne Errors, alle Lizenzen sichtbar

---

## ✅ Freigabe-Checkliste (vor Beginn von R6)

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] Alle Sprites/Animationen laden ohne 404 (Browser-Network-Panel geprüft)
- [ ] Performance ≥ 50 FPS auf Low-Spec-Test-Gerät
- [ ] Music/SFX-Lizenzen alle dokumentiert in Credits
- [ ] Optionen persistieren über LocalStorage
- [ ] `pnpm test` — alle Tests grün
- [ ] `pnpm lint` — keine Errors
- [ ] `pnpm build` — läuft fehlerfrei
- [ ] Browser-Console: 0 Errors, 0 Warnings
- [ ] Keine offenen Bugs der Schweregrade „kritisch" oder „mittel"
- [ ] Git-Tag `v0.6.0` gesetzt

**Erst wenn ALLE Häkchen gesetzt sind, beginnt R6.**

---

## Offene Fragen / Risiken

- **Asset-Beschaffung:** Größtes Risiko. Ohne Artist müssen Asset-Packs gekauft werden — diese sind oft inkonsistent
- **Performance:** Echte Sprites + Partikel können auf schwächeren Maschinen ruckeln. Performance-Test auf Low-Spec-Browser nötig
- **Stil-Konsistenz:** Mehrere Artists / Asset-Packs → Style-Bruch. Hart durchsetzen, dass ein Style-Guide existiert
- **Audio-Lizenzen:** Royalty-free vs. royalty-bearing genau prüfen wenn Steam-Release geplant
