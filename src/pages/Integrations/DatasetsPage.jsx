import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import { DatasetsViewModel } from "./viewmodel/IntegrationsViewModels.js";
import IntegrationsLayout from "./view/IntegrationsLayout.jsx";
import DatasetTable from "./view/DatasetTable.jsx";
import ImportLogTable from "./view/ImportLogTable.jsx";
import ImportDataDialog from "./view/ImportDataDialog.jsx";

const DatasetsView = observer(({ vm }) => (
    <IntegrationsLayout data-i-doc="page:integrations-datasets" canRead={vm.canRead}>
        <DatasetTable vm={vm} onImportClick={vm.openImport}/>
        <div className="mt-6">
            <ImportLogTable list={vm.logs}/>
        </div>
        {vm.importDataset && (
            <ImportDataDialog key={vm.importDataset.id} open onClose={vm.closeImport} dataset={vm.importDataset} page={vm}/>
        )}
    </IntegrationsLayout>
));

/** Маршрут /integrations-datasets (pageAccess). */
export default function DatasetsPage() {
    const vm = useViewModel((deps) => new DatasetsViewModel(deps));
    usePageTitle("Датасети");
    return <DatasetsView vm={vm} />;
}
