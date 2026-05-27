/* CHROMATIC — Shop */

const SHOP_CARDS = [
  { id:"a", name:"Druide",      color:"natur",   cls:"Magier",   mana:8,  dmg:7,  hp:12, price:120,
    ability:"Heilt alle Natur-Units um 3 HP pro Tick.", combo:"+4 DMG für alle Natur-Einheiten." },
  { id:"b", name:"Beserker",    color:"krieg",   cls:"Krieger",  mana:10, dmg:15, hp:8,  price:180,
    ability:"Wenn eigene HP < 50 % → Damage ×1.5.",     combo:"Doppelter Schaden mit zweitem Krieger." },
  { id:"c", name:"Wachposten",  color:"krieg",   cls:"Festung",  mana:7,  dmg:5,  hp:22, price:140,
    ability:"Blockt Projektile in einem 2-Feld-Radius.", combo:"+5 Max-HP für nahe Krieg-Einheiten." },
  { id:"d", name:"Schatten",    color:"untot",   cls:"Reittier", mana:9,  dmg:11, hp:10, price:160,
    ability:"Erste Bewegung kann nicht getroffen werden.", combo:"Klauen 2 HP bei jedem Treffer." },
  { id:"e", name:"Gargyl",      color:"stein",   cls:"Festung",  mana:12, dmg:6,  hp:30, price:210,
    ability:"Stein-Rüstung: -2 erhaltener Schaden.",       combo:"+8 Max-HP für nahe Stein-Einheiten." },
  { id:"f", name:"Ur-Geist",    color:"farblos", cls:"Magier",   mana:18, dmg:20, hp:14, price:320,
    ability:"AoE-Schaden in 3 Feld-Umkreis bei Spawn.",   combo:"Farblos — kein Combo nötig." },
];

