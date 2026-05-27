/* CHROMATIC — app: design canvas composing all screens */

/* ============== Map data ============== */

/* Akt 1 — kleines Netz (folgt der Skizze: 8 Räume mit Verzweigung) */
const ACT1_ROOMS = [
  { id:"s",   type:"start",    size:"xs", sub:1, x:80,   y:294, state:"visited" },
  { id:"n1",  type:"normal",   size:"sm", sub:3, x:220,  y:294, state:"visited" },
  { id:"p",   type:"perk",     size:"md", sub:2, x:400,  y:294, state:"current" },
  { id:"n2",  type:"normal",   size:"lg", sub:4, x:600,  y:160, state:"available" },
  { id:"n3",  type:"normal",   size:"sm", sub:2, x:600,  y:430, state:"available" },
  { id:"hd",  type:"hard",     size:"md", sub:5, x:820,  y:160, state:"available" },
  { id:"sh",  type:"shop",     size:"sm", sub:1, x:820,  y:430, state:"available" },
  { id:"bs",  type:"boss",     size:"xl", sub:7, x:1080, y:294, state:"available" },
];
const ACT1_EDGES = [
  { from:"s",  to:"n1", active:true },
  { from:"n1", to:"p",  active:true },
  { from:"p",  to:"n2" },
  { from:"p",  to:"n3" },
  { from:"n2", to:"hd" },
  { from:"n3", to:"sh" },
  { from:"hd", to:"bs" },
  { from:"sh", to:"bs" },
];

/* Akt 2 — größeres Netz, mehrere Verzweigungen */
const ACT2_ROOMS = [
  { id:"s",   type:"start",    size:"xs", sub:1, x:60,   y:380, state:"visited" },
  { id:"n1",  type:"normal",   size:"md", sub:4, x:200,  y:380, state:"current" },
  { id:"t1",  type:"treasure", size:"sm", sub:1, x:360,  y:230, state:"available" },
  { id:"n2",  type:"normal",   size:"lg", sub:6, x:360,  y:530, state:"available" },
  { id:"p1",  type:"perk",     size:"md", sub:2, x:540,  y:130, state:"available" },
  { id:"n3",  type:"normal",   size:"sm", sub:3, x:540,  y:360, state:"available" },
  { id:"sh",  type:"shop",     size:"md", sub:1, x:540,  y:600, state:"available" },
  { id:"hd1", type:"hard",     size:"md", sub:5, x:740,  y:230, state:"available" },
  { id:"n4",  type:"normal",   size:"xs", sub:2, x:740,  y:440, state:"available" },
  { id:"mb",  type:"mini",     size:"lg", sub:6, x:940,  y:340, state:"available" },
  { id:"n5",  type:"normal",   size:"sm", sub:3, x:940,  y:580, state:"available" },
  { id:"t2",  type:"treasure", size:"md", sub:2, x:1140, y:200, state:"available" },
  { id:"n6",  type:"normal",   size:"md", sub:5, x:1140, y:480, state:"available" },
  { id:"bs",  type:"boss",     size:"xl", sub:8, x:1380, y:340, state:"available" },
];
const ACT2_EDGES = [
  { from:"s",   to:"n1",  active:true },
  { from:"n1",  to:"t1" },
  { from:"n1",  to:"n2" },
  { from:"t1",  to:"p1" },
  { from:"t1",  to:"n3" },
  { from:"n2",  to:"n3" },
  { from:"n2",  to:"sh" },
  { from:"p1",  to:"hd1" },
  { from:"n3",  to:"hd1" },
  { from:"n3",  to:"n4" },
  { from:"sh",  to:"n4" },
  { from:"hd1", to:"mb" },
  { from:"n4",  to:"mb" },
  { from:"n4",  to:"n5" },
  { from:"mb",  to:"t2" },
  { from:"mb",  to:"n6" },
  { from:"n5",  to:"n6" },
  { from:"t2",  to:"bs" },
  { from:"n6",  to:"bs" },
];

