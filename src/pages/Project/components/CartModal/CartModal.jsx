import { observer } from "mobx-react-lite";
import { useVM } from "../../../../shared/mvvm/index.js";
import SelectedProjectsTab from "./SelectedProjectsTab.jsx";
import BulkActionsTab from "./BulkActionsTab.jsx";
import BulkActionsLogTab from "./BulkActionsLogTab.jsx";

const TABS = [
    { id: "tab-1", title: "Список відібраних проєктів" },
    { id: "tab-2", title: "Масові дії" },
    { id: "tab-3", title: "Журнал масових дій" },
];

// Кошик /project (порт modal-cart.blade.php + cartManager.js). Стан — CartModalViewModel (useVM().cartModal):
// набір id — localStorage["cartItems"], запити активні лише поки модалка відкрита.
const CartModal = () => {
    const vm = useVM().cartModal;
    if (!vm.isOpen) return null;
    const { activeTab, setActiveTab, userId } = vm;
    const cart = { ids: vm.ids, remove: vm.remove, clear: vm.clear };
    const onClose = vm.close;
    const handleActionDone = vm.done;

    return (
        <div data-i-doc="modal:project-cart-modal"
            className="fixed inset-0 z-[1055] flex items-start justify-center overflow-y-auto bg-gray-500 bg-opacity-50 pt-8 dark:bg-neutral-900 dark:bg-opacity-70"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="m-3 flex w-full max-w-7xl flex-col rounded-xl border border-gray-200 bg-white pointer-events-auto shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-neutral-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">
                        <i className="fa-solid fa-cart-shopping mr-2 text-blue-500" />Відібрані проєкти
                    </h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                        <i className="fas fa-xmark text-lg" />
                    </button>
                </div>

                <div className="px-4 pt-4">
                    <nav className="flex gap-2">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`rounded-t-lg border-2 border-b-0 px-5 py-2.5 text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? "border-blue-500 bg-white text-blue-600 dark:border-blue-500 dark:bg-neutral-800 dark:text-blue-400"
                                        : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-400 dark:hover:bg-neutral-600"
                                }`}
                            >
                                {tab.title}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mx-4 mb-4 overflow-hidden rounded-b-xl rounded-tr-xl border-2 border-blue-500 dark:border-blue-600">
                    {activeTab === "tab-1" &&
                        <div data-i-doc="tab:project-cart-selected-projects">
                            <SelectedProjectsTab cart={cart} />
                        </div>
                    }
                    {activeTab === "tab-2" && (
                        <div data-i-doc="tab:project-cart-bulk-actions">
                            <BulkActionsTab projectIds={cart.ids} userId={userId} onActionDone={handleActionDone} cart={cart} />
                        </div>
                    )}
                    {activeTab === "tab-3" &&
                        <div data-i-doc="tab:project-cart-bulk-actions-log">
                            <BulkActionsLogTab />
                        </div>
                    }
                </div>
            </div>
        </div>
    );
};

export default observer(CartModal);