const Shop = ({ coins = 412 }) => {
  const selectedId = "c";
  const selected = SHOP_CARDS.find(c => c.id === selectedId);
  return (
    <div className="cm-screen">
      {/* HUD */}
      <div className="cm-hud">
        <div className="cm-hud-left">
          <button style={{background:"transparent", border:"1px solid var(--line)", color:"var(--ink-dim)", padding:"8px 10px", cursor:"pointer", borderRadius:2}}>
            <Icon name="exit" size={14}/>
          </button>
          <div className="cm-act">
            <span className="cm-act-label">Akt 01 · Markt</span>
            <span className="cm-act-name">Krämerin Vey</span>
          </div>
        </div>
        <div className="cm-hud-right">
          <HPPill cur={86} max={100}/>
          <Coin value={coins}/>
        </div>
      </div>

      {/* Body: 2-col split */}
      <div style={{position:"absolute", inset:"110px 56px 56px 56px", display:"grid", gridTemplateColumns:"1fr 380px", gap:32}}>

        {/* Cards area */}
        <div style={{display:"flex", flexDirection:"column", gap:18}}>
          {/* Title */}
          <div style={{display:"flex", alignItems:"end", justifyContent:"space-between", borderBottom:"1px solid var(--line)", paddingBottom:12}}>
            <div>
              <div className="cm-label">Angebot · wechselt pro Raum</div>
              <h2 className="cm-title" style={{margin:"6px 0 0 0", fontSize:24, color:"var(--ink)"}}>Karten zum Verkauf</h2>
            </div>
            <span className="cm-label">6 Posten</span>
          </div>

          {/* Card row */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:14, alignItems:"start"}}>
            {SHOP_CARDS.map(c => (
              <div key={c.id} style={{display:"flex", flexDirection:"column", alignItems:"center", gap:10}}>
                <UnitCard card={c} size="md" selected={c.id === selectedId}/>
                {/* price tag */}
                <div style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"5px 12px",
                  background: c.id === selectedId ? "linear-gradient(180deg, #c89642, #8a6a2c)" : "var(--surface)",
                  border: `1px solid ${c.id === selectedId ? "var(--gold-hi)" : "var(--line-hi)"}`,
                  borderRadius: 2,
                  fontFamily:'"JetBrains Mono", monospace',
                  fontSize: 12, color: c.id === selectedId ? "#1a1208" : "var(--gold-hi)",
                }}>
                  <svg viewBox="0 0 24 24" width="11" height="11"><circle cx="12" cy="12" r="9" fill={c.id===selectedId?"#1a1208":"#c89642"}/></svg>
                  {c.price}
                </div>
              </div>
            ))}
          </div>

          {/* Buy bar */}
          <div style={{
            marginTop:"auto",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"14px 18px",
            background:"linear-gradient(180deg, var(--surface), var(--bg-2))",
            border:"1px solid var(--line)",
            borderRadius:3,
          }}>
            <div style={{display:"flex", flexDirection:"column", gap:2}}>
              <span className="cm-label">Ausgewählt</span>
              <span style={{fontFamily:'"Cinzel", serif', fontSize:15, color:"var(--ink)", letterSpacing:".1em"}}>{selected.name}</span>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:14}}>
              <button className="cm-btn cm-btn--ghost">Verlassen</button>
              <button className="cm-btn cm-btn--gold">Kaufen · {selected.price}</button>
            </div>
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
            <span className="cm-label">Karten-Detail</span>
            <span style={{display:"flex", alignItems:"center", gap:6}}>
              <span className={`cm-chip cm-chip--${selected.color}`}/>
              <span className="cm-label" style={{color: COLOR_CSS[selected.color]}}>{COLOR_LABEL[selected.color]}</span>
            </span>
          </div>

          <h3 className="cm-display" style={{margin:0, fontSize:28, color:"var(--ink)"}}>{selected.name}</h3>
          <div className="cm-label" style={{color:"var(--ink-dim)"}}>{COLOR_LABEL[selected.color]} · {selected.cls}</div>

          {/* stat row */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
            {[
              { label:"Mana",   v: selected.mana, c:"var(--mana)" },
              { label:"Damage", v: selected.dmg,  c:"var(--c-krieg)" },
              { label:"HP",     v: selected.hp,   c:"var(--c-natur)" },
            ].map((s,i) => (
              <div key={i} style={{
                padding:"10px 12px",
                background:"var(--bg-2)", border:"1px solid var(--line)", borderRadius:2,
                display:"flex", flexDirection:"column", gap:2,
              }}>
                <span className="cm-label">{s.label}</span>
                <span style={{fontFamily:'"JetBrains Mono", monospace', fontSize:22, color: s.c, fontWeight:700}}>{s.v}</span>
              </div>
            ))}
          </div>

          {/* abilities */}
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            <div>
              <span className="cm-label" style={{color:"var(--gold)"}}>◆ Passiv</span>
              <p style={{margin:"6px 0 0 0", fontSize:13, color:"var(--ink-dim)", lineHeight:1.5}}>{selected.ability}</p>
            </div>
            <div>
              <span className="cm-label" style={{color:"var(--c-untot)"}}>⧗ Combo-Bonus</span>
              <p style={{margin:"6px 0 0 0", fontSize:13, color:"var(--ink-dim)", lineHeight:1.5}}>{selected.combo}</p>
            </div>
          </div>

          {/* compatibility */}
          <div style={{
            marginTop:"auto",
            padding:"10px 12px",
            background:"var(--bg-2)", border:"1px solid var(--line)", borderRadius:2,
          }}>
            <span className="cm-label">Synergie</span>
            <div style={{display:"flex", gap:8, marginTop:6}}>
              <span className={`cm-chip cm-chip--krieg`}/>
              <span style={{fontSize:11, fontFamily:'"JetBrains Mono", monospace', color:"var(--ink-mute)"}}>4 weitere Krieg-Karten im Deck</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Shop = Shop;
