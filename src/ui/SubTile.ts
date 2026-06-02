import type { SubNodeType } from '../domain/Run';
import { subButtonUrl } from './buttons';

interface TypeMeta {
  label: string;
  color: string;
  size: number;
}

const META: Record<SubNodeType, TypeMeta> = {
  spawn: { label: 'Eintritt', color: '#9fc8d6', size: 56 },
  sub_combat: { label: 'Kampf', color: '#e8dcc4', size: 60 },
  sub_treasure: { label: 'Schatz', color: '#f0c878', size: 60 },
  mini_boss: { label: 'Zwischenboss', color: '#c8b8a8', size: 72 },
  exit: { label: 'Ausgang', color: '#9fc8d6', size: 60 },
};

export interface SubTileState {
  type: SubNodeType;
  current: boolean;
  visited: boolean;
  reachable: boolean;
}

export const renderSubTile = (state: SubTileState, onClick?: () => void): HTMLElement => {
  const meta = META[state.type];
  const imgUrl = subButtonUrl(state.type, (clean) => {
    const img = tile.querySelector('img');
    if (img && img.src !== clean) img.src = clean;
  });
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.dataset.subType = state.type;
  const enabled = state.reachable && !state.current;
  const glow = 'none';
  const visitedDim = state.visited && !state.current;
  tile.style.cssText = `
    position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px;
    width: ${meta.size}px; height: ${meta.size + 22}px;
    background: transparent; border: none; padding: 0;
    cursor: ${enabled ? 'pointer' : 'default'};
    opacity: ${visitedDim ? 0.55 : state.reachable || state.current ? 1 : 0.75};
  `;

  tile.innerHTML = `
    <div style="
      position: relative; width: ${meta.size}px; height: ${meta.size}px;
      display: flex; align-items: center; justify-content: center;
      transition: transform 120ms, filter 120ms;
      filter: ${glow};
    ">
      ${
        imgUrl
          ? `<img src="${imgUrl}" alt="${meta.label}" style="
              width: 100%; height: 100%; object-fit: contain;
              pointer-events: none;
              ${visitedDim ? 'filter: grayscale(0.6) brightness(0.85);' : ''}
            "/>`
          : `<div style="
              width:100%; height:100%; border-radius:50%;
              background: radial-gradient(circle at 50% 35%, #3d3225, #1f180f);
              border:2px solid ${meta.color};
            "></div>`
      }
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
      if (ring) ring.style.transform = 'scale(1.08)';
    });
    tile.addEventListener('mouseleave', () => {
      const ring = tile.firstElementChild as HTMLElement | null;
      if (ring) ring.style.transform = 'scale(1)';
    });
  }
  return tile;
};

export const subTileSize = (type: SubNodeType): number => META[type].size;
