export interface HpBarOptions {
  width: number;
  height?: number;
  color: string;
  bgColor?: string;
}

export interface HpBarHandle {
  el: HTMLElement;
  update: (current: number, max: number) => void;
}

export const renderHpBar = (opts: HpBarOptions): HpBarHandle => {
  const h = opts.height ?? 14;
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    width: ${opts.width}px;
    height: ${h}px;
    background: ${opts.bgColor ?? '#0f0a06'};
    border: 1px solid var(--line-hi);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
  `;
  const fill = document.createElement('div');
  fill.style.cssText = `
    height: 100%;
    width: 100%;
    background: linear-gradient(180deg, ${opts.color}, ${opts.color}88);
    transition: width 120ms linear;
  `;
  wrap.appendChild(fill);
  return {
    el: wrap,
    update(current: number, max: number) {
      const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
      fill.style.width = `${pct * 100}%`;
    },
  };
};
