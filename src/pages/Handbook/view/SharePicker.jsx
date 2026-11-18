import { observer } from "mobx-react-lite";
import MultiSelect from "../../../components/fields/MultiSelect.jsx";
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { SharePickerViewModel } from "../viewmodel/BirthdayViewModels.js";

/**
 * Розшарування ОСОБИСТОГО запису ГРУПАМ користувачів — видиме й активне
 * лише строгому власнику (canShareBirthdayEntry на рівні виклику). Лишився
 * лише для Днів народження — Телефони груповий шеринг прибрали повністю
 * (2026-08-03: немає більше особистих/спільних списків узагалі, PhoneEntryPolicy
 * не має аналога). Шеринг лише через групи (включно з віртуальною "Всім") —
 * без прямого вибору окремих користувачів (рішення сесії: не тицяти вручну
 * весь список).
 */
const SharePicker = ({ value = [], onChange, disabled = false }) => {
    const vm = useViewModel((deps) => new SharePickerViewModel({ ...deps, onAdd: (group) => onChange([...value, group]) }));
    const groups = vm.groups;
    const isLoading = vm.groupsQuery.isLoading;

    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
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

            {!disabled && vm.canManageGroups &&
                (vm.showCreate ? (
                    <div className="mt-2 flex flex-col gap-2 rounded-md border border-gray-200 p-2 dark:border-neutral-700">
                        <input
                            autoFocus
                            type="text"
                            value={vm.newGroupName}
                            onChange={(e) => vm.setNewGroupName(e.target.value)}
                            placeholder="Назва групи…"
                            className="w-full rounded-md border border-gray-200 bg-white p-1.5 text-xs text-gray-900 focus:border-blue-300 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100"
                        />
                        <MultiSelect
                            size="xs"
                            placeholder="Учасники…"
                            options={vm.users}
                            value={vm.newGroupMembers}
                            onChange={vm.setNewGroupMembers}
                        />
                        <div className="flex justify-end gap-1.5">
                            <button type="button" onClick={() => vm.setShowCreate(false)}
                                    className="rounded px-2 py-1 text-[11px] font-medium text-gray-600 transition hover:bg-gray-100 dark:hover:bg-neutral-700">
                                Скасувати
                            </button>
                            <LoadingButton size="sm" color="green" isLoading={vm.cmd.createGroup.isPending}
                                           disabled={!vm.newGroupName.trim()} onClick={vm.createGroup}>
                                Створити
                            </LoadingButton>
                        </div>
                    </div>
                ) : (
                    <button type="button" onClick={() => vm.setShowCreate(true)}
                            className="mt-1.5 text-[11px] font-medium text-blue-600 transition hover:underline dark:text-blue-400">
                        <i className="fa-regular fa-plus mr-1"></i>Створити групу
                    </button>
                ))
            }
        </div>
    );
};

export default observer(SharePicker);
