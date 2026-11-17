import { observer } from "mobx-react-lite";
import { Link } from "react-router";
import toast from "react-hot-toast";
import { apiFetch } from "../../lib/api.js";
import { makeViewModel, useViewModel } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import DeveloperLayout from "../../components/Developer/DeveloperLayout.jsx";
import ConfirmModal from "../../components/Modal/ConfirmModal.jsx";

// ---- Model ---------------------------------------------------------------

const clearPhoneHandbook = () =>
    apiFetch("/api/developer-debug/phone/clear", { method: "POST" }).then((payload) => payload?.data ?? {});

// ---- ViewModel -----------------------------------------------------------

/** Інструменти розробника. Гейтиться лише developer-debug.read. */
class DeveloperDebugViewModel {
    confirmClearPhones = false;

    constructor({ scope, stores }) {
        this.scope = scope;
        this.stores = stores;
        makeViewModel(this);
        this.clearPhonesMutation = scope.mutation({ mutationFn: clearPhoneHandbook });
    }

    get canRead() {
        return Boolean(this.stores.session.scopeFor("developer-debug", "read"));
    }

    askClearPhones() {
        this.confirmClearPhones = true;
    }

    cancelClearPhones() {
        this.confirmClearPhones = false;
    }

    async clearPhones() {
        try {
            const { cleared_count: clearedCount } = await this.clearPhonesMutation.mutateAsync();
            toast.success(`Довідник телефонів очищено: видалено записів — ${clearedCount}`);
            this.confirmClearPhones = false;
        } catch {
            toast.error("Не вдалося очистити довідник телефонів");
        }
    }
}

// ---- View ----------------------------------------------------------------

const LINK_CLASS = "inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30";

const ToolCard = ({ title, description, children, last = false }) => (
    <div className={`${last ? "" : "mb-4 "}rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900`}>
        <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">{description}</p>
        {children}
    </div>
);

const NoAccess = () => (
    <DeveloperLayout active="debug">
        <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                <i className="fa-solid fa-lock mb-2 text-xl"></i>
                <p>Немає доступу до інструментів розробника.</p>
            </div>
        </div>
    </DeveloperLayout>
);

const DeveloperDebugView = observer(({ vm }) => {
    if (!vm.canRead) return <NoAccess/>;

    return (
        <DeveloperLayout data-i-doc="page:developer-debug" active="debug">
            <div className="mx-auto max-w-2xl p-6">
                <ToolCard
                    title="Досьє — інструменти дедуплікації"
                    description="Первинна генерація/оновлення досьє з ДРС, звʼязування проєктів, створення досьє для сиріт, перерахунок стану підсанкційності — той самий розділ, що раніше жив лише під /develop."
                >
                    <Link to="/develop/dossier" className={LINK_CLASS}>
                        <i className="fa-regular fa-arrow-up-right-from-square mr-1.5"></i>Відкрити інструменти досьє
                    </Link>
                </ToolCard>
                <ToolCard
                    title="Нотифікації — тестові повідомлення"
                    description="Генерація тестової нотифікації обраному юзеру за типом (задача, досьє, тікет проєкту, інвентар, оголошення, системне) і перегляд поточного стану бейджів/дзвіника."
                >
                    <Link to="/develop/notifications" className={LINK_CLASS}>
                        <i className="fa-regular fa-arrow-up-right-from-square mr-1.5"></i>Відкрити тестові нотифікації
                    </Link>
                </ToolCard>
                <ToolCard
                    title="Telescope — моніторинг запитів"
                    description="Запити, SQL-запити, черги, винятки, кеш, пошта та інші події застосунку в реальному часі (Laravel Telescope)."
                >
                    {/* Сторінка бекенду (не SPA) — повне перезавантаження через proxy. */}
                    <a href="/telescope" className={LINK_CLASS}>
                        <i className="fa-regular fa-arrow-up-right-from-square mr-1.5"></i>Відкрити Telescope
                    </a>
                </ToolCard>
                <ToolCard
                    last
                    title="Довідник телефонів"
                    description="Незворотно видаляє УСІ записи довідника (включно з номерами, коментарями, обраним) — для очищення тестових даних."
                >
                    <button type="button" onClick={vm.askClearPhones}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30">
                        <i className="fa-regular fa-trash-can mr-1.5"></i>Очистити весь довідник
                    </button>
                </ToolCard>
            </div>

            <ConfirmModal
                open={vm.confirmClearPhones}
                onClose={vm.cancelClearPhones}
                onConfirm={vm.clearPhones}
                isLoading={vm.clearPhonesMutation.isPending}
                title="Очистити весь довідник телефонів?"
                message="Усі записи, номери, коментарі та обране буде видалено безповоротно. Цю дію неможливо скасувати."
            />
        </DeveloperLayout>
    );
});

/** Маршрут /developer-debug (auth). Мала сторінка — M/VM/V в одному модулі. */
export default function DeveloperDebugPage() {
    const vm = useViewModel((deps) => new DeveloperDebugViewModel(deps));
    usePageTitle("Інструменти розробника");
    return <DeveloperDebugView vm={vm} />;
}
