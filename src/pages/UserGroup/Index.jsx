import { useViewModel, ViewModelProvider } from "../../shared/mvvm/index.js";
import { UserGroupsViewModel } from "./viewmodel/UserGroupsViewModel.js";
import UserGroupsView from "./view/UserGroupsView.jsx";

/** Маршрут /admin-groups. */
export default function UserGroupsPage() {
    const vm = useViewModel((deps) => new UserGroupsViewModel(deps));

    return (
        <ViewModelProvider value={vm}>
            <UserGroupsView />
        </ViewModelProvider>
    );
}
