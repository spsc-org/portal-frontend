import { useParams } from "react-router";
import { useViewModel } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import { ValidationViewModel } from "./viewmodel/ReportViewModels.js";
import ValidationView from "./view/ValidationView.jsx";

function ValidationContent({ report }) {
    const vm = useViewModel((deps) => new ValidationViewModel({ ...deps, report }));
    usePageTitle("Валідація");
    return <ValidationView vm={vm} />;
}

/** Маршрут /report/validation/:report (раніше Inertia prop `report`). */
export default function ValidationPage() {
    const { report } = useParams();
    return <ValidationContent key={report} report={report} />;
}
