import type { Screen } from '../router';
import { loadMeta } from '../systems/save/MetaSave';
import { ACHIEVEMENTS } from '../systems/meta/achievements';
import { BG, bgUrl, fitBg } from '../ui/backgrounds';

export const Stats: Screen = (host, ctx) => {
  const meta = loadMeta();
  const unlocked = new Set(meta.achievements);

  const statRows: Array<[string, string]> = [
    ['Runs gestartet', String(meta.runsStarted)],
    ['Niederlagen', String(meta.runsEnded)],
    ['Bosse besiegt', String(meta.bossesBeaten)],
    ['Höchster Akt', meta.highestActReached > 0 ? `Akt ${meta.highestActReached}` : '—'],
    ['Meiste Coins', String(meta.bestCoins)],
    ['Meiste Räume / Run', String(meta.bestRoomsVisited)],
  ];

  const statsHtml = statRows
    .map(
      ([label, val]) => `
      <div style="display:flex; justify-content:space-between; gap:24px; padding:8px 0; border-bottom:1px solid var(--line);">
        <span class="cm-label" style="color:var(--ink-mute);">${label}</span>
        <span style="font-family:'JetBrains Mono', monospace; font-size:14px; color:var(--gold-hi);">${val}</span>
      </div>`,
    )
    .join('');

  const achHtml = ACHIEVEMENTS.map((a) => {
    const got = unlocked.has(a.id);
    return `
      <div style="display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:6px;
        background:${got ? 'linear-gradient(180deg, var(--surface-2), var(--surface))' : 'rgba(255,255,255,0.02)'};
        border:1px solid ${got ? 'var(--gold-deep)' : 'var(--line)'}; opacity:${got ? '1' : '0.55'};">
        <div style="font-size:22px; line-height:1; filter:${got ? 'none' : 'grayscale(1)'};">${got ? '🏆' : '🔒'}</div>
        <div style="display:flex; flex-direction:column; gap:2px;">
          <span style="font-weight:600; font-size:13px; color:${got ? 'var(--gold-hi)' : 'var(--ink-dim)'};">${a.name}</span>
          <span style="font-size:11px; color:var(--ink-dim);">${a.desc}</span>
        </div>
      </div>`;
  }).join('');

  const unlockedCount = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length;

  host.innerHTML = `
    <div class="cm-fit" style="${fitBg(bgUrl(BG.menu!))}"><div class="cm-screen" style="display:flex; flex-direction:column;">
      <div class="cm-hud">
        <div class="cm-hud-left">
          <button class="cm-btn cm-btn--ghost" data-action="back" style="padding:6px 10px;">◀ Zurück</button>
          <div class="cm-act">
            <span class="cm-act-label">Karriere</span>
            <span class="cm-act-name">Statistiken</span>
          </div>
        </div>
        <div class="cm-hud-right">
          <span class="cm-label">Achievements ${unlockedCount} / ${ACHIEVEMENTS.length}</span>
        </div>
      </div>

      <div style="position:absolute; inset:84px 40px 28px 40px; display:flex; gap:36px; align-items:stretch;">
        <div style="flex:0 0 360px; display:flex; flex-direction:column; gap:6px;">
          <span class="cm-label" style="margin-bottom:6px;">Übersicht</span>
          ${statsHtml}
        </div>
        <div style="flex:1; display:flex; flex-direction:column; gap:8px; min-height:0;">
          <span class="cm-label" style="margin-bottom:2px;">Achievements</span>
          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; overflow-y:auto; padding-right:6px;">
            ${achHtml}
          </div>
        </div>
      </div>
    </div></div>
  `;

  host.querySelector<HTMLButtonElement>('[data-action="back"]')!.addEventListener('click', () => {
    ctx.go('menu');
  });
};
