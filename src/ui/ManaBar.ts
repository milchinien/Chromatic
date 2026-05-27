import { COLORS_CSS } from '../systems/data/designTokens';

export interface ManaBarHandle {
  el: HTMLElement;
  update: (current: number, max: number) => void;
}

export const renderManaBar = (width: number): ManaBarHandle => {
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    width: ${width}px;
    height: 18px;
    background: #0f0a06;
    border: 1px solid var(--line-hi);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
  `;
  const fill = document.createElement('div');
  fill.style.cssText = `
    height: 100%;
    width: 0%;
    background: linear-gradient(180deg, #6ab1e8, ${COLORS_CSS.mana});
    transition: width 80ms linear;
  `;
  // Skala-Ticks (20 Mana → 19 Trennlinien)
  const ticks = document.createElement('div');
  ticks.style.cssText = `position:absolute; inset:0; pointer-events:none;`;
  for (let i = 1; i < 20; i++) {
    const tick = document.createElement('div');
    tick.style.cssText = `
      position:absolute; top:0; bottom:0;
      left:${(i / 20) * 100}%;
      width:1px;
      background:rgba(0,0,0,0.35);
    `;
    ticks.appendChild(tick);
  }
  wrap.appendChild(fill);
  wrap.appendChild(ticks);
  return {
    el: wrap,
    update(current: number, max: number) {
      const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
      fill.style.width = `${pct * 100}%`;
      ticks.style.opacity = max > 20 ? '0.3' : '1';
    },
  };
};
