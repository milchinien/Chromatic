/* CHROMATIC — Card Designs canvas */

const CardApp = () => (
  <DesignCanvas>
    <DCSection
      id="finished"
      title="Fertige Karten · 5 × 5"
      subtitle="Die fertigen Karten 1:1 übernommen — alle 5 Farben × 5 Klassen (Krieger 15/8 · Festung 20/25 · Reittier 12/10 · Magier 10/6 · Heiler 8/12)."
    >
      <DCArtboard id="finished-grid" label="Fertige Karten · 25 Karten (1:1)" width={1100} height={1720}>
        <FinishedCards/>
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById("root")).render(<CardApp/>);
