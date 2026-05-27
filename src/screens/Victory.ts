import type { Screen } from '../router';
import { clearCurrentRun, getCurrentRun } from '../systems/run/currentRun';

export const Victory: Screen = (host, ctx) => {
  const run = getCurrentRun();
  const visited = run?.visitedNodes.size ?? 0;
  const coins = run?.coins ?? 0;

  host.innerHTML = `
    <div class="cm-fit"><div class="cm-screen" style="display:flex; align-items:center; justify-content:center;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:24px;">
        <span class="cm-label" style="color:var(--gold-hi);">Akt ${run?.actNumber ?? 1} geschafft</span>
        <h1 class="cm-display" style="margin:0; font-size:96px; color:var(--gold-hi); text-shadow:0 0 40px rgba(214,169,85,.5);">Triumph</h1>
        <p style="font-family:'IBM Plex Sans', sans-serif; color:var(--ink-dim); max-width:520px; text-align:center; margin:0;">
          Der Endboss ist gefallen. Weitere Akte erscheinen in einer späteren Phase.
        </p>
        <div style="display:grid; grid-template-columns: auto auto; gap: 10px 20px; margin-top:8px; font-family:'JetBrains Mono', monospace; font-size:13px; color:var(--ink-dim);">
          <span style="color:var(--ink-mute);">Räume besucht</span><span>${visited}</span>
          <span style="color:var(--ink-mute);">Coins gesammelt</span><span style="color:var(--gold-hi);">${coins}</span>
          <span style="color:var(--ink-mute);">Deck-Größe</span><span>${run?.deck.length ?? 0}</span>
          <span style="color:var(--ink-mute);">Verbleibende HP</span><span style="color:var(--c-natur);">${run?.baseHp ?? 0} / ${run?.maxBaseHp ?? 100}</span>
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
