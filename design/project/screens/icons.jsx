/* CHROMATIC — shared SVG icons & helpers
   All icons are clean outline / lineart style — stroke only, rounded caps,
   consistent stroke width. Two collections:
     • Icon    — small UI icons (HUD, buttons, class chips, etc.)
     • RoomGlyph — large pictograms used on map medallions
*/

const Icon = ({ name, size = 18, color = "currentColor", stroke = 1.6 }) => {
  const s = size, c = color, w = stroke;
  const wrap = (children) => (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  );
  switch (name) {
    case "coin":
      return wrap(<><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/></>);
    case "skull":
      return wrap(<><path d="M5 11 Q 5 4, 12 4 Q 19 4, 19 11 L 19 14 Q 19 15.5, 17 16 L 17 19 L 14 19 L 14 17 L 10 17 L 10 19 L 7 19 L 7 16 Q 5 15.5, 5 14 Z"/><circle cx="9.5" cy="11" r="1.3" fill={c}/><circle cx="14.5" cy="11" r="1.3" fill={c}/><path d="M 11 14 L 12 15.5 L 13 14"/></>);
    case "crown":
      return wrap(<><path d="M 3 18 L 21 18 L 19 8 L 15 12 L 12 6 L 9 12 L 5 8 Z"/></>);
    case "sword":
      return wrap(<><path d="M 12 3 L 9.5 13 L 14.5 13 Z"/><line x1="7" y1="13" x2="17" y2="13"/><line x1="12" y1="13" x2="12" y2="19.5"/><circle cx="12" cy="20.7" r="1.3" fill={c}/></>);
    case "swords":
      return wrap(<><path d="M 18 4 L 20.5 6.5 L 9.5 17.5 L 7 15 Z"/><line x1="5" y1="13.5" x2="10.5" y2="19"/><line x1="7.5" y1="19.5" x2="4" y2="22"/><circle cx="3" cy="22.2" r="1.1" fill={c}/><path d="M 6 4 L 3.5 6.5 L 14.5 17.5 L 17 15 Z"/><line x1="19" y1="13.5" x2="13.5" y2="19"/><line x1="16.5" y1="19.5" x2="20" y2="22"/><circle cx="21" cy="22.2" r="1.1" fill={c}/></>);
    case "shield":
      return wrap(<path d="M 12 3 L 20 6 L 20 12 Q 20 18, 12 21 Q 4 18, 4 12 L 4 6 Z"/>);
    case "chest":
      return wrap(<><rect x="3.5" y="10" width="17" height="10" rx="0.6"/><path d="M 3.5 10 Q 3.5 5, 12 5 Q 20.5 5, 20.5 10"/><line x1="3.5" y1="13" x2="20.5" y2="13"/><rect x="10.5" y="11" width="3" height="4" rx="0.4"/><circle cx="12" cy="13.5" r="0.6" fill={c}/></>);
    case "potion":
      return wrap(<><rect x="9.5" y="3" width="5" height="2" rx="0.4"/><path d="M 10 5 L 10 8 L 7 13 Q 6 19, 12 19 Q 18 19, 17 13 L 14 8 L 14 5"/><path d="M 8 14 Q 12 12.5, 16 14"/></>);
    case "sparkle":
      return wrap(<><path d="M 12 3 L 13.5 10 L 21 12 L 13.5 14 L 12 21 L 10.5 14 L 3 12 L 10.5 10 Z"/></>);
    case "flame":
      return wrap(<path d="M 12 3 Q 7 8, 7 13 Q 7 19, 12 21 Q 17 19, 17 13 Q 17 9, 14 8 Q 13 11, 12 10 Q 11 7, 12 3 Z"/>);
    case "spark":
      return wrap(<><path d="M 12 3 L 12 8 M 12 16 L 12 21 M 3 12 L 8 12 M 16 12 L 21 12"/><circle cx="12" cy="12" r="2"/></>);
    case "tree":
      return wrap(<><path d="M 12 3 L 17 10 L 14.5 10 L 18.5 16 L 13 16 L 13 21 L 11 21 L 11 16 L 5.5 16 L 9.5 10 L 7 10 Z"/></>);
    case "horse":
      return wrap(<><path d="M 5 21 L 6 14 L 10 11 L 8 6 L 13 9 L 17 7 L 20 11 L 17 13 L 15 21"/></>);
    case "wand":
      return wrap(<><path d="M 18 4 L 20 6 L 6 20 L 4 18 Z"/><path d="M 21 8 L 21 11 M 19.5 9.5 L 22.5 9.5"/><path d="M 14 3 L 14 5 M 13 4 L 15 4"/><circle cx="22" cy="13" r="0.6" fill={c}/></>);
    case "cross":
      return wrap(<><path d="M 12 4 L 12 20 M 4 12 L 20 12"/></>);
    case "lock":
      return wrap(<><rect x="5" y="11" width="14" height="9" rx="1"/><path d="M 8 11 V 8 a 4 4 0 0 1 8 0 V 11"/></>);
    case "spawn":
      return wrap(<><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill={c}/></>);
    case "flag":
      return wrap(<><line x1="6" y1="3" x2="6" y2="22"/><circle cx="6" cy="3" r="0.9" fill={c}/><path d="M 6 4 L 19 4 L 16 8 L 19 12 L 6 12"/></>);
    case "boss":
      return wrap(<><path d="M 5 18 L 3 9 L 9 12 L 12 5 L 15 12 L 21 9 L 19 18 Z"/><line x1="5" y1="18" x2="19" y2="18"/></>);
    case "castle":
      return wrap(<><path d="M 3 21 L 3 9 L 5 10 L 5 7 L 7 8 L 7 5 L 9 7 L 9 5 L 12 3 L 15 5 L 15 7 L 17 5 L 17 8 L 19 7 L 19 10 L 21 9 L 21 21 Z"/><path d="M 10 21 L 10 16 L 14 16 L 14 21"/></>);
    case "heart":
      return wrap(<path d="M 12 20 Q 5 15, 5 10 Q 5 6.5, 8.5 6.5 Q 11 6.5, 12 9 Q 13 6.5, 15.5 6.5 Q 19 6.5, 19 10 Q 19 15, 12 20 Z"/>);
    case "drop":
      return wrap(<path d="M 12 3 Q 6 11, 6 15 Q 6 20, 12 20 Q 18 20, 18 15 Q 18 11, 12 3 Z"/>);
    case "play":
      return wrap(<path d="M 7 5 L 19 12 L 7 19 Z"/>);
    case "cog":
      return wrap(<><circle cx="12" cy="12" r="3.2"/><path d="M 12 3 L 12 6 M 12 18 L 12 21 M 3 12 L 6 12 M 18 12 L 21 12 M 5.5 5.5 L 7.7 7.7 M 16.3 16.3 L 18.5 18.5 M 5.5 18.5 L 7.7 16.3 M 16.3 7.7 L 18.5 5.5"/></>);
    case "x":
      return wrap(<><path d="M 5 5 L 19 19 M 19 5 L 5 19"/></>);
    case "exit":
      return wrap(<><path d="M 14 4 L 19 4 L 19 20 L 14 20"/><path d="M 3 12 L 14 12 M 10 8 L 14 12 L 10 16"/></>);
    case "moneybag":
      return wrap(<><path d="M 8 6 L 16 6 L 18.5 11 Q 21 17.5, 12 21 Q 3 17.5, 5.5 11 Z"/><path d="M 8 6 L 9 4 L 15 4 L 16 6"/><path d="M 12 11 L 12 17"/><path d="M 14.5 12.5 Q 14.5 11.5, 13 11.5 L 11 11.5 Q 9.5 11.5, 9.5 13 Q 9.5 14.2, 11 14.2 L 13 14.2 Q 14.5 14.2, 14.5 15.7 Q 14.5 17, 13 17 L 11 17 Q 9.5 17, 9.5 15.7"/></>);
    case "coins":
      return wrap(<><ellipse cx="12" cy="6" rx="7" ry="2"/><path d="M 5 6 L 5 9 Q 5 11, 12 11 Q 19 11, 19 9 L 19 6"/><path d="M 5 10 L 5 13 Q 5 15, 12 15 Q 19 15, 19 13 L 19 10"/><path d="M 5 14 L 5 17 Q 5 19, 12 19 Q 19 19, 19 17 L 19 14"/></>);
    case "menu":
      return wrap(<><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>);
    case "backpack":
      return wrap(<><path d="M 6 9 L 6 21 L 18 21 L 18 9"/><path d="M 6 9 Q 6 5, 9 5 L 15 5 Q 18 5, 18 9"/><path d="M 9 5 Q 9 3, 12 3 Q 15 3, 15 5"/><rect x="9" y="13" width="6" height="4" rx="0.5"/></>);
    case "dice":
      return wrap(<><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="8" cy="8" r="1.2" fill={c}/><circle cx="16" cy="8" r="1.2" fill={c}/><circle cx="8" cy="16" r="1.2" fill={c}/><circle cx="16" cy="16" r="1.2" fill={c}/></>);
    case "reroll":
      return wrap(<><path d="M 4 12 Q 4 5, 12 5 Q 16 5, 19 8 L 17 10 M 19 5 L 19 10 L 14 10"/><path d="M 20 12 Q 20 19, 12 19 Q 8 19, 5 16 L 7 14 M 5 19 L 5 14 L 10 14"/></>);
    default:
      return wrap(<circle cx="12" cy="12" r="6"/>);
  }
};

