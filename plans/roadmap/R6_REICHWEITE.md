# R6 — Reichweite

**Dauer:** offen · **Priorität:** niedrig (Release-Phase, nicht Entwicklung)

## Ziel

Das Spiel aus dem Browser raus und auf etablierte Plattformen bringen: Steam-Release, Mobile-Port, ggf. Mod-Support für Community-Content.

## 🎯 Definition of Done — Hauptziel (Gate) — **1.0 Release**

> **Spiel ist auf mindestens 2 Plattformen verfügbar (Web + Steam ODER Web + Mobile). Saves syncen über Cloud (sofern Steam). UI funktioniert auf Touch-Geräten. Lokalisierung DE+EN umgesetzt. Spiel ist veröffentlicht.**

Diese Phase gilt **erst dann als abgeschlossen**, wenn dieses Hauptziel **bug-frei** implementiert ist. Konkret:

- Tauri-Builds für Windows/macOS/Linux erfolgreich, alle starten ohne Crash
- Steam-Build im Test-Branch installierbar, Achievements lösen aus, Cloud-Save funktioniert
- (falls Mobile) Build läuft auf realem iPhone + Android-Phone, Touch-Steuerung ohne Hover-Bugs
- Alle UI-Texte über i18n-System abrufbar, DE und EN vollständig übersetzt
- Lokalisierungs-Wechsel zur Laufzeit funktioniert
- (falls Mods) ein Test-Mod ergänzt eine Karte, erscheint im Pool, kein Crash
- Keine offenen Release-Blocker-Bugs
- Alle Dependency-Lizenzen geprüft und in Credits dokumentiert
- DSGVO-Hinweis (falls Telemetrie) korrekt platziert
- Git-Tag `v1.0.0` gesetzt, Release-Notes geschrieben

**🚧 Solange diese Bedingungen nicht erfüllt sind, gilt der Release NICHT als ausgeliefert.** Im Zweifel lieber Release verschieben als mit kritischen Bugs launchen.

---

## Voraussetzungen

- R5 abgeschlossen (Spiel sieht und klingt verkaufbar)
- Mindestens 20 Stunden Playtest-Feedback aus Browser-Version
- Entscheidung: kommerzieller Release oder Free-to-Play?

---

## Schritt-für-Schritt-Anleitung

### 1. Steam-Release-Vorbereitung (2–4 Wochen)
- [ ] **Wrapper-Wahl:** Tauri (leichtgewichtig, Rust-basiert) ODER Electron (etabliert, schwerer)
  - Empfehlung: **Tauri** — kleinerer Footprint, bessere Performance
- [ ] Build-Konfiguration: `pnpm build` → `dist/` → Tauri-Build → Windows-Installer + macOS-DMG + Linux-AppImage
- [ ] **Steamworks-Integration:**
  - Steamworks SDK einbinden (über `steamworks.js` oder Tauri-Plugin)
  - Cloud-Saves (Meta + Run-Save in Steam-Cloud spiegeln)
  - Steam-Achievements (parallel zu internen Achievements)
- [ ] **Steam-Store-Page:**
  - Capsule-Bilder (drei Größen)
  - 5+ Screenshots
  - 1 Trailer (60–90 Sek.)
  - Beschreibung mit Features-Bullets
- [ ] **Steam-Tags:** Roguelite, Deckbuilder, Strategy, Indie, Real-Time
- [ ] **Preisgestaltung** + Release-Datum
- [ ] Early-Access-Strategie überlegen: separat oder direkt 1.0?

### 2. Mobile-Port (3–4 Wochen)
- [ ] **Wrapper-Wahl:** Capacitor (Web → Native) ODER PWA (vereinfachter Ansatz)
  - Für Steam-Equivalent: Capacitor → iOS App Store + Google Play
  - Für schnellen Start: PWA reicht, kein Store-Submission
- [ ] **Touch-Steuerung:**
  - Karten in der Hand größer machen für Finger-Tap
  - Mauseingabe-Code generalisieren (`pointer`-Events statt `mouse`-Events)
  - Hover-Funktionen alternativ über Long-Press
- [ ] **UI-Skalierung:**
  - Portrait/Landscape umschaltbar
  - Reactive Layout für unterschiedliche Bildschirm-Größen
- [ ] **Performance auf Low-End-Phones** testen, Partikel-Effekte ggf. dimmen
- [ ] Store-Submissions (Apple-Review-Prozess kann Wochen dauern)

### 3. Mod-Support (2–3 Wochen, optional)
- [ ] **Datengetriebene Architektur** (sollte aus R2 bereits vorhanden sein):
  - Karten, Encounter, Perks, Status-Effekte als JSON
- [ ] **Mod-Loader**:
  - Mod-Ordner-Konvention (`~/Documents/Chromatic/mods/`)
  - JSON-Dateien werden beim Start gelesen, ergänzen/überschreiben Daten
- [ ] **Mod-Manifest** mit Name, Version, Autor
- [ ] **Mod-Manager-UI** im Hauptmenü (Liste, aktivieren/deaktivieren)
- [ ] Save-Trennung: Modded-Runs nicht mit Vanilla-Stats mischen
- [ ] **Dokumentation:** Mod-API-Doc, Beispiel-Mods

