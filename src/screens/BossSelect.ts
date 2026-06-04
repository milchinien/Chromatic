import type { Screen } from '../router';
import type { Color } from '../domain/Card';
import { getCurrentRun } from '../systems/run/currentRun';
import { setActColor } from '../systems/run/RunState';
import { mulberry32 } from '../systems/rng';
import { sfx } from '../systems/audio';
import { fitBg } from '../ui/backgrounds';

// Vite-Glob lädt die "Wähle deinen Gegner"-Assets als gehashte URLs.
//  - akt-N.png: Vollbild-Menühintergründe (Titel "AKT N · WÄHLE DEINEN GEGNER"
//    ist bereits ins Bild eingebacken).
//  - boss-<farbe>.png: fertige Boss-Karten inkl. Titel, Sigil und
//    "HERAUSFORDERN"-Button — das ganze Bild ist die Schaltfläche.
const aktImages = import.meta.glob('../assets/bossselect/akt-*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const bossImages = import.meta.glob('../assets/bossselect/boss-*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** Höchste vorhandene AKT-Hintergrundnummer (akt-1..akt-N). */
const MAX_AKT_BG = Object.keys(aktImages).length;

/** Menühintergrund für einen Akt — geklemmt auf die vorhandenen Bilder. */
const aktBgUrl = (actNumber: number): string => {
  const n = Math.min(Math.max(1, actNumber), MAX_AKT_BG);
  return aktImages[`../assets/bossselect/akt-${n}.png`] ?? '';
};

/** Boss-Karten-Bild für eine Farbe. */
const bossImgUrl = (color: Color): string =>
  bossImages[`../assets/bossselect/boss-${color}.png`] ?? '';

const ALL_COLORS: readonly Color[] = ['natur', 'krieg', 'stein', 'untot', 'farblos'];
const COLOR_LABEL: Record<Color, string> = {
  natur: 'Natur',
  krieg: 'Krieg',
  stein: 'Stein',
  untot: 'Untot',
  farblos: 'Farblos',
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

  const bg = aktBgUrl(run.actNumber);
  host.innerHTML = `
    <div class="cm-fit" style="${fitBg(bg ? `url(${bg})` : '')}"><div class="cm-screen" style="
      display:flex; align-items:center; justify-content:center;
    ">
      <div data-slot="options" style="
        display:flex; gap:64px; align-items:center; justify-content:center;
        width:100%; padding-top:90px; box-sizing:border-box;
      "></div>
    </div></div>
  `;

  const optionsHost = host.querySelector<HTMLElement>('[data-slot="options"]')!;
  for (const color of options) {
    const btn = document.createElement('button');
    btn.className = 'cm-bossselect-card';
    btn.type = 'button';
    btn.setAttribute('aria-label', `${COLOR_LABEL[color]}-Boss herausfordern`);
    btn.title = `${COLOR_LABEL[color]}-Boss herausfordern`;
    btn.style.cssText = `
      background:transparent; border:none; padding:0; cursor:pointer;
      width:330px; max-width:34vw; line-height:0;
      filter: drop-shadow(0 12px 28px rgba(0,0,0,0.55));
      transition: transform 140ms ease, filter 140ms ease;
    `;

    const img = document.createElement('img');
    img.src = bossImgUrl(color);
    img.alt = `${COLOR_LABEL[color]}-Boss`;
    img.draggable = false;
    img.style.cssText = 'width:100%; height:auto; display:block; border-radius:12px;';
    btn.appendChild(img);

    btn.onmouseenter = () => {
      btn.style.transform = 'translateY(-6px) scale(1.03)';
      btn.style.filter = 'drop-shadow(0 18px 36px rgba(0,0,0,0.6)) brightness(1.06)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = '';
      btn.style.filter = 'drop-shadow(0 12px 28px rgba(0,0,0,0.55))';
    };
    btn.onclick = () => {
      setActColor(run, color);
      sfx.click();
      ctx.go('worldmap');
    };

    optionsHost.appendChild(btn);
  }
};
