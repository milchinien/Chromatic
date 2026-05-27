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
import { addCoins, damageBase, exitRoom, isInRoom, markNodeVisited } from '../systems/run/RunState';
import { encounterDeck } from '../systems/data/encounters';
import { applyPerk } from '../systems/data/perks';
import {
  ENEMY_BASE_X,
  EXP_THRESHOLDS,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  PLAYER_BASE_X,
  UNIT_RADIUS,
} from '../systems/data/balance';
import { colorToCss, COLORS_CSS } from '../systems/data/designTokens';
import { renderCardView } from '../ui/CardView';
import { renderHpBar } from '../ui/HpBar';
import { renderManaBar } from '../ui/ManaBar';

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
  if (!sandboxMode && run) {
    state.player.baseHp = run.baseHp;
    state.player.maxBaseHp = run.maxBaseHp;
    // Perks anwenden — sie modifizieren Mana/HP/Hand-Size/Bonus-Damage einmalig.
    for (const perk of run.activePerks) applyPerk(perk, state.player, run);
    // Falls maxBaseHp durch Perks erhöht wurde, baseHp ggf. mit-anheben.
    state.player.maxBaseHp = run.maxBaseHp;
    state.player.baseHp = Math.min(run.baseHp, state.player.maxBaseHp);
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

  host.innerHTML = `
    <div class="cm-fit"><div class="cm-screen cm-combat" style="display:flex; flex-direction:column;">
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

      <!-- Battlefield Canvas -->
      <div style="position:absolute; top:160px; left:50%; transform:translateX(-50%); width:${FIELD_WIDTH}px; height:${FIELD_HEIGHT + 80}px; z-index:1;">
        <canvas data-slot="canvas" width="${FIELD_WIDTH}" height="${FIELD_HEIGHT + 80}" style="
          width:${FIELD_WIDTH}px; height:${FIELD_HEIGHT + 80}px;
          border: 1px solid var(--line-soft); border-radius:4px;
          background:
            linear-gradient(180deg, #5a3f24 0%, #3a2818 60%, #2a1f14 100%);
          box-shadow: var(--shadow);
        "></canvas>
      </div>

      <!-- Bottom panel -->
      <div style="
        position:absolute; bottom:0; left:0; right:0; height:240px;
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
            <div style="flex:1; background:var(--surface); border:1px solid var(--line); padding:8px 12px; border-radius:2px;">
              <div class="cm-label">Deck</div>
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
        width:150px; height:218px; border:1px dashed rgba(240,200,120,.4);
        border-radius:4px; display:flex; align-items:center; justify-content:center;
        font-family:'JetBrains Mono', monospace; font-size:9px; letter-spacing:0.22em;
        color:var(--ink-mute);
      `;
      placeholder.textContent = 'NACHZIEHEN';
      handHost.appendChild(placeholder);
    }
  };

  const playCard = (handIndex: number): void => {
    if (state.status !== 'running') return;
    const card = state.player.hand[handIndex];
    if (!card) return;
    if (!ManaSystem.spend(state.player, card)) return;
    DrawSystem.consume(state.player, handIndex);
    UnitSystem.spawn(state, card, 'player');
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
    const title = kind === 'victory' ? 'Sieg' : 'Niederlage';
    const color = kind === 'victory' ? 'var(--c-natur)' : 'var(--c-krieg)';

    // Run-aware: Coins gutschreiben, Base-HP persistieren, Encounter freigeben.
    if (!sandboxMode && run && encounter) {
      if (kind === 'victory') {
        addCoins(run, encounter.coinReward);
        // Base-HP-Differenz aus dem Combat zurück in den Run.
        const damage = run.baseHp - state.player.baseHp;
        if (damage > 0) damageBase(run, damage);
        // Mini-Boss-Sieg = Exit-Gate: Welt-Knoten besucht + Raum verlassen.
        if (isMiniBossEncounter && run.activeWorldNodeId) {
          markNodeVisited(run, run.activeWorldNodeId);
          exitRoom(run);
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
          ? 'Akt-Sieg'
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
      if (kind === 'defeat') ctx.go('gameover');
      else if (isBossEncounter) ctx.go('victory');
      else if (isMiniBossEncounter) ctx.go('worldmap');
      else if (inRoom) ctx.go('roommap');
      else ctx.go('worldmap');
    };

    const coinLine =
      !sandboxMode && encounter && kind === 'victory'
        ? `<span class="cm-label">+${encounter.coinReward} COINS · BASE-HP ${Math.ceil(state.player.baseHp)}/${state.player.maxBaseHp}</span>`
        : '';

    showOverlay(`
      <div style="display:flex; flex-direction:column; align-items:center; gap:18px;">
        <h2 class="cm-display" style="margin:0; font-size:84px; color:${color}; text-shadow:0 0 40px ${color};">${title}</h2>
        <span class="cm-label" data-slot="result-stats">Dauer ${Math.floor(state.elapsedSec)}s · Units gespawnt: ${state.nextUnitId - 1}</span>
        ${coinLine}
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
  };
  document.addEventListener('keydown', onKey);

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

    // EXP
    $('player-level').textContent = String(state.player.level);
    const thresholdIdx = state.player.level - 1;
    const next = thresholdIdx < EXP_THRESHOLDS.length ? EXP_THRESHOLDS[thresholdIdx]! : state.player.exp;
    $('exp-text').textContent = `${state.player.exp} / ${next}`;
    const expFill = $('exp-fill');
    const pct = next > 0 ? Math.min(1, state.player.exp / next) : 1;
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
    $('draw-hint').textContent = `AUTO-DRAW ${state.player.drawIntervalSec.toFixed(0)}S`;

    // Canvas
    drawBattlefield();
  };

  const drawBattlefield = (): void => {
    cctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground gradient (oben Himmel, unten Erde)
    const horizonY = 60;
    const groundGrad = cctx.createLinearGradient(0, horizonY, 0, canvas.height);
    groundGrad.addColorStop(0, '#3a2818');
    groundGrad.addColorStop(0.4, '#2a1f14');
    groundGrad.addColorStop(1, '#1a1109');
    cctx.fillStyle = groundGrad;
    cctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);

    // Berge (Silhouetten)
    cctx.fillStyle = '#2a1f14';
    cctx.beginPath();
    cctx.moveTo(0, horizonY);
    let x = 0;
    while (x < canvas.width) {
      const peak = horizonY - 18 - Math.sin((x / canvas.width) * Math.PI * 4) * 12;
      cctx.lineTo(x, peak);
      x += 40;
    }
    cctx.lineTo(canvas.width, horizonY);
    cctx.closePath();
    cctx.fill();

    // Horizont-Linie
    cctx.strokeStyle = 'rgba(214,169,85,0.35)';
    cctx.beginPath();
    cctx.moveTo(0, horizonY);
    cctx.lineTo(canvas.width, horizonY);
    cctx.stroke();

    // Boden-Linie wo die Units stehen (zur Orientierung)
    const groundY = horizonY + FIELD_HEIGHT / 2;
    cctx.strokeStyle = 'rgba(255,255,255,0.05)';
    cctx.setLineDash([4, 6]);
    cctx.beginPath();
    cctx.moveTo(40, groundY);
    cctx.lineTo(canvas.width - 40, groundY);
    cctx.stroke();
    cctx.setLineDash([]);

    // Bases als stilisierte Türme
    drawBase(PLAYER_BASE_X, COLORS_CSS.cNatur);
    drawBase(ENEMY_BASE_X, COLORS_CSS.cKrieg);

    // Units
    ComboAuraSystem.recomputeIfDirty(state);
    for (const u of state.units) {
      if (!u.alive) continue;
      const color = colorToCss(u.card.color);
      const cy = horizonY + u.y;
      const hasCombo =
        (u.buffs.damage ?? 0) > 0 || (u.buffs.hp ?? 0) > 0 || (u.buffs.speed ?? 0) > 0;

      // Combo-Glow
      if (hasCombo) {
        cctx.fillStyle = color + '44';
        cctx.beginPath();
        cctx.arc(u.x, cy, UNIT_RADIUS + 8, 0, Math.PI * 2);
        cctx.fill();
      }

      // Body
      cctx.fillStyle = color;
      cctx.strokeStyle = u.side === 'player' ? COLORS_CSS.ink : '#1a0d08';
      cctx.lineWidth = 2;
      cctx.beginPath();
      cctx.arc(u.x, cy, UNIT_RADIUS, 0, Math.PI * 2);
      cctx.fill();
      cctx.stroke();

      // HP-Bar drüber
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
  };

  const drawBase = (x: number, color: string): void => {
    const horizonY = 60;
    const baseY = horizonY + FIELD_HEIGHT / 2 + 30;
    cctx.fillStyle = '#1a1109';
    cctx.fillRect(x - 22, baseY - 80, 44, 80);
    cctx.fillStyle = color;
    cctx.fillRect(x - 22, baseY - 80, 44, 4);
    // Zinnen
    for (let i = 0; i < 4; i++) {
      cctx.fillStyle = '#1a1109';
      cctx.fillRect(x - 22 + i * 11 + 2, baseY - 88, 7, 8);
    }
    cctx.fillStyle = color;
    cctx.fillRect(x - 4, baseY - 60, 8, 20);
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
  };
};
