/* CHROMATIC — Welt-Karte (World Map)
   Data-driven: render rooms as variable-sized tiles on an SVG path graph.
   "A" badge indicates sub-room count (each world room contains a node-graph). */

const ROOM_DEFS = {
  start:   { label: "Start",          glyph: "start",    color: "#e0c878",          tone: "#3d3225" },
  normal:  { label: "Kampf",          glyph: "normal",   color: "#e8dcc4",          tone: "#3d3225" },
  perk:    { label: "Zauber",         glyph: "perk",     color: "#c89fdc",          tone: "#3a2c3d" },
  shop:    { label: "Shop",           glyph: "shop",     color: "#7fc88a",          tone: "#2b3a26" },
  treasure:{ label: "Schatz",         glyph: "treasure", color: "#f0c878",          tone: "#3d3024" },
  hard:    { label: "Schwer",         glyph: "hard",     color: "#e8856e",          tone: "#3d251c" },
  mini:    { label: "Zwischenboss",   glyph: "mini",     color: "#c8b8a8",          tone: "#322a22" },
  boss:    { label: "Endboss",        glyph: "boss",     color: "#f0c878",          tone: "#3d1c14" },
};

/* Single near-uniform tile size per type — only barely different.
   Slay-the-Spire-style: circular medallion with bold glyph inside. */
const TILE_SIZE = {
  start: 76, normal: 80, perk: 80, shop: 80, treasure: 80, hard: 84, mini: 92, boss: 108,
};

const RoomTile = ({ id, type, sub = 3, state = "available", x, y }) => {
  const def = ROOM_DEFS[type];
  const D = TILE_SIZE[type] || 80;
  const glyphSize = Math.round(D * 0.5);
  const dimmed = state === "future";
  const isCurrent = state === "current";
  const isVisited = state === "visited";
  const isBoss = type === "boss";

  return (
    <div style={{
      position:"absolute",
      left: x - D/2, top: y - D/2,
      width: D, height: D,
      opacity: dimmed ? 0.5 : 1,
      transition: "opacity .2s",
    }}>
      {/* outer ring */}
      <div style={{
        position:"absolute", inset: 0,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 30%, ${def.tone}, #1f180f 90%)`,
        border: `2px solid ${isCurrent ? def.color : (isVisited ? "var(--ink-mute)" : "#8b6f47")}`,
        boxShadow: isCurrent
          ? `0 0 0 2px ${def.color}55, 0 0 24px ${def.color}88, var(--shadow-sm)`
          : "var(--shadow-sm), inset 0 0 12px rgba(0,0,0,.4)",
      }}/>

      {/* inner ring */}
      <div style={{
        position:"absolute", inset: 5,
        borderRadius: "50%",
        border: `1px solid ${isCurrent ? def.color : "#594732"}`,
        opacity: 0.65,
      }}/>

      {/* glyph */}
      <div style={{
        position:"absolute", inset: 0,
        display:"flex", alignItems:"center", justifyContent:"center",
        filter: isVisited ? "saturate(.4) opacity(.7)" : "none",
      }}>
        <RoomGlyph type={def.glyph} size={glyphSize} color={isCurrent ? def.color : (isVisited ? "#a89373" : def.color)} shadow="#1a130c"/>
      </div>

      {/* visited check */}
      {isVisited && (
        <div style={{
          position:"absolute", bottom:-2, right:-2,
          width: 18, height: 18, borderRadius:"50%",
          background:"#4a8a4a", border:"2px solid #1a130c",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:11, color:"#fff", fontWeight:700,
        }}>✓</div>
      )}

      {/* sub-room counter badge */}
      {!isBoss && type !== "start" && (
        <div style={{
          position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)",
          display:"flex", alignItems:"center", gap:3,
          padding:"2px 7px",
          background:"#1a130c",
          border:`1px solid ${def.color}88`,
          borderRadius:8,
          fontFamily:'"JetBrains Mono", monospace',
          fontSize:9, letterSpacing:"0.1em", color:"var(--ink-dim)",
          whiteSpace:"nowrap",
          boxShadow:"0 1px 3px rgba(0,0,0,.5)",
        }}>
          <span style={{color: def.color, fontWeight:700}}>A</span>
          <span style={{opacity:.5}}>·</span>
          <span>{sub}</span>
        </div>
      )}

      {/* label under tile (every room EXCEPT boss) */}
      {!isBoss && (
        <div style={{
          position:"absolute", top: D + 6, left:"50%", transform:"translateX(-50%)",
          fontFamily:'"Cinzel", serif',
          fontSize: 11,
          letterSpacing:"0.18em",
          textTransform:"uppercase",
          color: isCurrent ? def.color : "var(--ink-dim)",
          whiteSpace:"nowrap",
          textShadow:"0 1px 2px rgba(0,0,0,.7)",
        }}>{def.label}</div>
      )}

      {/* "Du bist hier" arrow */}
      {isCurrent && (
        <div style={{
          position:"absolute", bottom: isBoss ? -22 : -28, left:"50%", transform:"translateX(-50%)",
          fontFamily:'"JetBrains Mono", monospace', fontSize:9, letterSpacing:"0.25em",
          color: def.color, whiteSpace:"nowrap", marginTop: 6,
        }}>▼ DU BIST HIER</div>
      )}
    </div>
  );
};

