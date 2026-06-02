# Asset-Credits

## Sound-Effekte

**Alle SFX sind prozedural mit der Web-Audio-API erzeugt.** Es wurden keine externen Audio-Dateien eingebunden — die Sounds entstehen zur Laufzeit aus OscillatorNode + GainNode-Envelopes in [`src/systems/audio.ts`](../systems/audio.ts).

Vorteil: keine Lizenz-Fragen, keine Asset-Downloads, kein Loading-Screen.
Nachteil: die Sounds klingen synthetisch (passend zum geometrischen Visual-Stil).

In Phase R5 (Präsentation) sollen prozedurale Sounds durch echte Samples ersetzt werden — dann kommen hier die Quellen + Lizenzen rein.

## Sprites / Grafiken

Bisher keine. Alle Visuals sind Canvas-2D-Primitives + CSS/SVG-Komponenten.

Design-Mockups unter [`design/project/`](../../design/project/) sind als Referenz vom Designer geliefert worden (Quelle: Claude-Design-Handoff-Bundle, intern).

## Fonts

Drei Google-Fonts via `<link>` in [index.html](../../index.html):

| Font | Verwendung | Lizenz |
|------|------------|--------|
| **Cinzel** | Display, Titel, Karten-Namen | [SIL Open Font License 1.1](https://fonts.google.com/specimen/Cinzel/license) |
| **IBM Plex Sans** | Body-Text, Beschreibungen | [SIL Open Font License 1.1](https://fonts.google.com/specimen/IBM+Plex+Sans/license) |
| **JetBrains Mono** | Zahlen, Labels | [SIL Open Font License 1.1](https://fonts.google.com/specimen/JetBrains+Mono/license) |

Alle drei sind frei nutzbar (auch kommerziell).
