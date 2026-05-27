/* CHROMATIC — Raum-Karte (Room sub-graph) */

const SubNode = ({ type, x, y, state = "available", size = 64 }) => {
  const def = ROOM_DEFS[type];
  const isCurrent = state === "current";
  const isVisited = state === "visited";
  const dimmed = state === "future" || state === "locked";
  const isBoss = type === "boss" || type === "mini";
  const glyphSize = Math.round(size * 0.5);
  return (
    <div style={{
      position:"absolute", left: x - size/2, top: y - size/2,
      width: size, height: size,
      opacity: dimmed ? 0.4 : 1,
    }}>
      <div style={{
        position:"absolute", inset:0,
        borderRadius:"50%",
        background:`radial-gradient(circle at 35% 30%, ${def.tone}, #1f180f 90%)`,
        border:`2px solid ${isCurrent ? def.color : (isVisited ? "var(--ink-mute)" : "#8b6f47")}`,
        boxShadow: isCurrent
          ? `0 0 0 2px ${def.color}55, 0 0 16px ${def.color}88`
          : "var(--shadow-sm), inset 0 0 10px rgba(0,0,0,.4)",
      }}/>
      <div style={{
        position:"absolute", inset:4,
        borderRadius:"50%",
        border:`1px solid ${isCurrent ? def.color : "#594732"}`,
        opacity:.6,
      }}/>
      <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", filter: isVisited ? "saturate(.4) opacity(.7)" : "none"}}>
        <RoomGlyph type={def.glyph} size={glyphSize} color={isCurrent ? def.color : (isVisited ? "#a89373" : def.color)}/>
      </div>
      {isVisited && (
        <div style={{position:"absolute", bottom:-2, right:-2, width:16, height:16, borderRadius:"50%", background:"#4a8a4a", border:"2px solid #1a130c", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", fontWeight:700}}>✓</div>
      )}
      {!isBoss && (
        <span style={{position:"absolute", top: size + 6, left:"50%", transform:"translateX(-50%)", fontFamily:'"Cinzel", serif', fontSize:10, color: isCurrent ? def.color : "var(--ink-dim)", letterSpacing:".15em", textTransform:"uppercase", whiteSpace:"nowrap", textShadow:"0 1px 2px rgba(0,0,0,.7)"}}>
          {def.label}
        </span>
      )}
    </div>
  );
};

/* Dashed edge between nodes */
const SubEdge = ({ from, to, traversed }) => (
  <line
    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
    stroke={traversed ? "var(--gold)" : "var(--line-hi)"}
    strokeWidth={traversed ? 1.6 : 1.2}
    strokeDasharray={traversed ? "0" : "4 5"}
    opacity={traversed ? 1 : 0.6}
  />
);

const RoomMap = ({ roomLabel = "Normaler Raum", act = 1, coins = 612, nodes = [], edges = [], w = 1100, h = 660 }) => {
  const lookup = Object.fromEntries(nodes.map(n => [n.id, n]));
  return (
    <div className="cm-screen">
      <div className="cm-hud">
        <div className="cm-hud-left">
          <button style={{background:"transparent", border:"1px solid var(--line)", color:"var(--ink-dim)", padding:"8px 10px", cursor:"pointer", borderRadius:2}}>
            <Icon name="exit" size={14}/>
          </button>
          <div className="cm-act">
            <span className="cm-act-label">Akt {String(act).padStart(2,"0")} · Raum-Karte</span>
            <span className="cm-act-name">{roomLabel}</span>
          </div>
        </div>
        <div className="cm-hud-right">
          <HPPill cur={86} max={100}/>
          <Coin value={coins}/>
        </div>
      </div>

      {/* Map area */}
      <div style={{position:"absolute", inset:"96px 56px 56px 56px"}}>
        <svg style={{position:"absolute", inset:0, width:"100%", height:"100%"}} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <defs>
            <pattern id={`rgrid-${roomLabel.replace(/\s/g,"")}`} width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="0.8" fill="rgba(214,169,85,.08)"/>
            </pattern>
          </defs>
          <rect width={w} height={h} fill={`url(#rgrid-${roomLabel.replace(/\s/g,"")})`}/>
          {edges.map((e, i) => {
            const a = lookup[e.from], b = lookup[e.to];
            if (!a || !b) return null;
            return <SubEdge key={i} from={{x:a.x, y:a.y}} to={{x:b.x, y:b.y}} traversed={e.traversed}/>;
          })}
        </svg>
        {nodes.map(n => <SubNode key={n.id} {...n}/>)}
      </div>

      {/* legend */}
      <div style={{position:"absolute", bottom:18, left:56, right:56, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div style={{display:"flex", gap:18, alignItems:"center"}}>
          <span className="cm-label">Knoten-Typen</span>
          {[["start","Start"],["normal","Kampf"],["hard","Schwer"],["treasure","Schatz"],["mini","Boss"]].map(([t,l]) => (
            <span key={t} style={{display:"flex", alignItems:"center", gap:6, color:"var(--ink-dim)", fontFamily:'"JetBrains Mono", monospace', fontSize:10, letterSpacing:".15em", textTransform:"uppercase"}}>
              <RoomGlyph type={ROOM_DEFS[t].glyph} size={14} color={ROOM_DEFS[t].color}/>
              {l}
            </span>
          ))}
        </div>
        <span className="cm-label" style={{color:"var(--ink-dim)"}}>{nodes.filter(n=>n.state==="visited").length} / {nodes.length} besucht</span>
      </div>
    </div>
  );
};

window.RoomMap = RoomMap;
