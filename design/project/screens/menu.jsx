/* CHROMATIC — Main Menu */

const MainMenu = () => {
  const items = [
    { label: "Spielen", primary: true },
    { label: "Optionen" },
    { label: "Credits" },
    { label: "Beenden" },
  ];
  return (
    <div className="cm-screen" style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
      {/* Decorative arch */}
      <svg style={{position:"absolute", inset:0, width:"100%", height:"100%"}} preserveAspectRatio="none" viewBox="0 0 1280 800">
        <defs>
          <radialGradient id="mm-glow" cx="50%" cy="20%" r="60%">
            <stop offset="0%" stopColor="rgba(214,169,85,.18)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
          </radialGradient>
          <linearGradient id="mm-rune" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(214,169,85,0)"/>
            <stop offset="50%" stopColor="rgba(214,169,85,.6)"/>
            <stop offset="100%" stopColor="rgba(214,169,85,0)"/>
          </linearGradient>
        </defs>
        <rect width="1280" height="800" fill="url(#mm-glow)"/>
        {/* corner brackets */}
        <g stroke="rgba(214,169,85,.4)" strokeWidth="1" fill="none">
          <path d="M40 40 L80 40 M40 40 L40 80"/>
          <path d="M1240 40 L1200 40 M1240 40 L1240 80"/>
          <path d="M40 760 L80 760 M40 760 L40 720"/>
          <path d="M1240 760 L1200 760 M1240 760 L1240 720"/>
        </g>
        {/* vertical rune lines */}
        <line x1="100" y1="120" x2="100" y2="680" stroke="url(#mm-rune)"/>
        <line x1="1180" y1="120" x2="1180" y2="680" stroke="url(#mm-rune)"/>
      </svg>

      <div style={{position:"relative", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:64}}>
        {/* version */}
        <div style={{position:"absolute", top:-220, left:"50%", transform:"translateX(-50%)", display:"flex", alignItems:"center", gap:14}}>
          <span style={{width:60, height:1, background:"linear-gradient(90deg, transparent, var(--gold))"}}></span>
          <span className="cm-label" style={{color:"var(--gold)"}}>v 0.1 · Pre-Alpha</span>
          <span style={{width:60, height:1, background:"linear-gradient(90deg, var(--gold), transparent)"}}></span>
        </div>

        {/* Logo */}
        <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:10}}>
          {/* 5-color crest */}
          <div style={{display:"flex", gap:6, marginBottom:14}}>
            {["natur","krieg","stein","untot","farblos"].map(c => (
              <span key={c} className={`cm-chip cm-chip--${c}`} style={{width:14, height:14}}/>
            ))}
          </div>
          <h1 className="cm-display" style={{
            margin:0, fontSize:96, lineHeight:1, color:"var(--ink)",
            textShadow:"0 0 40px rgba(214,169,85,.3)"
          }}>Chromatic</h1>
          <div style={{display:"flex", alignItems:"center", gap:18, marginTop:4}}>
            <span style={{width:80, height:1, background:"var(--line-hi)"}}></span>
            <span style={{
              fontFamily:'"Cinzel", serif', letterSpacing:"0.4em", fontSize:11,
              color:"var(--ink-dim)", textTransform:"uppercase"
            }}>Ein Roguelite des Magierats</span>
            <span style={{width:80, height:1, background:"var(--line-hi)"}}></span>
          </div>
        </div>

        {/* Menu */}
        <div style={{display:"flex", flexDirection:"column", gap:2, width:280}}>
          {items.map((it, i) => (
            <button key={i} style={{
              background: it.primary ? "linear-gradient(180deg, #2c2218, #1a130c)" : "transparent",
              border: "none",
              borderTop: `1px solid ${it.primary ? "var(--gold-deep)" : "var(--line)"}`,
              borderBottom: `1px solid ${it.primary ? "var(--gold-deep)" : "var(--line)"}`,
              padding: "16px 24px",
              color: it.primary ? "var(--gold-hi)" : "var(--ink-dim)",
              fontFamily: '"Cinzel", serif',
              fontSize: 16,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              cursor: "pointer",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              textAlign:"left",
            }}>
              <span>{it.label}</span>
              {it.primary && (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M7 5l12 7-12 7z"/>
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{display:"flex", gap:24, color:"var(--ink-mute)", fontFamily:'"JetBrains Mono", monospace', fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase"}}>
          <span>↑↓ Auswählen</span>
          <span>↵ Bestätigen</span>
          <span>ESC Zurück</span>
        </div>
      </div>
    </div>
  );
};

window.MainMenu = MainMenu;
