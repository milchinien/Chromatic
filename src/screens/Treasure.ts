import type { Screen } from '../router';
import type { Card } from '../domain/Card';
import {
  addCoins,
  cardLevel,
  healBase,
  isInRoom,
  locationKey,
  markNodeVisited,
  upgradeCard,
} from '../systems/run/RunState';
import { getCurrentRun } from '../systems/run/currentRun';
import { renderCardView } from '../ui/CardView';
import { sfx } from '../systems/audio';
import { BG, bgUrl, fitBg } from '../ui/backgrounds';
import { coinHudHtml } from '../ui/coins';

const COINS_AMOUNT = 50;
const HEAL_AMOUNT = 30;

// Pro Schatz-Knoten nur einmal einlösbar.
const collectedByNode = new Set<string>();

/** Schatz: KEIN Karten-Drop mehr. Der Spieler wählt: 1 gratis Karten-Upgrade,
 *  Heilung oder Coins. */
export const Treasure: Screen = (host, ctx) => {
  const run = getCurrentRun();
  if (!run) {
    queueMicrotask(() => ctx.go('menu'));
    host.innerHTML = '';
    return;
  }

  const nodeId = locationKey(run);
  const alreadyDone = collectedByNode.has(nodeId);

  const hudRight = `
    <div class="cm-hud-right">
      <div class="cm-hp-pill">
        <span class="cm-hp-dot"></span>
        <span><span data-slot="hp">${Math.ceil(run.baseHp)}</span><span style="opacity:0.5;"> / ${run.maxBaseHp}</span></span>
      </div>
      ${coinHudHtml(run.coins)}
    </div>`;

  const shell = (inner: string): string => `
    <div class="cm-fit" style="${fitBg(bgUrl(BG.treasure!))}"><div class="cm-screen" style="display:flex; align-items:center; justify-content:center;">
      <div class="cm-hud">
        <div class="cm-hud-left">
          <div class="cm-act">
            <span class="cm-act-label">AKT 0${run.actNumber} · SCHATZ</span>
            <span class="cm-act-name">Schatztruhe</span>
          </div>
        </div>
        ${hudRight}
      </div>
      ${inner}
    </div></div>`;

  const goNext = (): void => {
    if (isInRoom(run)) {
      ctx.go('roommap');
    } else {
      markNodeVisited(run, run.currentNodeId);
      ctx.go('worldmap');
    }
  };

  const refreshHud = (): void => {
    const c = host.querySelector<HTMLElement>('[data-slot="coins"]');
    if (c) c.textContent = String(run.coins);
    const h = host.querySelector<HTMLElement>('[data-slot="hp"]');
    if (h) h.textContent = String(Math.ceil(run.baseHp));
  };

  const renderDone = (msg: string): void => {
    host.innerHTML = shell(`
      <div style="display:flex; flex-direction:column; align-items:center; gap:18px; text-align:center;">
        <span class="cm-label">Belohnung</span>
        <div style="font-size:96px; line-height:1; color:var(--gold-hi); text-shadow:0 0 40px rgba(214,169,85,.5);">◈</div>
        <h2 class="cm-display" style="margin:0; font-size:36px; color:var(--ink);">${msg}</h2>
        <button class="cm-btn cm-btn--gold" data-action="continue">Weiter</button>
      </div>
    `);
    host.querySelector<HTMLButtonElement>('[data-action="continue"]')!.addEventListener('click', goNext);
  };

  // Schon eingelöst → leere Truhe.
  if (alreadyDone) {
    host.innerHTML = shell(`
      <div style="display:flex; flex-direction:column; align-items:center; gap:18px; text-align:center;">
        <span class="cm-label">Leer</span>
        <div style="font-size:96px; line-height:1; color:var(--ink-mute);">✕</div>
        <h2 class="cm-display" style="margin:0; font-size:36px; color:var(--ink);">Die Schatztruhe ist bereits leer.</h2>
        <button class="cm-btn cm-btn--gold" data-action="continue">Weiter</button>
      </div>
    `);
    host.querySelector<HTMLButtonElement>('[data-action="continue"]')!.addEventListener('click', goNext);
    return;
  }

  // Upgrade-Auswahl: eindeutige Deck-Karten anzeigen, eine gratis upgraden.
  const showUpgradePicker = (): void => {
    const seen = new Set<string>();
    const cards: Card[] = [];
    for (const c of run.deck) if (!seen.has(c.id)) { seen.add(c.id); cards.push(c); }
    host.innerHTML = shell(`
      <div style="display:flex; flex-direction:column; align-items:center; gap:18px; text-align:center; max-width:880px;">
        <span class="cm-label">Gratis-Upgrade</span>
        <h2 class="cm-display" style="margin:0; font-size:32px; color:var(--ink);">Wähle eine Karte zum Upgraden</h2>
        <div data-slot="picker" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:12px; align-items:end;"></div>
      </div>
    `);
    const picker = host.querySelector<HTMLElement>('[data-slot="picker"]')!;
    cards.forEach((card) => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; flex-direction:column; gap:6px; align-items:center;';
      const view = renderCardView({
        card,
        affordable: true,
        size: 'sm',
        onClick: () => {
          upgradeCard(run, card.id);
          collectedByNode.add(nodeId);
          sfx.coin();
          renderDone(`${card.name} → Stufe ${cardLevel(run, card.id)}`);
        },
      });
      const tag = document.createElement('div');
      tag.style.cssText =
        "font-family:'JetBrains Mono', monospace; font-size:11px; color:var(--gold-hi);";
      tag.textContent = `Lv ${cardLevel(run, card.id)} → ${cardLevel(run, card.id) + 1}`;
      wrap.appendChild(view);
      wrap.appendChild(tag);
      picker.appendChild(wrap);
    });
  };

  // Startansicht: 3 Belohnungs-Optionen.
  host.innerHTML = shell(`
    <div style="display:flex; flex-direction:column; align-items:center; gap:24px; text-align:center;">
      <span class="cm-label">Schatz gefunden</span>
      <h2 class="cm-display" style="margin:0; font-size:40px; color:var(--gold-hi);">Wähle deine Belohnung</h2>
      <div style="display:flex; gap:20px;">
        <button class="cm-btn cm-btn--gold" data-action="upgrade" style="width:220px; flex-direction:column; gap:6px; padding:18px;">
          <span style="font-size:16px;">Gratis-Upgrade</span>
          <span style="font-family:'IBM Plex Sans', sans-serif; font-size:11px; color:var(--ink-dim); text-transform:none; letter-spacing:0;">Eine Karte +1 Stufe</span>
        </button>
        <button class="cm-btn" data-action="heal" style="width:220px; flex-direction:column; gap:6px; padding:18px;" ${run.baseHp >= run.maxBaseHp ? 'disabled' : ''}>
          <span style="font-size:16px;">+${HEAL_AMOUNT} HP</span>
          <span style="font-family:'IBM Plex Sans', sans-serif; font-size:11px; color:var(--ink-dim); text-transform:none; letter-spacing:0;">${run.baseHp >= run.maxBaseHp ? 'Bereits volle HP' : 'Base heilen'}</span>
        </button>
        <button class="cm-btn" data-action="coins" style="width:220px; flex-direction:column; gap:6px; padding:18px;">
          <span style="font-size:16px;">+${COINS_AMOUNT} Coins</span>
          <span style="font-family:'IBM Plex Sans', sans-serif; font-size:11px; color:var(--ink-dim); text-transform:none; letter-spacing:0;">Für den Shop</span>
        </button>
      </div>
    </div>
  `);

  host.querySelector<HTMLButtonElement>('[data-action="upgrade"]')!.addEventListener('click', showUpgradePicker);
  host.querySelector<HTMLButtonElement>('[data-action="heal"]')?.addEventListener('click', () => {
    const before = run.baseHp;
    healBase(run, HEAL_AMOUNT);
    collectedByNode.add(nodeId);
    refreshHud();
    sfx.coin();
    renderDone(`+${Math.round(run.baseHp - before)} HP geheilt`);
  });
  host.querySelector<HTMLButtonElement>('[data-action="coins"]')!.addEventListener('click', () => {
    addCoins(run, COINS_AMOUNT);
    collectedByNode.add(nodeId);
    refreshHud();
    sfx.coin();
    renderDone(`+${COINS_AMOUNT} Coins`);
  });
};

/** Reset für neuen Run (Game Over / Sieg). */
export const resetTreasureCollections = (): void => {
  collectedByNode.clear();
};
