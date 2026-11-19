import {Navigate, Outlet, useLocation} from "react-router";
import Page from "../../components/Page.jsx";
import {useMe} from "../../hooks/useMe.js";
import {DictionaryProvider} from "./DictionaryContext.jsx";

// Порядок = порядок підменю "Словники" в config/sidebar.php на бекенді.
// Використовується лише як фолбек, коли /api/me ще не віддав menu.catalog.
const FALLBACK_SUBMENU = [
    {href: "/dictionary/identify", disabled: true},
    {href: "/dictionary/identify-v2", disabled: false},
    {href: "/dictionary/subgroup", disabled: false},
    {href: "/dictionary/attributes", disabled: false},
];

const normalize = (path) => path.replace(/\/+$/, "") || "/";

function useDictionarySubmenu() {
    const {data: me} = useMe();
    return me?.menu?.catalog?.dictionary?.submenu ?? FALLBACK_SUBMENU;
}

/**
 * Спільна оболонка для /dictionary/* — кожен підрозділ словника тепер окрема
 * сторінка зі своїм URL (замість табів). Вимкнені пункти підменю
 * (`disabled` у config/sidebar.php) недоступні і за прямим URL — так само, як
 * PagesController::dictionaryReact() віддавав 404.
 */
export default function DictionaryLayout() {
    const {pathname} = useLocation();
    const submenu = useDictionarySubmenu();
    const current = submenu.find((item) => normalize(item.href) === normalize(pathname));

    if (current?.disabled) {
        return <Navigate to="/dictionary" replace/>;
    }

    return (
        <DictionaryProvider>
            <Page>
                <Outlet/>
            </Page>
        </DictionaryProvider>
    );
}

/** /dictionary → перша НЕ вимкнена підсторінка словника. */
export function DictionaryIndexRedirect() {
    const submenu = useDictionarySubmenu();
    const first = submenu.find((item) => !item.disabled) ?? FALLBACK_SUBMENU[1];
    return <Navigate to={first.href} replace/>;
}

/** Заголовок-картка сторінки словника (на місці колишнього рядка табів). */
export function DictionaryPageShell({title, children}) {
    return (
        <>
            <div
                data-i-doc="page:dictionary"
                className="mb-5 rounded-lg bg-white px-4 py-3 text-left shadow-lg dark:bg-slate-800"
            >
                <h1 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{title}</h1>
            </div>
            <div className="bg-white p-1 dark:bg-slate-800">{children}</div>
        </>
    );
}
