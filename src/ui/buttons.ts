import type { NodeType, SubNodeType } from '../domain/Run';

const buttonFiles = import.meta.glob('../assets/buttons/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const rawUrl = (name: string): string | undefined =>
  buttonFiles[`../assets/buttons/${name}`];

/** Cache: Original-URL → verarbeitete Data-URL (weißer Hintergrund ist transparent).
 *  Wird lazy beim ersten Aufruf gefüllt. */
const processedCache = new Map<string, string>();
/** In-flight Promises pro Original-URL — verhindert Doppel-Processing. */
const inFlight = new Map<string, Promise<string>>();

// Pixel sind "weißlich" (Hintergrund + heller Glow-Saum), wenn ihr DUNKELSTER
// Kanal noch hell ist — also hohe Helligkeit bei geringer Sättigung. Der
// goldene/rote Knopfrand ist gesättigt (niedriger Blau-Kanal) und bleibt damit
// erhalten. Diese Pixel werden transparent gemacht.
const WHITE_MIN_CHANNEL = 205;
// Pixel ab diesem Alpha zählen als "solider" Knopf-Inhalt (für Autocrop).
const SOLID_ALPHA = 128;

const processImage = (url: string): Promise<string> => {
  const existing = inFlight.get(url);
  if (existing) return existing;
  const p = new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(url);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, W, H);
      const px = data.data;

      // 1) Weißlichen Hintergrund + hellen Glow-Saum transparent machen.
      //    Kriterium: dunkelster Kanal ist immer noch hell (= weiß/grau-weißlich).
      //    Gesättigte Knopf-Pixel (Gold/Rot) haben einen niedrigen Min-Kanal
      //    und bleiben erhalten.
      for (let i = 0; i < px.length; i += 4) {
        const min = Math.min(px[i]!, px[i + 1]!, px[i + 2]!);
        if (min >= WHITE_MIN_CHANNEL) {
          px[i + 3] = 0;
        }
      }
      ctx.putImageData(data, 0, 0);

      // 2) Bounding-Box des soliden Knopf-Inhalts (Alpha > SOLID_ALPHA) finden.
      //    Der weiche Glow (niedriges Alpha) bleibt außen vor → alle Knöpfe
      //    werden auf ihren eigentlichen Körper normalisiert, unabhängig vom
      //    unterschiedlichen Glow-/Transparenz-Rand der Quell-PNGs.
      let minX = W;
      let minY = H;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (px[(y * W + x) * 4 + 3]! > SOLID_ALPHA) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      try {
        if (maxX < minX || maxY < minY) {
          // Kein solider Inhalt gefunden — unverändert zurückgeben.
          resolve(canvas.toDataURL('image/png'));
          processedCache.set(url, processedCache.get(url) ?? url);
          return;
        }
        // 3) Quadratisch + zentriert zuschneiden, minimaler Sicherheitsrand.
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const half = (Math.max(maxX - minX, maxY - minY) / 2) * 1.03;
        const sx = Math.max(0, Math.round(cx - half));
        const sy = Math.max(0, Math.round(cy - half));
        const size = Math.min(Math.round(half * 2), W - sx, H - sy);
        const out = document.createElement('canvas');
        out.width = size;
        out.height = size;
        const octx = out.getContext('2d')!;
        octx.drawImage(canvas, sx, sy, size, size, 0, 0, size, size);
        const dataUrl = out.toDataURL('image/png');
        processedCache.set(url, dataUrl);
        resolve(dataUrl);
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
  inFlight.set(url, p);
  return p;
};

/** Liefert die "saubere" URL synchron, falls schon verarbeitet — sonst die
 *  Original-URL als Fallback. Startet die Verarbeitung im Hintergrund.
 *  Über `onReady` erfährt der Caller, sobald die Data-URL bereit ist. */
const buttonUrl = (
  name: string,
  onReady?: (cleanUrl: string) => void,
): string | undefined => {
  const orig = rawUrl(name);
  if (!orig) return undefined;
  const cached = processedCache.get(orig);
  if (cached) return cached;
  void processImage(orig).then((u) => onReady?.(u));
  return orig;
};

const nodeNameMap: Record<NodeType, string> = {
  start: 'Start-Knopf.png',
  combat_normal: 'Kampf-Knopf.png',
  combat_hard: 'Schwer-Knopf.png',
  treasure: 'Schatz-Knopf.png',
  shop: 'Shop-Knopf.png',
  perk: 'Zauber-Knopf.png',
  // Elite = harter Kampf → nutzt vorerst das „Schwer"-Icon (rote Umrandung +
  // Größe + Label „ELITE" unterscheiden es). `Elite-Knopf.png` überschreibt es.
  elite: 'Schwer-Knopf.png',
  boss: 'Endboss-Knopf.png',
};

const subNameMap: Record<SubNodeType, string> = {
  spawn: 'Raum-Eintritt-Knopf.png',
  sub_combat: 'Raum-Kampf-Knopf.png',
  sub_treasure: 'Schatz-Knopf.png',
  mini_boss: 'Endboss-Knopf.png',
  exit: 'Raum-Ausgang-Knopf.png',
};

// Inaktive (nicht erreichbare) Varianten — entsättigt/ohne Glühen, signalisieren
// "nicht betretbar". Datei-Name = aktives Bild mit `-Inaktiv`-Suffix.
const inactiveName = (name: string): string => name.replace(/\.png$/, '-Inaktiv.png');

// Beim Modul-Load alle Knöpfe (aktiv + inaktiv) vorab verarbeiten, damit beim
// ersten WorldMap-/RoomMap-Render kein Original-PNG (mit weißem Hintergrund)
// gezeigt wird.
export const buttonsReady: Promise<void> = (async () => {
  const baseNames = new Set([...Object.values(nodeNameMap), ...Object.values(subNameMap)]);
  const allNames = new Set<string>();
  for (const n of baseNames) {
    allNames.add(n);
    allNames.add(inactiveName(n));
  }
  await Promise.all(
    [...allNames].map((name) => {
      const u = rawUrl(name);
      return u ? processImage(u) : Promise.resolve(u);
    }),
  );
})();

export const nodeButtonUrl = (
  type: NodeType,
  active = true,
  onReady?: (cleanUrl: string) => void,
): string | undefined => {
  const name = active ? nodeNameMap[type] : inactiveName(nodeNameMap[type]);
  return buttonUrl(name, onReady);
};

export const subButtonUrl = (
  type: SubNodeType,
  active = true,
  onReady?: (cleanUrl: string) => void,
): string | undefined => {
  const name = active ? subNameMap[type] : inactiveName(subNameMap[type]);
  return buttonUrl(name, onReady);
};
