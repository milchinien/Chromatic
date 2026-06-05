import type { Screen } from '../router';
import { getCurrentRun } from '../systems/run/currentRun';
import { sfx } from '../systems/audio';

/**
 * Run-Start-Interstitial. Liegt zwischen „Spielen" und der Boss-Auswahl, damit
 * der Sprung ins Spiel eine bewusste Schwelle bekommt statt eines harten Cuts:
 * die fünf Farbsigillen leuchten gestaffelt auf, ein Lade-Balken läuft, dann
 * geht es automatisch weiter. Per Klick / Enter / Esc überspringbar.
 */
const COLORS = ['natur', 'krieg', 'stein', 'untot', 'farblos'] as const;
const HOLD_MS = 1500;

export const RunIntro: Screen = (host, ctx) => {
  const run = getCurrentRun();
  // Defensiv: ohne aktiven Run gibt es nichts zu starten → zurück ins Menü.
  if (!run) {
    ctx.go('menu');
    return;
  }

  const sigils = COLORS.map(
    (c, i) =>
      `<span class="cm-chip cm-chip--${c} ri-sigil" style="--ri-i:${i}; width:22px; height:22px;"></span>`,
  ).join('');

  host.innerHTML = `
    <div class="cm-fit">
      <div class="cm-screen" style="display:flex; align-items:center; justify-content:center;">
        <div class="ri-wrap">
          <div class="cm-label ri-act" style="color:var(--gold);">Akt ${run.actNumber}</div>
          <div class="ri-sigils">${sigils}</div>
          <h2 class="cm-display ri-title">Der Magierat erwacht</h2>
          <div class="ri-bar"><span class="ri-bar-fill"></span></div>
          <div class="cm-label ri-hint">Klicken zum Überspringen</div>
        </div>
      </div>
    </div>
  `;

  // Dezenter aufsteigender Akkord beim Eintauchen.
  sfx.perk();

  let done = false;
  const proceed = (): void => {
    if (done) return;
    done = true;
    ctx.go('bossselect');
  };

  const timer = window.setTimeout(proceed, HOLD_MS);

  const onClick = (): void => proceed();
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      proceed();
    }
  };
  host.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);

  return () => {
    window.clearTimeout(timer);
    host.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
  };
};
