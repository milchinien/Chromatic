import type { Screen } from '../router';
import type { Card } from '../domain/Card';
import { addCardToDeck, addCoins, markNodeVisited } from '../systems/run/RunState';
import { getCurrentRun } from '../systems/run/currentRun';
import { getRandomDrops, shopPool, shopPriceOf } from '../systems/data/dropPool';
import { mulberry32 } from '../systems/rng';
import { renderCardView } from '../ui/CardView';
import { sfx } from '../systems/audio';
import { BG, bgUrl } from '../ui/backgrounds';

const NUM_OFFERS = 4;

// Per-Knoten gemerkte Käufe, damit Wiederbetreten kein Doppelkauf erlaubt.
// (Aktueller Welt-Karten-Flow geht zwar nur vorwärts, aber der Plan verlangt
// das Verhalten explizit — hier als Singleton hinterlegt.)
const purchasedByNode = new Map<string, Set<string>>();

const seedFromNodeId = (runSeed: number, nodeId: string): number => {
  let h = runSeed >>> 0;
  for (let i = 0; i < nodeId.length; i++) h = ((h * 31) ^ nodeId.charCodeAt(i)) >>> 0;
  return h;
};

const colorLabel: Record<Card['color'], string> = {
  natur: 'Natur',
  krieg: 'Krieg',
  stein: 'Stein',
  untot: 'Untot',
  farblos: 'Farblos',
};
const classLabel: Record<Card['class'], string> = {
  krieger: 'Krieger',
  festung: 'Festung',
  reittier: 'Reittier',
  magier: 'Magier',
  heiler: 'Heiler',
};