/* Akt 3 — dichteres Netz, größere Räume */
const ACT3_ROOMS = [
  { id:"s",   type:"start",    size:"xs", sub:1, x:60,   y:420, state:"visited" },
  { id:"n1",  type:"normal",   size:"md", sub:5, x:180,  y:420, state:"visited" },
  { id:"n2",  type:"normal",   size:"sm", sub:3, x:320,  y:240, state:"current" },
  { id:"n3",  type:"normal",   size:"lg", sub:7, x:320,  y:600, state:"available" },
  { id:"p1",  type:"perk",     size:"md", sub:2, x:470,  y:120, state:"available" },
  { id:"t1",  type:"treasure", size:"sm", sub:1, x:470,  y:340, state:"available" },
  { id:"sh1", type:"shop",     size:"md", sub:1, x:470,  y:540, state:"available" },
  { id:"n4",  type:"normal",   size:"xs", sub:2, x:470,  y:720, state:"available" },
  { id:"hd1", type:"hard",     size:"lg", sub:6, x:640,  y:220, state:"available" },
  { id:"n5",  type:"normal",   size:"md", sub:4, x:640,  y:440, state:"available" },
  { id:"n6",  type:"normal",   size:"sm", sub:3, x:640,  y:640, state:"available" },
  { id:"mb1", type:"mini",     size:"xl", sub:8, x:830,  y:160, state:"available" },
  { id:"t2",  type:"treasure", size:"md", sub:2, x:830,  y:380, state:"available" },
  { id:"hd2", type:"hard",     size:"md", sub:6, x:830,  y:560, state:"available" },
  { id:"n7",  type:"normal",   size:"sm", sub:3, x:830,  y:740, state:"available" },
  { id:"p2",  type:"perk",     size:"md", sub:2, x:1020, y:260, state:"available" },
  { id:"n8",  type:"normal",   size:"lg", sub:7, x:1020, y:480, state:"available" },
  { id:"sh2", type:"shop",     size:"sm", sub:1, x:1020, y:680, state:"available" },
  { id:"mb2", type:"mini",     size:"xl", sub:9, x:1220, y:200, state:"available" },
  { id:"n9",  type:"normal",   size:"md", sub:5, x:1220, y:440, state:"available" },
  { id:"n10", type:"normal",   size:"xs", sub:2, x:1220, y:640, state:"available" },
  { id:"bs",  type:"boss",     size:"xl", sub:10, x:1450, y:400, state:"available" },
];
const ACT3_EDGES = [
  { from:"s",   to:"n1",  active:true },
  { from:"n1",  to:"n2",  active:true },
  { from:"n1",  to:"n3" },
  { from:"n2",  to:"p1" },
  { from:"n2",  to:"t1" },
  { from:"n3",  to:"sh1" },
  { from:"n3",  to:"n4" },
  { from:"p1",  to:"hd1" },
  { from:"t1",  to:"hd1" },
  { from:"t1",  to:"n5" },
  { from:"sh1", to:"n5" },
  { from:"sh1", to:"n6" },
  { from:"n4",  to:"n6" },
  { from:"hd1", to:"mb1" },
  { from:"hd1", to:"t2" },
  { from:"n5",  to:"t2" },
  { from:"n5",  to:"hd2" },
  { from:"n6",  to:"hd2" },
  { from:"n6",  to:"n7" },
  { from:"mb1", to:"p2" },
  { from:"t2",  to:"p2" },
  { from:"t2",  to:"n8" },
  { from:"hd2", to:"n8" },
  { from:"n7",  to:"sh2" },
  { from:"p2",  to:"mb2" },
  { from:"n8",  to:"mb2" },
  { from:"n8",  to:"n9" },
  { from:"sh2", to:"n9" },
  { from:"sh2", to:"n10" },
  { from:"mb2", to:"bs" },
  { from:"n9",  to:"bs" },
  { from:"n10", to:"bs" },
];

/* ============== Raum-Karte Daten ============== */

/* Kleiner Raum (Akt 1) — folgt der Skizze */
const SUB_SMALL_NODES = [
  { id:"sp",  type:"start",    x:340,  y:560, state:"visited" },
  { id:"swr", type:"hard",     x:240,  y:430, state:"visited" },
  { id:"x1",  type:"normal",   x:440,  y:430, state:"current" },
  { id:"x2",  type:"normal",   x:140,  y:300, state:"available" },
  { id:"tr",  type:"treasure", x:340,  y:300, state:"available" },
  { id:"kp",  type:"normal",   x:540,  y:300, state:"available" },
  { id:"x3",  type:"normal",   x:240,  y:180, state:"available" },
  { id:"x4",  type:"normal",   x:440,  y:180, state:"available" },
  { id:"mb",  type:"mini",     x:340,  y:60,  state:"available" },
];
const SUB_SMALL_EDGES = [
  { from:"sp", to:"swr", traversed:true },
  { from:"sp", to:"x1",  traversed:true },
  { from:"swr", to:"x2" },
  { from:"swr", to:"tr" },
  { from:"x1", to:"tr" },
  { from:"x1", to:"kp" },
  { from:"x2", to:"x3" },
  { from:"tr", to:"x3" },
  { from:"tr", to:"x4" },
  { from:"kp", to:"x4" },
  { from:"x3", to:"mb" },
  { from:"x4", to:"mb" },
];

