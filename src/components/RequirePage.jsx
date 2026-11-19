import {Outlet} from "react-router";
import {useMe} from "../hooks/useMe.js";

/**
 * Layout-guard роуту за ключем сторінки з `/api/me` → `access.pages`
 * (AccessiblePagesResolver на бекенді: ключ є, якщо в User.permissions.pages
 * є хоч одне право на цю сторінку). Дзеркалить Gate/pageAccess веб-маршрутів:
 * без доступу — повідомлення замість сторінки, тож сторінка не шле запити,
 * на які API однаково відповість 403.
 *
 * Використання в router.jsx: `{ element: <RequirePage page="mass-search" />, children: [...] }`.
 */
export default function RequirePage({page}) {
    const {data: me, loading} = useMe();

    if (loading) return null;

    if (!me?.access?.pages?.includes(page)) {
        return (
            <section
                data-i-doc="component:no-access"
                className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
            >
                <i className="fa-solid fa-lock mb-3 text-3xl text-slate-300 dark:text-slate-600"></i>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Немає доступу</h2>
                <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    У вас немає прав на перегляд цієї сторінки. Зверніться до адміністратора.
                </p>
            </section>
        );
    }

    return <Outlet/>;
}
