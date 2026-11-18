import { Link } from "react-router";

const StatCard = ({icon, label, value, href}) => (
    <Link
        to={href}
        className="rounded-xl border border-gray-300 bg-white p-4 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/60 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800/70 dark:shadow-black/20 dark:ring-0 dark:hover:border-blue-600"
    >
        <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
            <i className={`${icon} text-blue-600 dark:text-blue-400`}></i>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </Link>
);

export default StatCard;
