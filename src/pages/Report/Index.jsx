import { useViewModel } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import { ReportIndexViewModel } from "./viewmodel/ReportViewModels.js";
import ReportIndexView from "./view/ReportIndexView.jsx";

/** Маршрут /report (pageAccess + Gate report.read). */
export default function IndexPage() {
    const vm = useViewModel((deps) => new ReportIndexViewModel(deps));
    usePageTitle("Звіти та аналітика");
    return <ReportIndexView vm={vm} />;
}
