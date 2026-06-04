// Vite löst alle PNGs unter src/assets/backgrounds/ auf Build-Zeit zu gehashten
// URLs auf. Wir nutzen den Glob-Loader (eager), damit der Aufrufer einen
// Map-Lookup nach Datei-Name machen kann — analog zu CardView.
const backgroundFiles = import.meta.glob('../assets/backgrounds/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const urlByName = (name: string): string | undefined =>
  backgroundFiles[`../assets/backgrounds/${name}`];

/** Liefert die fertige `background-image: url(...)`-Property für einen Screen.
 *  Aufrufer setzt damit den Body/Container-Hintergrund. Bei unbekanntem Namen
 *  leerer String → Caller fallback. */
export const bgUrl = (name: string): string => {
  const u = urlByName(name);
  return u ? `url(${u})` : '';
};

/** Inline-Style für die `.cm-fit`-Hülle: setzt das Vollbild-Hintergrundbild über
 *  die CSS-Variable `--screen-bg`. Das Bild deckt damit den GANZEN Viewport
 *  (full-bleed, `cover`) statt nur die zentrierte 1280×800-Box — keine
 *  leeren Streifen links/rechts mehr. `cssUrl` ist das fertige `url(...)`
 *  (z.B. aus `bgUrl()`); leer → Default-Verlauf aus styles.css. */
export const fitBg = (cssUrl: string): string => (cssUrl ? `--screen-bg:${cssUrl};` : '');

/** Mapping Screen-Key → Bild-Datei-Name. Eine zentrale Stelle für alle Screens. */
export const BG: Record<string, string> = {
  menu: 'Main-Screen-Hintergrund.png',
  worldmap: 'Welt-Karte-Hintergrund.png',
  roommap: 'Raum-Karte-Hintergrund.png',
  shop: 'Shop-Raum-Hintergrund.png',
  treasure: 'Schatz-Raum-Hintergrund.png',
  perk: 'Zauber-Raum-Hintergrund.png',
  // Combat hat 4 Varianten — Caller wählt nach run.actNumber bzw. zufällig.
  combat1: 'Kampf-Raum-Hintergrund-1.png',
  combat2: 'Kampf-Raum-Hintergrund-2.png',
  combat3: 'Kampf-Raum-Hintergrund-3.png',
  combat4: 'Kampf-Raum-Hintergrund-4.png',
};

/** Combat-Hintergrund nach Akt: Akt 1 → 1, Akt 2 → 2, Akt 3 → 3.
 *  Sandbox / Boss-only-Encounter → Variante 4 als "Special". */
export const combatBgForAct = (actNumber: number, isBoss = false): string => {
  if (isBoss) return BG.combat4!;
  const key = `combat${Math.min(3, Math.max(1, actNumber))}` as keyof typeof BG;
  return BG[key]!;
};
