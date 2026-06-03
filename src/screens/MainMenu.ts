import type { Screen } from '../router';
import { createRunState } from '../systems/run/RunState';
import { clearCurrentRun, setActiveEncounter, setCurrentRun } from '../systems/run/currentRun';
import { resetShopPurchases } from './Shop';
import { resetTreasureCollections } from './Treasure';
import { resetPerkSelections } from './PerkSelect';
import { isMuted, toggleMute } from '../systems/audio';
import { BG, bgUrl } from '../ui/backgrounds';

/**
 * Hauptmenü — 1:1-Port von design/project/screens/menu.jsx.
 * Klassen aus src/styles.css: cm-screen, cm-chip, cm-display, cm-label.
 * Restliches Styling inline, exakt wie im JSX-Original.
 */
type MenuAction = 'options' | 'credits' | 'quit';

export const MainMenu: Screen = (host, ctx) => {
  const items: ReadonlyArray<{ label: string; primary?: boolean; screen?: string; action?: MenuAction }> = [
    { label: 'Spielen', primary: true, screen: 'worldmap' },
    { label: 'Karten', screen: 'gallery' },
    { label: 'Optionen', action: 'options' },
    { label: 'Credits', action: 'credits' },
    { label: 'Beenden', action: 'quit' },
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
    <div class="cm-fit"><div class="cm-screen" style="display:flex; align-items:center; justify-content:center; background-image:${bgUrl(BG.menu!)}; background-size:cover; background-position:center;">
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
          <span>M Ton ${isMuted() ? 'an' : 'aus'}</span>
        </div>
      </div>

      <!-- Stub-Overlay für Optionen/Credits/Beenden -->
      <div data-slot="overlay" style="position:absolute; inset:0; z-index:10; display:none; align-items:center; justify-content:center; background:rgba(15,12,8,0.72);"></div>
    </div></div>
  `;

  // Alten Run beim Menü-Aufruf wegwerfen — verhindert Carry-Over zwischen Runs.
  clearCurrentRun();

  // Auswahl-Index für Tastatur-Navigation
  let selectedIdx = 0;

  const overlay = host.querySelector<HTMLElement>('[data-slot="overlay"]')!;
  const closeOverlay = (): void => {
    overlay.style.display = 'none';
    overlay.innerHTML = '';
  };
  const showOverlay = (html: string): void => {
    overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.querySelector<HTMLButtonElement>('[data-action="close"]')?.addEventListener('click', closeOverlay);
  };

  const openOptions = (): void => {
    showOverlay(`
      <div style="display:flex; flex-direction:column; align-items:center; gap:18px; min-width:360px; padding:24px; background:linear-gradient(180deg, var(--surface-2), var(--surface)); border:1px solid var(--line-hi); border-radius:6px;">
        <h2 class="cm-display" style="margin:0; font-size:36px; color:var(--gold-hi);">Optionen</h2>
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
          <span class="cm-label">Ton</span>
          <button class="cm-btn cm-btn--ghost" data-action="mute">${isMuted() ? 'Stumm — einschalten' : 'An — stummschalten'}</button>
        </div>
        <span class="cm-label" style="color:var(--ink-mute);">Weitere Optionen folgen.</span>
        <button class="cm-btn" data-action="close">Schließen</button>
      </div>
    `);
    const muteBtn = overlay.querySelector<HTMLButtonElement>('[data-action="mute"]')!;
    muteBtn.addEventListener('click', () => {
      toggleMute();
      openOptions();
    });
  };

  const openCredits = (): void => {
    showOverlay(`
      <div style="display:flex; flex-direction:column; align-items:center; gap:14px; min-width:420px; padding:28px; background:linear-gradient(180deg, var(--surface-2), var(--surface)); border:1px solid var(--line-hi); border-radius:6px; text-align:center;">
        <h2 class="cm-display" style="margin:0; font-size:36px; color:var(--gold-hi);">Credits</h2>
        <div style="display:flex; flex-direction:column; gap:8px; color:var(--ink-dim); font-family:'IBM Plex Sans', sans-serif; font-size:13px;">
          <span><strong style="color:var(--ink);">Chromatic</strong> — Pre-Alpha</span>
          <span>Design &amp; Code: Michel Waggoner</span>
          <span>Engine: TypeScript, Vite, DOM &amp; Canvas</span>
          <span>SFX: Prozedural via Web-Audio</span>
        </div>
        <button class="cm-btn" data-action="close">Schließen</button>
      </div>
    `);
  };

  const openQuit = (): void => {
    showOverlay(`
      <div style="display:flex; flex-direction:column; align-items:center; gap:14px; min-width:360px; padding:24px; background:linear-gradient(180deg, var(--surface-2), var(--surface)); border:1px solid var(--line-hi); border-radius:6px; text-align:center;">
        <h2 class="cm-display" style="margin:0; font-size:30px; color:var(--c-krieg);">Spiel beenden?</h2>
        <span class="cm-label" style="color:var(--ink-dim);">Im Browser: einfach den Tab schließen.</span>
        <button class="cm-btn" data-action="close">Doch weiter spielen</button>
      </div>
    `);
  };

  const activate = (idx: number): void => {
    const it = items[idx];
    if (!it) return;
    if (it.screen === 'worldmap') {
      resetShopPurchases();
      resetTreasureCollections();
      resetPerkSelections();
      setCurrentRun(createRunState(Date.now() & 0xffffffff));
      setActiveEncounter(null);
      // Vor der Weltkarte: Boss-Auswahl bestimmt die Akt-Farbe.
      ctx.go('bossselect');
      return;
    }
    if (it.screen) {
      ctx.go(it.screen);
      return;
    }
    if (it.action === 'options') openOptions();
    else if (it.action === 'credits') openCredits();
    else if (it.action === 'quit') openQuit();
  };

  const updateHighlight = (): void => {
    host.querySelectorAll<HTMLButtonElement>('button[data-menu-index]').forEach((b, i) => {
      const it = items[i]!;
      const sel = i === selectedIdx;
      b.style.color = sel || it.primary ? 'var(--gold-hi)' : 'var(--ink-dim)';
      b.style.transform = sel ? 'translateX(4px)' : 'translateX(0)';
    });
  };

  // Interaktivität: Klick + Hover
  const buttons = host.querySelectorAll<HTMLButtonElement>('button[data-menu-index]');
  buttons.forEach((btn) => {
    const idx = Number(btn.dataset.menuIndex);
    const it = items[idx];
    if (!it) return;
    btn.addEventListener('mouseenter', () => {
      selectedIdx = idx;
      updateHighlight();
    });
    btn.addEventListener('click', () => activate(idx));
  });
  updateHighlight();

  // Keyboard-Navigation
  const onKey = (e: KeyboardEvent): void => {
    // Overlay offen → ESC schließt es, sonst keine Menü-Navigation.
    if (overlay.style.display === 'flex') {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeOverlay();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = (selectedIdx + 1) % items.length;
      updateHighlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = (selectedIdx - 1 + items.length) % items.length;
      updateHighlight();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate(selectedIdx);
    } else if (import.meta.env.DEV && (e.key === 'd' || e.key === 'D')) {
      // Dev-Shortcut: D startet die Combat-Sandbox.
      ctx.go('combat');
    }
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
};
