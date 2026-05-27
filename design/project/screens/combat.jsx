/* CHROMATIC — Combat screen
   Fixed UI chrome (HUD, bases, mana bar, hand panel, deck stats, log).
   Dynamic content — units on the battlefield, hand cards, combo arcs and
   damage numbers — is rendered as placeholders here; runtime game logic
   fills these in. */

const HandSlot = ({ index = 1, locked = false, drawing = false }) => {
  if (drawing) {
    return (
      <div style={{
        width:150, height:218,
        border:"1px dashed var(--line-hi)", borderRadius:4,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6,
        color:"var(--ink-mute)", fontFamily:'"JetBrains Mono", monospace', fontSize:10, letterSpacing:".2em",
        textTransform:"uppercase", textAlign:"center",
      }}>
        <Icon name="sparkle" size={20} color="var(--ink-faint)"/>
        <span>Nachziehen</span>
        <span style={{fontSize:18, color:"var(--ink-dim)"}}>02s</span>
      </div>
    );
  }
  return (
    <div style={{
      width:150, height:218,
      padding:10,
      borderRadius:4,
      border:`1px dashed ${locked ? "rgba(200,85,61,.5)" : "rgba(240,200,120,.55)"}`,
      background:"linear-gradient(180deg, rgba(74,61,44,.45), rgba(45,37,25,.65))",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"space-between", gap:8,
      position:"relative",
      boxSizing:"border-box",
    }}>
      {/* mana cost placeholder */}
      <div style={{
        position:"absolute", top:-8, left:-8,
        width:24, height:24, borderRadius:"50%",
        background:"radial-gradient(circle at 30% 30%, rgba(106,177,232,.6), rgba(42,90,140,.6))",
        border:"1px dashed rgba(106,177,232,.7)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:'"JetBrains Mono", monospace', fontSize:11, fontWeight:700, color:"#fff",
      }}>?</div>

      {/* slot kicker */}
      <span style={{
        fontFamily:'"JetBrains Mono", monospace',
        fontSize:8, letterSpacing:".3em", color: locked ? "rgba(200,85,61,.7)" : "rgba(240,200,120,.7)",
        textTransform:"uppercase", paddingLeft: 14,
      }}>Hand · 0{index}</span>

      {/* art placeholder */}
      <div style={{
        width:"100%", height: 80,
        background:"repeating-linear-gradient(135deg, rgba(240,200,120,.05) 0 8px, transparent 8px 16px)",
        border:"1px dashed rgba(240,200,120,.4)",
        borderRadius:2,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"rgba(240,200,120,.6)", fontFamily:'"JetBrains Mono", monospace', fontSize:18,
      }}>?</div>

      {/* name lines */}
      <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"center", width:"100%"}}>
        <div style={{width:"68%", height:9, background:"rgba(240,200,120,.18)", borderRadius:1}}/>
        <div style={{width:"88%", height:5, background:"rgba(240,200,120,.10)", borderRadius:1}}/>
      </div>

      {/* stat row */}
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"4px 8px", width:"100%",
        background:"var(--bg-2)", border:"1px solid var(--line)", borderRadius:2,
        fontFamily:'"JetBrains Mono", monospace', fontSize:11, color:"var(--ink-mute)",
      }}>
        <span>DMG ?</span>
        <span>HP ?</span>
      </div>

      {locked && (
        <div style={{
          position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:'"JetBrains Mono", monospace', fontSize:11, color:"var(--c-krieg)", letterSpacing:".15em",
          background:"rgba(15,12,8,.45)", textTransform:"uppercase",
        }}>Kein Mana</div>
      )}
    </div>
  );
};

