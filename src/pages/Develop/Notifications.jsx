import { useViewModel } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";

const DEVELOP_CRUMBS = [{ label: "Розробка", href: "/developer-posts" }, { label: "Дебаг", href: "/developer-debug" }];
import { NotificationToolsViewModel } from "./viewmodel/NotificationToolsViewModel.js";
import NotificationToolsView from "./view/NotificationToolsView.jsx";

/** Маршрут /develop/notifications (auth). Користувачі — /api/spa/pages/develop-notifications/options. */
export default function NotificationToolsPage() {
    const vm = useViewModel((deps) => new NotificationToolsViewModel(deps));
    usePageTitle("Тестові нотифікації", { breadcrumbs: DEVELOP_CRUMBS });
    return <NotificationToolsView vm={vm} />;
}
