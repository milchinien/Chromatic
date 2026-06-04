# Design Reference — Chromatic

Diese Datei ist die **verbindliche visuelle Spezifikation** für alle Phasen ab jetzt. Sie wurde aus einem Claude-Design-Handoff-Bundle extrahiert. Die rohen Quell-Dateien (HTML/CSS/JSX-Prototypen) liegen unter [`design/`](../design/) und sind die Quelle der Wahrheit — diese Datei ist die destillierte Implementierungs-Anleitung.

> ⚠️ **Kern-Leitplanken (Stand 2026-06):** Visuals bleiben gültig, aber die **Mechanik-Hinweise** sind am aktuellen Kern zu lesen: **Mana-Bar & Mana-Cost-Bubble sind reine Deko ohne Funktion** (kein „locked = Mana zu wenig" — Karten sind nie mana-gated). Das Deck ist **fest (25 Karten)** — kein Kartenkauf/-sammeln. Details: [README → Kern-Leitplanken](README.md#kern-leitplanken).

## Quell-Dateien

| Datei | Inhalt |
|-------|--------|
| [design/README.md](../design/README.md) | Handoff-Hinweise vom Design-Tool |
| [design/project/styles.css](../design/project/styles.css) | Alle CSS-Custom-Properties + Komponenten-Klassen |
| [design/project/Chromatic Game Design.html](../design/project/Chromatic%20Game%20Design.html) | HTML-Loader (lädt nur Scripts) |
| [design/project/screens/menu.jsx](../design/project/screens/menu.jsx) | Hauptmenü |
| [design/project/screens/world-map.jsx](../design/project/screens/world-map.jsx) | Welt-Karte (Akt-Ebene) |
| [design/project/screens/room-map.jsx](../design/project/screens/room-map.jsx) | Raum-Karte (Sub-Knoten als Graph) |
| [design/project/screens/dungeon-map.jsx](../design/project/screens/dungeon-map.jsx) | Top-Down-Dungeon-Variante der Raum-Karte |
| [design/project/screens/combat.jsx](../design/project/screens/combat.jsx) | Combat-Szene mit allen HUD-Elementen |
| [design/project/screens/card.jsx](../design/project/screens/card.jsx) | Karten-Komponente (Hand + Shop) |
| [design/project/screens/shop.jsx](../design/project/screens/shop.jsx) | Shop / Markt |
| [design/project/screens/perk.jsx](../design/project/screens/perk.jsx) | Zauber-Raum / Perk-Auswahl |
| [design/project/screens/reward-picker.jsx](../design/project/screens/reward-picker.jsx) | Belohnungs-Auswahl nach Combat |
| [design/project/screens/icons.jsx](../design/project/screens/icons.jsx) | Icon-Set + RoomGlyph + Coin + HPPill |
| [design/project/uploads/](../design/project/uploads/) | Skizzen und Referenzbilder vom Designer |
| [design/project/scraps/](../design/project/scraps/) | Iterations-Screenshots |

**Regel:** Bei Unklarheiten im Detail die `.jsx`-Quelle öffnen — sie ist autoritativ.

---

## 1. Visueller Stil — Mood

- **Genre-Anker:** Roguelite-Deckbuilder im Stil von Slay the Spire und Hades — warme, dunkle „Parchment"-Atmosphäre, gold-akzentuiert.
- **Grundstimmung:** Düsteres Mittelalter / Magierat, keine Sci-Fi, keine Comic-Sättigung.
- **Texturen:** Subtile Parchment-Grain via Radial-Gradients, Inset-Vignette pro Screen, Pattern-Grids auf Karten.
- **Helligkeit:** Hintergrund-Schwarz `#0f0c08`, Surface-Töne im warmen Braun-Bereich, Tinte/Text in warmem Cream.
- **Akzent:** Eine einzige primäre Akzentfarbe — Gold (`--gold` / `--gold-hi`). Wird sparsam für aktive Elemente und Hervorhebungen eingesetzt.
- **Kartenfarben:** 5 distinkte, leicht entsättigte Farben — keine Neon-Sättigung. Stein und Farblos sind explizit muted.

---

## 2. Design-Tokens (CSS-Variablen)

Diese werden 1:1 als TypeScript-Konstanten in `src/systems/data/designTokens.ts` gespiegelt (siehe Phaser-Hinweise unten).

### Surfaces (warm parchment-dark)
| Token | Hex | Verwendung |
|-------|-----|------------|
| `--bg` | `#2a2219` | Screen-Background-Basis |
| `--bg-2` | `#322a1f` | Background-Gradient-Endpunkt |
| `--surface` | `#3d3225` | Panels, Cards |
| `--surface-2` | `#4a3d2c` | Card-Gradient-Highlight |
| `--surface-3` | `#5a4a34` | Button-Gradient-Highlight |
| `--line` | `#5a4733` | Standard-Border |
| `--line-hi` | `#8b6f47` | Hervorgehobene Border, Kanten |
| `--line-soft` | `#3a2e22` | Subtile Trennlinien |
| body bg (root) | `#0f0c08` | Außerhalb des Screen-Frames |

### Tinte / Text
| Token | Hex | Verwendung |
|-------|-----|------------|
| `--ink` | `#fbf3dc` | Haupt-Text |
| `--ink-dim` | `#d8c39a` | Sekundärer Text |
| `--ink-mute` | `#9b8463` | Tertiär, Labels |
| `--ink-faint` | `#6b573d` | Sehr leise Hints |

### Gold — primärer UI-Akzent
| Token | Hex | Verwendung |
|-------|-----|------------|
| `--gold` | `#d6a955` | Standard-Akzent |
| `--gold-hi` | `#f0c878` | Hover, aktive Hervorhebung |
| `--gold-deep` | `#8a6a2c` | Gold-Button-Gradient-Schatten |

### 5 Karten-Farben
| Token | Hex | Farbe (DE) |
|-------|-----|------------|
| `--c-natur` | `#6aa56a` | Natur (grün) |
| `--c-krieg` | `#c8553d` | Krieg (rot) |
| `--c-stein` | `#9a8f80` | Stein (warm grau) |
| `--c-untot` | `#9a6cb6` | Untot (lila) |
| `--c-farblos` | `#ead7a8` | Farblos (parchment-cream) |

### Meter-Farben
| Token | Hex | Bedeutung |
|-------|-----|-----------|
| `--hp` | `#6aa56a` | HP-Bar gefüllt (= Natur-Farbe) |
| `--hp-bad` | `#c8553d` | HP-Bar low / Gegner-Base |
| `--mana` | `#4a8cc8` | Mana-Bar |
| `--xp` | `#d6a955` | EXP-Bar (= Gold) |

### FX
| Token | Wert |
|-------|------|
| `--shadow-sm` | `0 2px 6px rgba(0,0,0,.4)` |
| `--shadow` | `0 6px 24px rgba(0,0,0,.55)` |
| `--glow-gold` | `0 0 24px rgba(214,169,85,.4)` |

### Screen-Background-Pattern
Jeder Screen rendert einen Radial-Gradient-Hintergrund:
```css
background: radial-gradient(ellipse at 50% 0%, #4a3a26 0%, var(--bg) 55%, var(--bg-2) 100%);
```
Plus zwei Overlays für die Parchment-Atmosphäre:
- `::before` — Radial-Gradient mit Natur+Untot-Tinten (~4% Opacity)
- `::after` — Inset-Box-Shadow `0 0 140px rgba(0,0,0,.45)` als Vignette

---

## 3. Typografie

Drei Web-Fonts via Google Fonts — werden im HTML-Head geladen, ehe Phaser startet:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### Font-Stack-Rollen

| Font-Family | Rolle | Beispiele |
|-------------|-------|-----------|
| **Cinzel** (serif) | Display, Titel, Buttons, Karten-Namen | Logo „CHROMATIC", Menu-Buttons, Karten-Namen, Akt-Namen, Encounter-Namen |
| **IBM Plex Sans** | Body-Text, Beschreibungen | Karten-Beschreibungen, Tooltip-Text, Hilfe-Hinweise |
| **JetBrains Mono** | Zahlen, Labels, Mono | Coin-Count, HP-Zahlen, Mana-Zahlen, Kompass-Labels, Hotkey-Hinweise |

### Type-Klassen (aus styles.css)

| Klasse | Family | Weight | Letter-Spacing | Transform |
|--------|--------|--------|----------------|-----------|
| `cm-display` | Cinzel | 600 | `0.14em` | uppercase |
| `cm-title` | Cinzel | 500 | `0.18em` | uppercase |
| `cm-num` | JetBrains Mono | 400 | — | tabular-nums |
| `cm-label` | JetBrains Mono | 400 | `0.22em` | uppercase, 10px, color `--ink-mute` |

### Kanonische Größen (aus den Screens)

| Element | Größe |
|---------|-------|
| Logo-Titel („CHROMATIC") | 96px Cinzel 600, letter-spacing 0.14em |
| Subtitel | 11px Cinzel, letter-spacing 0.4em |
| Menü-Buttons | 16px Cinzel, letter-spacing 0.28em |
| Card-Name (md) | 13px Cinzel |
| Akt-Name in HUD | 18px Cinzel, letter-spacing 0.2em |
| Akt-Label in HUD | 10px JetBrains Mono, letter-spacing 0.3em |
| Coin-Value | 16px JetBrains Mono, color `--gold-hi` |
| HP-Pill-Zahlen | 12px JetBrains Mono |
| Card-Stats | 14px JetBrains Mono (md), Bold |
| Mana-Bar-Zahl | 22px JetBrains Mono, color `--mana`, Weight 600 |
| Combat-Timer | 18px JetBrains Mono, color `--gold-hi` |

---

## 4. Wiederverwendbare UI-Komponenten

Diese Komponenten erscheinen über mehrere Screens hinweg. In Phaser-Umsetzung werden sie zu wiederverwendbaren Klassen in `src/ui/`.

### 4.1 Screen-Frame (`cm-screen`)
- Vollflächig (`100% × 100%`)
- Hintergrund-Radial-Gradient (siehe oben)
- Parchment-Grain via 2 Radial-Gradient-Overlays
- Inset-Vignette via `::after`
- Font-Default: IBM Plex Sans, color `--ink`
- `overflow: hidden`

### 4.2 Top-HUD (`cm-hud`)
- Absolut positioniert, `top: 0; left: 0; right: 0`
- Padding `18px 28px`
- Flex-Layout: links/rechts justified
- z-index: 5 (über Background, unter Modals)

**Linke HUD-Seite:**
1. Exit-Button (Ghost-Button mit `exit`-Icon, 14px, padding 8px 10px)
2. Akt-Block:
   - Oben: Label (`cm-act-label`) z. B. `AKT 01 · WELT-KARTE` — 10px JetBrains Mono, letter-spacing 0.3em, color `--ink-mute`
   - Unten: Name (`cm-act-name`) z. B. `VERFLUCHTER HAIN` — 18px Cinzel, letter-spacing 0.2em, color `--ink`

**Rechte HUD-Seite:**
1. **HP-Pill** (`cm-hp-pill`)
   - Background `--surface`, Border `--line`, border-radius 999px (Pill)
   - Padding 8px 14px
   - Grüner Glow-Dot (`cm-hp-dot`, 8px Kreis, color `--hp`, box-shadow `0 0 8px var(--hp)`)
   - Text: `<HP-Aktuell>` (color `--ink`) `/ <Max>` (opacity 0.5), 12px Mono
2. **Coin** (`cm-coin`)
   - Background linear-gradient `--surface-2` → `--surface`, Border `--line`, border-radius 999px
   - Padding 8px 14px
   - Coin-Icon (16px Doppel-Kreis-Outline in Gold)
   - Value: 16px JetBrains Mono, color `--gold-hi`

### 4.3 Buttons (`cm-btn`)
**Standard-Button:**
- Background linear-gradient `--surface-3` → `--surface`
- Border 1px `--line-hi`
- Color `--ink`, font Cinzel 13px, letter-spacing 0.22em, uppercase
- Padding 10px 22px, border-radius 2px
- Cursor pointer, Transition all 150ms
- **Hover:** Border-color → `--gold`, Color → `--gold-hi`

**Gold-Button (`cm-btn--gold`)** — Primär-Aktion:
- Background linear-gradient `#c89642` → `#8a6a2c`
- Border `--gold-hi`
- Color `#1a1208` (dunkel auf Gold)
- Text-Shadow `0 1px 0 rgba(255,255,255,.2)`

**Ghost-Button (`cm-btn--ghost`)** — Sekundär:
- Background transparent
- Border-color `--line`

### 4.4 Card (`cm-card`)
- Background linear-gradient `--surface-2` → `--surface`
- Border 1px `--line-hi`, border-radius 4px
- Bei `--selected`: Border `--gold`, doppelter Box-Shadow inkl. Glow

### 4.5 Color-Chip (`cm-chip`)
- Inline-block, 10×10px, border-radius 50%
- Pro Farbe eigene Subklasse mit passendem Glow-Shadow

### 4.6 UnitCard (Hand- und Shop-Karte)
Drei Größen (sm/md/lg):

| Variant | Breite | Höhe | Padding | Art-Höhe | Name-Größe | Stat-Größe |
|---------|--------|------|---------|----------|------------|------------|
| `sm` | 110px | 160px | 8px | 60px | 11px | 11px |
| `md` | 150px | 218px | 10px | 88px | 13px | 14px |
| `lg` | 190px | 274px | 12px | 116px | 16px | 18px |

**Aufbau (von oben nach unten):**
1. **Mana-Cost-Bubble** (top-left, abs, -8px offset): Kreis 28×28px, Radial-Gradient `#6ab1e8` → `#2a5a8c`, 2px dunkler Border, weiße Zahl 13px JetBrains Mono Bold, Glow-Shadow.
2. **Color/Class-Header**: Color-Dot + Farb-Label (links), Klassen-Icon (rechts) — alles 14px hoch
3. **Art-Well**: Diagonales Stripe-Pattern in Karten-Farbe + Radial-Gradient + Klassen-Icon zentral (55% der Art-Höhe). Eckpunkte: kleine `◆`-Runen in Karten-Farbe.
4. **Name**: Cinzel zentriert
5. **Stat-Row** (push-to-bottom): DMG-Icon + Zahl in rot, HP-Icon + Zahl in grün, in einem `--bg-2`-Cell mit Border
6. **Klassen-Label** ganz unten: JetBrains Mono, uppercase, letter-spacing 0.22em, color `--ink-mute`

### 4.7 RoomTile (Welt-Karte-Knoten)
Kreisförmig, Größen je nach Typ:

| Typ | Durchmesser | Glyph-Größe |
|-----|-------------|-------------|
| `start` | 76px | 38px |
| `normal` | 80px | 40px |
| `perk` | 80px | 40px |
| `shop` | 80px | 40px |
| `treasure` | 80px | 40px |
| `hard` | 84px | 42px |
| `mini` (Mini-Boss) | 92px | 46px |
| `boss` | 108px | 54px |

**Aufbau:**
1. **Outer Ring**: Radial-Gradient (typ-Tonfarbe → `#1f180f`), 2px Border (Typ-Farbe wenn current, `--ink-mute` wenn visited, sonst `#8b6f47`)
2. **Inner Ring**: 5px Inset, 1px Border, opacity 0.65
3. **Glyph**: zentriert, Outline-Icon in Typ-Farbe (siehe `RoomGlyph` in icons.jsx)
4. **Visited-Check**: kleiner grüner Kreis mit `✓` unten-rechts wenn visited
5. **Sub-Room-Badge** (top): `[Typ-Initial] · [Sub-Count]` in Pill, 9px Mono — nur für nicht-Boss/start
6. **Label unter Tile**: 11px Cinzel uppercase letter-spacing 0.18em
7. **„DU BIST HIER"** unter aktuellem Knoten (9px Mono, Typ-Farbe)

**Edge (Verbindung zw. zwei Räumen):**
- SVG-Path, kubische Bézier-Kurve (horizontal-ausgerichtet)
- Aktiv: stroke `--gold`, solid, 1.6px, opacity 1
- Inaktiv: stroke `--line-hi`, dasharray `3 4`, 1.2px, opacity 0.55

### 4.8 Room-Type-Definitionen (single source of truth)

| Key | Label | Glyph | Color | Tone |
|-----|-------|-------|-------|------|
| `start` | Start | start (Fahne) | `#e0c878` | `#3d3225` |
| `normal` | Kampf | normal (Schwert) | `#e8dcc4` | `#3d3225` |
| `perk` | Zauber | perk (Zauberstab) | `#c89fdc` | `#3a2c3d` |
| `shop` | Shop | shop (Münz-Stapel) | `#7fc88a` | `#2b3a26` |
| `treasure` | Schatz | treasure (Geldbeutel) | `#f0c878` | `#3d3024` |
| `hard` | Schwer | hard (gekreuzte Schwerter) | `#e8856e` | `#3d251c` |
| `mini` | Zwischenboss | mini (Schädel) | `#c8b8a8` | `#322a22` |
| `boss` | Endboss | boss (Schädel + Crossbones) | `#f0c878` | `#3d1c14` |

---

## 5. Per-Screen-Spezifikationen

### 5.1 Main Menu ([screens/menu.jsx](../design/project/screens/menu.jsx))

Layout: Vollflächig zentriert, Flex-Column mit `gap: 64px`.

**Decorative SVG (Background):**
- Radial-Gradient-Glow oben (`#d6a955` 18% opacity → transparent)
- 4 Ecken-Klammern aus Gold-Linien (40px lang, 1px stroke, opacity 0.4)
- 2 vertikale Rune-Linien links/rechts (`x=100` und `x=1180`), vertikaler Gradient durch Gold

**Vertikale Anordnung im Zentrum:**

1. **Version-Strip** (oben, abs -220px über Logo):
   - Horizontaler 60px Gradient-Strich (transparent → gold)
   - Text „v 0.1 · Pre-Alpha" (cm-label, color `--gold`)
   - Horizontaler 60px Gradient-Strich (gold → transparent)

2. **Logo-Block**:
   - **5-Color-Crest**: 5 nebeneinander liegende 14×14px Chips, eine pro Karten-Farbe (Reihenfolge: natur, krieg, stein, untot, farblos), gap 6px
   - **Titel „Chromatic"**: 96px Cinzel 600, color `--ink`, text-shadow `0 0 40px rgba(214,169,85,.3)`, lineHeight 1
   - **Subtitel**: 80px Linie links + Text „EIN ROGUELITE DES MAGIERATS" (Cinzel 11px, letter-spacing 0.4em, color `--ink-dim`) + 80px Linie rechts

3. **Menü** (width 280px, gap 2px):
   - 4 Buttons untereinander
   - „Spielen" ist `primary` mit gradient-bg `#2c2218` → `#1a130c`, Top+Bottom-Border in `--gold-deep`, color `--gold-hi`, mit Play-Pfeil-Icon (14×14 SVG) rechts
   - „Optionen", „Credits", „Beenden": transparent, Top+Bottom-Border in `--line`, color `--ink-dim`
   - Padding 16px 24px, Cinzel 16px, letter-spacing 0.28em, uppercase

4. **Footer**:
   - JetBrains Mono 10px, color `--ink-mute`, letter-spacing 0.2em, uppercase
   - „↑↓ AUSWÄHLEN" · „↵ BESTÄTIGEN" · „ESC ZURÜCK"

### 5.2 World Map ([screens/world-map.jsx](../design/project/screens/world-map.jsx))

- **HUD**: Standard cm-hud mit „Akt 01 · WELT-KARTE" links, HP-Pill+Coin rechts
- **Map Area**: Abs `inset: 96px 56px 56px 56px`
- **Hintergrund**: SVG-Grid-Pattern (40×40px, opacity 5%)
- **Edges**: kubische Bézier-Kurven (horizontal-orientiert), aktive Pfade gold solid, sonst gestrichelt
- **Räume**: positionierte `RoomTile`-Instanzen
- **Bottom-Rail**: „PFAD" Label + horizontale Linie + „[N] Räume · Endboss"

### 5.3 Room Map (Sub-Knoten-Graph) ([screens/room-map.jsx](../design/project/screens/room-map.jsx))

- Identische Struktur zur World Map
- Kleinere Knoten (default `size = 64`)
- Hintergrund: Dot-Grid (32×32px Pattern mit Kreis)
- Edges: gerade Linien, dashed `4 5` wenn untraversed
- Bottom-Rail: Legende der Knoten-Typen (Glyph + Label) links, „[X] / [Y] besucht" rechts

### 5.4 Dungeon Map (Top-Down-Floor-View) ([screens/dungeon-map.jsx](../design/project/screens/dungeon-map.jsx))

Alternative zur Room Map: zeigt Räume als **steingewände Kammern mit Korridoren**.

- Wand-Pattern: dunkler Stein (`#1a1109`) mit horizontalen Highlights
- Floor-Pattern: heller Stein (`#a89378`) mit unregelmäßigen Tile-Variationen
- Corridor-Breite: 60px, Wall-Dicke: 16px
- Türrahmen: schwarze Strips an Korridor-Enden
- Aktueller Raum: Pulsing Goldring außen + Gold-Disc-Marker mit „DU"-Text

### 5.5 Combat ([screens/combat.jsx](../design/project/screens/combat.jsx))

**Auflösung:** 1920×1080 (höher als andere Screens — als „Vollbild" gedacht).

**Hintergrund-Layers (von hinten nach vorn):**
1. Linear-Gradient `#4a3a26` → `#5a3f24` (30%) → `#3a2818`
2. Radial-Gradient-Lichthof oben + lila Akzent in der Mitte
3. **Wolken** (SVG, top 40, opacity 0.5) — 2 dünne Wellen-Pfade
4. **Ferne Berge** (SVG, top 130, opacity 0.6, gradient `#4a3520` → `#2a1f14`)
5. **Mittlere Berge** (SVG, top 220, opacity 0.85, gradient `#3a2a18` → `#1f1610`)
6. **Horizontlinie** (top 420, 2px, horizontal-gold-gradient)
7. **Atmosphäre** (top 420 → bottom 360, dunkler Verlauf)
8. **Vordergrund-Baumsilhouetten** (top 660, opacity 0.6) — 9 Pixel-Dreiecks-Bäume
9. **GRASS-Strip** (top 718, 14px) — grüner Gradient + Pixel-Gräser-SVG
10. **DIRT-Strip** (top 732 → bottom 270) — dunkler Erd-Gradient mit Specks

**HUD-Top (top 24, abs):**
- **Linke Base-HP**:
  - Castle-Icon 18px in `--c-natur`
  - Label „FREUNDLICHE BASE" (cm-label, color `--c-natur`)
  - Zahlen rechts: „HP" `--c-natur` + „/ MAX" opacity 0.4
  - HP-Bar: 14px hoch, bg `#0f0a06`, Border `--line-hi`, gradient `#7ebd7e` → `#4a8a4a`, mit 30px-Repeating-Stripes als Skala
- **Zentraler Timer**:
  - Label „ECHTZEIT-COMBAT" (cm-label)
  - Timer-Box „00:00" mit `--gold-hi` Text auf surface-Gradient, JetBrains Mono 18px
  - Unten: Cog-Icon + „ESC PAUSE · TAB DECK"
- **Rechte Base-HP**: Spiegelbildlich, color `--c-krieg`, gradient `#d96b53` → `#8a3d2c`

**EXP-Rail** (top 100, zentriert, width 280):
- „STUFE · EXP" Label + „— / —" rechts
- 5px Bar in `--gold`

**Bases (zwei spiegelbildliche SVG-Burgen):**
- Position: left/right 70px, bottom 362px, 160×260px
- Detaillierte SVG mit Zinnen, Toren, Fensterschießscharten, Türmen, Wappen-Flagge oben in Seitenfarbe
- Rechte Base ist `transform: scaleX(-1)` (gespiegelt)

**Battlefield-Zone**:
- Mittlerer Bereich (left 260, right 260, top 460, height 260)
- Im MVP-Design ein Platzhalter mit gestrichenem Border und „SCHLACHTFELD"-Label

**Bottom Hand Panel** (height 270, abs bottom 0):
- Background linear-gradient (transparent → `#0f0c08`), Top-Border `--line-hi`
- Grid: `380px 1fr 380px` mit Gap 24px, Padding 22px 32px

  **Links — Mana**:
  - Drop-Icon + „MANA" Label + Zahl rechts (22px JetBrains Mono Bold)
  - Mana-Bar 18px hoch, dunkler bg, gradient `#6ab1e8` → `#2a5a8c`, 19 vertikale 1px-Trennlinien als Skala-Ticks (20 Mana-Einheiten)
  - Unten: Spark-Icon + „+1 MANA / SEK." links, „AUTO-DRAW 04S" rechts

  **Mitte — Hand-Slots**:
  - 3 Hand-Karten + 1 Draw-Slot (Platzhalter)
  - Jede Karte um `±2°` rotiert (i-2)*2deg für leichten Fächer
  - Slot-Dimensionen: 150×218 (md)
  - Slot-Border: gestrichelt `rgba(240,200,120,.55)` (normal) oder `rgba(200,85,61,.5)` (locked = Mana zu wenig)
  - Mana-Cost-Bubble top-left -8/-8 offset
  - Draw-Slot zeigt Sparkle-Icon + „NACHZIEHEN" + Countdown „02s"

  **Rechts — Deck/Field/Log**:
  - Oben: 2 nebeneinander Cell-Boxen: „DECK" (Anzahl + „Karten · Random-Pool"), „AUF DEM FELD" (Anzahl + „Units · Combos")
  - Unten: Event-Log (74px hoch) mit Bullet-Indikator und „EVENT-LOG · SPAWN / KILL / COMBO"

### 5.6 Shop ([screens/shop.jsx](../design/project/screens/shop.jsx))

- HUD: „AKT 01 · MARKT" + „KRÄMERIN VEY"
- Body Grid `1fr 380px` mit Gap 32px:
  - **Links — Karten-Area**:
    - Header mit cm-label „ANGEBOT · WECHSELT PRO RAUM" und cm-title „Karten zum Verkauf"
    - Grid `repeat(6, 1fr)` mit Gap 14px — 6 UnitCards (size `md`)
    - Unter jeder Karte: Price-Tag (Coin-Icon + Zahl)
    - Selected-Karte: Gold-Border + Gold-Glow + Gold-Gradient-Pricetag
    - **Buy-Bar** unten: linke Spalte „AUSGEWÄHLT" + Name, rechte Spalte 2 Buttons (Ghost „Verlassen" + Gold „Kaufen · [Preis]")
  - **Rechts — Info-Panel**:
    - Header: „KARTEN-DETAIL" + Color-Chip+Name rechts
    - Card-Display-Name (cm-display 28px)
    - Klassen-Zeile (cm-label)
    - 3 Stat-Boxen nebeneinander: Mana / Damage / HP
    - „◆ PASSIV" Section: Beschreibung
    - „⧗ COMBO-BONUS" Section: Beschreibung
    - Synergie-Footer: Color-Chip + „[N] weitere [Farbe]-Karten im Deck"

**Shop-Karten-Daten** (handgemachte Defaults aus [shop.jsx](../design/project/screens/shop.jsx) — Felder: `id, name, color, cls, mana, dmg, hp, price, ability, combo`).

### 5.7 Perk Room ([screens/perk.jsx](../design/project/screens/perk.jsx))

- HUD: „AKT 01 · ZAUBER-RAUM" + „HEILIGTUM DER WAHL"
- **Dekorativer Hintergrund**: 680×680 Ritual-Kreis im Zentrum (3 konzentrische Kreise + Pentagramm + 5 Radien, alle Gold opacity 0.18)
- Body Grid `1fr 380px`:
  - **Links — Perk-Pedestale** (4 Perks):
    - Grid `repeat(4, 1fr)` mit Gap 16px, Align-Items: end
    - Pro Pedestal:
      - **Perk-Card** (aspectRatio 3/4): Background-Gradient, Border in Perk-Farbe wenn selected (sonst `--line-hi`)
      - 4 Ecken-Markierungen in Perk-Farbe (8×8px L-shapes)
      - Icon-Halo: 90×90px Kreis mit Radial-Gradient in Perk-Farbe + 44px Icon
      - Tag-Label, Name (Cinzel 15px), Beschreibungs-Text
      - Selected: translate-Y -12px (lifted)
      - Sockel: 86% Breite × 24px, dunkler Gradient
      - Glow-Linie unter Sockel
  - **Rechts — Info-Panel**:
    - „PERK-INFO" Header + Icon+Tag rechts
    - Display-Name (cm-display 24px)
    - Highlight-Box mit Icon + Beschreibung
    - „WIRKUNG" Detail-Text
    - „AKTIVE PERKS ([N])" Footer-Liste mit Icon, Text, Akt-Tag pro Perk

**4 Perk-Definitionen** sind in [perk.jsx](../design/project/screens/perk.jsx) hartkodiert (Beispiele: „Quell des Geistes" — +20 Max-Mana, „Adern der Welt" — +2× Regen, „Eiserne Bindung" — +20 Base-HP, „Vier-Karten-Hand" — +1 Hand-Karte).

### 5.8 Reward Picker ([screens/reward-picker.jsx](../design/project/screens/reward-picker.jsx))

Erscheint nach Combat — 3-Slot-Belohnungs-Picker auf dunklem lila Panel.

- HUD: „FLOOR [N] / 20 · BELOHNUNG" + „WÄHLE EINEN PFAD"
- **Dekorative Ketten** oben (4 vertikale Kettenstränge aus SVG-Ellipsen)
- **Hauptpanel** (top 140, left 100, right 100, bottom 80):
  - Background linear-gradient `#4a3a6e` → `#2f235a` (lila Akzent — unterscheidet sich vom warmen Standard)
  - 2px dunkler Border, border-radius 14px
  - Speckle-Textur-Overlay
  - Header: „BELOHNUNG · EINE AUSWAHL" + cm-title „DREI PFADE" + „3 OPTIONEN · 1 WAHL"
  - Grid `150px 1fr`:
    - **Linke Rail**: Ghost-Button „Überspringen" + Standard-Button „Neuwurf" (mit Reroll-Icon + Coin-Cost 4)
    - **3 Slot-Karten** (270×400px) — Platzhalter mit Slot-Index, Ecken-Markern, Orb, Linien, „KARTE / PERK / RARE"-Kicker
  - Footer: „AUSWAHL WIRKT SOFORT" + Gold-Button „Belohnung nehmen"
- **Rechte Seiten-Tabs** (3 vertikale Toggle-Buttons): Deck / Inv. / Perks — der aktive (z. B. „Perks") in Gold

### 5.9 UI-Placeholder (`UIPlaceholder` aus icons.jsx)

Universeller „hier kommt zur Laufzeit Inhalt rein"-Marker:
- Dashed-Border in Akzent-Farbe (default Gold rgba(214,169,85,.7))
- Diagonale Stripe-Pattern Background
- Kicker (uppercase Mono), Label (uppercase Mono größer), Hint (IBM Plex Sans)
- Optional Icon

Verwendet für: Schlachtfeld-Zone in Combat, Hand-Slot-Placeholder, Reward-Slot.

---

## 6. Icon-System

### 6.1 `Icon` — kleine UI-Icons (24×24 Viewbox)

Alle als Outline mit `strokeLinecap="round"`, `strokeLinejoin="round"`. Standard stroke 1.6px, Color `currentColor`.

**Verfügbare Namen** (aus [icons.jsx:13](../design/project/screens/icons.jsx)):
`coin`, `skull`, `crown`, `sword`, `swords`, `shield`, `chest`, `potion`, `sparkle`, `flame`, `spark`, `tree`, `horse`, `wand`, `cross`, `lock`, `spawn`, `flag`, `boss`, `castle`, `heart`, `drop`, `play`, `cog`, `x`, `exit`, `moneybag`, `coins`, `menu`, `backpack`, `dice`, `reroll`

**Klassen-Icons (für UnitCard):**
| Klasse | Icon |
|--------|------|
| Krieger | `sword` |
| Festung | `shield` |
| Reittier | `horse` |
| Magier | `wand` |
| Heiler | `heart` |

### 6.2 `RoomGlyph` — große Map-Pictogramme

Größere Outline-Pictogramme für Welt-/Raum-Karten-Knoten:
- `start` — Fahne mit Wimpel
- `normal` — einzelnes Schwert
- `hard` — gekreuzte Schwerter
- `treasure` — Geldbeutel mit $
- `shop` — Münzstapel
- `perk` — Zauberstab mit Funken
- `mini` — sauberer Schädel (Zwischenboss)
- `boss` — Schädel mit gekreuzten Knochen darunter

---

## 7. Implementierungs-Hinweise für Phaser

Der Design-Prototyp ist React/HTML/CSS. Unser Stack ist Phaser 3. Die folgenden Regeln gelten:

### 7.1 Design-Tokens spiegeln
Lege `src/systems/data/designTokens.ts` an, das **alle** Werte aus Sektion 2 als TypeScript-Konstanten exportiert:
```ts
export const COLORS = {
  bg: 0x2a2219,        // Phaser nutzt Hex-Zahlen
  surface: 0x3d3225,
  ink: 0xfbf3dc,
  gold: 0xd6a955,
  goldHi: 0xf0c878,
  cNatur: 0x6aa56a,
  cKrieg: 0xc8553d,
  // ...
} as const;
export const COLORS_CSS = {
  bg: '#2a2219',       // String-Form für Text-Styles
  // ...
} as const;
export const FONTS = {
  display: '"Cinzel", serif',
  body: '"IBM Plex Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const;
```
Regel: **keine Magic-Color-Strings im Scene-Code** — immer aus `designTokens.ts`.

### 7.2 Font-Loading
- `index.html` lädt Google-Fonts via `<link>` (siehe Sektion 3)
- Phaser-Scenes nutzen `fontFamily: FONTS.display` etc.
- Optional: `document.fonts.ready` in `main.ts` `await`-en bevor `new Phaser.Game(config)` läuft, damit Text nicht erst in Default-Font flackert

### 7.3 UI-Komponenten als Phaser-Klassen
Lege in `src/ui/` wieder­verwendbare Builder-Klassen an:
- `Hud.ts` — kompletter Top-HUD (Exit, Akt-Block, HP-Pill, Coin)
- `HpPill.ts`, `CoinBadge.ts` — atomare HUD-Elemente
- `Button.ts` — Standard / Gold / Ghost Varianten
- `UnitCard.ts` — Größen sm/md/lg, mit Mana-Bubble, Stat-Row
- `RoomTile.ts` — kreisförmiger Welt-Karten-Knoten mit Glow
- `RoomGlyph.ts` — gibt das richtige Phaser-Texture/Geometry-Objekt für einen Glyph-Typ zurück
- `ScreenFrame.ts` — Helper der Background-Gradient + Vignette + Grain auf eine Szene legt

### 7.4 Renderer-Wahl
- `Phaser.AUTO` (WebGL bevorzugt, Canvas-Fallback) für Production
- Manche FX (Inset-Shadows, CSS-Filter) gibt es in Phaser nicht 1:1 — entweder:
  - approximieren mit `RadialGradient`-Sprites
  - oder als statisches PNG/SVG-Overlay generieren

### 7.5 SVG-Rendering
Viele Design-Elemente sind SVG (Berge, Wolken, Bases, Glyphs, Ritual-Kreis). Optionen:
1. **Per Phaser Graphics-API neu zeichnen** (volle Kontrolle, mehr Aufwand)
2. **SVG-Pfade als Texture preloaden** (`scene.load.svg()`) — einfacher, aber statisch
3. **Vektor-Pfade aus Design-Code adaptieren** für komplexe Shapes wie Burgen

Faustregel: dekorative Hintergründe (Berge, Wolken, Burgen) als preloaded SVG, interaktive/animierte Elemente (Glyphs in Tiles, Combo-Auras) per Graphics-API.

### 7.6 Layout-Auflösung
Design-Mocks gehen mal von 1280×800, mal von 1920×1080 aus. Phaser-Game-Config: **1280×720** als Basis (siehe `src/main.ts`), mit `Phaser.Scale.FIT` für Skalierung.
Combat-Layout dürfte aber höhere Auflösung wirklich brauchen — entweder responsive Layout schreiben oder Combat-Scene auf größere View-Box laufen lassen.

---

## 8. Was nicht im Design steht

Der Design-Prototyp ist **statisch** — folgende Aspekte sind nicht visualisiert und müssen aus [GAME_DESIGN.md](../GAME_DESIGN.md) abgeleitet werden:
- Animations-Timing (Tweens, Combo-Bogen-Anims, Damage-Numbers-Flug)
- Sound-Design
- Echte Sprite-Animationen der Units (Spawn, Walk, Attack, Death)
- Partikel-Effekte
- Hover/Click-Mikrointeraktionen über Standard-Hover hinaus
- Loading-/Splash-Screen

Diese Layer kommen in [Phase 7](mvp/PHASE_7_POLISH.md) und [R5](roadmap/R5_PRAESENTATION.md) drauf.

---

## 9. Anwendung in den Phasen

Ab Phase 2 implementiert jede Phase die jeweils relevanten Screens aus dieser Referenz:

| Phase | Screens aus Design |
|-------|--------------------|
| Phase 1 (bereits done) | Menu (Minimal-Variante) + leere WorldMap als Placeholder |
| Phase 1.5 (optional) | Menu auf volle Design-Specs upgraden |
| Phase 2 (Combat-Sandbox) | Combat (komplette HUD-Chrome, Bases, Hand-Slots, Mana-Bar) |
| Phase 3 (Run-Schale) | World Map (RoomTiles, Edges), GameOver/Victory-Screens |
| Phase 4 (Deck-Wachstum) | Shop, RewardPicker, Treasure-Variante |
| Phase 5 (Sub-Maps) | RoomMap **oder** DungeonMap (Entscheidung treffen) |
| Phase 6 (Perks) | Perk-Room mit Pedestalen |
| Phase 7 (Polish) | Animations-Polish, FX die der Design-Prototyp nicht zeigt |

**Regel:** Vor Implementierungsbeginn eines neuen Screens immer die zugehörige `.jsx`-Datei im `design/`-Ordner zur Hand nehmen und gegen diese Referenz cross-checken.
