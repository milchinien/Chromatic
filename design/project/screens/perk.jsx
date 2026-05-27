/* CHROMATIC — Zauber-Raum (Permanent Perk room) */

const PERKS = [
  { id:"a", name:"Quell des Geistes",   icon:"sparkle", color:"var(--mana)",      tag:"Mana",
    text:"+20 Max-Mana für den Rest des Runs.", detail:"Erweitert dein Mana-Reservoir dauerhaft. Spielraum für stärkere Combos." },
  { id:"b", name:"Adern der Welt",       icon:"tree",    color:"var(--c-natur)",   tag:"Regen",
    text:"+2× Mana-Regeneration für den Rest des Runs.", detail:"Verdoppelt deine Mana-Regen-Rate. Aggressiveres Tempo, mehr Karten pro Minute." },
  { id:"c", name:"Eiserne Bindung",      icon:"shield",  color:"var(--c-stein)",   tag:"HP",
    text:"+20 Base-HP für den Rest des Runs.", detail:"Mehr Polster gegen Aggro-Decks. Verhindert frühe Niederlagen in Akt 3+." },
  { id:"d", name:"Vier-Karten-Hand",     icon:"swords",  color:"var(--gold)",      tag:"Hand",
    text:"+1 Karte in der Hand (4 statt 3).", detail:"Mehr Optionen pro Tick. Eröffnet komplexere Combos im Real-Time-Spiel." },
];

