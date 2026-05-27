/* CHROMATIC — Reward Picker (Shop + Zauber combined)
   Fixed UI chrome — the 3 reward slots are placeholders. The card data
   (unit / perk / rare) is generated at runtime by game logic. */

const RewardSlot = ({ index = 1 }) => (
  <div style={{
    width: 270, height: 400,
    background: "linear-gradient(180deg, rgba(58,42,80,.55) 0%, rgba(36,28,56,.65) 100%)",
    border: "1px dashed rgba(240,200,120,.55)",
    borderRadius: 14,
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,.3), 0 6px 14px rgba(0,0,0,.45)",
    padding: 18,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
    position: "relative",
    boxSizing: "border-box",
  }}>
    {/* index chip */}
    <div style={{
      position: "absolute", top: 12, left: 12,
      padding: "2px 8px",
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 10, letterSpacing: ".22em",
      color: "rgba(240,200,120,.7)",
      background: "rgba(0,0,0,.35)",
      border: "1px solid rgba(240,200,120,.3)",
      borderRadius: 2,
    }}>SLOT 0{index}</div>

    {/* corner ticks */}
    {["tl","tr","bl","br"].map(p => (
      <span key={p} style={{
        position:"absolute",
        ...(p.includes("t") ? {top:6} : {bottom:6}),
        ...(p.includes("l") ? {left:6} : {right:6}),
        width:10, height:10,
        borderTop: p.includes("t") ? "1px solid rgba(240,200,120,.5)" : "none",
        borderBottom: p.includes("b") ? "1px solid rgba(240,200,120,.5)" : "none",
        borderLeft: p.includes("l") ? "1px solid rgba(240,200,120,.5)" : "none",
        borderRight: p.includes("r") ? "1px solid rgba(240,200,120,.5)" : "none",
      }}/>
    ))}

    {/* big orb placeholder */}
    <div style={{
      width: 110, height: 110, borderRadius: "50%",
      background: "radial-gradient(circle at 35% 28%, rgba(240,200,120,.25), rgba(240,200,120,.05) 60%, transparent 75%)",
      border: "1px dashed rgba(240,200,120,.5)",
      display:"flex", alignItems:"center", justifyContent:"center",
      color: "rgba(240,200,120,.85)",
      fontFamily: '"JetBrains Mono", monospace', fontSize: 18, letterSpacing: ".1em",
    }}>?</div>

    {/* placeholder lines */}
    <div style={{display:"flex", flexDirection:"column", gap:6, alignItems:"center", width:"100%"}}>
      <div style={{width: "70%", height: 12, background: "rgba(240,200,120,.18)", borderRadius: 1}}/>
      <div style={{width: "92%", height: 7, background: "rgba(240,200,120,.10)", borderRadius: 1}}/>
      <div style={{width: "92%", height: 7, background: "rgba(240,200,120,.10)", borderRadius: 1}}/>
      <div style={{width: "72%", height: 7, background: "rgba(240,200,120,.10)", borderRadius: 1}}/>
    </div>

    {/* type kicker */}
    <span style={{
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 9, letterSpacing: ".3em", textTransform:"uppercase",
      color: "rgba(240,200,120,.6)", textAlign:"center",
    }}>Karte / Perk / Rare</span>
  </div>
);

