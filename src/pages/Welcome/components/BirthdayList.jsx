import React from 'react';
import {formatDob} from "../util.js";

const BirthdayList = ({users = [], emptyText}) => {
    if (!users.length) {
        return <p className="text-[11px] text-slate-500 dark:text-slate-400">{emptyText}</p>;
    }

    return (
        <ul className="p-0 m-0 list-none">
            {users.map((user) => (
                <li key={user.id} className="p-0 m-0">
                    <div className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <p className="truncate text-[11px] font-medium text-slate-800 dark:text-slate-200">{user.name}</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                            {formatDob(user.dob)}
                        </span>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default BirthdayList;
