import type { Screen } from '../router';
import type { Card, CardClass, Color } from '../domain/Card';
import { ALL_CARDS } from '../systems/data/cards';
import { renderCardView } from '../ui/CardView';

// Reihen-Reihenfolge mirror'd den User-Anhang: Krieger oben (Mana 7) → Heiler unten (Mana 3).
const ROW_ORDER: readonly CardClass[] = ['krieger', 'festung', 'reittier', 'magier', 'heiler'];
// Spalten-Reihenfolge: Krieg / Natur / Stein / Untot / Farblos.
const COL_ORDER: readonly Color[] = ['krieg', 'natur', 'stein', 'untot', 'farblos'];

const findCard = (cls: CardClass, color: Color): Card | undefined =>
  ALL_CARDS.find((c) => c.class === cls && c.color === color);

export const CardGallery: Screen = (host, ctx) => {
  host.innerHTML = `
    <div class="cm-fit"><div class="cm-screen" style="display:flex; flex-direction:column;">
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
        position:absolute; inset:80px 28px 28px 28px; overflow-y:auto; overflow-x:hidden;
        padding-right:8px;
      ">
        <div data-slot="grid" style="
          display:grid;
          grid-template-columns: repeat(5, 150px);
          grid-auto-rows: max-content;
          gap:14px 14px;
          justify-content:center;
          padding-bottom: 24px;
        "></div>
      </div>
    </div></div>
  `;

  const grid = host.querySelector<HTMLElement>('[data-slot="grid"]')!;

  // Spalten-Header über den Karten
  for (const col of COL_ORDER) {
    const head = document.createElement('div');
    head.style.cssText = `
      display:flex; align-items:center; justify-content:center; gap:8px;
      padding:6px 0; grid-row:1;
    `;
    head.innerHTML = `
      <span class="cm-chip cm-chip--${col}" style="width:10px; height:10px;"></span>
      <span class="cm-label" style="font-size:10px;">${col.toUpperCase()}</span>
    `;
    grid.appendChild(head);
  }

  // 5 Reihen × 5 Spalten — Karten-Galerie wie im User-Anhang.
  for (const cls of ROW_ORDER) {
    for (const col of COL_ORDER) {
      const card = findCard(cls, col);
      if (!card) continue;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; flex-direction:column; gap:6px; align-items:center;';
      // Karten-Ansicht (affordable=true rein optisch — hier keine Mana-Logik).
      const view = renderCardView({ card, affordable: true, size: 'md' });
      wrap.appendChild(view);
      grid.appendChild(wrap);
    }
  }

  host.querySelector<HTMLButtonElement>('[data-action="back"]')!.addEventListener('click', () => {
    ctx.go('menu');
  });
};
