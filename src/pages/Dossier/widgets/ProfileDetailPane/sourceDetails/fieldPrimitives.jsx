/* eslint-disable react-refresh/only-export-components -- примітиви полів деталей джерела (компоненти + хелпери форматування) */

const labelClasses = "font-medium text-xs mb-1 text-gray-500 dark:text-gray-400";
const valueBoxClasses = "p-2 bg-gray-50 dark:bg-gray-800 rounded text-gray-800 dark:text-gray-100 text-sm";

// Спільні примітиви для шаблонів подання джерела-звʼязку (по одному шаблону на
// кожну таблицю-джерело — див. sourceDetails/*, зареєстровані в shared/config/sourceTypes.js).
export const Field = ({label, value}) => (
    <div>
        <div className={labelClasses}>{label}</div>
        <div className={valueBoxClasses}>{value ?? "—"}</div>
    </div>
);

export const ListField = ({label, items, renderItem}) => (
    <div>
        <div className={labelClasses}>{label}</div>
        {Array.isArray(items) && items.length > 0 ? (
            <ul className="list-none text-sm text-gray-800 dark:text-gray-100">
                {items.map((item, index) => (
                    <li className="px-0" key={item.id ?? index}>{renderItem(item)}</li>
                ))}
            </ul>
        ) : (
            <div className={valueBoxClasses}>—</div>
        )}
    </div>
);

export const LinkValue = ({href, label = "Відкрити"}) =>
    href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
            {label}
        </a>
    ) : null;

export const splitAliases = (aliases) =>
    aliases ? aliases.split(";").map((item) => item.trim()).filter(Boolean) : [];