/* Curved connector between two points */
const Edge = ({ from, to, active }) => {
  const mx = (from.x + to.x) / 2;
  const stroke = active ? "var(--gold)" : "var(--line-hi)";
  const dash = active ? "0" : "3 4";
  return (
    <path
      d={`M ${from.x} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.x} ${to.y}`}
      fill="none"
      stroke={stroke}
      strokeWidth={active ? 1.6 : 1.2}
      strokeDasharray={dash}
      opacity={active ? 1 : 0.55}
    />
  );
};

/* World-map artboard.
   Pass: act, coins, w, h, rooms (array of {id, type, size, sub, x, y, state}),
   edges (array of {from:id, to:id, active}). */
const WorldMap = ({ act = 1, coins = 550, w = 1400, h = 720, rooms = [], edges = [], title = "Verfluchter Hain" }) => {
  const lookup = Object.fromEntries(rooms.map(r => [r.id, r]));
  return (
    <div className="cm-screen">
      {/* HUD */}
      <div className="cm-hud">
        <div className="cm-hud-left">
          <button style={{background:"transparent", border:"1px solid var(--line)", color:"var(--ink-dim)", padding:"8px 10px", cursor:"pointer", borderRadius:2}}>
            <Icon name="exit" size={14}/>
          </button>
          <div className="cm-act">
            <span className="cm-act-label">Akt {String(act).padStart(2,"0")} · Welt-Karte</span>
            <span className="cm-act-name">{title}</span>
          </div>
        </div>
        <div className="cm-hud-right">
          <HPPill cur={100} max={100}/>
          <Coin value={coins}/>
        </div>
      </div>

      {/* Map area */}
      <div style={{position:"absolute", inset:"96px 56px 56px 56px"}}>
        {/* background grid */}
        <svg style={{position:"absolute", inset:0, width:"100%", height:"100%"}} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <defs>
            <pattern id={`grid-${act}`} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(214,169,85,.05)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width={w} height={h} fill={`url(#grid-${act})`}/>

          {/* edges */}
          {edges.map((e, i) => {
            const a = lookup[e.from], b = lookup[e.to];
            if (!a || !b) return null;
            return <Edge key={i} from={{x:a.x, y:a.y}} to={{x:b.x, y:b.y}} active={e.active}/>;
          })}
        </svg>

        {/* rooms */}
        {rooms.map(r => <RoomTile key={r.id} {...r}/>)}
      </div>

      {/* Bottom rail: act progress */}
      <div style={{
        position:"absolute", bottom:18, left:56, right:56,
        display:"flex", alignItems:"center", gap:18,
      }}>
        <span className="cm-label">Pfad</span>
        <div style={{flex:1, height:1, background:"var(--line)"}}></div>
        <span className="cm-label" style={{color:"var(--ink-dim)"}}>{rooms.length} Räume · Endboss</span>
      </div>
    </div>
  );
};

window.WorldMap = WorldMap;
window.RoomTile = RoomTile;
window.ROOM_DEFS = ROOM_DEFS;