export const Shop: Screen = (host, ctx) => {
  const run = getCurrentRun();
  if (!run) {
    queueMicrotask(() => ctx.go('menu'));
    host.innerHTML = '';
    return;
  }

  const nodeId = run.currentNodeId;
  const rng = mulberry32(seedFromNodeId(run.seed, nodeId));
  const offers = getRandomDrops(shopPool, NUM_OFFERS, rng);
  let purchased = purchasedByNode.get(nodeId);
  if (!purchased) {
    purchased = new Set<string>();
    purchasedByNode.set(nodeId, purchased);
  }

  let selectedIdx = -1;

  host.innerHTML = `
    <div class="cm-fit"><div class="cm-screen" style="background-image:${bgUrl(BG.shop!)}; background-size:cover; background-position:center;">
      <div class="cm-hud">
        <div class="cm-hud-left">
          <button class="cm-btn cm-btn--ghost" data-action="leave" style="padding:6px 10px;">◀ Verlassen</button>
          <div class="cm-act">
            <span class="cm-act-label">AKT 0${run.actNumber} · MARKT</span>
            <span class="cm-act-name">Krämerin Vey</span>
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
            <span class="cm-coin-val" data-slot="coins">${run.coins}</span>
          </div>
        </div>
      </div>

      <div style="position:absolute; inset:96px 56px 80px 56px; display:grid; grid-template-columns: 1fr 360px; gap:32px;">
        <!-- Karten + Buy-Bar -->
        <div style="display:flex; flex-direction:column; gap:18px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <span class="cm-label">Angebot · wechselt pro Raum</span>
            <h2 class="cm-title" style="margin:0; font-size:24px; color:var(--ink);">Karten zum Verkauf</h2>
          </div>
          <div data-slot="offers" style="display:grid; grid-template-columns: repeat(${NUM_OFFERS}, 1fr); gap:14px; align-items:end;"></div>
        </div>

        <!-- Info-Panel -->
        <div data-slot="info-panel" style="background:linear-gradient(180deg, var(--surface-2), var(--surface)); border:1px solid var(--line-hi); border-radius:4px; padding:18px; display:flex; flex-direction:column; gap:14px;">
          <div class="cm-label">Karten-Detail</div>
          <div data-slot="info-content" style="font-family:'IBM Plex Sans', sans-serif; font-size:13px; color:var(--ink-dim); min-height:280px; display:flex; align-items:center; justify-content:center; text-align:center;">
            Hover über eine Karte für Details.
          </div>
        </div>
      </div>
    </div></div>
  `;

  const $ = <T extends HTMLElement = HTMLElement>(slot: string): T => {
    const el = host.querySelector<T>(`[data-slot="${slot}"]`);
    if (!el) throw new Error(`Missing slot: ${slot}`);
    return el;
  };

  const updateCoins = (): void => {
    $('coins').textContent = String(run.coins);
  };

  const renderInfo = (idx: number): void => {
    const card = offers[idx];
    const info = $('info-content');
    if (!card) {
      info.innerHTML = 'Hover über eine Karte für Details.';
      info.style.alignItems = 'center';
      info.style.justifyContent = 'center';
      info.style.textAlign = 'center';
      return;
    }
    info.style.alignItems = 'stretch';
    info.style.justifyContent = 'flex-start';
    info.style.textAlign = 'left';
    const price = shopPriceOf(card);
    const owned = run.deck.filter((c) => c.id === card.id).length;
    const isPurchased = purchased!.has(card.id);
    const affordable = run.coins >= price;
    info.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <h3 class="cm-display" style="margin:0; font-size:22px; color:var(--ink);">${card.name}</h3>
        <span class="cm-label">${colorLabel[card.color]} · ${classLabel[card.class]}</span>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
          <div style="background:var(--bg-2); border:1px solid var(--line-soft); padding:6px 8px;">
            <div class="cm-label" style="font-size:9px;">Mana</div>
            <div style="font-family:'JetBrains Mono', monospace; font-size:18px; color:var(--mana);">${card.manaCost}</div>
          </div>
          <div style="background:var(--bg-2); border:1px solid var(--line-soft); padding:6px 8px;">
            <div class="cm-label" style="font-size:9px;">Damage</div>
            <div style="font-family:'JetBrains Mono', monospace; font-size:18px; color:var(--c-krieg);">${card.stats.damage}</div>
          </div>
          <div style="background:var(--bg-2); border:1px solid var(--line-soft); padding:6px 8px;">
            <div class="cm-label" style="font-size:9px;">HP</div>
            <div style="font-family:'JetBrains Mono', monospace; font-size:18px; color:var(--c-natur);">${card.stats.hp}</div>
          </div>
        </div>
        ${card.description ? `<div style="background:var(--bg-2); border:1px solid var(--line-soft); padding:8px 10px;"><div class="cm-label" style="font-size:9px;">◆ Passiv</div><div style="font-size:12px; margin-top:4px; color:var(--ink);">${card.description}</div></div>` : ''}
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
          <span class="cm-label">Du besitzt: ${owned}×</span>
          <span style="font-family:'JetBrains Mono', monospace; font-size:18px; color:${affordable ? 'var(--gold-hi)' : 'var(--c-krieg)'};">${price} ⦿</span>
        </div>
        <button class="cm-btn cm-btn--gold" data-action="buy" style="margin-top:6px;" ${isPurchased || !affordable ? 'disabled' : ''}>${isPurchased ? 'Bereits gekauft' : affordable ? `Kaufen · ${price}` : 'Zu wenig Coins'}</button>
      </div>
    `;
    const buyBtn = info.querySelector<HTMLButtonElement>('[data-action="buy"]');
    if (buyBtn && !buyBtn.disabled) {
      buyBtn.addEventListener('click', () => onBuy(idx));
    }
  };

  const onBuy = (idx: number): void => {
    const card = offers[idx];
    if (!card) return;
    if (purchased!.has(card.id)) return;
    const price = shopPriceOf(card);
    if (run.coins < price) return;
    addCoins(run, -price);
    addCardToDeck(run, card);
    purchased!.add(card.id);
    sfx.coin();
    updateCoins();
    renderOffers();
    renderInfo(idx);
  };

  const renderOffers = (): void => {
    const offersHost = $('offers');
    offersHost.replaceChildren();
    offers.forEach((card, idx) => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; flex-direction:column; gap:8px; align-items:center;';
      const isPurchased = purchased!.has(card.id);
      const affordable = run.coins >= shopPriceOf(card);
      const view = renderCardView({
        card,
        affordable: !isPurchased && affordable,
        size: 'md',
        onClick: () => {
          selectedIdx = idx;
          renderInfo(idx);
          highlightSelected();
        },
      });
      if (isPurchased) view.style.filter = 'grayscale(1)';
      const tag = document.createElement('div');
      tag.style.cssText = `
        display:flex; align-items:center; gap:6px; padding:4px 10px;
        background:${isPurchased ? 'var(--surface)' : 'linear-gradient(180deg, var(--surface-2), var(--surface))'};
        border:1px solid ${isPurchased ? 'var(--line)' : 'var(--line-hi)'};
        font-family:'JetBrains Mono', monospace; font-size:12px;
        color:${isPurchased ? 'var(--ink-mute)' : 'var(--gold-hi)'};
        border-radius:2px;
      `;
      tag.textContent = isPurchased ? 'GEKAUFT' : `${shopPriceOf(card)} ⦿`;
      wrap.appendChild(view);
      wrap.appendChild(tag);
      // Hover-Info ohne Auswahl
      view.addEventListener('mouseenter', () => renderInfo(idx));
      offersHost.appendChild(wrap);
    });
    highlightSelected();
  };

  const highlightSelected = (): void => {
    const offersHost = $('offers');
    Array.from(offersHost.children).forEach((wrap, i) => {
      const view = wrap.firstElementChild as HTMLElement | null;
      if (!view) return;
      if (i === selectedIdx) view.classList.add('cm-card--selected');
      else view.classList.remove('cm-card--selected');
    });
  };

  renderOffers();
  if (offers.length > 0) renderInfo(0);

  host.querySelector<HTMLButtonElement>('[data-action="leave"]')!.addEventListener('click', () => {
    // Shop-Verlassen schließt den Welt-Knoten ab.
    markNodeVisited(run, run.currentNodeId);
    ctx.go('worldmap');
  });

};

// Helper für externe Resets (z.B. neuer Run nach Game Over).
export const resetShopPurchases = (): void => {
  purchasedByNode.clear();
};