const PerkRoom = ({ coins = 412 }) => {
  const selectedId = "b";
  const selected = PERKS.find(p => p.id === selectedId);
  return (
    <div className="cm-screen">
      <div className="cm-hud">
        <div className="cm-hud-left">
          <button style={{background:"transparent", border:"1px solid var(--line)", color:"var(--ink-dim)", padding:"8px 10px", cursor:"pointer", borderRadius:2}}>
            <Icon name="exit" size={14}/>
          </button>
          <div className="cm-act">
            <span className="cm-act-label">Akt 01 · Zauber-Raum</span>
            <span className="cm-act-name">Heiligtum der Wahl</span>
          </div>
        </div>
        <div className="cm-hud-right">
          <HPPill cur={86} max={100}/>
          <Coin value={coins}/>
        </div>
      </div>

      {/* Background ritual circle */}
      <svg style={{position:"absolute", top:140, left:"50%", transform:"translateX(-50%)", width:680, height:680, opacity:.18, pointerEvents:"none"}} viewBox="0 0 680 680">
        <circle cx="340" cy="340" r="320" fill="none" stroke="var(--gold)" strokeWidth="1"/>
        <circle cx="340" cy="340" r="260" fill="none" stroke="var(--gold)" strokeWidth=".6" strokeDasharray="2 6"/>
        <circle cx="340" cy="340" r="180" fill="none" stroke="var(--gold)" strokeWidth=".6"/>
        <polygon points="340,40 588,200 488,580 192,580 92,200" fill="none" stroke="var(--gold)" strokeWidth=".8"/>
        {[0,72,144,216,288].map(a => {
          const r=(a-90)*Math.PI/180;
          return <line key={a} x1="340" y1="340" x2={340+Math.cos(r)*320} y2={340+Math.sin(r)*320} stroke="var(--gold)" strokeWidth=".4"/>;
        })}
      </svg>

      {/* Body: perks on pedestals */}
      <div style={{position:"absolute", inset:"110px 56px 56px 56px", display:"grid", gridTemplateColumns:"1fr 380px", gap:32}}>
        <div style={{display:"flex", flexDirection:"column", gap:18}}>

          <div style={{display:"flex", alignItems:"end", justifyContent:"space-between", borderBottom:"1px solid var(--line)", paddingBottom:12}}>
            <div>
              <div className="cm-label">Wähle einen Permanenten Vorteil</div>
              <h2 className="cm-title" style={{margin:"6px 0 0 0", fontSize:24, color:"var(--ink)"}}>Vier Pfade · Eine Wahl</h2>
            </div>
            <span className="cm-label">Endgültig</span>
          </div>

          {/* Perk pedestals */}
          <div style={{flex:1, display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16, alignItems:"end"}}>
            {PERKS.map(p => {
              const isSel = p.id === selectedId;
              return (
                <div key={p.id} style={{display:"flex", flexDirection:"column", alignItems:"center", gap:0}}>
                  {/* perk card */}
                  <div style={{
                    width:"100%",
                    aspectRatio:"3/4",
                    background: `linear-gradient(180deg, ${isSel ? "#2a201a" : "var(--surface)"} 0%, var(--bg-2) 100%)`,
                    border: `1px solid ${isSel ? p.color : "var(--line-hi)"}`,
                    borderRadius:3,
                    boxShadow: isSel ? `0 0 0 1px ${p.color}, 0 -20px 60px -10px ${p.color}55` : "var(--shadow-sm)",
                    padding:18,
                    display:"flex", flexDirection:"column", alignItems:"center", gap:14, justifyContent:"center",
                    position:"relative", overflow:"hidden",
                    transform: isSel ? "translateY(-12px)" : "none",
                    transition:"transform .2s",
                  }}>
                    {/* corner runes */}
                    {[[6,6,"tl"],[6,6,"tr"],[6,6,"bl"],[6,6,"br"]].map(([_,__,pos],i) => (
                      <span key={i} style={{
                        position:"absolute",
                        ...(pos.includes("t") ? {top:8} : {bottom:8}),
                        ...(pos.includes("l") ? {left:8} : {right:8}),
                        width:8, height:8,
                        borderTop: pos.includes("t") ? `1px solid ${p.color}` : "none",
                        borderBottom: pos.includes("b") ? `1px solid ${p.color}` : "none",
                        borderLeft: pos.includes("l") ? `1px solid ${p.color}` : "none",
                        borderRight: pos.includes("r") ? `1px solid ${p.color}` : "none",
                        opacity:.7,
                      }}/>
                    ))}

                    {/* icon halo */}
                    <div style={{
                      width:90, height:90, borderRadius:"50%",
                      background: `radial-gradient(circle, ${p.color}22 0%, transparent 70%)`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      border:`1px solid ${p.color}55`,
                    }}>
                      <Icon name={p.icon} size={44} color={p.color}/>
                    </div>

                    <span className="cm-label" style={{color:p.color}}>{p.tag}</span>

                    <h3 style={{margin:0, fontFamily:'"Cinzel", serif', fontSize:15, color:"var(--ink)", letterSpacing:".08em", textAlign:"center", lineHeight:1.2}}>{p.name}</h3>

                    <p style={{margin:0, fontSize:11.5, color:"var(--ink-dim)", lineHeight:1.4, textAlign:"center"}}>{p.text}</p>
                  </div>

                  {/* pedestal */}
                  <div style={{
                    width:"86%", height:24,
                    background:"linear-gradient(180deg, #382c1f, #1a130c)",
                    border:"1px solid var(--line)",
                    borderTop:"none",
                    borderRadius:"0 0 4px 4px",
                    boxShadow:"inset 0 4px 12px rgba(0,0,0,.5)",
                  }}/>
                  <div style={{
                    width:"100%", height:1,
                    background: isSel
                      ? `radial-gradient(ellipse at center, ${p.color}88, transparent 70%)`
                      : "radial-gradient(ellipse at center, rgba(255,255,255,.12), transparent 70%)",
                  }}/>
                </div>
              );
            })}
          </div>

          {/* Bottom bar */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"14px 18px",
            background:"linear-gradient(180deg, var(--surface), var(--bg-2))",
            border:"1px solid var(--line)",
            borderRadius:3,
          }}>
            <div style={{fontSize:12, color:"var(--ink-mute)", fontFamily:'"JetBrains Mono", monospace'}}>
              ⚠ Diese Wahl ist <span style={{color:"var(--c-krieg)"}}>endgültig</span> für diesen Run.
            </div>
            <button className="cm-btn cm-btn--gold">Bestätigen ◆</button>
          </div>
        </div>

        {/* Info panel */}
        <div style={{
          background:"linear-gradient(180deg, var(--surface), var(--bg-2))",
          border:"1px solid var(--line-hi)",
          borderRadius:3, padding:20,
          display:"flex", flexDirection:"column", gap:16,
        }}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <span className="cm-label">Perk-Info</span>
            <span style={{display:"flex", alignItems:"center", gap:6, color: selected.color}}>
              <Icon name={selected.icon} size={12} color={selected.color}/>
              <span className="cm-label" style={{color: selected.color}}>{selected.tag}</span>
            </span>
          </div>

          <h3 className="cm-display" style={{margin:0, fontSize:24, color:"var(--ink)"}}>{selected.name}</h3>

          <div style={{
            padding:"12px 14px",
            background:"var(--bg-2)", border:`1px solid ${selected.color}44`, borderRadius:2,
            display:"flex", alignItems:"center", gap:12,
          }}>
            <Icon name={selected.icon} size={28} color={selected.color}/>
            <p style={{margin:0, fontSize:13, color:"var(--ink)", lineHeight:1.4}}>{selected.text}</p>
          </div>

          <div>
            <span className="cm-label">Wirkung</span>
            <p style={{margin:"8px 0 0 0", fontSize:13, color:"var(--ink-dim)", lineHeight:1.5}}>{selected.detail}</p>
          </div>

          <div style={{
            padding:"10px 12px",
            background:"var(--bg-2)", border:"1px solid var(--line)", borderRadius:2,
            marginTop:"auto",
          }}>
            <span className="cm-label">Aktive Perks (3)</span>
            <div style={{display:"flex", flexDirection:"column", gap:6, marginTop:8}}>
              {[
                ["sparkle","+20 Max-Mana","Akt 1"],
                ["heart","+1 HP-Regen","Akt 1"],
                ["sword","+5 Damage","Akt 2"],
              ].map(([ic,t,when],i) => (
                <div key={i} style={{display:"flex", alignItems:"center", gap:8, fontSize:11, color:"var(--ink-mute)", fontFamily:'"JetBrains Mono", monospace'}}>
                  <Icon name={ic} size={11} color="var(--gold)"/>
                  <span style={{flex:1}}>{t}</span>
                  <span style={{opacity:.6}}>{when}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.PerkRoom = PerkRoom;
