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
  const { card, affordable, size = 'md' } = opts;
  // Aspect-Ratio matched die Quell-PNGs (174×304 ≈ 0.572 w/h), damit `cover`
  // weder Top (Mana/Name) noch Bottom (Farb-/Klassen-Tag) abschneidet.
  const dims = size === 'md' ? { w: 150, h: 262 } : { w: 110, h: 192 };

  const url = cardImageUrl(card);

  const el = document.createElement('button');
  el.className = `cm-card cm-card-view${affordable ? '' : ' cm-card-view--locked'}`;
  el.dataset.cardId = card.id;
  el.setAttribute('aria-label', `${card.name} · ${card.manaCost} Mana`);
  el.style.cssText = `
    position: relative;
    width: ${dims.w}px;
    height: ${dims.h}px;
    padding: 0;
    border: 0;
    background: ${url ? `url(${url}) center/cover no-repeat` : 'var(--surface)'};
    border-radius: 6px;
    cursor: ${affordable ? 'pointer' : 'not-allowed'};
    opacity: ${affordable ? '1' : '0.5'};
    filter: ${affordable ? 'none' : 'grayscale(0.5)'};
    transition: transform 120ms, filter 120ms, box-shadow 120ms;
    box-shadow: 0 4px 8px rgba(0,0,0,0.55);
  `;

  if (opts.onClick && affordable) {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      opts.onClick!();
    });
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'translateY(-3px)';
      el.style.filter = 'brightness(1.1)';
      el.style.boxShadow = '0 8px 18px rgba(0,0,0,0.65), 0 0 12px rgba(214,169,85,0.35)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translateY(0)';
      el.style.filter = 'none';
      el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.55)';
    });
  }
  return el;
};
