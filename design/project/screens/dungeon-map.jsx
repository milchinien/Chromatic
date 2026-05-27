/* CHROMATIC — Dungeon Map (Raum-Karte · Micro-Navigation)
   Top-down dungeon floor view: stone-walled chambers connected by corridors.
   Fixed UI chrome — the specific room layout, doors and contents are
   placeholders for procedurally-generated runtime content. */

const DUNGEON_TOKENS = {
  WALL_THICK: 16,
  CORRIDOR_W: 60,
  WALL_FILL: "#1a1109",
  WALL_HI:   "#2c1f14",
  FLOOR_FILL:"url(#dgn-tile)",
  DOORFRAME: "#0a0703",
  PLAYER_RING: "#f0c878",
};

/* Corridor rect between two grid-aligned rooms */
function corridorFor(a, b, W = DUNGEON_TOKENS.CORRIDOR_W) {
  const aR = a.cx + a.w/2, aL = a.cx - a.w/2;
  const aT = a.cy - a.h/2, aB = a.cy + a.h/2;
  const bR = b.cx + b.w/2, bL = b.cx - b.w/2;
  const bT = b.cy - b.h/2, bB = b.cy + b.h/2;
  if (Math.abs(a.cx - b.cx) < 4) {
    const y0 = a.cy < b.cy ? aB : bB;
    const y1 = a.cy < b.cy ? bT : aT;
    return { x: a.cx - W/2, y: y0, w: W, h: y1 - y0, vertical: true };
  }
  const x0 = a.cx < b.cx ? aR : bR;
  const x1 = a.cx < b.cx ? bL : aL;
  return { x: x0, y: a.cy - W/2, w: x1 - x0, h: W, vertical: false };
}

