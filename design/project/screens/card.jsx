/* CHROMATIC — Card component (used by Shop + Combat hand) */

const COLOR_CSS = {
  natur: "var(--c-natur)", krieg: "var(--c-krieg)", stein: "var(--c-stein)",
  untot: "var(--c-untot)", farblos: "var(--c-farblos)",
};
const COLOR_LABEL = {
  natur: "Natur", krieg: "Krieg", stein: "Stein", untot: "Untot", farblos: "Farblos",
};
const CLASS_ICON = {
  Krieger: "sword", Festung: "shield", Reittier: "horse",
  Magier: "wand", Heiler: "heart",
};

/* Card size variants */
const UnitCard = ({ card, size = "md", selected = false, onClick }) => {
  const dims = {
    sm: { w: 110, h: 160, pad: 8,  artH: 60,  name: 11, stat: 11, kw: 8 },
    md: { w: 150, h: 218, pad: 10, artH: 88,  name: 13, stat: 14, kw: 9 },
    lg: { w: 190, h: 274, pad: 12, artH: 116, name: 16, stat: 18, kw: 10 },
  }[size];
  const colorCss = COLOR_CSS[card.color];
  return (
    <div
      onClick={onClick}
      className={`cm-card ${selected ? "cm-card--selected" : ""}`}
      style={{
        width: dims.w, height: dims.h,
        padding: dims.pad,
        display: "flex", flexDirection: "column", gap: 6,
        cursor: onClick ? "pointer" : "default",
        background: `linear-gradient(180deg, ${card.color === "farblos" ? "#2c2316" : "var(--surface-2)"}, var(--surface))`,
        borderColor: selected ? "var(--gold)" : "var(--line-hi)",
      }}
    >
      {/* mana cost */}
      <div style={{
        position:"absolute", top: -8, left: -8,
        width: 28, height: 28, borderRadius: "50%",
        background: "radial-gradient(circle at 30% 30%, #6ab1e8, #2a5a8c)",
        border: "2px solid #0f1820",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:'"JetBrains Mono", monospace', fontSize: 13, fontWeight: 700, color:"#fff",
        boxShadow:"0 0 8px rgba(74,140,200,.5)",
        zIndex: 2,
      }}>{card.mana}</div>

      {/* color/class tags */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", paddingLeft: 22}}>
        <div style={{display:"flex", alignItems:"center", gap:5}}>
          <span style={{width: 7, height: 7, borderRadius:"50%", background: colorCss, boxShadow:`0 0 6px ${colorCss}`}}/>
          <span style={{fontFamily:'"JetBrains Mono", monospace', fontSize: dims.kw, color:"var(--ink-dim)", letterSpacing:".12em", textTransform:"uppercase"}}>
            {COLOR_LABEL[card.color]}
          </span>
        </div>
        <Icon name={CLASS_ICON[card.cls]} size={dims.name} color="var(--ink-mute)"/>
      </div>

      {/* art well */}
      <div style={{
        height: dims.artH,
        background: `repeating-linear-gradient(135deg, ${colorCss}18 0 6px, transparent 6px 12px), radial-gradient(ellipse at 50% 60%, ${colorCss}33 0%, transparent 70%), #1a130c`,
        border: "1px solid var(--line)",
        borderRadius: 2,
        display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative",
      }}>
        <Icon name={CLASS_ICON[card.cls]} size={dims.artH * 0.55} color={colorCss}/>
        {/* corner runes */}
        <span style={{position:"absolute", top:4, left:4, fontFamily:'"JetBrains Mono", monospace', fontSize:8, color:colorCss, opacity:.7}}>◆</span>
        <span style={{position:"absolute", bottom:4, right:4, fontFamily:'"JetBrains Mono", monospace', fontSize:8, color:colorCss, opacity:.7}}>◆</span>
      </div>

      {/* name */}
      <div style={{
        fontFamily:'"Cinzel", serif', fontSize: dims.name, color:"var(--ink)", letterSpacing:".05em",
        textAlign:"center", lineHeight: 1.1,
      }}>{card.name}</div>

      {/* stats */}
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding: "4px 8px", marginTop: "auto",
        background:"var(--bg-2)", border:"1px solid var(--line)", borderRadius: 2,
      }}>
        <span style={{display:"flex", alignItems:"center", gap:4, color:"var(--c-krieg)", fontFamily:'"JetBrains Mono", monospace', fontSize: dims.stat, fontWeight:700}}>
          <Icon name="sword" size={dims.stat} color="var(--c-krieg)"/>{card.dmg}
        </span>
        <span style={{display:"flex", alignItems:"center", gap:4, color:"var(--c-natur)", fontFamily:'"JetBrains Mono", monospace', fontSize: dims.stat, fontWeight:700}}>
          <Icon name="heart" size={dims.stat} color="var(--c-natur)"/>{card.hp}
        </span>
      </div>

      {/* class label */}
      <div style={{
        fontFamily:'"JetBrains Mono", monospace', fontSize: dims.kw, letterSpacing:".22em",
        color:"var(--ink-mute)", textAlign:"center", textTransform:"uppercase",
      }}>{card.cls}</div>
    </div>
  );
};

window.UnitCard = UnitCard;
window.COLOR_CSS = COLOR_CSS;
window.COLOR_LABEL = COLOR_LABEL;
window.CLASS_ICON = CLASS_ICON;
