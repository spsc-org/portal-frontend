import { useSearchParams } from "react-router";
import { useViewModel, ViewModelProvider } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import { AuditViewModel } from "./viewmodel/AuditViewModel.js";
import AuditView from "./view/AuditView.jsx";

/** Маршрут /audit (pageAccess). */
export default function AuditPage() {
    const [searchParams] = useSearchParams();
    const vm = useViewModel((deps) => new AuditViewModel({ ...deps, initialTab: searchParams.get("tab") }));
    usePageTitle("Аудит");

    return (
        <ViewModelProvider value={vm}>
            <AuditView />
        </ViewModelProvider>
    );
}