const Combat = ({ w = 1920, h = 1080 }) => {
  return (
    <div className="cm-screen" style={{
      background:`linear-gradient(180deg, #4a3a26 0%, #5a3f24 30%, #3a2818 100%)`,
    }}>
      {/* === BACKGROUND LANDSCAPE (fixed visual chrome) === */}
      <div style={{position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 18%, rgba(240,200,120,.18), transparent 55%), radial-gradient(ellipse at 50% 50%, rgba(154,108,182,.08), transparent 55%)"}}/>

      {/* distant clouds */}
      <svg style={{position:"absolute", top: 40, left:0, right:0, width:"100%", height: 120, opacity:.5}} viewBox="0 0 1920 120" preserveAspectRatio="none">
        <path d="M0 60 Q 200 30, 400 60 T 800 60 T 1200 60 T 1600 60 T 1920 60" fill="none" stroke="rgba(255,220,170,.4)" strokeWidth="1"/>
        <path d="M0 90 Q 240 70, 480 90 T 960 90 T 1440 90 T 1920 90" fill="none" stroke="rgba(255,220,170,.25)" strokeWidth="1"/>
      </svg>

      {/* far mountains */}
      <svg style={{position:"absolute", top: 130, left:0, right:0, width:"100%", height: 230, opacity:.6}} viewBox="0 0 1920 230" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mtn-far" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4a3520"/>
            <stop offset="100%" stopColor="#2a1f14"/>
          </linearGradient>
        </defs>
        <path d="M0 230 L120 110 L240 170 L380 70 L520 150 L680 50 L840 130 L1000 80 L1180 160 L1340 60 L1500 140 L1680 90 L1820 170 L1920 120 L1920 230 Z" fill="url(#mtn-far)"/>
      </svg>

      {/* mid mountains */}
      <svg style={{position:"absolute", top: 220, left:0, right:0, width:"100%", height: 220, opacity:.85}} viewBox="0 0 1920 220" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mtn-mid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3a2a18"/>
            <stop offset="100%" stopColor="#1f1610"/>
          </linearGradient>
        </defs>
        <path d="M0 220 L160 80 L320 150 L480 40 L640 130 L820 30 L1000 120 L1180 70 L1360 140 L1540 60 L1720 130 L1920 80 L1920 220 Z" fill="url(#mtn-mid)"/>
      </svg>

      {/* horizon line */}
      <div style={{position:"absolute", top: 420, left:0, right:0, height: 2, background:"linear-gradient(90deg, transparent, rgba(214,169,85,.4), transparent)"}}/>

      {/* atmospheric haze */}
      <div style={{position:"absolute", top: 420, left:0, right:0, bottom: 360, background:"linear-gradient(180deg, rgba(74,58,38,.2) 0%, rgba(58,40,24,.4) 100%)"}}/>

      {/* foreground silhouette trees */}
      <svg style={{position:"absolute", top: 660, left:0, right:0, width:"100%", height: 60, opacity:.6, pointerEvents:"none"}} viewBox="0 0 1920 60" preserveAspectRatio="none">
        <g fill="#1a1208">
          {[120, 260, 540, 760, 980, 1280, 1480, 1680, 1820].map((cx, i) => (
            <g key={i} transform={`translate(${cx} 0)`}>
              <rect x="-1" y="40" width="3" height="20"/>
              <path d="M-12 50 L0 18 L12 50 Z"/>
              <path d="M-9 38 L0 12 L9 38 Z"/>
            </g>
          ))}
        </g>
      </svg>

      {/* GRASS strip */}
      <div style={{position:"absolute", top: 718, left:0, right:0, height: 14, zIndex:1,
        background:"linear-gradient(180deg, #6a9438 0%, #4e7228 60%, #2c4818 100%)",
        boxShadow:"0 1px 0 rgba(0,0,0,.5), inset 0 -2px 0 rgba(0,0,0,.3)",
      }}/>
      <svg style={{position:"absolute", top: 706, left:0, right:0, width:"100%", height: 14, pointerEvents:"none", zIndex:2}} viewBox="0 0 1920 14" preserveAspectRatio="none">
        {Array.from({length:120}, (_,i) => {
          const cx = i*16 + (i%3)*3;
          const t = i%4;
          return (
            <path key={i} d={`M${cx} 14 L${cx+1} ${10-t} L${cx+2} 14 L${cx+3} ${8-t} L${cx+4} 14 Z`} fill={t%2 ? "#4e7228" : "#3a5a20"}/>
          );
        })}
      </svg>

      {/* DIRT strip */}
      <div style={{position:"absolute", top: 732, left:0, right:0, bottom: 270, zIndex:1,
        background:"linear-gradient(180deg, #5a4028 0%, #3a2818 60%, #1f1610 100%)",
      }}>
        <svg style={{position:"absolute", inset:0, width:"100%", height:"100%"}} viewBox="0 0 1920 80" preserveAspectRatio="none">
          <defs>
            <pattern id="dirt-spec" width="60" height="20" patternUnits="userSpaceOnUse">
              <circle cx="6" cy="8" r=".7" fill="rgba(20,12,6,.4)"/>
              <circle cx="22" cy="14" r=".5" fill="rgba(20,12,6,.3)"/>
              <circle cx="38" cy="6" r=".8" fill="rgba(20,12,6,.5)"/>
              <circle cx="50" cy="16" r=".4" fill="rgba(20,12,6,.3)"/>
            </pattern>
          </defs>
          <rect width="1920" height="80" fill="url(#dirt-spec)"/>
        </svg>
      </div>

      {/* === TOP HUD: HP bars (fixed UI) === */}
      <div style={{
        position:"absolute", top: 24, left: 32, right: 32,
        display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        zIndex: 5,
      }}>
        {/* Player base */}
        <div style={{display:"flex", flexDirection:"column", gap:8, minWidth: 380}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <Icon name="castle" size={18} color="var(--c-natur)"/>
            <span className="cm-label" style={{color:"var(--c-natur)"}}>Freundliche Base</span>
            <span style={{flex:1}}/>
            <span style={{fontFamily:'"JetBrains Mono", monospace', fontSize:13, color:"var(--ink)"}}>
              <span style={{color:"var(--c-natur)"}}>HP</span>
              <span style={{opacity:.4}}> / MAX</span>
            </span>
          </div>
          <div style={{height:14, background:"#0f0a06", border:"1px solid var(--line-hi)", borderRadius:2, position:"relative", overflow:"hidden"}}>
            <div style={{position:"absolute", inset:0, background:"repeating-linear-gradient(90deg, transparent 0 30px, rgba(255,255,255,.04) 30px 31px)"}}/>
            <div style={{height:"100%", width:"100%", background:"linear-gradient(180deg, #7ebd7e, #4a8a4a)", boxShadow:"inset 0 0 8px rgba(0,0,0,.4)"}}/>
          </div>
        </div>

        {/* Center timer */}
        <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:6}}>
          <span className="cm-label">Echtzeit-Combat</span>
          <div style={{
            padding:"4px 18px",
            background:"linear-gradient(180deg, var(--surface-2), var(--surface))",
            border:"1px solid var(--line-hi)", borderRadius:2,
            fontFamily:'"JetBrains Mono", monospace', fontSize:18, color:"var(--gold-hi)", letterSpacing:".1em",
          }}>00:00</div>
          <div style={{display:"flex", alignItems:"center", gap:8, fontSize:10, color:"var(--ink-mute)", fontFamily:'"JetBrains Mono", monospace', letterSpacing:".2em"}}>
            <Icon name="cog" size={11} color="var(--ink-mute)"/>
            <span>ESC PAUSE</span>
            <span>·</span>
            <span>TAB DECK</span>
          </div>
        </div>

        {/* Enemy base */}
        <div style={{display:"flex", flexDirection:"column", gap:8, minWidth: 380, alignItems:"flex-end"}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <span style={{fontFamily:'"JetBrains Mono", monospace', fontSize:13, color:"var(--ink)"}}>
              <span style={{color:"var(--c-krieg)"}}>HP</span>
              <span style={{opacity:.4}}> / MAX</span>
            </span>
            <span style={{flex:1}}/>
            <span className="cm-label" style={{color:"var(--c-krieg)"}}>Feindliche Base</span>
            <Icon name="castle" size={18} color="var(--c-krieg)"/>
          </div>
          <div style={{height:14, background:"#0f0a06", border:"1px solid var(--line-hi)", borderRadius:2, position:"relative", overflow:"hidden", width:"100%"}}>
            <div style={{height:"100%", width:"100%", background:"linear-gradient(180deg, #d96b53, #8a3d2c)", boxShadow:"inset 0 0 8px rgba(0,0,0,.4)"}}/>
          </div>
        </div>
      </div>

      {/* === EXP rail (fixed UI) === */}
      <div style={{position:"absolute", top: 100, left: "50%", transform:"translateX(-50%)", width: 280, zIndex:5}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4}}>
          <span className="cm-label">Stufe · EXP</span>
          <span style={{fontFamily:'"JetBrains Mono", monospace', fontSize:10, color:"var(--ink-mute)"}}>— / —</span>
        </div>
        <div style={{height:5, background:"#0f0a06", border:"1px solid var(--line)", borderRadius:1}}>
          <div style={{height:"100%", width:"0%", background:"var(--gold)"}}/>
        </div>
      </div>

      {/* === BASES (fixed level chrome) === */}
      {[{side:"left",  color:"var(--c-natur)", gid:"base-stone-p", c1:"#8a7a6a", c2:"#3a2e22"},
        {side:"right", color:"var(--c-krieg)", gid:"base-stone-e", c1:"#7a5a4a", c2:"#3a1f18"}].map(b => (
        <div key={b.side} style={{position:"absolute", [b.side]: 70, bottom: 362, width: 160, height: 260, zIndex: 3, transform: b.side==="right" ? "scaleX(-1)" : "none"}}>
          <svg viewBox="0 0 160 260" width="100%" height="100%">
            <defs>
              <linearGradient id={b.gid} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={b.c1}/>
                <stop offset="100%" stopColor={b.c2}/>
              </linearGradient>
            </defs>
            <path d="M30 260 L30 130 L40 130 L40 115 L55 115 L55 130 L70 130 L70 115 L85 115 L85 130 L100 130 L100 115 L115 115 L115 130 L125 130 L125 260 Z" fill={`url(#${b.gid})`} stroke="#1a130c" strokeWidth="2"/>
            <path d="M10 260 L10 160 L20 160 L20 145 L35 145 L35 160 L40 160 L40 260 Z" fill={`url(#${b.gid})`} stroke="#1a130c" strokeWidth="2"/>
            <g fill="#1a130c">
              <rect x="32" y="130" width="6" height="6"/>
              <rect x="57" y="130" width="6" height="6"/>
              <rect x="87" y="130" width="6" height="6"/>
              <rect x="117" y="130" width="6" height="6"/>
            </g>
            <path d="M68 260 L68 215 Q 68 200, 78 200 Q 88 200, 88 215 L88 260" fill="#1a0c06" stroke="#1a130c" strokeWidth="1.5"/>
            <rect x="44" y="160" width="7" height="14" fill="#1a0c06" stroke="#1a130c"/>
            <rect x="104" y="160" width="7" height="14" fill="#1a0c06" stroke="#1a130c"/>
            <line x1="78" y1="115" x2="78" y2="55" stroke="#5a4530" strokeWidth="2"/>
            <path d="M78 60 L 112 70 L 78 80 Z" fill={b.color} stroke="#1a130c" strokeWidth="1"/>
            <path d="M65 200 L91 200 L91 220 L78 215 L65 220 Z" fill={b.color} stroke="#1a130c" strokeWidth="1"/>
          </svg>
        </div>
      ))}

      {/* === BATTLEFIELD PLACEHOLDER ZONE === */}
      <div style={{
        position:"absolute", left: 260, right: 260, top: 460, height: 260, zIndex: 2,
        display:"flex", alignItems:"center", justifyContent:"center",
        pointerEvents:"none",
      }}>
        <div style={{
          padding:"22px 36px",
          border:"1px dashed rgba(240,200,120,.45)",
          background:"rgba(15,12,8,.35)",
          borderRadius:3,
          display:"flex", flexDirection:"column", alignItems:"center", gap:8,
          backdropFilter:"blur(1px)",
        }}>
          <span style={{fontFamily:'"JetBrains Mono", monospace', fontSize:9, letterSpacing:".34em", color:"rgba(240,200,120,.6)", textTransform:"uppercase"}}>UI · Platzhalter</span>
          <span style={{fontFamily:'"Cinzel", serif', fontSize:18, color:"#fbf3dc", letterSpacing:".14em", textTransform:"uppercase"}}>Schlachtfeld</span>
          <span style={{fontFamily:'"IBM Plex Sans", sans-serif', fontSize:12, color:"rgba(216,195,154,.65)", maxWidth:420, textAlign:"center", lineHeight:1.45}}>
            Einheiten, Combo-Bögen und Damage-Zahlen werden zur Laufzeit gerendert.
            Diese Zone zeigt nur den freien Raum zwischen den Basen.
          </span>
        </div>
      </div>

      {/* === BOTTOM HAND PANEL (fixed UI) === */}
      <div style={{
        position:"absolute", left:0, right:0, bottom:0,
        height: 270,
        background:"linear-gradient(180deg, transparent 0%, rgba(15,12,8,.6) 30%, #0f0c08 100%)",
        borderTop:"1px solid var(--line-hi)",
        zIndex: 4,
        display:"grid", gridTemplateColumns:"380px 1fr 380px", padding:"22px 32px", gap:24,
      }}>
        {/* Mana */}
        <div style={{display:"flex", flexDirection:"column", gap:10, justifyContent:"center"}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <Icon name="drop" size={20} color="var(--mana)"/>
            <span className="cm-label" style={{color:"var(--mana)"}}>Mana</span>
            <span style={{flex:1}}/>
            <span style={{fontFamily:'"JetBrains Mono", monospace', fontSize:22, color:"var(--mana)", fontWeight:600}}>
              —<span style={{color:"var(--ink-mute)", fontSize:14}}> / —</span>
            </span>
          </div>
          <div style={{height:18, background:"#0a1018", border:"1px solid #1f3a5a", borderRadius:2, position:"relative", overflow:"hidden"}}>
            <div style={{height:"100%", width:"60%", background:"linear-gradient(180deg, #6ab1e8 0%, #2a5a8c 100%)", boxShadow:"inset 0 0 6px rgba(0,0,0,.5)"}}/>
            {Array.from({length:19}, (_,i) => (
              <span key={i} style={{position:"absolute", top:0, bottom:0, left:`${((i+1)/20)*100}%`, width:1, background:"rgba(0,0,0,.4)"}}/>
            ))}
          </div>
          <div style={{display:"flex", alignItems:"center", gap:10, fontSize:11, color:"var(--ink-mute)", fontFamily:'"JetBrains Mono", monospace', letterSpacing:".1em"}}>
            <Icon name="spark" size={11} color="var(--mana)"/>
            <span>+1 Mana / Sek.</span>
            <span style={{flex:1}}/>
            <span>Auto-Draw 04s</span>
          </div>
        </div>

        {/* Hand card slots — placeholders */}
        <div style={{display:"flex", justifyContent:"center", alignItems:"flex-start", gap:18, paddingTop:6}}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              transform: `translateY(0px) rotate(${(i-2)*2}deg)`,
              transition:"transform .15s",
            }}>
              <HandSlot index={i}/>
            </div>
          ))}
          <HandSlot drawing/>
        </div>

        {/* Right: deck + log (fixed UI structure) */}
        <div style={{display:"flex", flexDirection:"column", gap:10, justifyContent:"center"}}>
          <div style={{display:"flex", gap:10}}>
            <div style={{flex:1, padding:"10px 12px", background:"var(--surface)", border:"1px solid var(--line-hi)", borderRadius:2}}>
              <div className="cm-label">Deck</div>
              <div style={{display:"flex", alignItems:"baseline", gap:6}}>
                <span style={{fontFamily:'"JetBrains Mono", monospace', fontSize:22, color:"var(--ink)"}}>—</span>
                <span style={{fontSize:11, color:"var(--ink-mute)"}}>Karten · Random-Pool</span>
              </div>
            </div>
            <div style={{flex:1, padding:"10px 12px", background:"var(--surface)", border:"1px solid var(--line-hi)", borderRadius:2}}>
              <div className="cm-label">Auf dem Feld</div>
              <div style={{display:"flex", alignItems:"baseline", gap:6}}>
                <span style={{fontFamily:'"JetBrains Mono", monospace', fontSize:22, color:"var(--ink)"}}>—</span>
                <span style={{fontSize:11, color:"var(--ink-mute)"}}>Units · Combos</span>
              </div>
            </div>
          </div>

          <div style={{padding:"8px 12px", background:"var(--surface)", border:"1px solid var(--line)", borderRadius:2, fontSize:11, color:"var(--ink-mute)", fontFamily:'"JetBrains Mono", monospace', lineHeight:1.5, height:74, overflow:"hidden", display:"flex", flexDirection:"column", gap:2, justifyContent:"center"}}>
            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <span style={{width:6, height:6, borderRadius:"50%", background:"rgba(240,200,120,.5)"}}/>
              <span style={{flex:1, opacity:.5}}>Event-Log · Spawn / Kill / Combo</span>
            </div>
            <div style={{height:1, background:"var(--line)", opacity:.4}}/>
            <div style={{display:"flex", alignItems:"center", gap:8, color:"rgba(240,200,120,.4)", fontSize:9, letterSpacing:".22em", textTransform:"uppercase"}}>
              <span>Inhalt zur Laufzeit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Combat = Combat;
window.HandSlot = HandSlot;
