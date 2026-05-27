import type { NodeType } from '../domain/Run';

interface TypeMeta {
  label: string;
  color: string;
  tone: string;
  glyph: string;
  size: number;
}

// Aus plans/DESIGN_REFERENCE.md Sektion 4.8 — Room-Type-Definitionen.
// Glyphen sind reine Unicode-Approximationen; Phase 7 ersetzt sie durch
// die richtigen SVG-Pictogramme aus design/project/screens/icons.jsx.
const META: Record<NodeType, TypeMeta> = {
  start: { label: 'Start', color: '#e0c878', tone: '#3d3225', glyph: '⚑', size: 76 },
  combat_normal: { label: 'Kampf', color: '#e8dcc4', tone: '#3d3225', glyph: '⚔', size: 80 },
  combat_hard: { label: 'Schwer', color: '#e8856e', tone: '#3d251c', glyph: '⚔', size: 84 },
  perk: { label: 'Zauber', color: '#c89fdc', tone: '#3a2c3d', glyph: '✦', size: 80 },
  shop: { label: 'Shop', color: '#7fc88a', tone: '#2b3a26', glyph: '◉', size: 80 },
  treasure: { label: 'Schatz', color: '#f0c878', tone: '#3d3024', glyph: '◈', size: 80 },
  boss: { label: 'Endboss', color: '#f0c878', tone: '#3d1c14', glyph: '☠', size: 108 },
};

export interface RoomTileState {
  type: NodeType;
  current: boolean;
  visited: boolean;
  reachable: boolean;
}

export const renderRoomTile = (state: RoomTileState, onClick?: () => void): HTMLElement => {
  const meta = META[state.type];
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.dataset.roomType = state.type;
  const enabled = state.reachable && !state.current;
  const borderColor = state.current
    ? meta.color
    : state.visited
      ? 'var(--ink-mute)'
      : state.reachable
        ? meta.color
        : '#8b6f47';
  const glow = state.current ? `0 0 24px ${meta.color}88` : state.reachable ? `0 0 14px ${meta.color}44` : 'none';
  tile.style.cssText = `
    position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px;
    width: ${meta.size}px; height: ${meta.size + 28}px;
    background: transparent; border: none; padding: 0;
    cursor: ${enabled ? 'pointer' : 'default'};
    opacity: ${state.visited && !state.current ? 0.6 : 1};
  `;

  tile.innerHTML = `
    <div style="
      position: relative; width: ${meta.size}px; height: ${meta.size}px; border-radius: 50%;
      background: radial-gradient(circle at 50% 35%, ${meta.tone}, #1f180f);
      border: 2px solid ${borderColor};
      box-shadow: ${glow};
      display: flex; align-items: center; justify-content: center;
      transition: transform 120ms, box-shadow 120ms;
    ">
      <div style="
        position: absolute; inset: 5px; border-radius: 50%;
        border: 1px solid ${meta.color}; opacity: 0.65;
      "></div>
      <span style="font-size: ${Math.round(meta.size * 0.42)}px; color: ${meta.color}; line-height: 1; text-shadow: 0 0 8px ${meta.color};">${meta.glyph}</span>
      ${state.visited && !state.current ? `<div style="
        position:absolute; right:-2px; bottom:-2px; width:18px; height:18px;
        border-radius:50%; background:#3e6a3e; border:1.5px solid #1a1109;
        display:flex; align-items:center; justify-content:center;
        font-size: 11px; color: #fff;
      ">✓</div>` : ''}
    </div>
    <span style="font-family:'Cinzel', serif; font-size: 11px; letter-spacing:0.18em; text-transform:uppercase; color:${state.current ? meta.color : 'var(--ink-dim)'};">${meta.label}</span>
    ${state.current ? `<span style="font-family:'JetBrains Mono', monospace; font-size: 9px; letter-spacing:0.22em; color:${meta.color}; text-transform:uppercase;">Du bist hier</span>` : ''}
  `;

  if (enabled && onClick) {
    tile.addEventListener('click', onClick);
    tile.addEventListener('mouseenter', () => {
      const ring = tile.firstElementChild as HTMLElement | null;
      if (ring) ring.style.transform = 'scale(1.05)';
    });
    tile.addEventListener('mouseleave', () => {
      const ring = tile.firstElementChild as HTMLElement | null;
      if (ring) ring.style.transform = 'scale(1)';
    });
  }
  return tile;
};

export const roomTileSize = (type: NodeType): number => META[type].size;
export const roomTileColor = (type: NodeType): string => META[type].color;