### 4. Lokalisierung (1–2 Wochen, optional)
- [ ] i18n-System (z. B. `i18next`)
- [ ] Alle UI-Texte aus Code extrahieren → `locales/de.json`, `locales/en.json`
- [ ] Mindestens DE + EN für Release
- [ ] Karten-/Perk-Beschreibungen sind oft beschreibungsreich — Translation-Aufwand realistisch einschätzen

### 5. Marketing-Vorlauf (vor Steam-Launch)
- [ ] Devlog auf YouTube / Steam-Community-Posts ab 3 Monate vor Release
- [ ] Demo-Build auf itch.io für Feedback und Sichtbarkeit
- [ ] Reddit-Posts in r/IndieDev, r/roguelites
- [ ] Influencer-Outreach (Letsplayer mit Roguelite-Fokus)

### 6. Telemetrie (optional, mit Opt-In)
- [ ] Anonymisierte Daten:
  - Welche Karten werden am häufigsten gespielt
  - Akt-Win-Rates
  - Average Run-Duration
- [ ] Backend: simpler Endpoint (Cloudflare Worker o. Ä.) der JSON-Events sammelt
- [ ] DSGVO-konformes Opt-In!

### 7. Commit + Tag
- [ ] `git commit -m "R6: steam + mobile + mods"`
- [ ] Tag `v1.0.0` (echtes Release!)

---

## End-Zustand

**Datei-Baum (neu):**
```
src-tauri/                         # Tauri-Wrapper-Code (oder src-electron/)
src-mobile/                        # Capacitor-Config
mods/                              # Beispiel-Mods
src/
├── systems/
│   ├── platform/
│   │   ├── PlatformAdapter.ts     # Web vs. Desktop vs. Mobile
│   │   ├── SteamIntegration.ts
│   │   └── CloudSave.ts
│   ├── mods/
│   │   └── ModLoader.ts
│   └── i18n/
│       └── locales/
│           ├── de.json
│           └── en.json
└── scenes/
    └── ModManagerScene.ts
```

**Sichtbares Verhalten:**
- Spiel verfügbar auf:
  - Browser (itch.io oder eigene Domain)
  - Steam (Windows, macOS, Linux)
  - App Store / Google Play (Mobile)
- Spieler kann Sprache wählen (DE/EN, später mehr)
- Steam-Cloud synchronisiert Saves zwischen Geräten
- Mod-Manager listet installierte Mods, lädt sie beim Spielstart
- Steam-Achievements zusätzlich zu internen Achievements

---

## Akzeptanz-Test

1. Tauri-Build laufen lassen → `.exe` / `.dmg` / `.AppImage` werden korrekt erzeugt
2. Steam-Build auf Test-Branch hochladen, mit Test-User installieren
3. Achievement auslösen → in Steam-Profil sichtbar
4. Mobile-Build auf echtem iPhone und Android-Phone testen
5. Touch-Steuerung funktional, kein Hover-Bug
6. Mod laden → modifizierte Karte erscheint im Pool
7. Lokalisierung wechseln → alle Texte ändern sich
8. Save Cloud-Sync: auf Steam-Deck spielen, auf PC weiter machen

---

## ✅ Freigabe-Checkliste — **1.0 Release**

- [ ] Hauptziel (oben) bug-frei erfüllt
- [ ] Akzeptanz-Test komplett grün durchgelaufen
- [ ] Tauri-Builds für alle 3 OS erfolgreich erzeugt
- [ ] Steam-Test-Branch validiert (Achievements, Cloud-Save)
- [ ] (falls Mobile) realer Test auf iPhone + Android
- [ ] i18n DE+EN vollständig, Sprache zur Laufzeit wechselbar
- [ ] Alle Dependency-Lizenzen geprüft, Credits aktuell
- [ ] `pnpm test` — alle Tests grün
- [ ] `pnpm lint` — keine Errors
- [ ] Browser-Console: 0 Errors, 0 Warnings
- [ ] Keine Release-Blocker-Bugs offen
- [ ] DSGVO-Hinweis bei Telemetrie korrekt
- [ ] Release-Notes geschrieben
- [ ] Git-Tag `v1.0.0` gesetzt

**Erst wenn ALLE Häkchen gesetzt sind, ist das Spiel ausgeliefert. Im Zweifel Release verschieben.**

---

## Offene Fragen / Risiken

- **Steam-Approval:** Steam akzeptiert nicht jedes Spiel sofort, Approval-Prozess einplanen
- **Mobile-UX:** Browser-PC-UI funktioniert nicht 1:1 auf Touch — eigene UX-Iteration unerlässlich
- **Mod-Sicherheit:** JSON-Mods sind harmlos, aber wenn Mods JavaScript ausführen könnten → Sandbox-Risiko. Aktuelle Empfehlung: nur Daten-Mods, keine Code-Mods
- **Kommerz-vs-Free-Modell:** Wenn freier Release: deutlich weniger Druck, aber auch weniger Budget für Marketing. Strategische Entscheidung vor Beginn dieser Phase
- **Lizenz aller Dependencies:** Alle MIT/Apache/CC-Lizenzen prüfen vor kommerziellem Release
