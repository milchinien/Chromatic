import type { Screen } from '../router';
import { getCurrentRun } from '../systems/run/currentRun';
import { markNodeVisited } from '../systems/run/RunState';
import { sfx } from '../systems/audio';
import { PERKS, applyPerkOnChoose } from '../systems/data/perks';
import { mulberry32 } from '../systems/rng';
import type { Perk } from '../domain/Run';
import { BG, bgUrl } from '../ui/backgrounds';

const NUM_OFFERS = 3;

// Pro Welt-Knoten gespeicherte Auswahl, damit der Spieler bei Wiederbetreten
// dieselben 3 Perks sieht (verhindert Re-Roll-Cheese). Linear-DAG bedeutet
// theoretisch kein Wiederbetreten, aber das Pattern ist konsistent mit Shop/Treasure.
const cachedOffersByNode = new Map<string, string[]>();
const chosenByNode = new Map<string, string>();

const seedFromKey = (runSeed: number, key: string): number => {
  let h = runSeed >>> 0;
  for (let i = 0; i < key.length; i++) h = ((h * 31) ^ key.charCodeAt(i)) >>> 0;
  return h;
};

const pickN = <T,>(arr: readonly T[], n: number, rng: () => number): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a.slice(0, Math.min(n, a.length));
};

export const PerkSelect: Screen = (host, ctx) => {
  const run = getCurrentRun();
  if (!run) {
    queueMicrotask(() => ctx.go('menu'));
    host.innerHTML = '';
    return;
  }

  const nodeId = run.currentNodeId;
  const already = chosenByNode.get(nodeId);

  // Per-Seed deterministisch — bereits gewählte Perks aus Pool ausschließen,
  // damit Stacking-Variation natürlich wirkt.
  let offerIds = cachedOffersByNode.get(nodeId);
  if (!offerIds) {
    const rng = mulberry32(seedFromKey(run.seed, nodeId));
    const ownedIds = new Set(run.activePerks.map((p) => p.id));
    const available = PERKS.filter((p) => !ownedIds.has(p.id));
    const pool = available.length >= NUM_OFFERS ? available : PERKS;
    offerIds = pickN(pool, NUM_OFFERS, rng).map((p) => p.id);
    cachedOffersByNode.set(nodeId, offerIds);
  }
  const offers = offerIds
    .map((id) => PERKS.find((p) => p.id === id))
    .filter((p): p is (typeof PERKS)[number] => !!p);

  let selectedIdx = already ? offers.findIndex((p) => p.id === already) : -1;

  host.innerHTML = `
    <div class="cm-fit"><div class="cm-screen" style="background-image:${bgUrl(BG.perk!)}; background-size:cover; background-position:center;">
      <div class="cm-hud">
        <div class="cm-hud-left">
          <div class="cm-act">
            <span class="cm-act-label">AKT 0${run.actNumber} · ZAUBER-RAUM</span>
            <span class="cm-act-name">Heiligtum der Wahl</span>
          </div>
        </div>
        <div class="cm-hud-right">
          <div class="cm-hp-pill">
            <span class="cm-hp-dot"></span>
            <span><span>${run.baseHp}</span><span style="opacity:0.5;"> / ${run.maxBaseHp}</span></span>
          </div>
          <div class="cm-coin">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold-hi)" stroke-width="1.6">
              <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>
            </svg>
            <span class="cm-coin-val">${run.coins}</span>
          </div>
        </div>
      </div>

      <!-- Dekorativer Ritualkreis -->
      <svg style="position:absolute; top:50%; left:50%; width:680px; height:680px; transform:translate(-50%, -50%); pointer-events:none; opacity:0.18;" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke="var(--gold)" stroke-width="0.4"/>
        <circle cx="50" cy="50" r="36" fill="none" stroke="var(--gold)" stroke-width="0.3"/>
        <circle cx="50" cy="50" r="24" fill="none" stroke="var(--gold)" stroke-width="0.2"/>
        ${[0, 72, 144, 216, 288].map((a) => {
          const rad = (a - 90) * (Math.PI / 180);
          const x = 50 + Math.cos(rad) * 48;
          const y = 50 + Math.sin(rad) * 48;
          return `<line x1="50" y1="50" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="var(--gold)" stroke-width="0.25"/>`;
        }).join('')}
      </svg>

      <div style="position:absolute; inset:120px 56px 80px 56px; display:grid; grid-template-columns: 1fr 360px; gap:32px; z-index:1;">
        <!-- Sockel -->
        <div style="display:flex; flex-direction:column; gap:14px;">
          <div>
            <span class="cm-label">Drei Pfade · eine Wahl</span>
            <h2 class="cm-title" style="margin:6px 0 0; font-size:24px; color:var(--ink);">Wähle einen Zauber</h2>
          </div>
          <div data-slot="offers" style="display:grid; grid-template-columns: repeat(${NUM_OFFERS}, 1fr); gap:18px; align-items:end; flex:1;"></div>
          <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:10px;">
            <button class="cm-btn cm-btn--gold" data-action="confirm" disabled>Bestätigen</button>
          </div>
        </div>

        <!-- Info-Panel -->
        <div style="background:linear-gradient(180deg, var(--surface-2), var(--surface)); border:1px solid var(--line-hi); border-radius:4px; padding:18px; display:flex; flex-direction:column; gap:14px;">
          <div class="cm-label">Perk-Info</div>
          <div data-slot="info-content" style="font-family:'IBM Plex Sans', sans-serif; font-size:13px; color:var(--ink-dim); min-height:200px; display:flex; align-items:center; justify-content:center; text-align:center;">
            Hover oder klicke einen Sockel für Details.
          </div>
          <div style="border-top:1px solid var(--line-soft); padding-top:14px;">
            <div class="cm-label">Aktive Perks (${run.activePerks.length})</div>
            <div data-slot="active-perks" style="display:flex; flex-direction:column; gap:6px; margin-top:6px; font-family:'JetBrains Mono', monospace; font-size:11px; color:var(--ink-dim);">
              ${
                run.activePerks.length === 0
                  ? '<span style="color:var(--ink-mute); font-style:italic;">Noch keine.</span>'
                  : run.activePerks
                      .map(
                        (p) =>
                          `<div style="display:flex; align-items:center; gap:8px;"><span style="color:${p.color}; font-size:14px;">${p.glyph}</span><span>${p.name}</span></div>`,
                      )
                      .join('')
              }
            </div>
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

  const renderInfo = (idx: number): void => {
    const perk = offers[idx];
    const info = $('info-content');
    if (!perk) {
      info.innerHTML = 'Hover oder klicke einen Sockel für Details.';
      info.style.alignItems = 'center';
      info.style.justifyContent = 'center';
      info.style.textAlign = 'center';
      return;
    }
    info.style.alignItems = 'stretch';
    info.style.justifyContent = 'flex-start';
    info.style.textAlign = 'left';
    info.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div style="display:flex; align-items:center; gap:14px;">
          <div style="
            width:60px; height:60px; border-radius:50%;
            background: radial-gradient(circle at 50% 35%, ${perk.color}55, transparent 70%);
            display:flex; align-items:center; justify-content:center;
            font-size:36px; color:${perk.color}; text-shadow: 0 0 16px ${perk.color};
          ">${perk.glyph}</div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <h3 class="cm-display" style="margin:0; font-size:20px; color:var(--ink);">${perk.name}</h3>
            <span class="cm-label">Permanenter Perk</span>
          </div>
        </div>
        <div style="background:var(--bg-2); border:1px solid var(--line-soft); padding:10px 12px; font-size:13px; color:var(--ink);">
          ${perk.description}
        </div>
      </div>
    `;
  };

  const renderOffers = (): void => {
    const host_ = $('offers');
    host_.replaceChildren();
    offers.forEach((perk, idx) => {
      const isSel = idx === selectedIdx;
      const isOwned = run.activePerks.some((p) => p.id === perk.id);
      const card = document.createElement('button');
      card.type = 'button';
      card.dataset.perkId = perk.id;
      card.style.cssText = `
        position:relative; background:linear-gradient(180deg, ${perk.color}22, var(--surface));
        border:2px solid ${isSel ? perk.color : 'var(--line-hi)'};
        border-radius:6px; padding:24px 18px; cursor:pointer;
        display:flex; flex-direction:column; align-items:center; gap:12px;
        aspect-ratio: 3/4;
        transition: transform 150ms;
        ${isSel ? `transform: translateY(-12px); box-shadow: 0 0 32px ${perk.color}44, var(--shadow);` : ''}
        ${isOwned ? 'opacity:0.55;' : ''}
      `;
      card.innerHTML = `
        <span class="cm-label">PERK</span>
        <div style="
          width:90px; height:90px; border-radius:50%;
          background: radial-gradient(circle at 50% 35%, ${perk.color}66, transparent 70%);
          display:flex; align-items:center; justify-content:center;
          font-size:44px; color:${perk.color}; text-shadow: 0 0 18px ${perk.color};
        ">${perk.glyph}</div>
        <h3 class="cm-display" style="margin:0; font-size:15px; color:var(--ink); text-align:center;">${perk.name}</h3>
        <p style="font-family:'IBM Plex Sans', sans-serif; font-size:12px; color:var(--ink-dim); text-align:center; margin:0; line-height:1.4;">${perk.description}</p>
        ${isOwned ? '<span class="cm-label" style="color:var(--ink-mute);">BEREITS AKTIV</span>' : ''}
      `;
      card.addEventListener('mouseenter', () => renderInfo(idx));
      card.addEventListener('click', () => {
        selectedIdx = idx;
        renderOffers();
        renderInfo(idx);
        updateConfirm();
      });
      host_.appendChild(card);
    });
  };

  const updateConfirm = (): void => {
    const btn = host.querySelector<HTMLButtonElement>('[data-action="confirm"]');
    if (!btn) return;
    btn.disabled = selectedIdx < 0;
  };

  renderOffers();
  if (selectedIdx >= 0) renderInfo(selectedIdx);

  host.querySelector<HTMLButtonElement>('[data-action="confirm"]')!.addEventListener('click', () => {
    if (selectedIdx < 0) return;
    const perk = offers[selectedIdx];
    if (!perk) return;
    // In den RunState übernehmen — nur Daten-Felder, keine Funktions-Pointer.
    const stored: Perk = {
      id: perk.id,
      name: perk.name,
      description: perk.description,
      glyph: perk.glyph,
      color: perk.color,
    };
    run.activePerks.push(stored);
    // Permanente Effekte auf Run-State sofort anwenden (z.B. base_hp_plus_20
    // erhöht run.maxBaseHp + heilt). Side-Effekte folgen beim nächsten Combat.
    applyPerkOnChoose(stored, run);
    chosenByNode.set(nodeId, perk.id);
    // Perk-Knoten abgeschlossen.
    markNodeVisited(run, run.currentNodeId);
    sfx.perk();
    ctx.go('worldmap');
  });
};

/** Reset für neuen Run (Menü). */
export const resetPerkSelections = (): void => {
  cachedOffersByNode.clear();
  chosenByNode.clear();
};
