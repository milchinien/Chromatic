import type { Screen } from '../router';
import type { Card } from '../domain/Card';
import { addCardToDeck, addCoins, healBase, isInRoom, locationKey } from '../systems/run/RunState';
import { getCurrentRun } from '../systems/run/currentRun';
import { getRandomDrops, treasurePool } from '../systems/data/dropPool';
import { mulberry32, randInt } from '../systems/rng';
import { renderCardView } from '../ui/CardView';

type RewardKind = 'coins' | 'card' | 'heal';
const COINS_AMOUNT = 50;
const HEAL_AMOUNT = 30;

interface CollectedReward {
  kind: RewardKind;
  /** Welche Karte gedroppt wurde (nur bei 'card'). */
  cardId?: string;
}

const collectedByNode = new Map<string, CollectedReward>();

const seedFromKey = (runSeed: number, key: string): number => {
  let h = runSeed >>> 0;
  for (let i = 0; i < key.length; i++) h = ((h * 31) ^ key.charCodeAt(i)) >>> 0;
  return h;
};

export const Treasure: Screen = (host, ctx) => {
  const run = getCurrentRun();
  if (!run) {
    queueMicrotask(() => ctx.go('menu'));
    host.innerHTML = '';
    return;
  }

  // Composite-Key: in Sub-Map enthält dieser den Welt-Knoten plus den Sub-Knoten,
  // damit jeder Sub-Treasure eine eigene Belohnung hat.
  const nodeId = locationKey(run);
  const previous = collectedByNode.get(nodeId);
  const rng = mulberry32(seedFromKey(run.seed, nodeId));

  // 1/3 Coins, 1/3 Karte, 1/3 Heilung — per Seed deterministisch.
  const kinds: RewardKind[] = ['coins', 'card', 'heal'];
  const chosen: RewardKind = previous?.kind ?? kinds[randInt(rng, 0, kinds.length)]!;
  const cardDrop: Card | undefined =
    chosen === 'card'
      ? (() => {
          if (previous?.cardId) {
            return treasurePool.find((c) => c.id === previous.cardId);
          }
          const [picked] = getRandomDrops(treasurePool, 1, rng);
          return picked;
        })()
      : undefined;

  const isFirstVisit = !previous;
  if (isFirstVisit) {
    if (chosen === 'coins') addCoins(run, COINS_AMOUNT);
    else if (chosen === 'card' && cardDrop) addCardToDeck(run, cardDrop);
    else if (chosen === 'heal') healBase(run, HEAL_AMOUNT);
    collectedByNode.set(nodeId, { kind: chosen, cardId: cardDrop?.id });
  }

  const headline = isFirstVisit ? 'Belohnung' : 'Leer';
  const subline = isFirstVisit
    ? chosen === 'coins'
      ? `+${COINS_AMOUNT} Coins`
      : chosen === 'card' && cardDrop
        ? `${cardDrop.name} ins Deck`
        : `+${HEAL_AMOUNT} HP geheilt`
    : 'Die Schatztruhe ist bereits leer.';

  host.innerHTML = `
    <div class="cm-fit"><div class="cm-screen" style="display:flex; align-items:center; justify-content:center;">
      <div class="cm-hud">
        <div class="cm-hud-left">
          <div class="cm-act">
            <span class="cm-act-label">AKT 0${run.actNumber} · SCHATZ</span>
            <span class="cm-act-name">Schatztruhe</span>
          </div>
        </div>
        <div class="cm-hud-right">
          <div class="cm-hp-pill">
            <span class="cm-hp-dot"></span>
            <span><span data-slot="hp">${run.baseHp}</span><span style="opacity:0.5;"> / ${run.maxBaseHp}</span></span>
          </div>
          <div class="cm-coin">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold-hi)" stroke-width="1.6">
              <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>
            </svg>
            <span class="cm-coin-val">${run.coins}</span>
          </div>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; align-items:center; gap:18px; text-align:center;">
        <span class="cm-label">${headline}</span>
        <div style="font-size:96px; line-height:1; color:var(--gold-hi); text-shadow:0 0 40px rgba(214,169,85,.5);">${isFirstVisit ? '◈' : '✕'}</div>
        <h2 class="cm-display" style="margin:0; font-size:36px; color:var(--ink);">${subline}</h2>
        <div data-slot="card-mount"></div>
        <button class="cm-btn cm-btn--gold" data-action="continue">Weiter</button>
      </div>
    </div></div>
  `;

  if (isFirstVisit && chosen === 'card' && cardDrop) {
    const mount = host.querySelector<HTMLElement>('[data-slot="card-mount"]')!;
    mount.appendChild(renderCardView({ card: cardDrop, affordable: true, size: 'md' }));
  }

  host.querySelector<HTMLButtonElement>('[data-action="continue"]')!.addEventListener('click', () => {
    ctx.go(isInRoom(run) ? 'roommap' : 'worldmap');
  });
};

/** Reset für neuen Run (Game Over / Sieg). */
export const resetTreasureCollections = (): void => {
  collectedByNode.clear();
};