/* Großer Raum (Akt 3) — mehr Knoten */
const SUB_LARGE_NODES = [
  { id:"sp",  type:"start",    x:680, y:680, state:"visited" },
  { id:"a1",  type:"normal",   x:540, y:580, state:"visited" },
  { id:"a2",  type:"hard",     x:820, y:580, state:"current" },
  { id:"a3",  type:"normal",   x:380, y:480, state:"available" },
  { id:"a4",  type:"treasure", x:680, y:480, state:"available" },
  { id:"a5",  type:"normal",   x:960, y:480, state:"available" },
  { id:"a6",  type:"normal",   x:240, y:360, state:"available" },
  { id:"a7",  type:"hard",     x:540, y:360, state:"available" },
  { id:"a8",  type:"normal",   x:820, y:360, state:"available" },
  { id:"a9",  type:"treasure", x:1100,y:360, state:"available" },
  { id:"a10", type:"normal",   x:380, y:240, state:"available" },
  { id:"a11", type:"normal",   x:680, y:240, state:"available" },
  { id:"a12", type:"normal",   x:960, y:240, state:"available" },
  { id:"mb",  type:"mini",     x:680, y:100, state:"available" },
];
const SUB_LARGE_EDGES = [
  { from:"sp", to:"a1", traversed:true }, { from:"sp", to:"a2", traversed:true },
  { from:"a1", to:"a3" }, { from:"a1", to:"a4" },
  { from:"a2", to:"a4" }, { from:"a2", to:"a5" },
  { from:"a3", to:"a6" }, { from:"a3", to:"a7" },
  { from:"a4", to:"a7" }, { from:"a4", to:"a8" },
  { from:"a5", to:"a8" }, { from:"a5", to:"a9" },
  { from:"a6", to:"a10" },
  { from:"a7", to:"a10" }, { from:"a7", to:"a11" },
  { from:"a8", to:"a11" }, { from:"a8", to:"a12" },
  { from:"a9", to:"a12" },
  { from:"a10", to:"mb" }, { from:"a11", to:"mb" }, { from:"a12", to:"mb" },
];

/* ============== Dungeon Floor data (new style) ============== */

/* Akt 1 — small dungeon floor, axis-aligned grid */
const FLOOR_SMALL_ROOMS = [
  { id:"p",   type:"start",    cx:440, cy:600, w:180, h:140, state:"current" },
  { id:"jn",  type:"normal",   cx:440, cy:400, w:160, h:130, state:"visited" },
  { id:"hd",  type:"hard",     cx:140, cy:400, w:160, h:130, state:"visited" },
  { id:"n1",  type:"normal",   cx:740, cy:400, w:160, h:130, state:"available" },
  { id:"mb",  type:"mini",     cx:440, cy:180, w:280, h:180, state:"available" },
  { id:"n2",  type:"normal",   cx:140, cy:180, w:160, h:130, state:"available" },
  { id:"t1",  type:"treasure", cx:740, cy:180, w:160, h:130, state:"available" },
];
const FLOOR_SMALL_EDGES = [
  { from:"p",  to:"jn", traversed:true },
  { from:"jn", to:"hd", traversed:true },
  { from:"jn", to:"n1" },
  { from:"jn", to:"mb" },
  { from:"mb", to:"n2" },
  { from:"mb", to:"t1" },
];

