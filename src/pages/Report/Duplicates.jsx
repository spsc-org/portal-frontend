import { useViewModel } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import { DuplicatesViewModel } from "./viewmodel/ReportViewModels.js";
import DuplicatesView from "./view/DuplicatesView.jsx";

/** Маршрут /report/duplicates. */
export default function DuplicatesPage() {
    const vm = useViewModel((deps) => new DuplicatesViewModel(deps));
    usePageTitle("Дублікати в Рупорах");
    return <DuplicatesView vm={vm} />;
}
