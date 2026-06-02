import type { Screen } from '../router';
import { advance } from '../systems/combat/advance';
import {
  createCombatState,
  type CombatState,
  logEvent,
} from '../systems/combat/CombatState';
import { ManaSystem } from '../systems/combat/ManaSystem';
import { DrawSystem } from '../systems/combat/DrawSystem';
import { UnitSystem } from '../systems/combat/UnitSystem';
import { LEVEL_UP_CHOICES, applyLevelUp, type LevelUpChoice } from '../systems/combat/ExpSystem';
import { ComboAuraSystem } from '../systems/combat/ComboAuraSystem';
import { mulberry32 } from '../systems/rng';
import { sandboxEnemyDeck, sandboxPlayerDeck } from '../systems/data/starterDeck';
import { getActiveEncounter, getCurrentRun, setActiveEncounter } from '../systems/run/currentRun';
import { addCardToDeck, addCoins, advanceToNextAct, damageBase, exitRoom, isFinalAct, isInRoom, markNodeVisited } from '../systems/run/RunState';
import { getRandomDrops, treasurePool } from '../systems/data/dropPool';
import { encounterDeck } from '../systems/data/encounters';
import { applyPerkOnCombatMount } from '../systems/data/perks';
import { sfx, isMuted } from '../systems/audio';
import {
  DAMAGE_NUMBER_LIFE_SEC,
  DEATH_ANIM_SEC,
  EXP_THRESHOLDS,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  SPAWN_FLASH_SEC,
  UNIT_RADIUS,
} from '../systems/data/balance';
import { colorToCss, COLORS_CSS } from '../systems/data/designTokens';
import { renderCardView } from '../ui/CardView';
import { renderHpBar } from '../ui/HpBar';
import { renderManaBar } from '../ui/ManaBar';
import { bgUrl, combatBgForAct } from '../ui/backgrounds';

/**
 * Combat-Screen (Phase 2).
 * Architektur:
 *  - DOM: HUD, Hand, Mana-Bar, Dialoge (Pause/Level-Up/Sieg/Niederlage)
 *  - Canvas: Spielfeld mit Bases, Units, Combo-Glow
 *  - Loop: requestAnimationFrame → advance(state, dt) → render
 *
 * Außerhalb (Phase 3) wird das Mounten erweitert, sodass RunState die Decks
 * und Belohnungs-Hooks übergibt. Für Phase 2 lädt der Screen die Sandbox-Decks
 * direkt.
 */
