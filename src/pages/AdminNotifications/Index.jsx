import { observer } from "mobx-react-lite";
import toast from "react-hot-toast";
import { apiFetch } from "../../lib/api.js";
import { makeViewModel, useViewModel } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import AdminLayout from "../Admin/shared/ui/AdminLayout.jsx";
import NotificationCategoryTable from "../../components/NotificationCategoryTable.jsx";

// ---- Model ---------------------------------------------------------------

const fetchNotificationCategories = () =>
    apiFetch("/api/admin-notifications/categories").then((payload) => payload?.data?.categories ?? []);

// ---- ViewModel -----------------------------------------------------------

/**
 * Глобальна (не per-user) матриця "категорія → канали" — лише перегляд
 * системного дефолту (InAppNotificationCategory::channelDefaults()).
 */
class AdminNotificationsViewModel {
    constructor({ scope }) {
        this.scope = scope;
        makeViewModel(this);

        this.categoriesQuery = scope.query({
            queryKey: ["admin-notifications", "categories"],
            queryFn: fetchNotificationCategories,
            onError: (error) => toast.error(error?.payload?.message ?? "Не вдалося завантажити категорії нотифікацій"),
        });
    }

    get categories() {
        return this.categoriesQuery.data ?? [];
    }

    get isLoading() {
        return this.categoriesQuery.isLoading;
    }
}

// ---- View ----------------------------------------------------------------

const AdminNotificationsView = observer(({ vm }) => (
    <AdminLayout data-i-doc="page:admin-notifications" active="notifications">
        <div className="mx-2 mt-5 max-w-2xl">
            <div className="mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Категорії нотифікацій
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Глобальний перелік категорій і каналів, якими система їх підтримує —
                    лише перегляд. Персональні переваги користувачів — на сторінці
                    «Налаштування» кожного користувача.
                </p>
            </div>
            {vm.isLoading ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">Завантаження…</p>
            ) : (
                <NotificationCategoryTable categories={vm.categories} readOnly />
            )}
        </div>
    </AdminLayout>
));

/** Маршрут /admin-notifications. Сторінка мала — M/VM/V в одному модулі. */
export default function AdminNotificationsPage() {
    const vm = useViewModel((deps) => new AdminNotificationsViewModel(deps));
    usePageTitle("Нотифікації", { documentTitle: "Нотифікації — адміністрування" });

    return <AdminNotificationsView vm={vm} />;
}
