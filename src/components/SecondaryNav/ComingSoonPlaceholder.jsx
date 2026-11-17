
// Заготовка вмісту для підсторінок, які ще не реалізовані — каркас простору
// (навігація, layout) вже готовий, наповнення прийде окремою задачею.
const ComingSoonPlaceholder = ({icon, title, description}) => (
    <section data-i-doc="component:secondary-nav-coming-soon" className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <i className={`${icon} mb-3 text-3xl text-slate-300 dark:text-slate-600`}></i>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </section>
);

export default ComingSoonPlaceholder;
