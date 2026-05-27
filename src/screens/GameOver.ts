import type { Screen } from '../router';
import { clearCurrentRun, getCurrentRun } from '../systems/run/currentRun';

export const GameOver: Screen = (host, ctx) => {
  const run = getCurrentRun();
  const visited = run?.visitedNodes.size ?? 0;
  const coins = run?.coins ?? 0;

  host.innerHTML = `
    <div class="cm-fit"><div class="cm-screen" style="display:flex; align-items:center; justify-content:center;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:24px;">
        <span class="cm-label" style="color:var(--c-krieg);">Akt ${run?.actNumber ?? 1} · Run beendet</span>
        <h1 class="cm-display" style="margin:0; font-size:96px; color:var(--c-krieg); text-shadow:0 0 40px rgba(200,85,61,.5);">Niederlage</h1>
        <div style="display:grid; grid-template-columns: auto auto; gap: 10px 20px; margin-top:8px; font-family:'JetBrains Mono', monospace; font-size:13px; color:var(--ink-dim);">
          <span style="color:var(--ink-mute);">Räume besucht</span><span>${visited}</span>
          <span style="color:var(--ink-mute);">Coins gesammelt</span><span style="color:var(--gold-hi);">${coins}</span>
          <span style="color:var(--ink-mute);">Deck-Größe</span><span>${run?.deck.length ?? 0}</span>
        </div>
        <div style="display:flex; gap:14px; margin-top:24px;">
          <button class="cm-btn cm-btn--gold" data-action="menu">Zurück zum Hauptmenü</button>
        </div>
      </div>
    </div></div>
  `;

  host.querySelector<HTMLButtonElement>('[data-action="menu"]')!.addEventListener('click', () => {
    clearCurrentRun();
    ctx.go('menu');
  });
};