const RewardPicker = ({ coins = 412, hp = 86, hpMax = 100, floor = 4, floorMax = 20 }) => {
  return (
    <div className="cm-screen" style={{background:"#0b0805"}}>
      <div style={{position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 35%, rgba(80,60,40,.35) 0%, transparent 60%)"}}/>

      {/* === HUD — consistent cm-hud === */}
      <div className="cm-hud">
        <div className="cm-hud-left">
          <button style={{background:"transparent", border:"1px solid var(--line)", color:"var(--ink-dim)", padding:"8px 10px", cursor:"pointer", borderRadius:2}}>
            <Icon name="exit" size={14}/>
          </button>
          <div className="cm-act">
            <span className="cm-act-label">Floor {String(floor).padStart(2,"0")} / {floorMax} · Belohnung</span>
            <span className="cm-act-name">Wähle einen Pfad</span>
          </div>
        </div>
        <div className="cm-hud-right">
          <HPPill cur={hp} max={hpMax}/>
          <Coin value={coins}/>
        </div>
      </div>

      {/* === CHAINS (decor) === */}
      <svg style={{position:"absolute", top:90, left:0, right:0, height:200, width:"100%", pointerEvents:"none", opacity:.55}} preserveAspectRatio="none" viewBox="0 0 1500 200">
        {[320, 620, 920, 1180].map((x, i) => (
          <g key={i}>
            {Array.from({length: 7}, (_, j) => (
              <ellipse key={j} cx={x} cy={j*22 + 8} rx="5" ry="8" fill="none" stroke="#8a8278" strokeWidth="1.5"/>
            ))}
          </g>
        ))}
      </svg>

      {/* === PANEL === */}
      <div style={{
        position:"absolute", top: 140, left: 100, right: 100, bottom: 80,
        background:"linear-gradient(180deg, #4a3a6e 0%, #2f235a 100%)",
        border:"2px solid #1a130c",
        borderRadius: 14,
        boxShadow:"0 10px 30px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.06)",
        padding:"30px 36px 28px",
        display:"flex", flexDirection:"column", gap: 22,
      }}>
        {/* speckle texture */}
        <svg style={{position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", opacity:.18}} preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <pattern id="rw-tex" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r=".4" fill="#1a1228"/>
              <circle cx="10" cy="9" r=".4" fill="#1a1228"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#rw-tex)"/>
        </svg>

        {/* Title block */}
        <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,.12)", paddingBottom:14, position:"relative"}}>
          <div>
            <span className="cm-label" style={{color:"rgba(240,200,120,.7)"}}>Belohnung · Eine Auswahl</span>
            <h2 className="cm-title" style={{margin:"6px 0 0 0", fontSize:24, color:"#fbf3dc"}}>Drei Pfade</h2>
          </div>
          <span className="cm-label" style={{color:"rgba(255,255,255,.5)"}}>3 Optionen · 1 Wahl</span>
        </div>

        {/* Body: left rail + 3 reward slots */}
        <div style={{display:"grid", gridTemplateColumns:"150px 1fr", gap: 28, alignItems:"start", flex:1, position:"relative"}}>

          {/* Left rail — fixed UI buttons */}
          <div style={{display:"flex", flexDirection:"column", gap:10, alignSelf:"center"}}>
            <button className="cm-btn cm-btn--ghost" style={{justifyContent:"center", padding:"12px 0"}}>Überspringen</button>
            <button className="cm-btn" style={{justifyContent:"center", padding:"12px 0", flexDirection:"column", gap:4}}>
              <span style={{display:"flex", alignItems:"center", gap:8}}>
                <Icon name="reroll" size={14}/>
                Neuwurf
              </span>
              <span style={{display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--gold-hi)", fontFamily:'"JetBrains Mono", monospace', letterSpacing:".05em"}}>
                <Icon name="coin" size={11} color="var(--gold-hi)"/> 4
              </span>
            </button>
          </div>

          {/* Reward slots — placeholders */}
          <div style={{display:"flex", justifyContent:"center", gap:22}}>
            {[1,2,3].map(i => <RewardSlot key={i} index={i}/>)}
          </div>
        </div>

        {/* Bottom — Take button (fixed UI) */}
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:"1px solid rgba(255,255,255,.12)", paddingTop:16}}>
          <span className="cm-label" style={{color:"rgba(255,255,255,.5)"}}>Auswahl wirkt sofort</span>
          <button className="cm-btn cm-btn--gold" style={{padding:"12px 32px", fontSize:14}}>
            Belohnung nehmen
          </button>
        </div>
      </div>

      {/* === RIGHT SIDE TABS (fixed UI) === */}
      <div style={{position:"absolute", right: 24, top: "50%", transform:"translateY(-50%)", display:"flex", flexDirection:"column", gap: 10}}>
        {[
          { icon: "crown",    label:"Deck"   },
          { icon: "backpack", label:"Inv."   },
          { icon: "sparkle",  label:"Perks", active:true },
        ].map((t, i) => (
          <button key={i} style={{
            width: 54, height: 54,
            background: t.active ? "linear-gradient(180deg, var(--surface-3), var(--surface))" : "var(--surface)",
            border:`1px solid ${t.active ? "var(--gold)" : "var(--line)"}`,
            borderRadius: 3,
            cursor:"pointer", padding: 0,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2,
            color: t.active ? "var(--gold-hi)" : "var(--ink-mute)",
          }}>
            <Icon name={t.icon} size={20} color={t.active ? "var(--gold-hi)" : "var(--ink-mute)"}/>
            <span style={{fontFamily:'"JetBrains Mono", monospace', fontSize:8, letterSpacing:".18em", textTransform:"uppercase"}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

window.RewardPicker = RewardPicker;
window.RewardSlot = RewardSlot;
