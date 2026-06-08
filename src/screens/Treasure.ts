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
import { sfx } from '../systems/audio';
import { BG, bgUrl, fitBg } from '../ui/backgrounds';
import { coinHudHtml } from '../ui/coins';

const COIN_REWARDS = [100, 150, 200, 300, 500] as const;
const HEAL_AMOUNT = 30;

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

// Pro Schatz-Knoten nur einmal einlösbar.
const collectedByNode = new Set<string>();

/** Schatz: ZUFÄLLIGE Belohnung (keine Auswahl) — Coins (100/150/200/300/500),
 *  ein gratis Karten-Upgrade oder eine Heilung der Base. */
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
    refreshHud();
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

  // Eindeutige Deck-Karten (für Upgrade-Belohnung).
  const uniqueDeckCards = (): Card[] => {
    const seen = new Set<string>();
    const cards: Card[] = [];
    for (const c of run.deck) if (!seen.has(c.id)) { seen.add(c.id); cards.push(c); }
    return cards;
  };

  // Zufällige Belohnung würfeln und sofort vergeben → Ergebnis-Text.
  const grantRandomReward = (): string => {
    collectedByNode.add(nodeId);
    sfx.coin();

    // Mögliche Typen — Heilung nur bei fehlender HP, Upgrade nur mit Karten.
    const types: Array<'coins' | 'upgrade' | 'heal'> = ['coins'];
    const cards = uniqueDeckCards();
    if (cards.length > 0) types.push('upgrade');
    if (run.baseHp < run.maxBaseHp) types.push('heal');

    const type = pick(types);
    if (type === 'upgrade') {
      const card = pick(cards);
      upgradeCard(run, card.id);
      return `${card.name} → Stufe ${cardLevel(run, card.id)}`;
    }
    if (type === 'heal') {
      const before = run.baseHp;
      healBase(run, HEAL_AMOUNT);
      return `+${Math.round(run.baseHp - before)} HP geheilt`;
    }
    const amount = pick(COIN_REWARDS);
    addCoins(run, amount);
    return `+${amount} Coins`;
  };

  renderDone(grantRandomReward());
};

/** Reset für neuen Run (Game Over / Sieg). */
export const resetTreasureCollections = (): void => {
  collectedByNode.clear();
};
