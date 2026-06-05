import type { Card, CardClass, Color } from '../domain/Card';

// 25 einzelne Karten-Bilder aus design/project/cards (per Klasse × Farbe).
// Vite-Glob lädt alle als URLs ein und bundelt sie über den Build-Pipeline.
const cardImages = import.meta.glob('../assets/cards/card-r*-c*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export interface CardViewOptions {
  card: Card;
  affordable: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
  /** Truppenzahl-Badge (rundenbasiertes Combat) — groß auf der Karte. */
  troops?: number;
  /** Ausgewählt-Highlight (Pick-/Select-Phase). */
  selected?: boolean;
  /** Verdeckte Karten-Rückseite (die 5 zur Blind-Auswahl). */
  faceDown?: boolean;
  /** Optionale feste Breite in px — überschreibt das size-Preset (z.B. Galerie,
   *  die alle 25 Karten auf einen Bildschirm packt). Höhe folgt natürlich. */
  width?: number;
}

// Klassen-Reihe in den Datei-Namen: r1 = Krieger (Mana 7) ... r5 = Heiler (Mana 3).
const CLASS_ROW: Record<CardClass, number> = {
  krieger: 1,
  festung: 2,
  reittier: 3,
  magier: 4,
  heiler: 5,
};

// Farb-Spalte: c1 = Krieg ... c5 = Farblos.
const COLOR_COL: Record<Color, number> = {
  krieg: 1,
  natur: 2,
  stein: 3,
  untot: 4,
  farblos: 5,
};

const cardImageUrl = (card: Card): string | undefined => {
  const row = CLASS_ROW[card.class];
  const col = COLOR_COL[card.color];
  const key = `../assets/cards/card-r${row}-c${col}.png`;
  return cardImages[key];
};

/**
 * Karten-Ansicht.
 *
 * Jede Karte wird als eigene PNG-Datei aus src/assets/cards/ geladen
 * (Quelle: design/project/cards/card-r{class}-c{color}.png). Vite bundelt
 * die 25 Bilder im Build. Statische Karten-Inhalte (Mana, Name, Stats, Tags)
 * sind im jeweiligen PNG enthalten — die Daten in cards.ts spiegeln dieselben
 * Werte, damit Combat-Logik konsistent bleibt.
 */
export const renderCardView = (opts: CardViewOptions): HTMLElement => {
  const { card, affordable, size = 'md', troops, selected = false, faceDown = false } = opts;
  // Feste BOX (gleiche Größe für ALLE Karten) + `object-fit: contain`:
  // Die Quell-PNGs haben pro Klasse leicht unterschiedliche Seitenverhältnisse
  // (~0.56–0.65 w/h). `cover` schnitt breitere Karten seitlich ab; natürliche
  // Höhe machte Karten verschieden hoch. `contain` in einer einheitlichen Box
  // zeigt die VOLLE Karte (nichts beschnitten) und hält alle Karten GLEICH GROSS
  // — schmalere/breitere Karten bekommen einen kleinen, zentrierten Rand.
  const CARD_ASPECT_WH = 150 / 250; // Ziel-Seitenverhältnis der Box (~0.60)
  const w = opts.width ?? (size === 'md' ? 150 : 110);
  const dims = { w, h: Math.round(w / CARD_ASPECT_WH) };

  const url = cardImageUrl(card);
  const showImg = !faceDown && !!url;
  const back =
    'repeating-linear-gradient(45deg, #2a1d10, #2a1d10 8px, #34240f 8px, #34240f 16px)';

  const el = document.createElement('button');
  el.className = `cm-card cm-card-view${affordable ? '' : ' cm-card-view--locked'}${selected ? ' cm-card-view--selected' : ''}`;
  el.dataset.cardId = card.id;
  el.setAttribute('aria-label', faceDown ? 'Verdeckte Karte' : `${card.name}${troops !== undefined ? ` · ${troops} Truppen` : ''}`);
  const selRing = selected ? 'box-shadow: 0 0 0 3px var(--gold-hi), 0 8px 18px rgba(0,0,0,0.65);' : 'box-shadow: 0 4px 8px rgba(0,0,0,0.55);';
  el.style.cssText = `
    position: relative;
    width: ${dims.w}px;
    height: ${dims.h}px;
    padding: 0;
    border: 0;
    background: ${faceDown ? back : showImg ? 'transparent' : 'var(--surface)'};
    border-radius: 6px;
    overflow: hidden;
    line-height: 0;
    cursor: ${affordable ? 'pointer' : 'not-allowed'};
    opacity: ${affordable ? '1' : '0.5'};
    filter: ${affordable ? 'none' : 'grayscale(0.5)'};
    transform: ${selected ? 'translateY(-6px)' : 'translateY(0)'};
    transition: transform 120ms, filter 120ms, box-shadow 120ms;
    ${selRing}
  `;

  // Volles Kartenbild als <img>, `contain` → komplette Karte sichtbar, in einer
  // einheitlich großen Box zentriert (kein Beschnitt, gleiche Größe wie alle).
  if (showImg) {
    const img = document.createElement('img');
    img.src = url!;
    img.alt = card.name;
    img.draggable = false;
    img.style.cssText =
      'width:100%; height:100%; object-fit:contain; object-position:center; display:block; border-radius:6px;';
    el.appendChild(img);
  }

  // Verdeckte Rückseite: zentrales Glyph statt Karteninhalt.
  if (faceDown) {
    const q = document.createElement('div');
    q.textContent = '✶';
    q.style.cssText = `
      position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
      font-size:${size === 'md' ? 48 : 36}px; color: var(--gold); opacity:0.55;
    `;
    el.appendChild(q);
  }

  // Truppen-Badge (nur aufgedeckte Karten). Sitzt oben links und überdeckt die
  // ins PNG eingebrannte Mana-Zahl — Mana ist im rundenbasierten Combat nur noch
  // Platzhalter, die Truppenzahl ist die relevante Information.
  if (!faceDown && troops !== undefined) {
    const d = Math.round(dims.w * 0.27); // Durchmesser ~ deckt die Mana-Scheibe
    const badge = document.createElement('div');
    badge.textContent = `×${troops}`;
    badge.style.cssText = `
      position:absolute; top:${Math.round(dims.w * 0.045)}px; left:${Math.round(dims.w * 0.045)}px;
      width:${d}px; height:${d}px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-family:'JetBrains Mono', monospace; font-weight:700;
      font-size:${Math.round(d * 0.38)}px; line-height:1;
      color:#fff; background:rgba(10,7,4,0.92);
      border:2px solid var(--gold-hi);
      box-shadow:0 0 8px rgba(0,0,0,0.6), inset 0 0 6px rgba(214,169,85,0.25);
      letter-spacing:-0.02em; text-shadow:0 1px 2px #000;
    `;
    el.appendChild(badge);
  }

  if (opts.onClick && affordable) {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      opts.onClick!();
    });
    el.addEventListener('mouseenter', () => {
      if (!selected) el.style.transform = 'translateY(-3px)';
      el.style.filter = 'brightness(1.1)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = selected ? 'translateY(-6px)' : 'translateY(0)';
      el.style.filter = 'none';
    });
  }
  return el;
};
