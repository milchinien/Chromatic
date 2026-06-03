import type { Screen } from '../router';
import type { Color } from '../domain/Card';
import { getCurrentRun } from '../systems/run/currentRun';
import { setActColor } from '../systems/run/RunState';
import { cardById, cardsByColor } from '../systems/data/cards';
import { mulberry32 } from '../systems/rng';
import { colorToCss } from '../systems/data/designTokens';
import { renderCardView } from '../ui/CardView';
import { sfx } from '../systems/audio';

const ALL_COLORS: readonly Color[] = ['natur', 'krieg', 'stein', 'untot', 'farblos'];
const COLOR_LABEL: Record<Color, string> = {
  natur: 'Natur',
  krieg: 'Krieg',
  stein: 'Stein',
  untot: 'Untot',
  farblos: 'Farblos',
};
const COLOR_DESC: Record<Color, string> = {
  natur: 'Heilung & Support — zähe, regenerierende Truppen.',
  krieg: 'Aggression & Direktschaden — harte Offensive.',
  stein: 'Verteidigung & Panzerung — schwer zu durchbrechen.',
  untot: 'Dunkle Magie & Opfer — Debuffs und Beschwörung.',
  farblos: 'Neutrale Elite — keine Farb-Combos, aber solo stark.',
};

/**
 * Boss-Auswahl vor jeder Weltkarte: 2 zufällige Farb-Bosse (mit Wiederholung
 * über Akte hinweg), der Spieler wählt einen. Die gewählte Farbe wird zur
 * Akt-Farbe — alle Gegner des Akts ziehen dann nur Karten dieser Farbe.
 */
export const BossSelect: Screen = (host, ctx) => {
  const run = getCurrentRun();
  if (!run) {
    ctx.go('menu');
    return;
  }

  // Deterministisch pro Akt: zwei DISTINKTE zufällige Farben.
  const rng = mulberry32((run.seed ^ (run.actNumber * 0x85ebca6b)) >>> 0);
  const pool = [...ALL_COLORS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const options: Color[] = [pool[0]!, pool[1]!];

  const cardFor = (color: Color) => cardById(cardsByColor(color)[0]!);

  host.innerHTML = `
    <div class="cm-fit"><div class="cm-screen" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:28px; padding:48px;">
      <div style="text-align:center; display:flex; flex-direction:column; gap:6px;">
        <span class="cm-label">Akt ${run.actNumber}</span>
        <h1 class="cm-display" style="margin:0; font-size:56px; color:var(--gold-hi);">Wähle deinen Gegner</h1>
        <span class="cm-label">Die gewählte Farbe bestimmt das gesamte Gegner-Deck dieses Akts.</span>
      </div>
      <div style="display:flex; gap:48px;" data-slot="options"></div>
    </div></div>
  `;

  const optionsHost = host.querySelector<HTMLElement>('[data-slot="options"]')!;
  for (const color of options) {
    const accent = colorToCss(color);
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      display:flex; flex-direction:column; align-items:center; gap:14px; width:260px;
      padding:20px; border:1px solid var(--line-hi); border-radius:8px;
      background: linear-gradient(180deg, var(--surface-2), var(--surface));
    `;

    const title = document.createElement('div');
    title.className = 'cm-display';
    title.textContent = `${COLOR_LABEL[color]}-Boss`;
    title.style.cssText = `font-size:26px; color:${accent};`;
    wrap.appendChild(title);

    wrap.appendChild(renderCardView({ card: cardFor(color), affordable: true, size: 'sm' }));

    const desc = document.createElement('div');
    desc.textContent = COLOR_DESC[color];
    desc.style.cssText =
      "font-family:'IBM Plex Sans', sans-serif; font-size:12px; color:var(--ink-dim); text-align:center; min-height:48px;";
    wrap.appendChild(desc);

    const btn = document.createElement('button');
    btn.className = 'cm-btn cm-btn--gold';
    btn.textContent = 'Herausfordern';
    btn.onclick = () => {
      setActColor(run, color);
      sfx.click();
      ctx.go('worldmap');
    };
    wrap.appendChild(btn);

    optionsHost.appendChild(wrap);
  }
};
