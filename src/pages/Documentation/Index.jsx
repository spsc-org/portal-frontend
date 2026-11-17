import { useParams } from "react-router";
import { useViewModel } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import { DocumentationViewModel } from "./viewmodel/DocumentationViewModel.js";
import CategoryPage from "./pages/documentation/CategoryPage.jsx";

function DocumentationContent({ category }) {
    const vm = useViewModel((deps) => new DocumentationViewModel({ ...deps, category }));
    usePageTitle(category || "Документація", {
        breadcrumbs: category ? [{ label: "Документація", href: "/documentation" }] : null,
        documentTitle: category ? `Документація: ${category}` : "Документація",
    });
    return <CategoryPage vm={vm} />;
}

/** Маршрути /documentation і /documentation/:category (auth). */
export default function DocumentationPage() {
    const { category } = useParams();
    return <DocumentationContent key={category ?? ""} category={category} />;
}
