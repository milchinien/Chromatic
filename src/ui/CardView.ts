import type { Card } from '../domain/Card';
import { colorToCss } from '../systems/data/designTokens';

export interface CardViewOptions {
  card: Card;
  affordable: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

const classIcon = (cls: Card['class']): string => {
  switch (cls) {
    case 'krieger':
      return '⚔';
    case 'festung':
      return '🛡';
    case 'reittier':
      return '🐎';
    case 'magier':
      return '✦';
    case 'heiler':
      return '✚';
  }
};

const COLOR_LABEL: Record<Card['color'], string> = {
  natur: 'NATUR',
  krieg: 'KRIEG',
  stein: 'STEIN',
  untot: 'UNTOT',
  farblos: 'FARBLOS',
};

const CLASS_LABEL: Record<Card['class'], string> = {
  krieger: 'KRIEGER',
  festung: 'FESTUNG',
  reittier: 'REITTIER',
  magier: 'MAGIER',
  heiler: 'HEILER',
};

export const renderCardView = (opts: CardViewOptions): HTMLElement => {
  const { card, affordable, size = 'md' } = opts;
  const dims = size === 'md' ? { w: 150, h: 218, pad: 10, art: 88 } : { w: 110, h: 160, pad: 8, art: 60 };
  const color = colorToCss(card.color);

  const el = document.createElement('button');
  el.className = `cm-card cm-card-view${affordable ? '' : ' cm-card-view--locked'}`;
  el.dataset.cardId = card.id;
  el.style.cssText = `
    position: relative;
    width: ${dims.w}px;
    height: ${dims.h}px;
    padding: ${dims.pad}px;
    text-align: left;
    cursor: ${affordable ? 'pointer' : 'not-allowed'};
    opacity: ${affordable ? '1' : '0.55'};
    color: var(--ink);
    display: flex; flex-direction: column; gap: 6px;
  `;

  el.innerHTML = `
    <div style="
      position: absolute; top: -8px; left: -8px;
      width: 28px; height: 28px; border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #6ab1e8, #2a5a8c);
      border: 2px solid #163050;
      display: flex; align-items: center; justify-content: center;
      color: white; font: 600 13px 'JetBrains Mono', monospace;
      box-shadow: 0 0 12px rgba(74,140,200,.6);
    ">${card.manaCost}</div>

    <div style="display:flex; align-items:center; justify-content:space-between; height:14px;">
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${color}; box-shadow:0 0 6px ${color}aa;"></span>
        <span style="font: 400 9px 'JetBrains Mono', monospace; letter-spacing:0.2em; color:var(--ink-mute);">${COLOR_LABEL[card.color]}</span>
      </div>
      <span style="color:${color}; font-size:14px;">${classIcon(card.class)}</span>
    </div>

    <div style="
      height: ${dims.art}px; border-radius: 2px;
      background:
        repeating-linear-gradient(45deg, ${color}33 0 6px, transparent 6px 12px),
        radial-gradient(circle at 50% 40%, ${color}55, transparent 70%),
        #1f180f;
      position: relative; display:flex; align-items:center; justify-content:center;
      border: 1px solid var(--line);
    ">
      <span style="font-size:${Math.round(dims.art * 0.55)}px; color:${color}; opacity:0.95; text-shadow:0 0 16px ${color};">${classIcon(card.class)}</span>
    </div>

    <div style="font-family:'Cinzel', serif; font-size:13px; letter-spacing:0.06em; text-align:center;">${card.name}</div>

    <div style="
      margin-top:auto; display:flex; justify-content:space-between; align-items:center;
      background:var(--bg-2); border:1px solid var(--line-soft); border-radius:2px;
      padding: 4px 8px; font-family:'JetBrains Mono', monospace; font-size:12px;
    ">
      <span style="color:var(--c-krieg);">⚔ ${card.stats.damage}</span>
      <span style="color:var(--c-natur);">♥ ${card.stats.hp}</span>
    </div>

    <div style="text-align:center; font-family:'JetBrains Mono', monospace; font-size:9px; letter-spacing:0.22em; color:var(--ink-mute);">
      ${CLASS_LABEL[card.class]}
    </div>
  `;

  if (opts.onClick && affordable) {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      opts.onClick!();
    });
  }
  return el;
};
