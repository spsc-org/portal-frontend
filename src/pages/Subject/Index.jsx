import { useViewModel } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import { SubjectViewModel } from "./viewmodel/SubjectViewModel.js";
import SubjectView from "./view/SubjectView.jsx";

/** Маршрут /subject (pageAccess). Словник subjectTypes — /api/spa/pages/subject/options. */
export default function SubjectPage() {
    const vm = useViewModel((deps) => new SubjectViewModel(deps));
    usePageTitle("Суб'єкти");
    return <SubjectView vm={vm} />;
}
