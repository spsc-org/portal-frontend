import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import { ExportViewModel } from "./viewmodel/IntegrationsViewModels.js";
import IntegrationsLayout from "./view/IntegrationsLayout.jsx";
import ExportSection from "./view/ExportSection.jsx";

const ExportView = observer(({ vm }) => (
    <IntegrationsLayout data-i-doc="page:integrations-export" canRead={vm.canRead}>
        <ExportSection vm={vm}/>
    </IntegrationsLayout>
));

/** Маршрут /integrations-export (pageAccess). */
export default function ExportPage() {
    const vm = useViewModel((deps) => new ExportViewModel(deps));
    usePageTitle("Експорт");
    return <ExportView vm={vm} />;
}
