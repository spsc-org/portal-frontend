import { Link } from "react-router";

const StatCard = ({icon, label, value, href}) => (
    <Link
        to={href}
        className="rounded-xl border border-gray-200 bg-white p-4 no-underline transition-colors hover:border-blue-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-blue-500"
    >
        <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
            <i className={`${icon} text-blue-600 dark:text-blue-400`} aria-hidden="true"></i>
        </div>
        <p className="m-0 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </Link>
);

export default StatCard;
