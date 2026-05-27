import type { SubNodeType } from '../domain/Run';

interface TypeMeta {
  label: string;
  color: string;
  tone: string;
  glyph: string;
  size: number;
}

const META: Record<SubNodeType, TypeMeta> = {
  spawn: { label: 'Eintritt', color: '#9fc8d6', tone: '#22323a', glyph: '⬢', size: 56 },
  sub_combat: { label: 'Kampf', color: '#e8dcc4', tone: '#3d3225', glyph: '⚔', size: 60 },
  sub_treasure: { label: 'Schatz', color: '#f0c878', tone: '#3d3024', glyph: '◈', size: 60 },
  mini_boss: { label: 'Zwischenboss', color: '#c8b8a8', tone: '#322a22', glyph: '☠', size: 72 },
  exit: { label: 'Ausgang', color: '#9fc8d6', tone: '#22323a', glyph: '⤴', size: 60 },
};

export interface SubTileState {
  type: SubNodeType;
  current: boolean;
  visited: boolean;
  reachable: boolean;
}

export const renderSubTile = (state: SubTileState, onClick?: () => void): HTMLElement => {
  const meta = META[state.type];
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.dataset.subType = state.type;
  const enabled = state.reachable && !state.current;
  const borderColor = state.current
    ? meta.color
    : state.visited
      ? 'var(--ink-mute)'
      : state.reachable
        ? meta.color
        : '#5a6470';
  const glow = state.current ? `0 0 18px ${meta.color}88` : state.reachable ? `0 0 10px ${meta.color}44` : 'none';
  tile.style.cssText = `
    position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px;
    width: ${meta.size}px; height: ${meta.size + 22}px;
    background: transparent; border: none; padding: 0;
    cursor: ${enabled ? 'pointer' : 'default'};
    opacity: ${state.visited && !state.current ? 0.55 : 1};
  `;

  tile.innerHTML = `
    <div style="
      position: relative; width: ${meta.size}px; height: ${meta.size}px; border-radius: 50%;
      background: radial-gradient(circle at 50% 35%, ${meta.tone}, #14181c);
      border: 2px solid ${borderColor};
      box-shadow: ${glow};
      display: flex; align-items: center; justify-content: center;
      transition: transform 120ms;
    ">
      <span style="font-size: ${Math.round(meta.size * 0.42)}px; color: ${meta.color}; line-height: 1; text-shadow: 0 0 6px ${meta.color};">${meta.glyph}</span>
      ${state.visited && !state.current ? `<div style="
        position:absolute; right:-2px; bottom:-2px; width:14px; height:14px;
        border-radius:50%; background:#3e6a3e; border:1px solid #14181c;
        display:flex; align-items:center; justify-content:center;
        font-size: 9px; color: #fff;
      ">✓</div>` : ''}
    </div>
    <span style="font-family:'Cinzel', serif; font-size: 9px; letter-spacing:0.18em; text-transform:uppercase; color:${state.current ? meta.color : 'var(--ink-dim)'};">${meta.label}</span>
  `;

  if (enabled && onClick) {
    tile.addEventListener('click', onClick);
    tile.addEventListener('mouseenter', () => {
      const ring = tile.firstElementChild as HTMLElement | null;
      if (ring) ring.style.transform = 'scale(1.06)';
    });
    tile.addEventListener('mouseleave', () => {
      const ring = tile.firstElementChild as HTMLElement | null;
      if (ring) ring.style.transform = 'scale(1)';
    });
  }
  return tile;
};

export const subTileSize = (type: SubNodeType): number => META[type].size;
