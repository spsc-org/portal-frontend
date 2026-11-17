import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { DecreeListViewModel } from "./viewmodel/DecreeViewModels.js";
import DecreeView from "./view/DecreeView.jsx";

/** Маршрут /decree (pageAccess). Props Inertia (users) сторінка не використовувала. */
function DecreePage() {
    const vm = useViewModel((deps) => new DecreeListViewModel(deps));
    return <DecreeView vm={vm} />;
}

export default observer(DecreePage);
