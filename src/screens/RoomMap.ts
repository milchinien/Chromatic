import type { Screen } from '../router';
import {
  exitRoom,
  markNodeVisited,
  reachableInRoom,
  setCurrentRoomNode,
} from '../systems/run/RunState';
import { getCurrentRun, setActiveEncounter } from '../systems/run/currentRun';
import { encounterForSubNodeType } from '../systems/data/encounters';
import { renderSubTile, subTileSize } from '../ui/SubTile';

const MAP_LEFT = 140;
const MAP_RIGHT = 1140;
const MAP_TOP = 200;
const MAP_BOTTOM = 660;

const WORLD_TYPE_LABEL: Record<string, string> = {
  combat_normal: 'Normaler Kampf-Raum',
  combat_hard: 'Schwerer Kampf-Raum',
  shop: 'Markt',
  treasure: 'Schatzkammer',
  perk: 'Zauber-Heiligtum',
  boss: 'Endboss-Halle',
  start: 'Eingangshalle',
};

export const RoomMap: Screen = (host, ctx) => {
  const run = getCurrentRun();
  if (!run || !run.activeWorldNodeId) {
    queueMicrotask(() => ctx.go(run ? 'worldmap' : 'menu'));
    host.innerHTML = '';
    return;
  }

  const room = run.roomMaps.get(run.activeWorldNodeId);
  if (!room) {
    queueMicrotask(() => ctx.go('worldmap'));
    host.innerHTML = '';
    return;
  }

  const visited = run.visitedRoomNodes.get(run.activeWorldNodeId) ?? new Set<string>();
  const reachable = new Set(reachableInRoom(run));

  const posOf = (id: string): { x: number; y: number } => {
    const n = room.nodes.find((nn) => nn.id === id)!;
    return {
      x: MAP_LEFT + n.x * (MAP_RIGHT - MAP_LEFT),
      y: MAP_TOP + n.y * (MAP_BOTTOM - MAP_TOP),
    };
  };

  const edgesSvg = (() => {
    const paths: string[] = [];
    for (const node of room.nodes) {
      const from = posOf(node.id);
      for (const tid of node.edges) {
        const to = posOf(tid);
        const c1x = from.x + (to.x - from.x) * 0.5;
        const c1y = from.y;
        const c2x = from.x + (to.x - from.x) * 0.5;
        const c2y = to.y;
        const isCurrentEdge = node.id === run.currentRoomNodeId && reachable.has(tid);
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

  const worldLabel = WORLD_TYPE_LABEL[room.worldNodeType] ?? room.worldNodeType;

  host.innerHTML = `
    <div class="cm-fit"><div class="cm-screen" style="background: radial-gradient(ellipse at 50% 0%, #2a3340 0%, #1f2530 55%, #181c25 100%);">
      <div class="cm-hud">
        <div class="cm-hud-left">
          <button class="cm-btn cm-btn--ghost" data-action="exit-room" style="padding:6px 10px;">◀ Raum verlassen</button>
          <div class="cm-act">
            <span class="cm-act-label">AKT 0${run.actNumber} · RAUM-KARTE</span>
            <span class="cm-act-name">${worldLabel}</span>
          </div>
        </div>
        <div class="cm-hud-right">
          <div class="cm-hp-pill">
            <span class="cm-hp-dot"></span>
            <span><span>${run.baseHp}</span><span style="opacity:0.5;"> / ${run.maxBaseHp}</span></span>
          </div>
          <div class="cm-coin">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold-hi)" stroke-width="1.6">
              <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>
            </svg>
            <span class="cm-coin-val">${run.coins}</span>
          </div>
        </div>
      </div>

      <div style="position:absolute; inset:0; z-index:1;">
        <svg style="position:absolute; inset:0; width:100%; height:100%;" viewBox="0 0 1280 800" preserveAspectRatio="none">
          <defs>
            <pattern id="rm-dot" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="1" fill="rgba(159,200,214,0.10)"/>
            </pattern>
          </defs>
          <rect width="1280" height="800" fill="url(#rm-dot)"/>
          ${edgesSvg}
        </svg>
        <div data-slot="sub-nodes" style="position:absolute; inset:0;"></div>
      </div>

      <div style="position:absolute; bottom:18px; left:28px; right:28px; display:flex; justify-content:space-between; align-items:center; z-index:5;">
        <span class="cm-label">SUB-KARTE · ${room.nodes.length} Knoten</span>
        <span class="cm-label">${visited.size} / ${room.nodes.length} besucht</span>
      </div>
    </div></div>
  `;

  const nodesHost = host.querySelector<HTMLElement>('[data-slot="sub-nodes"]')!;
  for (const node of room.nodes) {
    const { x, y } = posOf(node.id);
    const size = subTileSize(node.type);
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute; left:${x - size / 2}px; top:${y - size / 2}px;`;
    const isCurrent = node.id === run.currentRoomNodeId;
    const tile = renderSubTile(
      {
        type: node.type,
        current: isCurrent,
        visited: visited.has(node.id) && !isCurrent,
        reachable: reachable.has(node.id),
      },
      reachable.has(node.id) ? () => onSubClick(node.id) : undefined,
    );
    wrap.appendChild(tile);
    nodesHost.appendChild(wrap);
  }

  host.querySelector<HTMLButtonElement>('[data-action="exit-room"]')!.addEventListener('click', () => {
    // Raum vorzeitig verlassen: Welt-Knoten bleibt unvisited, Spieler bricht ab.
    // Plan sieht das nicht explizit vor, ist aber nutzerfreundlich.
    exitRoom(run);
    ctx.go('worldmap');
  });

  function onSubClick(subId: string): void {
    if (!run || !run.activeWorldNodeId) return;
    const node = room!.nodes.find((n) => n.id === subId);
    if (!node) return;
    setCurrentRoomNode(run, subId);
    if (node.type === 'exit') {
      // Welt-Knoten als besucht markieren und zurück zur Welt-Karte.
      markNodeVisited(run, run.activeWorldNodeId);
      exitRoom(run);
      ctx.go('worldmap');
      return;
    }
    if (node.type === 'sub_treasure') {
      ctx.go('treasure');
      return;
    }
    const enc = encounterForSubNodeType(node.type);
    if (enc) {
      setActiveEncounter(enc);
      ctx.go('combat');
    }
  }
};
