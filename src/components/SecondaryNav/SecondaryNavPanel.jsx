import {Link} from "react-router";

// Друге бокове меню розділу (не плутати з головним сайдбаром застосунку) —
// список посилань на підсторінки одного простору (напр. /staff/*, /handbook/*).
// `items`: [{key, label, icon (fa-клас), href}]. `active` — ключ поточної
// підсторінки, підсвічується без очікування ре-рендеру після навігації.
const SecondaryNavPanel = ({title, items = [], active}) => (
    <nav data-i-doc="component:secondary-nav-panel" className="w-56 shrink-0 space-y-1 rounded-2xl border border-gray-300 bg-white p-3 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/60 dark:border-neutral-700 dark:bg-neutral-800/70 dark:shadow-black/20 dark:ring-0">
        {Boolean(title) &&
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-500">
                {title}
            </p>
        }
        {items.map((item) => {
            const isActive = item.key === active;
            return (
                <Link
                    key={item.key}
                    to={item.href}
                    className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition ${
                        isActive
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-neutral-700 dark:hover:text-white"
                    }`}
                >
                    <i className={`${item.icon} w-4 text-center text-xs ${isActive ? "" : "text-gray-600 dark:text-gray-500"}`}></i>
                    {item.label}
                </Link>
            );
        })}
    </nav>
);

export default SecondaryNavPanel;