/* Akt 3 — larger dungeon, more rooms and branches */
const FLOOR_LARGE_ROOMS = [
  { id:"p",   type:"start",    cx:440, cy:700, w:180, h:140, state:"current" },
  { id:"jn",  type:"normal",   cx:440, cy:540, w:180, h:140, state:"visited" },
  { id:"hd",  type:"hard",     cx:200, cy:540, w:160, h:130, state:"visited" },
  { id:"t1",  type:"treasure", cx:680, cy:540, w:160, h:130, state:"available" },
  { id:"md",  type:"normal",   cx:440, cy:360, w:220, h:160, state:"available" },
  { id:"n4",  type:"normal",   cx:200, cy:360, w:160, h:130, state:"available" },
  { id:"n5",  type:"normal",   cx:680, cy:360, w:160, h:130, state:"available" },
  { id:"t2",  type:"shop",     cx:200, cy:180, w:160, h:130, state:"available" },
  { id:"mb",  type:"mini",     cx:440, cy:180, w:280, h:180, state:"available" },
  { id:"n6",  type:"perk",     cx:680, cy:180, w:160, h:130, state:"available" },
];
const FLOOR_LARGE_EDGES = [
  { from:"p",  to:"jn", traversed:true },
  { from:"jn", to:"hd", traversed:true },
  { from:"jn", to:"t1" },
  { from:"jn", to:"md" },
  { from:"hd", to:"n4" },
  { from:"t1", to:"n5" },
  { from:"md", to:"n4" },
  { from:"md", to:"n5" },
  { from:"md", to:"mb" },
  { from:"n4", to:"t2" },
  { from:"n5", to:"n6" },
  { from:"mb", to:"t2" },
  { from:"mb", to:"n6" },
];

/* ============== Canvas composition ============== */

const App = () => {
  return (
    <DesignCanvas>
      <DCSection id="menu" title="Hauptmenü" subtitle="Start des Spiels · Eintritt in den Run">
        <DCArtboard id="main-menu" label="A · Hauptmenü" width={1280} height={800}>
          <MainMenu/>
        </DCArtboard>
      </DCSection>

      <DCSection id="worlds" title="Welt-Karten · Macro-Navigation" subtitle="Slay-the-Spire-Stil · Anzahl Räume wächst pro Akt. Sub-Counter „A · N“ zeigt, wie viele Sub-Knoten der Raum enthält.">
        <DCArtboard id="act1" label="A · Akt 01 (8 Räume)" width={1500} height={740}>
          <WorldMap act={1} coins={550} w={1388} h={588}
                    title="Verfluchter Hain"
                    rooms={ACT1_ROOMS} edges={ACT1_EDGES}/>
        </DCArtboard>
        <DCArtboard id="act2" label="B · Akt 02 (14 Räume)" width={1800} height={830}>
          <WorldMap act={2} coins={1240} w={1688} h={678}
                    title="Ruinen von Sallow"
                    rooms={ACT2_ROOMS} edges={ACT2_EDGES}/>
        </DCArtboard>
        <DCArtboard id="act3" label="C · Akt 03 (22 Räume)" width={2050} height={950}>
          <WorldMap act={3} coins={2890} w={1938} h={798}
                    title="Asche des Magierats"
                    rooms={ACT3_ROOMS} edges={ACT3_EDGES}/>
        </DCArtboard>
      </DCSection>

      <DCSection id="rooms" title="Raum-Karten · Micro-Navigation" subtitle="Top-down Dungeon-Layout: Steinkammern verbunden durch Korridore. Layout-Beispiele Akt 01 (klein) und Akt 03 (groß) — die konkrete Anordnung wird zur Laufzeit generiert.">
        <DCArtboard id="floor-small" label="A · Floor (Akt 01)" width={1100} height={900}>
          <DungeonMap floor={2} floorMax={20} hp={86} hpMax={100} coins={612}
                      rooms={FLOOR_SMALL_ROOMS} edges={FLOOR_SMALL_EDGES}/>
        </DCArtboard>
        <DCArtboard id="floor-large" label="B · Floor (Akt 03 · Hard)" width={1100} height={1000}>
          <DungeonMap floor={8} floorMax={20} suffix="Hard" hp={120} hpMax={120} coins={2890}
                      rooms={FLOOR_LARGE_ROOMS} edges={FLOOR_LARGE_EDGES}/>
        </DCArtboard>
      </DCSection>

      <DCSection id="loot" title="Belohnungsraum" subtitle="Shop und Zauber kombiniert: 3 Slots, eine Wahl. Karten / Perks / Rare werden zur Laufzeit befüllt — die drei Felder sind UI-Platzhalter.">
        <DCArtboard id="rewards" label="A · Belohnung wählen (UI-Chrome)" width={1500} height={950}>
          <RewardPicker coins={412} hp={86} hpMax={100} floor={4} floorMax={20}/>
        </DCArtboard>
      </DCSection>

      <DCSection id="combat" title="Combat" subtitle="Real-Time · Deck-Building · Side-Scroller. UI-Chrome (HUD, Mana, Basen, Hand-Panel) ist fix — Einheiten, Combo-VFX und Handkarten sind Platzhalter.">
        <DCArtboard id="fight" label="A · Combat (UI-Chrome)" width={1920} height={1080}>
          <Combat/>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
