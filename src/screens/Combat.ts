import type { Screen } from '../router';
import type { Card } from '../domain/Card';
import type { DeckEntry } from '../domain/Run';
import { advance } from '../systems/combat/advance';
import {
  createCombatState,
  type CombatState,
  type DrawnCard,
  logEvent,
} from '../systems/combat/CombatState';
import { RoundSystem } from '../systems/combat/RoundSystem';
import {
  RARITY_COLOR,
  RARITY_LABEL,
  applyAdvantage,
  rollAdvantages,
  type RolledAdvantage,
} from '../systems/combat/ExpSystem';
import { mulberry32 } from '../systems/rng';
import { sandboxEnemyDeck, sandboxPlayerDeck } from '../systems/data/starterDeck';
import { getActiveEncounter, getCurrentRun, setActiveEncounter } from '../systems/run/currentRun';
import {
  addCoins,
  advanceToNextAct,
  cardLevel,
  damageBase,
  exitRoom,
  isInRoom,
  markNodeVisited,
  upgradeCard,
} from '../systems/run/RunState';
import { encounterDeck } from '../systems/data/encounters';
import { applyPerkOnCombatMount } from '../systems/data/perks';
import { sfx, isMuted } from '../systems/audio';
import {
  DAMAGE_NUMBER_LIFE_SEC,
  DEATH_ANIM_SEC,
  EXP_THRESHOLDS,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  PICK_COUNT,
  PLAY_COUNT,
  SPAWN_FLASH_SEC,
} from '../systems/data/balance';
import { colorToCss, COLORS_CSS } from '../systems/data/designTokens';
import { renderCardView } from '../ui/CardView';
import { renderHpBar } from '../ui/HpBar';
import { renderManaBar } from '../ui/ManaBar';
import { bgUrl, combatBgForAct } from '../ui/backgrounds';

/**
 * Combat-Screen — RUNDENBASIERT.
 * Ablauf pro Runde: Banner „Runde N" → 5 verdeckte Karten (blind 3 picken)
 * → 2 der 3 spielen → Echtzeit-Gefecht bis Feld leer → nächste Runde.
 * Mana ist Platzhalter (sichtbar, gated nichts). Sieg/Niederlage = Base-HP 0.
 */
/** Combo-Hinweis für die 2 gewählten Karten (geteilte Farbe/Klasse → Armee-Buff). */
const comboHintText = (picked: DrawnCard[], sel: number[]): string => {
  const a = picked[sel[0]!];
  const b = picked[sel[1]!];
  if (!a || !b) return `Spiele 2 Karten`;
  const parts: string[] = [];
  if (a.card.color !== 'farblos' && a.card.color === b.card.color) parts.push(`Farbe ${a.card.color}`);
  if (a.card.class === b.card.class) parts.push(`Klasse ${a.card.class}`);
  return parts.length
    ? `Combo aktiv: ${parts.join(' + ')} → Armee-Buff`
    : `Keine Combo — verschiedene Farbe & Klasse`;
};

