import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import { VesselImoViewModel } from "./viewmodel/IntegrationsViewModels.js";
import IntegrationsLayout from "./view/IntegrationsLayout.jsx";
import VesselImoTable from "./view/VesselImo/VesselImoTable.jsx";
import VesselImoDetailsTable from "./view/VesselImo/VesselImoDetailsTable.jsx";
import VesselImoLogTable from "./view/VesselImo/VesselImoLogTable.jsx";
import VesselImoImportDialog from "./view/VesselImo/VesselImoImportDialog.jsx";
import VesselImoDetailsImportDialog from "./view/VesselImo/VesselImoDetailsImportDialog.jsx";

const VesselImoView = observer(({ vm }) => (
    <IntegrationsLayout data-i-doc="page:integrations-vessel-imo" active="vessel-imo" canRead={vm.canRead}>
        <VesselImoTable lists={vm.lists} onImportClick={vm.openListsImport}/>
        <VesselImoDetailsTable list={vm.details} onImportClick={vm.openDetailsImport}/>
        <VesselImoLogTable list={vm.logs}/>
        {vm.listsImportOpen && <VesselImoImportDialog open onClose={vm.closeListsImport} onImportSuccess={vm.closeListsImport}/>}
        {vm.detailsImportOpen && <VesselImoDetailsImportDialog open onClose={vm.closeDetailsImport} onImportSuccess={vm.closeDetailsImport}/>}
    </IntegrationsLayout>
));

/** Маршрут /integrations-vessel-imo (pageAccess). */
export default function VesselImoPage() {
    const vm = useViewModel((deps) => new VesselImoViewModel(deps));
    usePageTitle("Судна під санкціями (IMO)");
    return <VesselImoView vm={vm} />;
}
