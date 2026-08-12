import {formatDate} from "date-fns";

const ListSection = ({title, items = [], links = [], emptyText, renderMeta}) => (
    <section className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
            <div className="flex flex-wrap gap-2">
                {links.map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-600 dark:hover:bg-slate-700"
                    >
                        {link.label}
                    </a>
                ))}
            </div>
        </div>
        {items.length ? (
            <ul className="space-y-2">
                {items.map((item) => (
                    <li key={`${title}-${item.id}`}>
                        <a
                            href={item.url || "#"}
                            className="flex items-start justify-between gap-3 rounded-md px-2 py-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                                {item.meta ? <p className="text-xs text-slate-500 dark:text-slate-400">{item.meta}</p> : null}
                            </div>
                            <div className="shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
                                {/*<p>{formatDate(item.createdAt)}</p>*/}
                                {renderMeta ? renderMeta(item) : null}
                            </div>
                        </a>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
        )}
    </section>
);


export default ListSection;