export const Combat: Screen = (host, ctx) => {
  const run = getCurrentRun();
  const encounter = getActiveEncounter();
  const sandboxMode = !run || !encounter;
  const isBossEncounter = encounter?.id.startsWith('boss_') === true;
  const isMiniBossEncounter = encounter?.id.startsWith('mini_boss_') === true;

  const rng = mulberry32(Date.now() & 0xffffffff);

  const toEntries = (cards: Card[], levelOf: (id: string) => number): DeckEntry[] =>
    cards.map((c) => ({ card: c, level: levelOf(c.id) }));

  const buildPlayerDeck = (): DeckEntry[] =>
    sandboxMode
      ? toEntries(sandboxPlayerDeck(), () => 1)
      : toEntries(run!.deck, (id) => cardLevel(run!, id));

  const buildEnemyDeck = (): DeckEntry[] => {
    const enemyLevel = sandboxMode
      ? 1
      : Math.max(1, run!.actNumber + (isBossEncounter || isMiniBossEncounter ? 1 : 0));
    const cards = sandboxMode ? sandboxEnemyDeck() : encounterDeck(encounter!);
    return toEntries(cards, () => enemyLevel);
  };

  let state: CombatState = createCombatState(buildPlayerDeck(), buildEnemyDeck(), rng);

  if (!sandboxMode && run) {
    state.player.baseHp = run.baseHp;
    state.player.maxBaseHp = run.maxBaseHp;
    for (const perk of run.activePerks) applyPerkOnCombatMount(perk, state.player);
  }

  const combatBgFile = combatBgForAct(run?.actNumber ?? 1, isBossEncounter);
  host.innerHTML = `
    <div class="cm-fit"><div class="cm-screen cm-combat" style="display:flex; flex-direction:column; background-image:${bgUrl(combatBgFile)}; background-size:cover; background-position:center;">
      <div class="cm-combat-hud" style="
        position:absolute; top:0; left:0; right:0; padding:18px 28px;
        display:flex; justify-content:space-between; align-items:flex-start; z-index:5;
      ">
        <div data-slot="player-side" style="display:flex; flex-direction:column; gap:6px; min-width:280px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:var(--c-natur); font-size:18px;">🛡</span>
            <span class="cm-label" style="color:var(--c-natur);">Freundliche Base</span>
          </div>
          <div data-slot="player-hp-bar"></div>
          <div data-slot="player-hp-text" style="font-family:'JetBrains Mono', monospace; font-size:11px; color:var(--ink-dim);"></div>
        </div>

        <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
          <span class="cm-label" data-slot="round-label">Runde 1</span>
          <div data-slot="timer" style="
            font-family:'JetBrains Mono', monospace; font-size:18px; color:var(--gold-hi);
            padding:4px 14px; background: linear-gradient(180deg, var(--surface-2), var(--surface));
            border:1px solid var(--line-hi); border-radius:2px; letter-spacing:0.1em;
          ">00:00</div>
          <span class="cm-label" data-slot="hint">ESC PAUSE · M MENÜ</span>
        </div>

        <div data-slot="enemy-side" style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; min-width:280px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="cm-label" style="color:var(--c-krieg);">Feindliche Base</span>
            <span style="color:var(--c-krieg); font-size:18px;">☠</span>
          </div>
          <div data-slot="enemy-hp-bar"></div>
          <div data-slot="enemy-hp-text" style="font-family:'JetBrains Mono', monospace; font-size:11px; color:var(--ink-dim);"></div>
        </div>
      </div>

      <div style="position:absolute; top:104px; left:50%; transform:translateX(-50%); width:320px; display:flex; flex-direction:column; gap:4px; align-items:center; z-index:5;">
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <span class="cm-label">Stufe <span data-slot="player-level">1</span> · EXP</span>
          <span class="cm-label" data-slot="exp-text">0 / 5</span>
        </div>
        <div data-slot="exp-bar" style="width:100%; height:5px; background:#1a130c; border-radius:1px; overflow:hidden;">
          <div data-slot="exp-fill" style="height:100%; width:0%; background:var(--gold); transition: width 120ms linear;"></div>
        </div>
      </div>

      <div style="position:absolute; top:160px; left:50%; transform:translateX(-50%); width:${FIELD_WIDTH}px; height:${FIELD_HEIGHT + 80}px; z-index:1;">
        <canvas data-slot="canvas" width="${FIELD_WIDTH}" height="${FIELD_HEIGHT + 80}" style="
          width:${FIELD_WIDTH}px; height:${FIELD_HEIGHT + 80}px; background: transparent;
        "></canvas>
      </div>

      <!-- Runden-Banner -->
      <div data-slot="banner" style="
        position:absolute; top:200px; left:0; right:0; text-align:center; z-index:8;
        pointer-events:none; display:none;
      ">
        <div class="cm-display" style="font-size:88px; color:var(--gold-hi); text-shadow:0 0 40px rgba(214,169,85,0.6);"></div>
      </div>

      <div style="
        position:absolute; bottom:0; left:0; right:0; height:320px;
        background: linear-gradient(180deg, transparent, #0f0c08 60%);
        border-top:1px solid var(--line-hi);
        display:grid; grid-template-columns: 300px 1fr 300px; gap:24px; padding:18px 32px;
        z-index:4;
      ">
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:var(--mana); font-size:18px;">💧</span>
              <span class="cm-label">Mana (Platzhalter)</span>
            </div>
            <span data-slot="mana-num" style="font-family:'JetBrains Mono', monospace; font-size:22px; color:var(--mana); font-weight:600;">0/20</span>
          </div>
          <div data-slot="mana-bar"></div>
        </div>

        <!-- Phasen-Tray: Banner-Hinweis / Draw (5) / Select (3) -->
        <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
          <div class="cm-label" data-slot="phase-hint" style="min-height:14px;"></div>
          <div style="display:flex; align-items:flex-end; justify-content:center; gap:12px; min-height:200px;" data-slot="tray"></div>
          <button class="cm-btn cm-btn--gold" data-slot="confirm-btn" style="display:none;">Ins Gefecht (2)</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; gap:8px;">
            <div style="flex:1; background:var(--surface); border:1px solid var(--line); padding:8px 12px; border-radius:2px;" title="Deck-Pool — wird beim Ziehen NICHT aufgebraucht.">
              <div class="cm-label">Deck</div>
              <div data-slot="deck-count" style="font-family:'JetBrains Mono', monospace; font-size:16px; color:var(--ink);">0</div>
            </div>
            <div style="flex:1; background:var(--surface); border:1px solid var(--line); padding:8px 12px; border-radius:2px;">
              <div class="cm-label">Truppen im Feld</div>
              <div data-slot="field-count" style="font-family:'JetBrains Mono', monospace; font-size:16px; color:var(--ink);">0</div>
            </div>
          </div>
          <div style="background:var(--surface); border:1px solid var(--line); padding:8px 12px; border-radius:2px; height:140px; overflow:hidden;">
            <div class="cm-label">Event-Log</div>
            <div data-slot="log" style="font-family:'JetBrains Mono', monospace; font-size:10px; color:var(--ink-dim); line-height:1.5; margin-top:4px;"></div>
          </div>
        </div>
      </div>

      <div data-slot="overlay" style="position:absolute; inset:0; z-index:10; display:none;"></div>
    </div></div>
  `;

  const $ = <T extends HTMLElement = HTMLElement>(slot: string): T => {
    const el = host.querySelector<T>(`[data-slot="${slot}"]`);
    if (!el) throw new Error(`Missing slot: ${slot}`);
    return el;
  };

  const playerHp = renderHpBar({ width: 280, color: COLORS_CSS.hp });
  $('player-hp-bar').appendChild(playerHp.el);
  const enemyHp = renderHpBar({ width: 280, color: COLORS_CSS.hpBad });
  $('enemy-hp-bar').appendChild(enemyHp.el);
  const manaBar = renderManaBar(280);
  $('mana-bar').appendChild(manaBar.el);

  const canvas = $('canvas') as HTMLCanvasElement;
  const cctx = canvas.getContext('2d')!;

  // === Phasen-Tray (Draw/Select) ===
  let lastTrayKey = '';
  const trayKey = (): string => {
    const p = state.player;
    return [
      state.roundPhase,
      state.roundNumber,
      p.drawOptions.length,
      p.pickedIdx.join(','),
      p.picked.map((d) => `${d.card.id}:${d.troops}`).join('|'),
      p.selectedIdx.join(','),
    ].join('#');
  };

  const renderTray = (): void => {
    const key = trayKey();
    if (key === lastTrayKey) return;
    lastTrayKey = key;
    const tray = $('tray');
    tray.replaceChildren();
    const hint = $('phase-hint');
    const confirmBtn = $('confirm-btn') as HTMLButtonElement;
    confirmBtn.style.display = 'none';
    const p = state.player;

    if (state.roundPhase === 'draw') {
      hint.textContent = `Wähle ${PICK_COUNT} verdeckte Karten — ${p.pickedIdx.length}/${PICK_COUNT}`;
      p.drawOptions.forEach((_entry, idx) => {
        const view = renderCardView({
          card: p.drawOptions[idx]!.card,
          affordable: true,
          size: 'sm',
          faceDown: true,
          selected: p.pickedIdx.includes(idx),
          onClick: () => {
            RoundSystem.togglePick(state, idx);
            sfx.click();
            lastTrayKey = '';
          },
        });
        tray.appendChild(view);
      });
    } else if (state.roundPhase === 'select') {
      const sel = p.selectedIdx;
      hint.innerHTML =
        sel.length < PLAY_COUNT
          ? `Wähle 2 — 1. Klick = <b style="color:var(--c-krieg)">Front</b>, 2. = <b style="color:var(--mana)">Hinten</b> (${sel.length}/${PLAY_COUNT})`
          : comboHintText(p.picked, sel);
      p.picked.forEach((d, idx) => {
        const lineIdx = sel.indexOf(idx);
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:4px;';
        const tag = document.createElement('div');
        tag.className = 'cm-label';
        const tagColor = lineIdx === 0 ? 'var(--c-krieg)' : lineIdx === 1 ? 'var(--mana)' : 'transparent';
        tag.style.cssText = `font-size:10px; min-height:12px; letter-spacing:0.14em; color:${tagColor};`;
        tag.textContent = lineIdx === 0 ? 'FRONT' : lineIdx === 1 ? 'HINTEN' : '·';
        const view = renderCardView({
          card: d.card,
          affordable: true,
          size: 'sm',
          troops: d.troops,
          selected: lineIdx >= 0,
          onClick: () => {
            RoundSystem.toggleSelect(state, idx);
            sfx.click();
            lastTrayKey = '';
          },
        });
        wrap.appendChild(tag);
        wrap.appendChild(view);
        tray.appendChild(wrap);
      });
      if (RoundSystem.canConfirm(state)) {
        const swap = document.createElement('button');
        swap.className = 'cm-btn cm-btn--ghost';
        swap.textContent = '⇄ Front/Hinten tauschen';
        swap.style.alignSelf = 'center';
        swap.onclick = () => {
          RoundSystem.swapLines(state);
          sfx.click();
          lastTrayKey = '';
        };
        tray.appendChild(swap);
        confirmBtn.style.display = '';
        confirmBtn.onclick = () => {
          RoundSystem.confirmSelection(state);
          sfx.click();
          lastTrayKey = '';
        };
      }
    } else if (state.roundPhase === 'resolve') {
      hint.textContent = 'Gefecht läuft…';
    } else {
      hint.textContent = '';
    }
  };

  // === Banner ===
  const renderBanner = (): void => {
    const banner = $('banner');
    const txt = banner.firstElementChild as HTMLElement;
    if (state.roundPhase === 'banner' && state.status === 'running') {
      txt.textContent = `Runde ${state.roundNumber}`;
      banner.style.display = '';
    } else {
      banner.style.display = 'none';
    }
  };

  // === Overlays ===
  const overlay = $('overlay');
  const showOverlay = (html: string): void => {
    overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(15,12,8,0.72)';
  };
  const hideOverlay = (): void => {
    overlay.style.display = 'none';
    overlay.innerHTML = '';
  };

  const showPause = (): void => {
    showOverlay(`
      <div style="display:flex; flex-direction:column; align-items:center; gap:18px;">
        <h2 class="cm-display" style="margin:0; font-size:64px; color:var(--gold-hi);">Pause</h2>
        <span class="cm-label">ESC zum Fortsetzen</span>
        <div style="display:flex; gap:12px; margin-top:14px;">
          <button class="cm-btn cm-btn--ghost" data-action="resume">Fortsetzen</button>
          <button class="cm-btn" data-action="menu">Zum Hauptmenü</button>
        </div>
      </div>
    `);
    overlay.querySelector<HTMLButtonElement>('[data-action="resume"]')!.onclick = togglePause;
    overlay.querySelector<HTMLButtonElement>('[data-action="menu"]')!.onclick = () => {
      if (!sandboxMode) setActiveEncounter(null);
      ctx.go('menu');
    };
  };

  let levelUpRolled: RolledAdvantage[] = [];
  const showLevelUp = (): void => {
    // Einmal pro Pending-Level-Up rollen (nicht jeden Frame neu).
    if (levelUpRolled.length === 0) levelUpRolled = rollAdvantages(state.rng);
    const choicesHtml = levelUpRolled
      .map(
        (a, i) => `
      <button class="cm-btn" data-choice="${i}" style="width:240px; flex-direction:column; align-items:flex-start; gap:6px; padding:14px 18px; border-color:${RARITY_COLOR[a.rarity]};">
        <span style="font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.12em; color:${RARITY_COLOR[a.rarity]};">${RARITY_LABEL[a.rarity].toUpperCase()}</span>
        <span style="color:var(--gold-hi); font-size:15px;">${a.label} +${a.value}</span>
        <span style="color:var(--ink-dim); font-family:'IBM Plex Sans', sans-serif; font-size:11px; letter-spacing:0; text-transform:none;">${a.desc}</span>
      </button>
    `,
      )
      .join('');
    showOverlay(`
      <div style="display:flex; flex-direction:column; align-items:center; gap:18px;">
        <h2 class="cm-display" style="margin:0; font-size:48px; color:var(--gold-hi);">Stufe ${state.player.level + 1}</h2>
        <span class="cm-label">Wähle einen Vorteil für den Rest des Kampfes</span>
        <div style="display:grid; grid-template-columns: repeat(3, 240px); gap:12px; margin-top:12px;">${choicesHtml}</div>
      </div>
    `);
    overlay.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((btn) => {
      btn.onclick = () => {
        const adv = levelUpRolled[Number(btn.dataset.choice)];
        if (adv) applyAdvantage(state, 'player', adv);
        levelUpRolled = [];
        state.status = 'running';
        hideOverlay();
      };
    });
  };

  let resultShown = false;
  const showResult = (kind: 'victory' | 'defeat'): void => {
    if (resultShown) return;
    resultShown = true;
    const inRoom = !sandboxMode && run ? isInRoom(run) : false;
    const title = kind === 'victory' ? 'Sieg' : 'Niederlage';
    const color = kind === 'victory' ? 'var(--c-natur)' : 'var(--c-krieg)';

    // Boss/Mini-Boss-Sieg: eine zufällige eigene Karte gratis upgraden.
    let bossUpgradeName: string | null = null;
    if (!sandboxMode && run && kind === 'victory' && (isBossEncounter || isMiniBossEncounter)) {
      const ids = [...new Set(run.deck.map((c) => c.id))];
      const pick = ids[Math.floor(rng() * ids.length)];
      if (pick) {
        upgradeCard(run, pick);
        bossUpgradeName = run.deck.find((c) => c.id === pick)?.name ?? pick;
      }
    }

    if (!sandboxMode && run && encounter) {
      if (kind === 'victory') {
        addCoins(run, encounter.coinReward);
        const damage = run.baseHp - state.player.baseHp;
        if (damage > 0) damageBase(run, damage);
        if (isMiniBossEncounter && run.activeWorldNodeId) {
          markNodeVisited(run, run.activeWorldNodeId);
          exitRoom(run);
        }
        if (isBossEncounter) markNodeVisited(run, run.currentNodeId);
      } else {
        run.baseHp = 0;
      }
      setActiveEncounter(null);
    }

    const primaryLabel = sandboxMode
      ? 'Neuer Kampf'
      : kind === 'defeat'
        ? 'Zum Endbildschirm'
        : isBossEncounter
          ? `Weiter zu Akt ${(run?.actNumber ?? 0) + 1}`
          : isMiniBossEncounter
            ? 'Raum verlassen'
            : inRoom
              ? 'Zurück zur Raum-Karte'
              : 'Zurück zur Karte';
    const primaryAction = (): void => {
      if (sandboxMode) {
        restartSandbox();
        return;
      }
      if (kind === 'defeat') {
        ctx.go('gameover');
        return;
      }
      if (isBossEncounter) {
        // Boss besiegt → nächster Akt + neue Boss-Auswahl (endlos, eskalierend).
        if (run) advanceToNextAct(run);
        ctx.go('bossselect');
        return;
      }
      if (isMiniBossEncounter) ctx.go('worldmap');
      else if (inRoom) ctx.go('roommap');
      else ctx.go('worldmap');
    };

    const rewardLines: string[] = [];
    if (!sandboxMode && encounter && kind === 'victory') {
      rewardLines.push(
        `<span class="cm-label">+${encounter.coinReward} COINS · BASE-HP ${Math.ceil(state.player.baseHp)}/${state.player.maxBaseHp}</span>`,
      );
      if (bossUpgradeName) {
        rewardLines.push(
          `<span class="cm-label" style="color:var(--gold-hi);">Gratis-Upgrade: ${bossUpgradeName}</span>`,
        );
      }
    }

    showOverlay(`
      <div style="display:flex; flex-direction:column; align-items:center; gap:18px;">
        <h2 class="cm-display" style="margin:0; font-size:84px; color:${color}; text-shadow:0 0 40px ${color};">${title}</h2>
        <span class="cm-label">Runde ${state.roundNumber} · Dauer ${Math.floor(state.elapsedSec)}s</span>
        ${rewardLines.join('')}
        <div style="display:flex; gap:12px; margin-top:14px;">
          <button class="cm-btn cm-btn--gold" data-action="primary">${primaryLabel}</button>
          ${sandboxMode ? '<button class="cm-btn" data-action="menu">Zum Hauptmenü</button>' : ''}
        </div>
      </div>
    `);
    overlay.querySelector<HTMLButtonElement>('[data-action="primary"]')!.onclick = primaryAction;
    overlay.querySelector<HTMLButtonElement>('[data-action="menu"]')?.addEventListener('click', () => ctx.go('menu'));
  };

  const restartSandbox = (): void => {
    state = createCombatState(buildPlayerDeck(), buildEnemyDeck(), mulberry32(Date.now() & 0xffffffff));
    lastTrayKey = '';
    resultShown = false;
    hideOverlay();
    logEvent(state, 'Neuer Kampf');
  };

  const togglePause = (): void => {
    if (state.status === 'running') {
      state.status = 'paused';
      showPause();
    } else if (state.status === 'paused') {
      state.status = 'running';
      hideOverlay();
    }
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      if (state.status === 'running' || state.status === 'paused') togglePause();
    }
  };
  document.addEventListener('keydown', onKey);
  const onMuteChange = (): void => {
    updateHint();
    logEvent(state, isMuted() ? 'Sound stumm' : 'Sound an');
  };
  window.addEventListener('chromatic:mute-changed', onMuteChange);

  const updateHint = (): void => {
    const el = host.querySelector<HTMLElement>('[data-slot="hint"]');
    if (el) el.textContent = `ESC PAUSE · M ${isMuted() ? 'TON AN' : 'TON AUS'}`;
  };
  updateHint();

  // === Render ===
  const render = (): void => {
    playerHp.update(state.player.baseHp, state.player.maxBaseHp);
    enemyHp.update(state.enemy.baseHp, state.enemy.maxBaseHp);
    manaBar.update(state.player.mana, state.player.maxMana);
    $('mana-num').textContent = `${state.player.mana.toFixed(0)}/${state.player.maxMana}`;
    $('player-hp-text').textContent = `${Math.ceil(state.player.baseHp)} / ${state.player.maxBaseHp}`;
    $('enemy-hp-text').textContent = `${Math.ceil(state.enemy.baseHp)} / ${state.enemy.maxBaseHp}`;
    $('round-label').textContent = `Runde ${state.roundNumber}`;

    const t = Math.floor(state.elapsedSec);
    $('timer').textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

    $('player-level').textContent = String(state.player.level);
    const thresholdIdx = state.player.level - 1;
    const next = thresholdIdx < EXP_THRESHOLDS.length ? EXP_THRESHOLDS[thresholdIdx]! : state.player.exp;
    const shownExp = Math.min(state.player.exp, next);
    $('exp-text').textContent = `${shownExp} / ${next}`;
    $('exp-fill').style.width = `${(next > 0 ? Math.min(1, shownExp / next) : 1) * 100}%`;

    renderBanner();
    renderTray();

    $('deck-count').textContent = String(state.player.deck.length);
    $('field-count').textContent = String(state.units.filter((u) => u.side === 'player' && u.alive).length);
    $('log').innerHTML = state.log
      .slice(-7)
      .reverse()
      .map((e) => `<div>${escapeHtml(e.text)}</div>`)
      .join('');

    const isFull = state.player.mana >= state.player.maxMana;
    manaBar.el.classList.toggle('cm-mana-bar--full', isFull);

    while (state.baseHitFxQueue.length > 0) {
      const evt = state.baseHitFxQueue.shift()!;
      const el = evt.side === 'player' ? playerHp.el : enemyHp.el;
      el.classList.remove('cm-hp-bar--hit');
      void el.offsetWidth;
      el.classList.add('cm-hp-bar--hit');
      sfx.baseHit();
    }
    drainSoundQueues();
    drawBattlefield();
  };

  let lastVictorySound = false;
  let lastDefeatSound = false;
  const drainSoundQueues = (): void => {
    const spawns = state.spawnFxQueue.splice(0, 3);
    for (const s of spawns) sfx.spawn(s.side);
    const deaths = state.deathFxQueue.splice(0, 3);
    for (let i = 0; i < deaths.length; i++) sfx.death();
    if (state.status === 'victory' && !lastVictorySound) {
      sfx.victory();
      lastVictorySound = true;
    }
    if (state.status === 'defeat' && !lastDefeatSound) {
      sfx.defeat();
      lastDefeatSound = true;
    }
  };

  const DRAW_R = 10; // kleinerer Zeichen-Radius für dichte Truppen-Stacks
  const drawBattlefield = (): void => {
    cctx.save();
    if (state.screenShake.remainingSec > 0) {
      const tt = state.screenShake.remainingSec / 0.3;
      const amp = state.screenShake.intensity * tt;
      cctx.translate((state.rng() - 0.5) * 2 * amp, (state.rng() - 0.5) * 2 * amp);
    }
    cctx.clearRect(-20, -20, canvas.width + 40, canvas.height + 40);
    const horizonY = 60;

    // Armee-weiter Combo-Bonus dieser Runde → Units der betroffenen Seite leuchten.
    const playerCombo = Object.keys(state.player.comboBuff).length > 0;
    const enemyCombo = Object.keys(state.enemy.comboBuff).length > 0;
    for (const u of state.units) {
      const color = colorToCss(u.card.color);
      const cy = horizonY + u.y;
      const hasCombo = u.side === 'player' ? playerCombo : enemyCombo;

      let radius = DRAW_R;
      let alpha = 1;
      if (!u.alive && u.deathAge !== null) {
        const tt = Math.min(1, u.deathAge / DEATH_ANIM_SEC);
        radius = DRAW_R * (1 - tt * 0.7);
        alpha = 1 - tt;
      }
      cctx.globalAlpha = alpha;

      if (hasCombo && u.alive) {
        cctx.fillStyle = color + '55';
        cctx.beginPath();
        cctx.arc(u.x, cy, radius + 5, 0, Math.PI * 2);
        cctx.fill();
      }

      const flashT = u.alive && u.spawnAge < SPAWN_FLASH_SEC ? 1 - u.spawnAge / SPAWN_FLASH_SEC : 0;

      cctx.fillStyle = color;
      cctx.strokeStyle = u.side === 'player' ? COLORS_CSS.ink : '#1a0d08';
      cctx.lineWidth = 1.5;
      cctx.beginPath();
      cctx.arc(u.x, cy, radius, 0, Math.PI * 2);
      cctx.fill();
      cctx.stroke();

      if (flashT > 0) {
        cctx.fillStyle = `rgba(255,255,255,${(flashT * 0.55).toFixed(3)})`;
        cctx.beginPath();
        cctx.arc(u.x, cy, radius, 0, Math.PI * 2);
        cctx.fill();
      }
      if (!u.alive && u.deathAge !== null && u.deathAge < 0.1) {
        cctx.fillStyle = `rgba(255,80,60,${(1 - u.deathAge / 0.1).toFixed(3)})`;
        cctx.beginPath();
        cctx.arc(u.x, cy, radius + 3, 0, Math.PI * 2);
        cctx.fill();
      }

      if (u.alive) {
        const hpW = DRAW_R * 2;
        const pct = Math.max(0, u.currentHp / u.baseStats.hp);
        cctx.fillStyle = '#000';
        cctx.fillRect(u.x - DRAW_R, cy - DRAW_R - 6, hpW, 3);
        cctx.fillStyle = pct > 0.5 ? COLORS_CSS.hp : COLORS_CSS.hpBad;
        cctx.fillRect(u.x - DRAW_R, cy - DRAW_R - 6, hpW * pct, 3);
      }
      cctx.globalAlpha = 1;
    }

    cctx.textAlign = 'center';
    cctx.font = "bold 14px 'JetBrains Mono', monospace";
    for (const dn of state.damageNumbers) {
      const tt = dn.age / DAMAGE_NUMBER_LIFE_SEC;
      cctx.globalAlpha = Math.max(0, 1 - tt);
      cctx.fillStyle = dn.color;
      cctx.fillText(dn.text, dn.x, horizonY + dn.y - tt * 28);
      cctx.globalAlpha = 1;
    }
    cctx.restore();
  };

  const escapeHtml = (s: string): string =>
    s.replace(/[&<>"]/g, (ch) =>
      ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&quot;',
    );

  // === Sim Loop (setInterval — läuft auch headless/Hintergrund) ===
  const TICK_MS = 33;
  let last = performance.now();
  const tick = (): void => {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    advance(state, dt);
    if (state.status === 'levelup' && !overlay.innerHTML) showLevelUp();
    if (state.status === 'victory') showResult('victory');
    else if (state.status === 'defeat') showResult('defeat');
    render();
  };
  const intervalId = window.setInterval(tick, TICK_MS);
  tick();

  return () => {
    clearInterval(intervalId);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('chromatic:mute-changed', onMuteChange);
  };
};
