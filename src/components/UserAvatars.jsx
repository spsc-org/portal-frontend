import {Tooltip} from "@material-tailwind/react";

const AVATAR_COLORS = [
    "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
    "bg-violet-500", "bg-cyan-600", "bg-orange-500", "bg-teal-500",
];

const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/);
    const initials = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
    return initials || "?";
};

/**
 * Стек круглих аватарок (той самий вигляд, що й UserAvatars у ReactPages/Task/utils.jsx,
 * винесений сюди як спільний атомарний компонент): фото користувача, якщо завантажене,
 * інакше ініціали з детермінованим кольором від id.
 */
const UserAvatars = ({users = [], max = 6}) => {
    if (!users.length) return null;
    const visible = users.slice(0, max);
    const rest = users.length - visible.length;

    return (
        <div className="flex items-center -space-x-1.5">
            {visible.map(user => (
                <Tooltip key={user.id} content={user.name}>
                    {user.avatar ? (
                        <img src={`/files?path=${user.avatar}`} alt={user.name}
                             className="h-6 w-6 shrink-0 rounded-full border-2 border-white object-cover dark:border-gray-900"/>
                    ) : (
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white dark:border-gray-900 ${AVATAR_COLORS[user.id % AVATAR_COLORS.length]}`}>
                            {getInitials(user.name)}
                        </div>
                    )}
                </Tooltip>
            ))}
            {rest > 0 &&
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-400 text-[9px] font-bold text-white dark:border-gray-900 dark:bg-slate-600">
                    +{rest}
                </div>
            }
        </div>
    );
};

export default UserAvatars;
