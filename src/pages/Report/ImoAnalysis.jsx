import { useViewModel } from "../../shared/mvvm/index.js";
import { ImoAnalysisViewModel } from "./viewmodel/ReportViewModels.js";
import ImoAnalysisView from "./view/ImoAnalysisView.jsx";

/** Маршрут /report/imo-analysis. */
export default function ImoAnalysisPage() {
    const vm = useViewModel((deps) => new ImoAnalysisViewModel(deps));
    return <ImoAnalysisView vm={vm} />;
}
