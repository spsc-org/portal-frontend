import { useViewModel } from "../../shared/mvvm/index.js";
import { AdminUsersViewModel } from "./viewmodel/AdminUsersViewModel.js";
import AdminUsersView from "./view/AdminUsersView.jsx";

/** Маршрут /admin-users (auth). Схема прав — /api/spa/pages/admin-users/options. */
export default function AdminUsersPage() {
    const vm = useViewModel((deps) => new AdminUsersViewModel(deps));
    return <AdminUsersView vm={vm} />;
}
