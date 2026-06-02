import type { Screen } from '../router';
import {
  enterRoom,
  reachableFromCurrent,
  setCurrentNode,
} from '../systems/run/RunState';
import { getCurrentRun, setActiveEncounter, clearCurrentRun } from '../systems/run/currentRun';
import { encounterForNodeType } from '../systems/data/encounters';
import { getOrCreateRoomMap } from '../systems/run/RoomMapGenerator';
import { actName } from '../systems/run/MapGenerator';
import { mulberry32 } from '../systems/rng';
import { renderRoomTile, roomTileSize } from '../ui/RoomTile';
import { BG, bgUrl } from '../ui/backgrounds';

// Welt-Karte-Screen. Liest aktiven Run aus currentRun-Singleton. Wenn kein
// Run aktiv ist (z.B. direkter Aufruf), zurück ins Hauptmenü.
//
// Layout: 1280×800 Design-Box. Map liegt im Bereich x:80–1200, y:140–720.
// Knoten-Position aus map.x/y (normalisiert) skaliert in diesen Bereich.
const MAP_LEFT = 80;
const MAP_RIGHT = 1200;
const MAP_TOP = 140;
const MAP_BOTTOM = 700;

export const WorldMap: Screen = (host, ctx) => {
  const run = getCurrentRun();
  if (!run) {
    // Kein Run aktiv — Hauptmenü direkt zurück.
    queueMicrotask(() => ctx.go('menu'));
    host.innerHTML = '';
    return;
  }

  const nodeById = new Map(run.map.nodes.map((n) => [n.id, n]));
  const posOf = (id: string): { x: number; y: number } => {
    const n = nodeById.get(id)!;
    return {
      x: MAP_LEFT + n.x * (MAP_RIGHT - MAP_LEFT),
      y: MAP_TOP + n.y * (MAP_BOTTOM - MAP_TOP),
    };
  };

  const reachable = new Set(reachableFromCurrent(run));

  const edgesSvg = (() => {
    const paths: string[] = [];
    for (const node of run.map.nodes) {
      const from = posOf(node.id);
      for (const tid of node.edges) {
        const to = posOf(tid);
        const c1x = from.x + (to.x - from.x) * 0.5;
        const c1y = from.y;
        const c2x = from.x + (to.x - from.x) * 0.5;
        const c2y = to.y;
        const isCurrentEdge = node.id === run.currentNodeId && reachable.has(tid);
        const stroke = isCurrentEdge ? 'var(--gold)' : 'var(--line-hi)';
        const dash = isCurrentEdge ? '' : 'stroke-dasharray="3 4"';
        const width = isCurrentEdge ? '1.6' : '1.2';
        const opacity = isCurrentEdge ? '1' : '0.55';
        paths.push(
          `<path d="M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}" fill="none" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}" ${dash}/>`,
        );
      }
    }
    return paths.join('\n');
  })();

  host.innerHTML = `
    <div class="cm-fit"><div class="cm-screen" style="background-image:${bgUrl(BG.worldmap!)}; background-size:cover; background-position:center;">
      <!-- HUD -->
      <div class="cm-hud">
        <div class="cm-hud-left">
          <button class="cm-btn cm-btn--ghost" data-action="exit" style="padding:6px 10px;">◀ Verlassen</button>
          <div class="cm-act">
            <span class="cm-act-label">AKT 0${run.actNumber} · WELT-KARTE</span>
            <span class="cm-act-name">${actName(run.actNumber)}</span>
          </div>
        </div>
        <div class="cm-hud-right">
          <div class="cm-hp-pill" data-slot="hp-pill">
            <span class="cm-hp-dot"></span>
            <span><span data-slot="hp">${run.baseHp}</span><span style="opacity:0.5;"> / ${run.maxBaseHp}</span></span>
          </div>
          <div class="cm-coin">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold-hi)" stroke-width="1.6">
              <circle cx="12" cy="12" r="9"/>
              <circle cx="12" cy="12" r="5"/>
            </svg>
            <span class="cm-coin-val" data-slot="coins">${run.coins}</span>
          </div>
        </div>
      </div>

      <!-- Map area -->
      <div style="position:absolute; inset:0; z-index:1;">
        <svg style="position:absolute; inset:0; width:100%; height:100%;" viewBox="0 0 1280 800" preserveAspectRatio="none">
          <defs>
            <pattern id="wm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(214,169,85,0.05)" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="1280" height="800" fill="url(#wm-grid)"/>
          ${edgesSvg}
        </svg>

        <div data-slot="nodes" style="position:absolute; inset:0;"></div>
      </div>

      <!-- Bottom rail -->
      <div style="
        position:absolute; bottom:18px; left:28px; right:28px; display:flex;
        justify-content:space-between; align-items:center; z-index:5;
      ">
        <span class="cm-label">PFAD</span>
        <span class="cm-label">${run.map.nodes.length} Räume · Endboss am Ende</span>
      </div>

      <!-- Encounter-Preview popup (für nicht-implementierte Knotentypen) -->
      <div data-slot="popup" style="display:none; position:absolute; inset:0; z-index:10; align-items:center; justify-content:center; background:rgba(15,12,8,0.7);"></div>
    </div></div>
  `;

  const $ = <T extends HTMLElement = HTMLElement>(slot: string): T => {
    const el = host.querySelector<T>(`[data-slot="${slot}"]`);
    if (!el) throw new Error(`Missing slot: ${slot}`);
    return el;
  };

  // Knoten platzieren
  const nodesHost = $('nodes');
  for (const node of run.map.nodes) {
    const { x, y } = posOf(node.id);
    const size = roomTileSize(node.type);
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute; left:${x - size / 2}px; top:${y - size / 2}px;`;
    const isCurrent = node.id === run.currentNodeId;
    const tile = renderRoomTile(
      {
        type: node.type,
        current: isCurrent,
        visited: run.visitedNodes.has(node.id) && !isCurrent,
        reachable: reachable.has(node.id),
      },
      reachable.has(node.id) ? () => onNodeClick(node.id) : undefined,
    );
    wrap.appendChild(tile);
    nodesHost.appendChild(wrap);
  }

  // Exit-Button: Run aufgeben → zurück ins Menü.
  host.querySelector<HTMLButtonElement>('[data-action="exit"]')!.addEventListener('click', () => {
    clearCurrentRun();
    ctx.go('menu');
  });

  function onNodeClick(nodeId: string): void {
    const node = nodeById.get(nodeId);
    if (!node || !run) return;
    setCurrentNode(run, nodeId);

    // Boss-Welt-Knoten überspringt die Sub-Map und startet direkt den Boss-Combat.
    if (node.type === 'boss') {
      const enc = encounterForNodeType('boss', run.actNumber);
      if (enc) {
        setActiveEncounter(enc);
        ctx.go('combat');
      }
      return;
    }

    // Kampf-Welt-Knoten: zuerst Sub-Map öffnen (Phase 5).
    if (node.type === 'combat_normal' || node.type === 'combat_hard') {
      const room = getOrCreateRoomMap(run, node, mulberry32);
      enterRoom(run, node.id, room);
      ctx.go('roommap');
      return;
    }

    switch (node.type) {
      case 'shop':
        ctx.go('shop');
        return;
      case 'treasure':
        ctx.go('treasure');
        return;
      case 'perk':
        ctx.go('perk');
        return;
      default:
        showPlaceholder(node.type);
    }
  }

  function showPlaceholder(type: string): void {
    const popup = $('popup');
    const label =
      type === 'shop'
        ? 'Shop'
        : type === 'treasure'
          ? 'Schatzraum'
          : type === 'perk'
            ? 'Zauberraum'
            : type;
    popup.style.display = 'flex';
    popup.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:18px; padding:24px;">
        <h2 class="cm-display" style="margin:0; font-size:42px; color:var(--gold-hi);">${label}</h2>
        <span class="cm-label">Dieser Raumtyp wird in einer späteren Phase ausgebaut.</span>
        <button class="cm-btn" data-action="popup-close">Weiter</button>
      </div>
    `;
    popup.querySelector<HTMLButtonElement>('[data-action="popup-close"]')!.addEventListener('click', () => {
      popup.style.display = 'none';
      ctx.go('worldmap');
    });
  }

};
