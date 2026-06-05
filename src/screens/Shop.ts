import type { Screen } from '../router';
import type { Card } from '../domain/Card';
import { addCoins, cardLevel, markNodeVisited, upgradeCard } from '../systems/run/RunState';
import { getCurrentRun } from '../systems/run/currentRun';
import { leveledStats, troopRangeFor, upgradeCostFor } from '../systems/data/balance';
import { renderCardView } from '../ui/CardView';
import { sfx } from '../systems/audio';
import { BG, bgUrl, fitBg } from '../ui/backgrounds';
import { coinHudHtml } from '../ui/coins';

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

/** Shop: KAUF entfällt. Der Spieler kann seine eigenen Deck-Karten UPGRADEN
 *  (Coins). Ein Upgrade skaliert Stats UND Truppen-Range; Kosten steigen je Level. */
export const Shop: Screen = (host, ctx) => {
  const run = getCurrentRun();
  if (!run) {
    queueMicrotask(() => ctx.go('menu'));
    host.innerHTML = '';
    return;
  }

  // Eindeutige Deck-Karten (Deck kann Duplikate enthalten, Upgrade gilt per ID).
  const seen = new Set<string>();
  const offers: Card[] = [];
  for (const c of run.deck) if (!seen.has(c.id)) { seen.add(c.id); offers.push(c); }

  let selectedIdx = 0;

  host.innerHTML = `
    <div class="cm-fit" style="${fitBg(bgUrl(BG.shop!))}"><div class="cm-screen">
      <div class="cm-hud">
        <div class="cm-hud-left">
          <button class="cm-btn cm-btn--ghost" data-action="leave" style="padding:6px 10px;">◀ Verlassen</button>
          <div class="cm-act">
            <span class="cm-act-label">AKT 0${run.actNumber} · SCHMIEDE</span>
            <span class="cm-act-name">Krämerin Vey</span>
          </div>
        </div>
        <div class="cm-hud-right">
          <div class="cm-hp-pill">
            <span class="cm-hp-dot"></span>
            <span><span data-slot="hp">${run.baseHp}</span><span style="opacity:0.5;"> / ${run.maxBaseHp}</span></span>
          </div>
          ${coinHudHtml(run.coins)}
        </div>
      </div>

      <div style="position:absolute; inset:96px 56px 80px 56px; display:grid; grid-template-columns: 1fr 360px; gap:32px;">
        <div style="display:flex; flex-direction:column; gap:18px; overflow:auto;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <span class="cm-label">Dein Deck · Karten upgraden</span>
            <h2 class="cm-title" style="margin:0; font-size:24px; color:var(--ink);">Karten verbessern</h2>
          </div>
          <div data-slot="offers" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:14px; align-items:end;"></div>
        </div>

        <div data-slot="info-panel" style="background:linear-gradient(180deg, var(--surface-2), var(--surface)); border:1px solid var(--line-hi); border-radius:4px; padding:18px; display:flex; flex-direction:column; gap:14px;">
          <div class="cm-label">Upgrade-Detail</div>
          <div data-slot="info-content" style="font-family:'IBM Plex Sans', sans-serif; font-size:13px; color:var(--ink-dim); min-height:280px;"></div>
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
      info.innerHTML = 'Keine Karten.';
      return;
    }
    const level = cardLevel(run, card.id);
    const cost = upgradeCostFor(level);
    const affordable = run.coins >= cost;
    const cur = leveledStats(card.stats, level);
    const next = leveledStats(card.stats, level + 1);
    const tNow = troopRangeFor(card.manaCost, level);
    const tNext = troopRangeFor(card.manaCost, level + 1);
    const arrow = (a: number, b: number): string =>
      `${a}${b !== a ? ` <span style="color:var(--c-natur);">→ ${b}</span>` : ''}`;
    info.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <h3 class="cm-display" style="margin:0; font-size:22px; color:var(--ink);">${card.name}</h3>
        <span class="cm-label">${colorLabel[card.color]} · ${classLabel[card.class]} · Stufe ${level}</span>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
          <div style="background:var(--bg-2); border:1px solid var(--line-soft); padding:6px 8px;">
            <div class="cm-label" style="font-size:9px;">Damage</div>
            <div style="font-family:'JetBrains Mono', monospace; font-size:16px; color:var(--c-krieg);">${arrow(cur.damage, next.damage)}</div>
          </div>
          <div style="background:var(--bg-2); border:1px solid var(--line-soft); padding:6px 8px;">
            <div class="cm-label" style="font-size:9px;">HP</div>
            <div style="font-family:'JetBrains Mono', monospace; font-size:16px; color:var(--c-natur);">${arrow(cur.hp, next.hp)}</div>
          </div>
          <div style="background:var(--bg-2); border:1px solid var(--line-soft); padding:6px 8px;">
            <div class="cm-label" style="font-size:9px;">Truppen</div>
            <div style="font-family:'JetBrains Mono', monospace; font-size:16px; color:var(--gold-hi);">${tNow.min}-${tNow.max} <span style="color:var(--c-natur);">→ ${tNext.min}-${tNext.max}</span></div>
          </div>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
          <span class="cm-label">Upgrade auf Stufe ${level + 1}</span>
          <span style="font-family:'JetBrains Mono', monospace; font-size:18px; color:${affordable ? 'var(--gold-hi)' : 'var(--c-krieg)'};">${cost} ⦿</span>
        </div>
        <button class="cm-btn cm-btn--gold" data-action="upgrade" style="margin-top:6px;" ${affordable ? '' : 'disabled'}>${affordable ? `Upgraden · ${cost}` : 'Zu wenig Coins'}</button>
      </div>
    `;
    const btn = info.querySelector<HTMLButtonElement>('[data-action="upgrade"]');
    if (btn && !btn.disabled) btn.addEventListener('click', () => onUpgrade(idx));
  };

  const onUpgrade = (idx: number): void => {
    const card = offers[idx];
    if (!card) return;
    const cost = upgradeCostFor(cardLevel(run, card.id));
    if (run.coins < cost) return;
    addCoins(run, -cost);
    upgradeCard(run, card.id);
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
      wrap.style.cssText = 'display:flex; flex-direction:column; gap:6px; align-items:center;';
      const level = cardLevel(run, card.id);
      const view = renderCardView({
        card,
        affordable: true,
        size: 'sm',
        selected: idx === selectedIdx,
        onClick: () => {
          selectedIdx = idx;
          renderOffers();
          renderInfo(idx);
        },
      });
      const tag = document.createElement('div');
      tag.style.cssText = `
        display:flex; align-items:center; gap:6px; padding:3px 8px;
        background:linear-gradient(180deg, var(--surface-2), var(--surface));
        border:1px solid var(--line-hi); font-family:'JetBrains Mono', monospace;
        font-size:11px; color:var(--gold-hi); border-radius:2px;
      `;
      tag.textContent = `Lv ${level} · ${upgradeCostFor(level)} ⦿`;
      view.addEventListener('mouseenter', () => renderInfo(idx));
      wrap.appendChild(view);
      wrap.appendChild(tag);
      offersHost.appendChild(wrap);
    });
  };

  renderOffers();
  if (offers.length > 0) renderInfo(selectedIdx);

  host.querySelector<HTMLButtonElement>('[data-action="leave"]')!.addEventListener('click', () => {
    markNodeVisited(run, run.currentNodeId);
    ctx.go('worldmap');
  });
};

// Helper für externe Resets (z.B. neuer Run nach Game Over).
export const resetShopPurchases = (): void => {
  // Keine per-Node-Käufe mehr (Upgrades sind coin-limitiert) — No-op.
};
