// Coin-Anzeige (HUD) — nutzt die Assets aus src/assets/ui/:
//   coin-frame.png → ornamentale Plakette als HUD-Rahmen
//   coin.png       → einzelner Coin als Icon
//
// Die Quell-PNGs haben einen OPAKEN WEISSEN Hintergrund (keine echte
// Transparenz). Wir entfernen ihn zur Laufzeit per Canvas mit einem
// Flood-Fill vom Bildrand: nur der zusammenhängende helle Hintergrund wird
// transparent, helle Gold-Glanzlichter IM Motiv bleiben erhalten.
// Fehlt eine Datei, greift ein Fallback (SVG-Pille) — kein Bruch.

const coinAssets = import.meta.glob('../assets/ui/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const assetUrl = (name: string): string | undefined => coinAssets[`../assets/ui/${name}`];

const rawFrameUrl = (): string | undefined => assetUrl('coin-frame.png');
const rawIconUrl = (): string | undefined => assetUrl('coin.png');

// Pixel gilt als "Hintergrund-Weiß", wenn sein dunkelster Kanal noch hell ist
// (weiß/grau-weißlich). Gesättigtes Gold hat einen niedrigen Min-Kanal → bleibt.
const WHITE_MIN_CHANNEL = 224;

const processedCache = new Map<string, string>();
const inFlight = new Map<string, Promise<string>>();

/** Entfernt den vom Rand zusammenhängenden weißen Hintergrund (Flood-Fill). */
const stripBackground = (origUrl: string): Promise<string> => {
  const existing = inFlight.get(origUrl);
  if (existing) return existing;
  const p = new Promise<string>((resolve) => {
    if (typeof document === 'undefined') {
      resolve(origUrl);
      return;
    }
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
        resolve(origUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, W, H);
      const px = data.data;

      const isWhite = (idx: number): boolean =>
        Math.min(px[idx]!, px[idx + 1]!, px[idx + 2]!) >= WHITE_MIN_CHANNEL;

      // Flood-Fill (Stack) von allen Rand-Pixeln aus über weiße Nachbarn.
      const visited = new Uint8Array(W * H);
      const stack: number[] = [];
      const pushIfBorderWhite = (x: number, y: number): void => {
        const pi = y * W + x;
        if (!visited[pi] && isWhite(pi * 4)) {
          visited[pi] = 1;
          stack.push(pi);
        }
      };
      for (let x = 0; x < W; x++) {
        pushIfBorderWhite(x, 0);
        pushIfBorderWhite(x, H - 1);
      }
      for (let y = 0; y < H; y++) {
        pushIfBorderWhite(0, y);
        pushIfBorderWhite(W - 1, y);
      }
      while (stack.length > 0) {
        const pi = stack.pop()!;
        px[pi * 4 + 3] = 0; // transparent
        const x = pi % W;
        const y = (pi / W) | 0;
        if (x > 0) pushIfBorderWhite(x - 1, y);
        if (x < W - 1) pushIfBorderWhite(x + 1, y);
        if (y > 0) pushIfBorderWhite(x, y - 1);
        if (y < H - 1) pushIfBorderWhite(x, y + 1);
      }

      ctx.putImageData(data, 0, 0);
      try {
        const url = canvas.toDataURL('image/png');
        processedCache.set(origUrl, url);
        resolve(url);
      } catch {
        resolve(origUrl);
      }
    };
    img.onerror = () => resolve(origUrl);
    img.src = origUrl;
  });
  inFlight.set(origUrl, p);
  return p;
};

// Verarbeitung beim Modul-Load anstoßen — bis der HUD-Coin zum ersten Mal
// gebraucht wird (Welt-Karte, nach Menü+Boss-Auswahl), ist sie längst fertig.
for (const u of [rawFrameUrl(), rawIconUrl()]) if (u) void stripBackground(u);

/** Verarbeitete (transparente) URL falls schon fertig, sonst Original. */
const ready = (u?: string): string | undefined =>
  u ? (processedCache.get(u) ?? u) : undefined;

export const coinFrameUrl = (): string | undefined => ready(rawFrameUrl());
export const coinIconUrl = (): string | undefined => ready(rawIconUrl());

const SVG_COIN = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--gold-hi)" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg>`;

/** Münz-Icon: transparentes `coin.png` falls vorhanden, sonst SVG-Fallback. */
export const coinIconHtml = (sizePx = 16): string => {
  const u = coinIconUrl();
  return u
    ? `<img src="${u}" alt="" draggable="false" style="width:${sizePx}px; height:${sizePx}px; object-fit:contain; display:block;" />`
    : SVG_COIN;
};

/**
 * HUD-Coin-Anzeige. Mit Plakette (`coin-frame.png`) als Rahmen — das Coin-
 * Medaillon ist links ins Bild eingebacken, die Zahl steht rechts im braunen
 * Feld. Ohne Asset: bisherige `.cm-coin`-Pille (Icon + Zahl).
 */
export const coinHudHtml = (value: number | string, live = true): string => {
  const slot = live ? ' data-slot="coins"' : '';
  const frame = coinFrameUrl();
  if (frame) {
    return `<div class="cm-coin-plaque" style="background-image:url(${frame});">
      <span class="cm-coin-val"${slot}>${value}</span>
    </div>`;
  }
  return `<div class="cm-coin">${coinIconHtml(16)}<span class="cm-coin-val"${slot}>${value}</span></div>`;
};
