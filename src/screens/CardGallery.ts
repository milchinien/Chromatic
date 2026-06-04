import type { Screen } from '../router';
import type { Card, CardClass, Color } from '../domain/Card';
import { ALL_CARDS } from '../systems/data/cards';
import { renderCardView } from '../ui/CardView';
import { BG, bgUrl, fitBg } from '../ui/backgrounds';

// Karten-Breite so gewählt, dass alle 5×5 Karten (inkl. Spalten-Header) ohne
// Scrollen in die 1280×800-Box passen.
const GALLERY_CARD_W = 72;

// Reihen-Reihenfolge mirror'd den User-Anhang: Krieger oben (Mana 7) → Heiler unten (Mana 3).
const ROW_ORDER: readonly CardClass[] = ['krieger', 'festung', 'reittier', 'magier', 'heiler'];
// Spalten-Reihenfolge: Krieg / Natur / Stein / Untot / Farblos.
const COL_ORDER: readonly Color[] = ['krieg', 'natur', 'stein', 'untot', 'farblos'];

// Klassen-Beschriftung für die linke Spalte.
const CLASS_LABEL: Record<CardClass, string> = {
  krieger: 'Krieger',
  festung: 'Festung',
  reittier: 'Reittier',
  magier: 'Magier',
  heiler: 'Heiler',
};

const findCard = (cls: CardClass, color: Color): Card | undefined =>
  ALL_CARDS.find((c) => c.class === cls && c.color === color);

export const CardGallery: Screen = (host, ctx) => {
  host.innerHTML = `
    <div class="cm-fit" style="${fitBg(bgUrl(BG.roommap!))}"><div class="cm-screen" style="display:flex; flex-direction:column;">
      <div class="cm-hud">
        <div class="cm-hud-left">
          <button class="cm-btn cm-btn--ghost" data-action="back" style="padding:6px 10px;">◀ Zurück</button>
          <div class="cm-act">
            <span class="cm-act-label">Karten-Galerie</span>
            <span class="cm-act-name">Alle ${ALL_CARDS.length} Karten</span>
          </div>
        </div>
        <div class="cm-hud-right">
          <span class="cm-label">5 Farben · 5 Klassen</span>
        </div>
      </div>

      <div data-slot="scroll" style="
        position:absolute; inset:68px 28px 14px 28px; overflow:hidden;
        display:flex; align-items:center; justify-content:center;
      ">
        <div data-slot="grid" style="
          display:grid;
          grid-template-columns: max-content repeat(5, ${GALLERY_CARD_W}px);
          grid-auto-rows: max-content;
          align-items:center;
          gap:12px 20px;
          justify-content:center;
        "></div>
      </div>
    </div></div>
  `;

  const grid = host.querySelector<HTMLElement>('[data-slot="grid"]')!;

  // Auto-Flow füllt zeilenweise über 6 Spalten: [Ecke] [5 Farb-Header],
  // dann je Klasse [Klassen-Label] [5 Karten].

  // Leere Ecke oben-links.
  grid.appendChild(document.createElement('div'));

  // Spalten-Header (Farben) über den Karten.
  for (const col of COL_ORDER) {
    const head = document.createElement('div');
    head.style.cssText = `
      display:flex; align-items:center; justify-content:center; gap:8px; padding:6px 0;
    `;
    head.innerHTML = `
      <span class="cm-chip cm-chip--${col}" style="width:10px; height:10px;"></span>
      <span class="cm-label" style="font-size:10px;">${col.toUpperCase()}</span>
    `;
    grid.appendChild(head);
  }

  // 5 Reihen × 5 Spalten, jede Reihe mit Klassen-Label links.
  for (const cls of ROW_ORDER) {
    const rowLabel = document.createElement('div');
    rowLabel.className = 'cm-label';
    rowLabel.textContent = CLASS_LABEL[cls];
    rowLabel.style.cssText =
      'font-size:11px; text-align:right; padding-right:4px; white-space:nowrap; justify-self:end;';
    grid.appendChild(rowLabel);

    for (const col of COL_ORDER) {
      const card = findCard(cls, col);
      if (!card) {
        grid.appendChild(document.createElement('div'));
        continue;
      }
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; align-items:center; justify-content:center;';
      // Karten-Ansicht (affordable=true rein optisch — hier keine Mana-Logik).
      const view = renderCardView({ card, affordable: true, width: GALLERY_CARD_W });
      wrap.appendChild(view);
      grid.appendChild(wrap);
    }
  }

  host.querySelector<HTMLButtonElement>('[data-action="back"]')!.addEventListener('click', () => {
    ctx.go('menu');
  });
};
