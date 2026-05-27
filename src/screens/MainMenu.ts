import type { Screen } from '../router';
import { createRunState } from '../systems/run/RunState';
import { clearCurrentRun, setActiveEncounter, setCurrentRun } from '../systems/run/currentRun';
import { resetShopPurchases } from './Shop';
import { resetTreasureCollections } from './Treasure';
import { resetPerkSelections } from './PerkSelect';

/**
 * Hauptmenü — 1:1-Port von design/project/screens/menu.jsx.
 * Klassen aus src/styles.css: cm-screen, cm-chip, cm-display, cm-label.
 * Restliches Styling inline, exakt wie im JSX-Original.
 */
export const MainMenu: Screen = (host, ctx) => {
  const items: ReadonlyArray<{ label: string; primary?: boolean; screen?: string }> = [
    { label: 'Spielen', primary: true, screen: 'worldmap' },
    { label: 'Optionen' },
    { label: 'Credits' },
    { label: 'Beenden' },
  ];

  const chips = ['natur', 'krieg', 'stein', 'untot', 'farblos']
    .map((c) => `<span class="cm-chip cm-chip--${c}" style="width:14px;height:14px"></span>`)
    .join('');

  const menuButtons = items
    .map(
      (it, i) => `
      <button
        data-menu-index="${i}"
        style="
          background:${it.primary ? 'linear-gradient(180deg, #2c2218, #1a130c)' : 'transparent'};
          border:none;
          border-top:1px solid ${it.primary ? 'var(--gold-deep)' : 'var(--line)'};
          border-bottom:1px solid ${it.primary ? 'var(--gold-deep)' : 'var(--line)'};
          padding:16px 24px;
          color:${it.primary ? 'var(--gold-hi)' : 'var(--ink-dim)'};
          font-family:'Cinzel', serif;
          font-size:16px;
          letter-spacing:0.28em;
          text-transform:uppercase;
          cursor:pointer;
          display:flex; align-items:center; justify-content:space-between;
          text-align:left;
          transition: color .15s;
        "
      >
        <span>${it.label}</span>
        ${
          it.primary
            ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg>`
            : ''
        }
      </button>`,
    )
    .join('');

  host.innerHTML = `
    <div class="cm-fit"><div class="cm-screen" style="display:flex; align-items:center; justify-content:center;">
      <svg style="position:absolute; inset:0; width:100%; height:100%;" preserveAspectRatio="none" viewBox="0 0 1280 800">
        <defs>
          <radialGradient id="mm-glow" cx="50%" cy="20%" r="60%">
            <stop offset="0%" stop-color="rgba(214,169,85,.18)"/>
            <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
          </radialGradient>
          <linearGradient id="mm-rune" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="rgba(214,169,85,0)"/>
            <stop offset="50%" stop-color="rgba(214,169,85,.6)"/>
            <stop offset="100%" stop-color="rgba(214,169,85,0)"/>
          </linearGradient>
        </defs>
        <rect width="1280" height="800" fill="url(#mm-glow)"/>
        <g stroke="rgba(214,169,85,.4)" stroke-width="1" fill="none">
          <path d="M40 40 L80 40 M40 40 L40 80"/>
          <path d="M1240 40 L1200 40 M1240 40 L1240 80"/>
          <path d="M40 760 L80 760 M40 760 L40 720"/>
          <path d="M1240 760 L1200 760 M1240 760 L1240 720"/>
        </g>
        <line x1="100" y1="120" x2="100" y2="680" stroke="url(#mm-rune)"/>
        <line x1="1180" y1="120" x2="1180" y2="680" stroke="url(#mm-rune)"/>
      </svg>

      <div style="position:relative; text-align:center; display:flex; flex-direction:column; align-items:center; gap:64px;">
        <div style="position:absolute; top:-220px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:14px; white-space:nowrap;">
          <span style="width:60px; height:1px; background:linear-gradient(90deg, transparent, var(--gold));"></span>
          <span class="cm-label" style="color:var(--gold);">v 0.1 · Pre-Alpha</span>
          <span style="width:60px; height:1px; background:linear-gradient(90deg, var(--gold), transparent);"></span>
        </div>

        <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
          <div style="display:flex; gap:6px; margin-bottom:14px;">${chips}</div>
          <h1 class="cm-display" style="margin:0; font-size:96px; line-height:1; color:var(--ink); text-shadow:0 0 40px rgba(214,169,85,.3);">Chromatic</h1>
          <div style="display:flex; align-items:center; gap:18px; margin-top:4px;">
            <span style="width:80px; height:1px; background:var(--line-hi);"></span>
            <span style="font-family:'Cinzel', serif; letter-spacing:0.4em; font-size:11px; color:var(--ink-dim); text-transform:uppercase;">Ein Roguelite des Magierats</span>
            <span style="width:80px; height:1px; background:var(--line-hi);"></span>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:2px; width:280px;">
          ${menuButtons}
        </div>

        <div style="display:flex; gap:24px; color:var(--ink-mute); font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.2em; text-transform:uppercase;">
          <span>↑↓ Auswählen</span>
          <span>↵ Bestätigen</span>
          <span>ESC Zurück</span>
        </div>
      </div>
    </div></div>
  `;

  // Alten Run beim Menü-Aufruf wegwerfen — verhindert Carry-Over zwischen Runs.
  clearCurrentRun();

  // Interaktivität
  const buttons = host.querySelectorAll<HTMLButtonElement>('button[data-menu-index]');
  buttons.forEach((btn) => {
    const idx = Number(btn.dataset.menuIndex);
    const it = items[idx];
    if (!it) return;
    btn.addEventListener('mouseenter', () => {
      btn.style.color = 'var(--gold-hi)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.color = it.primary ? 'var(--gold-hi)' : 'var(--ink-dim)';
    });
    btn.addEventListener('click', () => {
      if (it.screen === 'worldmap') {
        // SPIELEN → frischer Run mit zufälligem Seed.
        // Per-Node-Caches (Shop-Käufe, Treasure-Drops) explizit resetten,
        // damit ein neuer Run garantiert frisch ist — auch wenn ein vorheriger
        // Run gleiche Node-IDs hatte.
        resetShopPurchases();
        resetTreasureCollections();
        resetPerkSelections();
        setCurrentRun(createRunState(Date.now() & 0xffffffff));
        setActiveEncounter(null);
      }
      if (it.screen) ctx.go(it.screen);
    });
  });

  // Dev-Shortcut: D startet die Combat-Sandbox (nur im Vite-Dev-Build).
  const onKey = (e: KeyboardEvent): void => {
    if (import.meta.env.DEV && (e.key === 'd' || e.key === 'D')) {
      ctx.go('combat');
    }
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
};