/* ============================================================
   Room Glyphs — large outline pictograms used on map medallions.
   ============================================================ */
const RoomGlyph = ({ type, size = 36, color = "#fbf3dc", x, y, stroke = 1.7 }) => {
  const s = { fill: "none", stroke: color, strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    start: (
      // FLAG on pole
      <g {...s}>
        <line x1="6" y1="3" x2="6" y2="22"/>
        <circle cx="6" cy="3" r="1" fill={color}/>
        <path d="M 6 4.5 L 19 4.5 L 16 8.5 L 19 12.5 L 6 12.5"/>
      </g>
    ),
    normal: (
      // SINGLE SWORD
      <g {...s}>
        <path d="M 12 2.5 L 9.5 13 L 14.5 13 Z"/>
        <line x1="7" y1="13" x2="17" y2="13"/>
        <line x1="12" y1="13" x2="12" y2="19.5"/>
        <circle cx="12" cy="20.8" r="1.3" fill={color}/>
      </g>
    ),
    hard: (
      // CROSSED SWORDS
      <g {...s}>
        {/* sword tip top-right */}
        <path d="M 18 3 L 20.5 5.5 L 9 17 L 6.5 14.5 Z"/>
        <line x1="4.5" y1="12.5" x2="10" y2="18"/>
        <line x1="7" y1="19" x2="3.5" y2="22"/>
        <circle cx="2.4" cy="22.4" r="1.1" fill={color}/>
        {/* sword tip top-left */}
        <path d="M 6 3 L 3.5 5.5 L 15 17 L 17.5 14.5 Z"/>
        <line x1="19.5" y1="12.5" x2="14" y2="18"/>
        <line x1="17" y1="19" x2="20.5" y2="22"/>
        <circle cx="21.6" cy="22.4" r="1.1" fill={color}/>
      </g>
    ),
    treasure: (
      // MONEY BAG with $
      <g {...s}>
        <path d="M 7 6 L 17 6 L 19.5 11 Q 22 17.5, 12 21 Q 2 17.5, 4.5 11 Z"/>
        <path d="M 7 6 L 8 4 L 16 4 L 17 6"/>
        <line x1="12" y1="11" x2="12" y2="17"/>
        <path d="M 14.5 12.5 Q 14.5 11.3, 13 11.3 L 11 11.3 Q 9.5 11.3, 9.5 13 Q 9.5 14.2, 11 14.2 L 13 14.2 Q 14.5 14.2, 14.5 15.7 Q 14.5 17, 13 17 L 11 17 Q 9.5 17, 9.5 15.7"/>
      </g>
    ),
    shop: (
      // STACK OF COINS
      <g {...s}>
        <ellipse cx="12" cy="5" rx="7.5" ry="2"/>
        <path d="M 4.5 5 L 4.5 7.5 Q 4.5 9.5, 12 9.5 Q 19.5 9.5, 19.5 7.5 L 19.5 5"/>
        <path d="M 4.5 9 L 4.5 11.5 Q 4.5 13.5, 12 13.5 Q 19.5 13.5, 19.5 11.5 L 19.5 9"/>
        <path d="M 4.5 13 L 4.5 15.5 Q 4.5 17.5, 12 17.5 Q 19.5 17.5, 19.5 15.5 L 19.5 13"/>
      </g>
    ),
    perk: (
      // MAGIC WAND with sparkles
      <g {...s}>
        <path d="M 18 4 L 20.5 6.5 L 6.5 20.5 L 4 18 Z"/>
        <path d="M 16.5 5.5 L 19 8" stroke={color} strokeWidth="1"/>
        <path d="M 22 9 L 22 12 M 20.5 10.5 L 23.5 10.5"/>
        <path d="M 14 2 L 14 4.5 M 12.7 3.2 L 15.3 3.2"/>
        <path d="M 22 15 L 22 17.5 M 20.7 16.2 L 23.3 16.2"/>
        <circle cx="9.5" cy="2.5" r="0.6" fill={color}/>
      </g>
    ),
    mini: (
      // SKULL (clean simple)
      <g {...s}>
        <path d="M 4.5 11 Q 4.5 3, 12 3 Q 19.5 3, 19.5 11 L 19.5 14 Q 19.5 15.8, 17 16.5 L 17 19.5 L 14 19.5 L 14 17.5 L 10 17.5 L 10 19.5 L 7 19.5 L 7 16.5 Q 4.5 15.8, 4.5 14 Z"/>
        <ellipse cx="9" cy="10.5" rx="2" ry="2.4" fill={color}/>
        <ellipse cx="15" cy="10.5" rx="2" ry="2.4" fill={color}/>
        <path d="M 11 14 L 12 16 L 13 14"/>
        <path d="M 9 17.5 L 9 19.5 M 11 17.5 L 11 19.5 M 13 17.5 L 13 19.5 M 15 17.5 L 15 19.5"/>
      </g>
    ),
    boss: (
      // SKULL with CROSSBONES below
      <g {...s}>
        {/* skull */}
        <path d="M 5 9 Q 5 2, 12 2 Q 19 2, 19 9 L 19 11.5 Q 19 13.2, 17 13.9 L 17 16 L 14 16 L 14 14 L 10 14 L 10 16 L 7 16 L 7 13.9 Q 5 13.2, 5 11.5 Z"/>
        <ellipse cx="9" cy="8.5" rx="1.8" ry="2.2" fill={color}/>
        <ellipse cx="15" cy="8.5" rx="1.8" ry="2.2" fill={color}/>
        <path d="M 11 11.5 L 12 13 L 13 11.5"/>
        <path d="M 8.5 14 L 8.5 16 M 10.5 14 L 10.5 16 M 13.5 14 L 13.5 16 M 15.5 14 L 15.5 16"/>
        {/* crossbones */}
        <g strokeWidth={stroke + 0.2}>
          <line x1="3" y1="22" x2="21" y2="17"/>
          <circle cx="2.3" cy="22.2" r="1.1" fill={color}/>
          <circle cx="21.7" cy="16.8" r="1.1" fill={color}/>
          <line x1="3" y1="17" x2="21" y2="22"/>
          <circle cx="2.3" cy="16.8" r="1.1" fill={color}/>
          <circle cx="21.7" cy="22.2" r="1.1" fill={color}/>
        </g>
      </g>
    ),
  };
  return (
    <svg x={x} y={y} viewBox="0 0 24 24" width={size} height={size} style={{display:"block"}}>
      {paths[type] || paths.normal}
    </svg>
  );
};

