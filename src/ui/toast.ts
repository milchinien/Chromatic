// Leichtgewichtige Toast-Notifications (z. B. Achievement freigeschaltet).
// Screen-unabhängig: hängt sich an document.body, stapelt unten rechts.

const containerEl = (): HTMLElement | null => {
  if (typeof document === 'undefined') return null;
  let c = document.getElementById('cm-toasts');
  if (!c) {
    c = document.createElement('div');
    c.id = 'cm-toasts';
    c.style.cssText =
      'position:fixed; right:22px; bottom:22px; z-index:9999; display:flex; flex-direction:column; gap:10px; align-items:flex-end; pointer-events:none;';
    document.body.appendChild(c);
  }
  return c;
};

export const showAchievementToast = (name: string, desc: string): void => {
  const c = containerEl();
  if (!c) return;

  const el = document.createElement('div');
  el.style.cssText = `
    display:flex; align-items:center; gap:12px; max-width:340px;
    padding:13px 18px; border-radius:8px;
    background: linear-gradient(180deg, #2c2218, #1a130c);
    border:1px solid var(--gold-deep); box-shadow:0 8px 28px rgba(0,0,0,0.6);
    font-family:'IBM Plex Sans', sans-serif; color: var(--ink);
    transform: translateX(24px); opacity:0;
    transition: transform 240ms ease, opacity 240ms ease;
  `;
  el.innerHTML = `
    <div style="font-size:26px; line-height:1;">🏆</div>
    <div style="display:flex; flex-direction:column; gap:2px;">
      <span style="font-family:'Cinzel', serif; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold-hi);">Achievement</span>
      <span style="font-weight:600; font-size:14px;">${name}</span>
      <span style="font-size:11px; color:var(--ink-dim);">${desc}</span>
    </div>`;
  c.appendChild(el);

  // Slide-in (per setTimeout statt RAF — RAF wird in Hintergrund-Tabs gedrosselt).
  setTimeout(() => {
    el.style.transform = 'translateX(0)';
    el.style.opacity = '1';
  }, 10);

  // Slide-out + Entfernen.
  setTimeout(() => {
    el.style.transform = 'translateX(24px)';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 280);
  }, 4200);
};
