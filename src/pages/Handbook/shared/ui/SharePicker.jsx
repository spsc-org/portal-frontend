import React, {useState} from "react";
import {usePage} from "@inertiajs/react";
import MultiSelect from "../../../../Components/fields/MultiSelect.jsx";
import LoadingButton from "../../../../Components/Buttons/LoadingButton.jsx";
import {useCreateUserGroupMutation, useUserGroupOptionsQuery, useUserGroupsQuery} from "@/entities/userGroup/queries.js";
import {canManageGroups} from "../lib/permissions.js";

/**
 * Розшарування ОСОБИСТОГО запису ГРУПАМ користувачів — видиме й активне
 * лише строгому власнику (canShareBirthdayEntry на рівні виклику). Лишився
 * лише для Днів народження — Телефони груповий шеринг прибрали повністю
 * (2026-08-03: немає більше особистих/спільних списків узагалі, PhoneEntryPolicy
 * не має аналога). Шеринг лише через групи (включно з віртуальною "Всім") —
 * без прямого вибору окремих користувачів (рішення сесії: не тицяти вручну
 * весь список).
 */
const SharePicker = ({value = [], onChange, disabled = false}) => {
    const {auth} = usePage().props;
    const {data: groups = [], isLoading} = useUserGroupsQuery();
    const {data: optionsData} = useUserGroupOptionsQuery();
    const users = optionsData?.users || [];

    const [showCreate, setShowCreate] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupMembers, setNewGroupMembers] = useState([]);

    const createGroupMutation = useCreateUserGroupMutation();

    const handleCreate = () => {
        const name = newGroupName.trim();
        if (!name) return;
        createGroupMutation.mutate(
            {name, memberIds: newGroupMembers.map((u) => u.id)},
            {
                onSuccess: (group) => {
                    onChange([...value, group]);
                    setShowCreate(false);
                    setNewGroupName("");
                    setNewGroupMembers([]);
                },
            },
        );
    };

    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Розшарити з групами
            </label>
            <MultiSelect
                size="xs"
                placeholder="Оберіть групи…"
                options={groups}
                value={value}
                disabled={disabled || isLoading}
                onChange={(selected) => onChange(selected || [])}
                getOptionLabel={(g) => (g.is_virtual ? `${g.name} (усі користувачі)` : g.name)}
            />

            {!disabled && canManageGroups(auth) &&
                (showCreate ? (
                    <div className="mt-2 flex flex-col gap-2 rounded-md border border-slate-200 p-2 dark:border-slate-700">
                        <input
                            autoFocus
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Назва групи…"
                            className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-900 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <MultiSelect
                            size="xs"
                            placeholder="Учасники…"
                            options={users}
                            value={newGroupMembers}
                            onChange={(selected) => setNewGroupMembers(selected || [])}
                        />
                        <div className="flex justify-end gap-1.5">
                            <button type="button" onClick={() => setShowCreate(false)}
                                    className="rounded px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                                Скасувати
                            </button>
                            <LoadingButton size="sm" color="green" isLoading={createGroupMutation.isPending}
                                           disabled={!newGroupName.trim()} onClick={handleCreate}>
                                Створити
                            </LoadingButton>
                        </div>
                    </div>
                ) : (
                    <button type="button" onClick={() => setShowCreate(true)}
                            className="mt-1.5 text-[11px] font-medium text-blue-600 transition hover:underline dark:text-blue-400">
                        <i className="fa-regular fa-plus mr-1"></i>Створити групу
                    </button>
                ))
            }
        </div>
    );
};

export default SharePicker;
