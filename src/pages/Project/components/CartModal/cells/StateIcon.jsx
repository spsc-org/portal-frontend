
// Порт TableManager.js:#renderCellState() — легасі шукає в
// myApp.globals.voc.state (плаский масив) через .find(); тут той самий
// пошук, лише масив приходить пропом (useProjectOptionsQuery(["state"])),
// без залежності від легасі глобального стану.
const StateIcon = ({ stateId, states }) => {
    const row = states.find((s) => s.id === stateId);
    if (!row?.icon) return null;
    return <i className={`${row.icon} ${row.style ?? ""}`} title={row.caption ?? ""} />;
};

export default StateIcon;