export const Combat: Screen = (host, ctx) => {
  // Run-aware: aktiven Run + Encounter aus dem currentRun-Singleton lesen.
  // Fallback (Dev-Shortcut D ohne aktiven Run): Sandbox-Decks.
  const run = getCurrentRun();
  const encounter = getActiveEncounter();
  const sandboxMode = !run || !encounter;

  const rng = mulberry32(Date.now() & 0xffffffff);
  const playerDeck = sandboxMode ? sandboxPlayerDeck() : [...run!.deck];
  const enemyDeck = sandboxMode ? sandboxEnemyDeck() : encounterDeck(encounter!);
  let state: CombatState = createCombatState(playerDeck, enemyDeck, rng);
  // Base-HP aus Run übernehmen (persistent über Räume), falls vorhanden.
  // Run-State bleibt Source-of-Truth — Perks haben run.maxBaseHp ggf. bereits
  // in PerkSelect erhöht (onChoose). Hier nur Side-State von Run initialisieren.
  if (!sandboxMode && run) {
    state.player.baseHp = run.baseHp;
    state.player.maxBaseHp = run.maxBaseHp;
    // Side-Effekte der Perks: manaRegen, maxMana, handSize, baseHpRegen, globalDamageBonus.
    // KEINE run-state-Modifikation hier (sonst Stacking-Bug bei mehreren Combats).
    for (const perk of run.activePerks) applyPerkOnCombatMount(perk, state.player);
    // Hand nach Perks neu auf handSize auffüllen (extra_hand_card-Perk).
    while (
      state.player.hand.length < state.player.handSize &&
      state.player.deck.length > 0
    ) {
      const idx = Math.floor(rng() * state.player.deck.length);
      state.player.hand.push(state.player.deck[idx]!);
    }
  }
  if (!sandboxMode && encounter?.enemyStartMana) {
    state.enemy.mana = Math.min(state.enemy.maxMana, encounter.enemyStartMana);
  }
  // KI-Skalierung pro Akt: höhere Akte = schnellere Entscheidungen.
  if (!sandboxMode && run) {
    const scale = Math.max(0.6, 1 - (run.actNumber - 1) * 0.2);
    state.enemy.aiDecisionIntervalSec = state.enemy.aiDecisionIntervalSec * scale;
  }

  const combatBgFile = combatBgForAct(run?.actNumber ?? 1, encounter?.id.startsWith('boss_') === true);
  host.innerHTML = `
    <div class="cm-fit"><div class="cm-screen cm-combat" style="display:flex; flex-direction:column; background-image:${bgUrl(combatBgFile)}; background-size:cover; background-position:center;">
      <!-- HUD top -->
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
          <span class="cm-label">Echtzeit-Combat</span>
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

      <!-- EXP rail -->
      <div style="position:absolute; top:104px; left:50%; transform:translateX(-50%); width:320px; display:flex; flex-direction:column; gap:4px; align-items:center; z-index:5;">
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <span class="cm-label">Stufe <span data-slot="player-level">1</span> · EXP</span>
          <span class="cm-label" data-slot="exp-text">0 / 5</span>
        </div>
        <div data-slot="exp-bar" style="width:100%; height:5px; background:#1a130c; border-radius:1px; overflow:hidden;">
          <div data-slot="exp-fill" style="height:100%; width:0%; background:var(--gold); transition: width 120ms linear;"></div>
        </div>
      </div>

      <!-- Battlefield Canvas — transparent, der Akt-Hintergrund ist die Bühne. -->
      <div style="position:absolute; top:160px; left:50%; transform:translateX(-50%); width:${FIELD_WIDTH}px; height:${FIELD_HEIGHT + 80}px; z-index:1;">
        <canvas data-slot="canvas" width="${FIELD_WIDTH}" height="${FIELD_HEIGHT + 80}" style="
          width:${FIELD_WIDTH}px; height:${FIELD_HEIGHT + 80}px;
          background: transparent;
        "></canvas>
      </div>

      <!-- Bottom panel — Höhe passt zur neuen Karten-Aspect-Ratio (262px Hand-Karte) -->
      <div style="
        position:absolute; bottom:0; left:0; right:0; height:300px;
        background: linear-gradient(180deg, transparent, #0f0c08 60%);
        border-top:1px solid var(--line-hi);
        display:grid; grid-template-columns: 320px 1fr 320px; gap:24px; padding:18px 32px;
        z-index:4;
      ">
        <!-- Mana column -->
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:var(--mana); font-size:18px;">💧</span>
              <span class="cm-label">Mana</span>
            </div>
            <span data-slot="mana-num" style="font-family:'JetBrains Mono', monospace; font-size:22px; color:var(--mana); font-weight:600;">0/20</span>
          </div>
          <div data-slot="mana-bar"></div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="cm-label" data-slot="regen-hint">+1 MANA / SEK.</span>
            <span class="cm-label" data-slot="draw-hint">AUTO-DRAW 4S</span>
          </div>
        </div>

        <!-- Hand -->
        <div style="display:flex; align-items:flex-end; justify-content:center; gap:14px;" data-slot="hand"></div>

        <!-- Deck / Log column -->
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; gap:8px;">
            <div style="flex:1; background:var(--surface); border:1px solid var(--line); padding:8px 12px; border-radius:2px;" title="Karten-Pool — der Pool wird beim Ziehen NICHT aufgebraucht.">
              <div class="cm-label">Pool</div>
              <div data-slot="deck-count" style="font-family:'JetBrains Mono', monospace; font-size:16px; color:var(--ink);">0</div>
            </div>
            <div style="flex:1; background:var(--surface); border:1px solid var(--line); padding:8px 12px; border-radius:2px;">
              <div class="cm-label">Auf dem Feld</div>
              <div data-slot="field-count" style="font-family:'JetBrains Mono', monospace; font-size:16px; color:var(--ink);">0</div>
            </div>
          </div>
          <div style="background:var(--surface); border:1px solid var(--line); padding:8px 12px; border-radius:2px; height:120px; overflow:hidden;">
            <div class="cm-label">Event-Log</div>
            <div data-slot="log" style="font-family:'JetBrains Mono', monospace; font-size:10px; color:var(--ink-dim); line-height:1.5; margin-top:4px;"></div>
          </div>
        </div>
      </div>

      <!-- Overlays -->
      <div data-slot="overlay" style="position:absolute; inset:0; z-index:10; display:none;"></div>
    </div></div>
  `;

  const $ = <T extends HTMLElement = HTMLElement>(slot: string): T => {
    const el = host.querySelector<T>(`[data-slot="${slot}"]`);
    if (!el) throw new Error(`Missing slot: ${slot}`);
    return el;
  };

  // === HUD-Bars instanziieren ===
  const playerHp = renderHpBar({ width: 280, color: COLORS_CSS.hp });
  $('player-hp-bar').appendChild(playerHp.el);
  const enemyHp = renderHpBar({ width: 280, color: COLORS_CSS.hpBad });
  $('enemy-hp-bar').appendChild(enemyHp.el);
  const manaBar = renderManaBar(280);
  $('mana-bar').appendChild(manaBar.el);

  const canvas = $('canvas') as HTMLCanvasElement;
  const cctx = canvas.getContext('2d')!;

  // === Hand-Render & Click ===
  let lastHandKey = '';
  const renderHand = (): void => {
    const handKey = state.player.hand.map((c) => c.id).join('|') + `:${state.player.mana | 0}`;
    if (handKey === lastHandKey) return;
    lastHandKey = handKey;
    const handHost = $('hand');
    handHost.replaceChildren();
    state.player.hand.forEach((card, idx) => {
      const affordable = ManaSystem.canAfford(state.player, card);
      const view = renderCardView({
        card,
        affordable,
        size: 'md',
        onClick: () => playCard(idx),
      });
      // Fächer-Rotation wie im Design (±2° pro Karte)
      const rot = (idx - 1) * 2;
      view.style.transform = `rotate(${rot}deg) translateY(${Math.abs(idx - 1) * 4}px)`;
      handHost.appendChild(view);
    });
    while (handHost.children.length < state.player.handSize) {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = `
        width:150px; height:262px; border:1px dashed rgba(240,200,120,.4);
        border-radius:4px; display:flex; align-items:center; justify-content:center;
        font-family:'JetBrains Mono', monospace; font-size:9px; letter-spacing:0.22em;
        color:var(--ink-mute);
      `;
      placeholder.textContent = 'NACHZIEHEN';
      handHost.appendChild(placeholder);
    }
  };

  // Click-Spam-Guard: nach jedem Klick kurz blockieren, damit Doppelklicks
  // (Maus-Bouncing, schnelle Double-Tap-Touchpads) nicht zwei Mal Mana abziehen.
  let clickGuardUntil = 0;
  const playCard = (handIndex: number): void => {
    if (state.status !== 'running') return;
    const now = performance.now();
    if (now < clickGuardUntil) return;
    clickGuardUntil = now + 80;
    const card = state.player.hand[handIndex];
    if (!card) return;
    if (!ManaSystem.spend(state.player, card)) return;
    DrawSystem.consume(state.player, handIndex);
    UnitSystem.spawn(state, card, 'player');
    sfx.click();
    lastHandKey = ''; // erzwingt Re-Render
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
      if (!sandboxMode) {
        // Run-Abbruch: aktiven Encounter freigeben, Run-State bleibt im
        // Singleton — Hauptmenü cleart ihn beim nächsten „SPIELEN".
        setActiveEncounter(null);
      }
      ctx.go('menu');
    };
  };

  const showLevelUp = (): void => {
    const choicesHtml = LEVEL_UP_CHOICES.map(
      (c) => `
      <button class="cm-btn" data-choice="${c.id}" style="width:240px; flex-direction:column; align-items:flex-start; gap:4px; padding:14px 18px;">
        <span style="color:var(--gold-hi); font-size:14px;">${c.label}</span>
        <span style="color:var(--ink-dim); font-family:'IBM Plex Sans', sans-serif; font-size:11px; letter-spacing:0; text-transform:none;">${c.desc}</span>
      </button>
    `,
    ).join('');
    showOverlay(`
      <div style="display:flex; flex-direction:column; align-items:center; gap:18px;">
        <h2 class="cm-display" style="margin:0; font-size:48px; color:var(--gold-hi);">Stufe ${state.player.level + 1}</h2>
        <span class="cm-label">Wähle einen Vorteil für den Rest des Kampfes</span>
        <div style="display:grid; grid-template-columns: repeat(3, 240px); gap:12px; margin-top:12px;">${choicesHtml}</div>
      </div>
    `);
    overlay.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.choice as LevelUpChoice;
        applyLevelUp(state, 'player', id);
        state.status = 'running';
        hideOverlay();
      };
    });
  };

  let resultShown = false;
  const showResult = (kind: 'victory' | 'defeat'): void => {
    if (resultShown) return;
    resultShown = true;
    const isBossEncounter = encounter?.id.startsWith('boss_') === true;
    const isMiniBossEncounter = encounter?.id.startsWith('mini_boss_') === true;
    const inRoom = !sandboxMode && run ? isInRoom(run) : false;
    const finalAct = !sandboxMode && run ? isFinalAct(run) : true;
    const title = kind === 'victory' ? 'Sieg' : 'Niederlage';
    const color = kind === 'victory' ? 'var(--c-natur)' : 'var(--c-krieg)';

    // Karten-Drop bei Boss/Mini-Boss: 1 zufällige Karte aus dem Treasure-Pool.
    let cardDrop: ReturnType<typeof getRandomDrops>[number] | null = null;
    if (!sandboxMode && run && kind === 'victory' && (isBossEncounter || isMiniBossEncounter)) {
      const dropRng = mulberry32(
        (run.seed ^ run.actNumber ^ (encounter ? encounter.id.length * 7919 : 0)) >>> 0,
      );
      const [picked] = getRandomDrops(treasurePool, 1, dropRng);
      cardDrop = picked ?? null;
    }

    // Run-aware: Coins gutschreiben, Base-HP persistieren, Encounter freigeben.
    if (!sandboxMode && run && encounter) {
      if (kind === 'victory') {
        addCoins(run, encounter.coinReward);
        // Base-HP-Differenz aus dem Combat zurück in den Run.
        const damage = run.baseHp - state.player.baseHp;
        if (damage > 0) damageBase(run, damage);
        // Karten-Drop ins Deck übernehmen.
        if (cardDrop) addCardToDeck(run, cardDrop);
        // Mini-Boss-Sieg = Exit-Gate: Welt-Knoten besucht + Raum verlassen.
        if (isMiniBossEncounter && run.activeWorldNodeId) {
          markNodeVisited(run, run.activeWorldNodeId);
          exitRoom(run);
        }
        // Boss-Sieg: Welt-Knoten ebenfalls als abgeschlossen markieren.
        if (isBossEncounter) {
          markNodeVisited(run, run.currentNodeId);
        }
      } else {
        // Niederlage: HP ist bereits 0, RunState wird nach gameover gecleart.
        run.baseHp = 0;
      }
      setActiveEncounter(null);
    }

    const primaryLabel = sandboxMode
      ? 'Neuer Kampf'
      : kind === 'defeat'
        ? 'Zum Endbildschirm'
        : isBossEncounter
          ? finalAct
            ? 'Run beenden'
            : `Weiter zu Akt ${(run?.actNumber ?? 0) + 1}`
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
        if (finalAct) {
          ctx.go('victory');
        } else if (run) {
          advanceToNextAct(run);
          ctx.go('worldmap');
        }
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
      if (cardDrop) {
        rewardLines.push(
          `<span class="cm-label" style="color:var(--gold-hi);">Karten-Drop: ${cardDrop.name} ins Deck</span>`,
        );
      }
    }

    showOverlay(`
      <div style="display:flex; flex-direction:column; align-items:center; gap:18px;">
        <h2 class="cm-display" style="margin:0; font-size:84px; color:${color}; text-shadow:0 0 40px ${color};">${title}</h2>
        <span class="cm-label" data-slot="result-stats">Dauer ${Math.floor(state.elapsedSec)}s · Units gespawnt: ${state.nextUnitId - 1}</span>
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
    state = createCombatState(sandboxPlayerDeck(), sandboxEnemyDeck(), mulberry32(Date.now() & 0xffffffff));
    lastHandKey = '';
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

  // === Keyboard ===
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      if (state.status === 'running' || state.status === 'paused') togglePause();
    }
    // M wird global in main.ts gehandhabt — wir spiegeln nur den HUD-Hint.
  };
  document.addEventListener('keydown', onKey);
  const onMuteChange = (): void => {
    updateHint();
    logEvent(state, isMuted() ? 'Sound stumm' : 'Sound an');
  };
  window.addEventListener('chromatic:mute-changed', onMuteChange);

  // Hint im HUD aktualisieren
  const updateHint = (): void => {
    const el = host.querySelector<HTMLElement>('[data-slot="hint"]');
    if (el) el.textContent = `ESC PAUSE · M ${isMuted() ? 'TON AN' : 'TON AUS'}`;
  };
  updateHint();

  // === Render ===
  const render = (): void => {
    // Bars
    playerHp.update(state.player.baseHp, state.player.maxBaseHp);
    enemyHp.update(state.enemy.baseHp, state.enemy.maxBaseHp);
    manaBar.update(state.player.mana, state.player.maxMana);
    $('mana-num').textContent = `${state.player.mana.toFixed(0)}/${state.player.maxMana}`;
    $('player-hp-text').textContent = `${Math.ceil(state.player.baseHp)} / ${state.player.maxBaseHp}`;
    $('enemy-hp-text').textContent = `${Math.ceil(state.enemy.baseHp)} / ${state.enemy.maxBaseHp}`;

    // Timer
    const t = Math.floor(state.elapsedSec);
    const mm = String(Math.floor(t / 60)).padStart(2, '0');
    const ss = String(t % 60).padStart(2, '0');
    $('timer').textContent = `${mm}:${ss}`;

    // EXP — bei Pending-Level-Up Anzeige auf next clampen (sonst sieht man "15/5").
    $('player-level').textContent = String(state.player.level);
    const thresholdIdx = state.player.level - 1;
    const next = thresholdIdx < EXP_THRESHOLDS.length ? EXP_THRESHOLDS[thresholdIdx]! : state.player.exp;
    const shownExp = Math.min(state.player.exp, next);
    $('exp-text').textContent = `${shownExp} / ${next}`;
    const expFill = $('exp-fill');
    const pct = next > 0 ? Math.min(1, shownExp / next) : 1;
    expFill.style.width = `${pct * 100}%`;

    // Hand
    renderHand();

    // Stats
    $('deck-count').textContent = String(state.player.deck.length);
    $('field-count').textContent = String(state.units.filter((u) => u.side === 'player' && u.alive).length);
    $('log').innerHTML = state.log
      .slice(-6)
      .reverse()
      .map((e) => `<div>${escapeHtml(e.text)}</div>`)
      .join('');

    // Hinweise
    $('regen-hint').textContent = `+${state.player.manaRegen.toFixed(0)} MANA / SEK.`;
    // Wenn Hand leer ist, zeige Countdown bis zum nächsten Auto-Draw —
    // sonst sieht der Spieler nicht, dass das System gleich nachzieht.
    const handEmpty = state.player.hand.length === 0;
    if (handEmpty && state.player.deck.length > 0) {
      const remaining = Math.max(0, state.player.drawIntervalSec - state.player.drawTimer);
      $('draw-hint').textContent = `NACHZIEHEN IN ${remaining.toFixed(1)}S`;
    } else {
      $('draw-hint').textContent = `AUTO-DRAW ${state.player.drawIntervalSec.toFixed(0)}S`;
    }

    // Mana-Voll-Pulse: addiert/entfernt CSS-Klasse.
    const manaEl = manaBar.el;
    const isFull = state.player.mana >= state.player.maxMana;
    manaEl.classList.toggle('cm-mana-bar--full', isFull);

    // Base-Hit-Queue: für jedes Event HP-Bar-Flash neu auslösen + SFX.
    while (state.baseHitFxQueue.length > 0) {
      const evt = state.baseHitFxQueue.shift()!;
      const el = evt.side === 'player' ? playerHp.el : enemyHp.el;
      el.classList.remove('cm-hp-bar--hit');
      // Force reflow → erlaubt die Animation, beim erneuten Klassen-Add wieder zu starten.
      void el.offsetWidth;
      el.classList.add('cm-hp-bar--hit');
      sfx.baseHit();
    }

    // Sound-Queues (Phase 7): wenn SoundManager aktiv, hier triggern.
    drainSoundQueues();

    // Canvas
    drawBattlefield();
  };

  // Sound-Trigger: Queues vom Combat-State drainen und passende SFX abspielen.
  // Limitiert auf max 3 SFX gleichzeitig pro Frame, damit kein Sound-Stau bei
  // großen Combos entsteht.
  let lastVictorySound = false;
  let lastDefeatSound = false;
  const drainSoundQueues = (): void => {
    const spawns = state.spawnFxQueue.splice(0, 3);
    for (const s of spawns) sfx.spawn(s.side);
    const deaths = state.deathFxQueue.splice(0, 3);
    for (let i = 0; i < deaths.length; i++) sfx.death();
    if (state.baseHitFxQueue.length === 0) {
      // baseHitFxQueue wird oben in der HP-Bar-Flash-Schleife geleert; daher
      // hier nichts mehr zu tun — alle Drains laufen synchron in render().
    }
    if (state.status === 'victory' && !lastVictorySound) {
      sfx.victory();
      lastVictorySound = true;
    }
    if (state.status === 'defeat' && !lastDefeatSound) {
      sfx.defeat();
      lastDefeatSound = true;
    }
  };

  const drawBattlefield = (): void => {
    cctx.save();
    // Screen-Shake — kleiner zufälliger Versatz, klingt mit Restzeit ab.
    if (state.screenShake.remainingSec > 0) {
      const t = state.screenShake.remainingSec / 0.3;
      const amp = state.screenShake.intensity * t;
      cctx.translate((state.rng() - 0.5) * 2 * amp, (state.rng() - 0.5) * 2 * amp);
    }
    cctx.clearRect(-20, -20, canvas.width + 40, canvas.height + 40);

    // Hintergrund kommt vom Akt-Bild (CSS) — Canvas zeichnet nur Units & FX.
    const horizonY = 60;

    // Units (inkl. sterbender mit Death-Anim)
    ComboAuraSystem.recomputeIfDirty(state);
    for (const u of state.units) {
      const color = colorToCss(u.card.color);
      const cy = horizonY + u.y;
      const hasCombo =
        (u.buffs.damage ?? 0) > 0 || (u.buffs.hp ?? 0) > 0 || (u.buffs.speed ?? 0) > 0;

      // Death-Anim: schrumpfen + fade.
      let radius = UNIT_RADIUS;
      let alpha = 1;
      if (!u.alive && u.deathAge !== null) {
        const t = Math.min(1, u.deathAge / DEATH_ANIM_SEC);
        radius = UNIT_RADIUS * (1 - t * 0.7);
        alpha = 1 - t;
      }
      cctx.globalAlpha = alpha;

      // Combo-Glow (nur lebende Units)
      if (hasCombo && u.alive) {
        cctx.fillStyle = color + '55';
        cctx.beginPath();
        cctx.arc(u.x, cy, radius + 8, 0, Math.PI * 2);
        cctx.fill();
        // Zweiter Ring für Class-Combo (subtiler heller Pulse)
        if ((u.buffs.damage ?? 0) > 0 && (u.buffs.hp ?? 0) > 0) {
          cctx.strokeStyle = color;
          cctx.lineWidth = 1.5;
          cctx.beginPath();
          cctx.arc(u.x, cy, radius + 11, 0, Math.PI * 2);
          cctx.stroke();
        }
      }

      // Spawn-Flash — kurzer weißer Schein während u.spawnAge < SPAWN_FLASH_SEC.
      const flashT =
        u.alive && u.spawnAge < SPAWN_FLASH_SEC ? 1 - u.spawnAge / SPAWN_FLASH_SEC : 0;

      // Body
      cctx.fillStyle = u.alive && !u.deathAge ? color : color;
      cctx.strokeStyle = u.side === 'player' ? COLORS_CSS.ink : '#1a0d08';
      cctx.lineWidth = 2;
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
      // Death-Flash (roter Pulse in den ersten 100ms nach Tod)
      if (!u.alive && u.deathAge !== null && u.deathAge < 0.1) {
        cctx.fillStyle = `rgba(255,80,60,${(1 - u.deathAge / 0.1).toFixed(3)})`;
        cctx.beginPath();
        cctx.arc(u.x, cy, radius + 4, 0, Math.PI * 2);
        cctx.fill();
      }

      // HP-Bar drüber (nur lebende)
      if (u.alive) {
        const hpW = UNIT_RADIUS * 2;
        const pct = Math.max(0, u.currentHp / u.baseStats.hp);
        cctx.fillStyle = '#000';
        cctx.fillRect(u.x - UNIT_RADIUS, cy - UNIT_RADIUS - 8, hpW, 4);
        cctx.fillStyle = pct > 0.5 ? COLORS_CSS.hp : COLORS_CSS.hpBad;
        cctx.fillRect(u.x - UNIT_RADIUS, cy - UNIT_RADIUS - 8, hpW * pct, 4);

        // Side-Indicator: kleiner Punkt
        cctx.fillStyle = u.side === 'player' ? COLORS_CSS.cNatur : COLORS_CSS.cKrieg;
        cctx.beginPath();
        cctx.arc(u.x, cy + UNIT_RADIUS + 6, 2, 0, Math.PI * 2);
        cctx.fill();
      }
      cctx.globalAlpha = 1;
    }

    // Floating-Damage-Numbers — steigen auf und faden.
    cctx.textAlign = 'center';
    cctx.font = "bold 14px 'JetBrains Mono', monospace";
    for (const dn of state.damageNumbers) {
      const t = dn.age / DAMAGE_NUMBER_LIFE_SEC;
      const yOff = -t * 28;
      cctx.globalAlpha = Math.max(0, 1 - t);
      cctx.fillStyle = dn.color;
      cctx.fillText(dn.text, dn.x, horizonY + dn.y + yOff);
      cctx.globalAlpha = 1;
    }

    cctx.restore();
  };

  const escapeHtml = (s: string): string =>
    s.replace(/[&<>"]/g, (ch) =>
      ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&quot;',
    );

  // === Sim Loop ===
  // setInterval statt RAF: läuft auch wenn Tab im Hintergrund / der Preview-
  // Headless-Browser visibilityState=hidden meldet. Render-Aufruf passiert im
  // selben Tick — DOM-Updates kosten kaum etwas, Canvas-Repaint passt zu 33ms.
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
  tick(); // erstes Frame sofort, damit Hand/HP nicht 33ms leer bleiben

  return () => {
    clearInterval(intervalId);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('chromatic:mute-changed', onMuteChange);
  };
};
