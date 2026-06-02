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

const WHITE_THRESHOLD = 235;

const processImage = (url: string): Promise<string> => {
  const existing = inFlight.get(url);
  if (existing) return existing;
  const p = new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(url);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        if (
          px[i]! >= WHITE_THRESHOLD &&
          px[i + 1]! >= WHITE_THRESHOLD &&
          px[i + 2]! >= WHITE_THRESHOLD
        ) {
          px[i + 3] = 0;
        }
      }
      ctx.putImageData(data, 0, 0);
      try {
        const dataUrl = canvas.toDataURL('image/png');
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
  boss: 'Endboss-Knopf.png',
};

const subNameMap: Record<SubNodeType, string> = {
  spawn: 'Raum-Eintritt-Knopf.png',
  sub_combat: 'Raum-Kampf-Knopf.png',
  sub_treasure: 'Schatz-Knopf.png',
  mini_boss: 'Endboss-Knopf.png',
  exit: 'Raum-Ausgang-Knopf.png',
};

export const nodeButtonUrl = (
  type: NodeType,
  onReady?: (cleanUrl: string) => void,
): string | undefined => buttonUrl(nodeNameMap[type], onReady);

export const subButtonUrl = (
  type: SubNodeType,
  onReady?: (cleanUrl: string) => void,
): string | undefined => buttonUrl(subNameMap[type], onReady);
