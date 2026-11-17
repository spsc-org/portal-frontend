import { useViewModel } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";

// Інструменти — підсторінки "Дебаг" (раніше — посилання "Назад до інструментів")
const DEVELOP_CRUMBS = [{ label: "Розробка", href: "/developer-posts" }, { label: "Дебаг", href: "/developer-debug" }];
import { DossierToolsViewModel } from "./viewmodel/DossierToolsViewModel.js";
import DossierToolsView from "./view/DossierToolsView.jsx";

/** Маршрут /develop/dossier (auth). Команди — POST на web-маршрути /develop/dossier/* (через proxy). */
export default function DossierToolsPage() {
    const vm = useViewModel((deps) => new DossierToolsViewModel(deps));
    usePageTitle("Досьє — інструменти дедуплікації", { breadcrumbs: DEVELOP_CRUMBS });
    return <DossierToolsView vm={vm} />;
}