const DungeonMap = ({
  floor = 2, floorMax = 20, suffix = "",
  hp = 100, hpMax = 100, coins = 412,
  rooms = [], edges = [],
}) => {
  const W = DUNGEON_TOKENS.WALL_THICK;
  const lookup = Object.fromEntries(rooms.map(r => [r.id, r]));
  const corridors = edges.map(e => ({
    ...corridorFor(lookup[e.from], lookup[e.to]),
    id: `${e.from}-${e.to}`,
    traversed: e.traversed,
  }));

  // Tight viewBox around content; symmetric padding so SVG centers cleanly
  // in its container regardless of how rooms are laid out.
  const pad = 48;
  const minX = Math.min(...rooms.map(r => r.cx - r.w/2)) - pad;
  const minY = Math.min(...rooms.map(r => r.cy - r.h/2)) - pad;
  const maxX = Math.max(...rooms.map(r => r.cx + r.w/2)) + pad;
  const maxY = Math.max(...rooms.map(r => r.cy + r.h/2)) + pad;
  const boxW = maxX - minX, boxH = maxY - minY;

  // unique id per instance so multiple dungeon artboards don't share defs
  const uid = React.useId().replace(/:/g, "");

  return (
    <div className="cm-screen">
      {/* === HUD — matches the rest of the system === */}
      <div className="cm-hud">
        <div className="cm-hud-left">
          <button style={{background:"transparent", border:"1px solid var(--line)", color:"var(--ink-dim)", padding:"8px 10px", cursor:"pointer", borderRadius:2}}>
            <Icon name="exit" size={14}/>
          </button>
          <div className="cm-act">
            <span className="cm-act-label">Floor {String(floor).padStart(2,"0")} / {floorMax} · Raum-Karte</span>
            <span className="cm-act-name">{suffix || "Steinhalle"}</span>
          </div>
        </div>
        <div className="cm-hud-right">
          <HPPill cur={hp} max={hpMax}/>
          <Coin value={coins}/>
        </div>
      </div>

      {/* === DUNGEON canvas — centered in remaining space === */}
      <div style={{position:"absolute", inset:"96px 56px 56px 56px", display:"flex", alignItems:"center", justifyContent:"center"}}>
        <svg
          viewBox={`${minX} ${minY} ${boxW} ${boxH}`}
          preserveAspectRatio="xMidYMid meet"
          style={{width:"100%", height:"100%", display:"block"}}>
          <defs>
            <pattern id={`dgn-tile-${uid}`} width="56" height="56" patternUnits="userSpaceOnUse">
              <rect width="56" height="56" fill="#a89378"/>
              <rect x="6"  y="8"  width="14" height="10" rx="2"   fill="#8a755a" opacity=".45"/>
              <rect x="28" y="14" width="10" height="8"  rx="1.5" fill="#8a755a" opacity=".40"/>
              <rect x="42" y="6"  width="10" height="9"  rx="1.5" fill="#8a755a" opacity=".40"/>
              <rect x="12" y="28" width="10" height="7"  rx="1.5" fill="#8a755a" opacity=".35"/>
              <rect x="32" y="32" width="14" height="10" rx="2"   fill="#8a755a" opacity=".45"/>
              <rect x="4"  y="44" width="12" height="8"  rx="1.5" fill="#8a755a" opacity=".40"/>
            </pattern>
            <pattern id={`dgn-wall-${uid}`} width="14" height="14" patternUnits="userSpaceOnUse">
              <rect width="14" height="14" fill={DUNGEON_TOKENS.WALL_FILL}/>
              <rect x="0" y="0" width="14" height="0.6" fill="#2c1f14" opacity=".5"/>
              <rect x="0" y="7" width="14" height="0.6" fill="#2c1f14" opacity=".5"/>
            </pattern>
          </defs>

          {/* WALL fill */}
          {rooms.map(r => (
            <rect key={`w-${r.id}`}
              x={r.cx - r.w/2} y={r.cy - r.h/2}
              width={r.w} height={r.h}
              fill={`url(#dgn-wall-${uid})`}
              rx="4"/>
          ))}
          {corridors.map(c => (
            <rect key={`wc-${c.id}`}
              x={c.x} y={c.y} width={c.w} height={c.h}
              fill={`url(#dgn-wall-${uid})`}/>
          ))}

          {/* FLOOR */}
          {rooms.map(r => (
            <rect key={`f-${r.id}`}
              x={r.cx - r.w/2 + W} y={r.cy - r.h/2 + W}
              width={r.w - 2*W} height={r.h - 2*W}
              fill={`url(#dgn-tile-${uid})`}
              rx="2"/>
          ))}
          {corridors.map(c => {
            if (c.vertical) {
              return <rect key={`fc-${c.id}`}
                x={c.x + W} y={c.y - W}
                width={c.w - 2*W} height={c.h + 2*W}
                fill={`url(#dgn-tile-${uid})`}/>;
            }
            return <rect key={`fc-${c.id}`}
              x={c.x - W} y={c.y + W}
              width={c.w + 2*W} height={c.h - 2*W}
              fill={`url(#dgn-tile-${uid})`}/>;
          })}

          {/* room interior outline — subtle inset for depth */}
          {rooms.map(r => (
            <rect key={`o-${r.id}`}
              x={r.cx - r.w/2 + W + 1} y={r.cy - r.h/2 + W + 1}
              width={r.w - 2*W - 2} height={r.h - 2*W - 2}
              fill="none" stroke="rgba(26,17,9,.35)" strokeWidth="1"
              rx="1"/>
          ))}

          {/* DOOR jambs */}
          {corridors.map(c => {
            if (c.vertical) {
              return (
                <g key={`dr-${c.id}`}>
                  <rect x={c.x + W} y={c.y - 3} width={c.w - 2*W} height={5} fill={DUNGEON_TOKENS.DOORFRAME}/>
                  <rect x={c.x + W} y={c.y + c.h - 2} width={c.w - 2*W} height={5} fill={DUNGEON_TOKENS.DOORFRAME}/>
                </g>
              );
            }
            return (
              <g key={`dr-${c.id}`}>
                <rect x={c.x - 3} y={c.y + W} width={5} height={c.h - 2*W} fill={DUNGEON_TOKENS.DOORFRAME}/>
                <rect x={c.x + c.w - 2} y={c.y + W} width={5} height={c.h - 2*W} fill={DUNGEON_TOKENS.DOORFRAME}/>
              </g>
            );
          })}

          {/* Room glyphs (visited/available — fixed UI signaling room type) */}
          {rooms.map(r => {
            const isCurrent = r.state === "current";
            const isVisited = r.state === "visited";
            if (isCurrent) return null;
            const glyphSize = Math.min(r.w, r.h) * 0.46;
            return (
              <g key={`ic-${r.id}`} opacity={isVisited ? 0.55 : 1}>
                <RoomGlyph
                  type={r.type}
                  x={r.cx - glyphSize/2}
                  y={r.cy - glyphSize/2}
                  size={glyphSize}
                  color={isVisited ? "#7a6850" : "#fbf3dc"}
                  stroke={2}/>
                {isVisited && (
                  <g transform={`translate(${r.cx + r.w/2 - 22} ${r.cy + r.h/2 - 22})`}>
                    <circle cx="8" cy="8" r="8" fill="#4a8a4a" stroke="#1a130c" strokeWidth="1.5"/>
                    <path d="M 4 8 L 7 11 L 12 5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                )}
              </g>
            );
          })}

          {/* Current room — clean marker, no pixel-art character */}
          {rooms.filter(r => r.state === "current").map(r => {
            const ringSize = Math.min(r.w, r.h) * 0.42;
            return (
              <g key={`cur-${r.id}`}>
                {/* outer pulse ring */}
                <rect
                  x={r.cx - r.w/2 + 3} y={r.cy - r.h/2 + 3}
                  width={r.w - 6} height={r.h - 6}
                  fill="none" stroke={DUNGEON_TOKENS.PLAYER_RING}
                  strokeWidth="2.5" strokeDasharray="7 5"
                  rx="3" opacity=".75"/>
                {/* player marker — gold disc with hexagram, abstract */}
                <circle cx={r.cx} cy={r.cy} r={ringSize/2 + 4} fill="#1a130c" stroke={DUNGEON_TOKENS.PLAYER_RING} strokeWidth="1.5" opacity=".85"/>
                <circle cx={r.cx} cy={r.cy} r={ringSize/2 - 2} fill="none" stroke={DUNGEON_TOKENS.PLAYER_RING} strokeWidth="1" opacity=".4"/>
                <g transform={`translate(${r.cx} ${r.cy})`} fill={DUNGEON_TOKENS.PLAYER_RING}>
                  <circle r="3.5"/>
                </g>
                {/* "DU" label below marker */}
                <text x={r.cx} y={r.cy + ringSize/2 + 14}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="11" letterSpacing="2"
                  fill={DUNGEON_TOKENS.PLAYER_RING}>DU</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom rail — fixed UI legend */}
      <div style={{
        position:"absolute", bottom:18, left:56, right:56,
        display:"flex", alignItems:"center", gap:18,
      }}>
        <span className="cm-label">Stockwerk</span>
        <div style={{flex:1, height:1, background:"var(--line)"}}/>
        <span className="cm-label" style={{color:"var(--ink-dim)"}}>
          {rooms.filter(r=>r.state==="visited").length} / {rooms.length} Räume erkundet
        </span>
      </div>
    </div>
  );
};

window.DungeonMap = DungeonMap;
