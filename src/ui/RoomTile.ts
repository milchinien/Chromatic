import type { NodeType } from '../domain/Run';
import { nodeButtonUrl } from './buttons';

interface TypeMeta {
  label: string;
  color: string;
  size: number;
}

const META: Record<NodeType, TypeMeta> = {
  start: { label: 'Start', color: '#e0c878', size: 76 },
  combat_normal: { label: 'Kampf', color: '#e8dcc4', size: 80 },
  combat_hard: { label: 'Schwer', color: '#e8856e', size: 84 },
  perk: { label: 'Zauber', color: '#c89fdc', size: 80 },
  shop: { label: 'Shop', color: '#7fc88a', size: 80 },
  treasure: { label: 'Schatz', color: '#f0c878', size: 80 },
  boss: { label: 'Endboss', color: '#f0c878', size: 108 },
};

export interface RoomTileState {
  type: NodeType;
  current: boolean;
  visited: boolean;
  reachable: boolean;
}

export const renderRoomTile = (state: RoomTileState, onClick?: () => void): HTMLElement => {
  const meta = META[state.type];
  // Aktiv = anklickbar (erreichbar) oder aktueller Standort. Alles andere
  // (besucht / noch nicht erreichbar) bekommt die inaktive "nicht betretbar"-Variante.
  const isActive = state.reachable || state.current;
  const imgUrl = nodeButtonUrl(state.type, isActive, (clean) => {
    const img = tile.querySelector('img');
    if (!img) return;
    if (img.src !== clean) img.src = clean;
    img.style.opacity = '1';
  });
  // Falls die saubere Data-URL noch nicht im Cache ist (imgUrl ist dann das
  // Original-PNG mit weißem Hintergrund), starten wir das Bild unsichtbar und
  // blenden via onReady-Callback ein.
  const imgIsClean = imgUrl?.startsWith('data:') === true;
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.dataset.roomType = state.type;
  const enabled = state.reachable && !state.current;
  // Aktive Knöpfe größer als inaktive — klare Hierarchie "betretbar vs. nicht".
  // (Nach dem Autocrop sind alle Bilder gleich groß, daher steuert der Scale hier.)
  const baseScale = isActive ? 1 : 0.82;
  // Zustand wird komplett über aktives/inaktives PNG + Häkchen kommuniziert —
  // kein zusätzliches Dimmen/Graustufen mehr (inaktive Bilder sind schon entsättigt).
  tile.style.cssText = `
    position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px;
    width: ${meta.size}px; height: ${meta.size + 28}px;
    background: transparent; border: none; padding: 0;
    cursor: ${enabled ? 'pointer' : 'default'};
    opacity: 1;
  `;

  tile.innerHTML = `
    <div style="
      position: relative; width: ${meta.size}px; height: ${meta.size}px;
      display: flex; align-items: center; justify-content: center;
      transition: transform 120ms;
      transform: scale(${baseScale});
    ">
      ${
        imgUrl
          ? `<img src="${imgUrl}" alt="${meta.label}" style="
              width: 100%; height: 100%; object-fit: contain;
              pointer-events: none;
              opacity: ${imgIsClean ? 1 : 0};
              transition: opacity 120ms ease-out;
            "/>`
          : `<div style="
              width:100%; height:100%; border-radius:50%;
              background: radial-gradient(circle at 50% 35%, #3d3225, #1f180f);
              border:2px solid ${meta.color};
            "></div>`
      }
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
      if (ring) ring.style.transform = `scale(${baseScale * 1.08})`;
    });
    tile.addEventListener('mouseleave', () => {
      const ring = tile.firstElementChild as HTMLElement | null;
      if (ring) ring.style.transform = `scale(${baseScale})`;
    });
  }
  return tile;
};

export const roomTileSize = (type: NodeType): number => META[type].size;
export const roomTileColor = (type: NodeType): string => META[type].color;
