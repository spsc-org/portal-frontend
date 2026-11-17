import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { DocumentListViewModel } from "./viewmodel/DocumentListViewModel.js";
import DocumentView from "./view/DocumentView.jsx";

/** Маршрут /document (pageAccess). Словники — /api/spa/pages/document/options. */
function DocumentPage() {
    const vm = useViewModel((deps) => new DocumentListViewModel(deps));
    return <DocumentView vm={vm} />;
}

export default observer(DocumentPage);