/* Coin counter — outline coin in HUD */
const Coin = ({ value }) => (
  <div className="cm-coin">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f0c878" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="5.5"/>
    </svg>
    <span className="cm-coin-val">{value}</span>
  </div>
);

/* HP pill */
const HPPill = ({ cur, max }) => (
  <div className="cm-hp-pill">
    <span className="cm-hp-dot"></span>
    <span><span style={{color:"var(--ink)"}}>{cur}</span><span style={{opacity:.5}}> / {max}</span></span>
  </div>
);

/* ============================================================
   UIPlaceholder — explicit "this is a placeholder, real content is
   generated by Claude Code at runtime" marker. Used for cards in
   loot pools, hand slots, on-field unit zones, etc. Keeps the
   fixed UI chrome around it so the layout reads at-a-glance.
   ============================================================ */
const UIPlaceholder = ({ label = "", hint, kicker = "UI · PLATZHALTER", icon, style, accent = "rgba(214,169,85,.7)" }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
    padding: 16,
    border: `1px dashed ${accent}`,
    background: "repeating-linear-gradient(135deg, rgba(214,169,85,.045) 0 10px, transparent 10px 20px)",
    color: accent,
    textAlign: "center",
    borderRadius: 3,
    fontFamily: '"JetBrains Mono", monospace',
    boxSizing: "border-box",
    ...style,
  }}>
    {icon && <Icon name={icon} size={22} color={accent}/>}
    <span style={{fontSize: 9, letterSpacing: ".32em", color: accent, opacity:.7, textTransform: "uppercase"}}>{kicker}</span>
    {label && <span style={{fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: accent}}>{label}</span>}
    {hint && (
      <span style={{
        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        fontSize: 11, color: "rgba(216,195,154,.55)", letterSpacing: ".02em",
        textTransform: "none", lineHeight: 1.45, maxWidth: 260,
      }}>{hint}</span>
    )}
  </div>
);

Object.assign(window, { Icon, Coin, HPPill, RoomGlyph, UIPlaceholder });
