 const StatCard = ({icon, label, value, href}) => (
    <a
        href={href}
        className="rounded-xl border border-slate-300 bg-white p-4 shadow-md shadow-slate-200/70 ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-black/20 dark:ring-0 dark:hover:border-blue-600"
    >
        <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
            <i className={`${icon} text-blue-600 dark:text-blue-400`}></i>
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </a>
);


export default StatCard;
