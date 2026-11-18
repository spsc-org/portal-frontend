import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { AssignmentFormViewModel } from "../viewmodel/ResponsibleViewModels.js";
import { Spinner, Tooltip } from "@material-tailwind/react"
import IconButton from "../../../components/Buttons/IconButton.jsx"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import {format} from "date-fns";
import {uk} from "date-fns/locale";
import UserAvatars from "../../../components/UserAvatars.jsx";
import ChipToggle from "../../../components/fields/ChipToggle.jsx";
import ChipResetButton from "../../../components/fields/ChipResetButton.jsx";
import SingleSelect from "../../../components/fields/SingleSelect.jsx";
import MultiSelect from "../../../components/fields/MultiSelect.jsx";
import DatePicker from "../../../components/fields/DatePicker.jsx";
import {LabeledInput} from "../../../components/fields/LabeledField.jsx";
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import {canManageResponsibleAssignment} from "../shared/lib/responsiblePermissions.js";
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TH, TR } from "../../../components/Table/tableStyles.js";


// Один модал на створення І редагування — призначення це акт (функція +
// підстава + дата початку/кінця), що стосується ОДРАЗУ ГРУПИ людей (напр.
// один наказ призначає кількох відповідальних), тому вибір людей — завжди
// мультивибір, і в редагуванні так само (склад групи можна змінювати).
// Монтується лише відкритою — стан форми живе рівно стільки, скільки модалка.
const AssignmentModalInner = observer(({open, onClose, assignment = null, functionOptions, userOptions, defaultFunctionId}) => {
    const vm = useViewModel((deps) => new AssignmentFormViewModel({ ...deps, assignment, functionOptions, defaultFunctionId }));
    const isEditing = vm.isEditing;
    const { func, selectedUsers, reason, startedAt, endedAt, isPending } = vm;
    const { setFunc, setSelectedUsers, setReason, setStartedAt, setEndedAt } = vm;
    const handleSave = () => vm.save(onClose);

    return (
        <Modal data-i-doc="modal:staff-responsible-assignment" open={open} handler={onClose} size="sm">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">{isEditing ? "Редагувати призначення" : "Нове призначення"}</h3>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-3">
                <SingleSelect id="assignment-function" label="Функція" options={functionOptions} value={func} onChange={setFunc}/>
                <MultiSelect id="assignment-users" label="Користувачі" options={userOptions} value={selectedUsers} onChange={setSelectedUsers}/>
                <LabeledInput label="Підстава (необов'язково)" value={reason} onChange={(e) => setReason(e.target.value)}
                              placeholder="Напр. Наказ №12 від 01.08.2026"/>
                <DatePicker label="Дата початку" value={startedAt} onChange={setStartedAt}/>
                {isEditing &&
                    <DatePicker label="Дата закінчення (необов'язково)" value={endedAt} onChange={setEndedAt}/>
                }
            </ModalBody>
            <ModalFooter className="gap-2">
                <LoadingButton variant="outlined" color="blue-gray" onClick={onClose} disabled={isPending}>
                    Скасувати
                </LoadingButton>
                <LoadingButton color="blue" onClick={handleSave} isLoading={isPending}
                                disabled={!func || selectedUsers.length === 0 || !startedAt}>
                    Зберегти
                </LoadingButton>
            </ModalFooter>
        </Modal>
    );
});

const AssignmentModal = (props) => (props.open ? <AssignmentModalInner {...props}/> : null);

// "Призначення" — плаский список УСІХ призначень (активні й скасовані —
// скасоване лишається видимим в історії, не зникає), один рядок = один акт
// (функція + група людей + підстава + дата). Фільтр за функцією тут НЕ
// потрібен окремим чипом — в один момент дивимось одну функцію через клік у
// ТАБ "Функції" (selectedFunctionId); лишається лише перемикач "лише діючі".
/** vm — ResponsibleAssignmentsViewModel; auth — для рядкових прав (canManageResponsibleAssignment). */
const ResponsibleAssignmentsTable = ({vm, auth}) => {
    const { onlyActive, isCreateOpen, editingAssignment, filtered, functionOptions, canCreate, assignableUserOptions } = vm;
    const { setOnlyActive, setIsCreateOpen, setEditingAssignment } = vm;
    const isLoading = vm.query.isLoading;
    const endMutation = vm.cmd.endAssignment;
    const selectedFunctionId = vm.registry.selectedFunctionId;
    const hasActive = onlyActive;

    return (
        <div data-i-doc="widget:staff-responsible-assignments">
            <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800">
                <ChipToggle active={onlyActive} onClick={() => setOnlyActive((prev) => !prev)}
                            icon="fa-regular fa-circle-check" label="Лише діючі"/>
                <ChipResetButton onClick={() => setOnlyActive(false)} hasActive={hasActive} label="Скинути"/>

                {canCreate &&
                    <button type="button" onClick={() => setIsCreateOpen(true)}
                            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700">
                        <i className="fa-solid fa-plus"></i>
                        Нове призначення
                    </button>
                }
            </div>

            <div className={twMerge(TABLE_WRAP, "max-w-full")}>
                <table className={twMerge(TABLE, "w-full table-auto text-left")}>
                    <thead>
                        <tr>
                            <th className={TH}>Функція</th>
                            <th className={TH}>Користувачі</th>
                            <th className={TH}>Підстава</th>
                            <th className={TH}>З дати</th>
                            <th className={TH}>До дати</th>
                            <th className={TH}>Статус</th>
                            <th className={TH}>Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!isLoading && filtered.length === 0 &&
                            <tr className={TR}>
                                <td colSpan={7} className={twMerge(TD, "text-center")}>
                                    {selectedFunctionId != null ? "У цієї функції ще немає призначень" : "Нічого не знайдено"}
                                </td>
                            </tr>
                        }
                        {filtered.map((row) => {
                            const canManage = canManageResponsibleAssignment(auth, row);
                            const isEnded = Boolean(row.ended_at);
                            return (
                                <tr key={row.id}
                                    className={twMerge(TR, `${isEnded ? "opacity-60" : ""} bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700`)}>
                                    <td className={twMerge(TD, "font-semibold")}>{row.function?.name || "—"}</td>
                                    <td className={TD}>
                                        <UserAvatars users={row.users || []}/>
                                    </td>
                                    <td className={TD}>{row.reason || "—"}</td>
                                    <td className={twMerge(TD, "whitespace-nowrap")}>
                                        {row.started_at ? format(new Date(row.started_at), "d MMM yyyy", {locale: uk}) : "—"}
                                    </td>
                                    <td className={twMerge(TD, "whitespace-nowrap")}>
                                        {isEnded ? format(new Date(row.ended_at), "d MMM yyyy", {locale: uk}) : "—"}
                                    </td>
                                    <td className={twMerge(TD, "whitespace-nowrap")}>
                                        {isEnded
                                            ? <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-neutral-600 dark:text-gray-300">
                                                Скасовано
                                            </span>
                                            : <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                                Діє
                                            </span>
                                        }
                                    </td>
                                    <td className={TD}>
                                        {canManage &&
                                            <div className="flex items-center gap-1">
                                                <Tooltip content="Редагувати">
                                                    <IconButton size="sm" variant="text" onClick={() => setEditingAssignment(row)}>
                                                        <i className="fa-regular fa-pen text-gray-600"></i>
                                                    </IconButton>
                                                </Tooltip>
                                                {!isEnded &&
                                                    <Tooltip content="Скасування">
                                                        <IconButton size="sm" variant="text" disabled={endMutation.isPending}
                                                                    onClick={() => endMutation.mutate({assignmentId: row.id})}>
                                                            {endMutation.isPending
                                                                ? <Spinner className="h-3.5 w-3.5"/>
                                                                : <i className="fa-regular fa-user-xmark text-red-500"></i>
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                }
                                            </div>
                                        }
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <AssignmentModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                functionOptions={functionOptions}
                userOptions={assignableUserOptions}
                defaultFunctionId={selectedFunctionId}
            />

            <AssignmentModal
                open={Boolean(editingAssignment)}
                onClose={() => setEditingAssignment(null)}
                assignment={editingAssignment}
                functionOptions={functionOptions}
                userOptions={assignableUserOptions}
            />
        </div>
    );
};

export default observer(ResponsibleAssignmentsTable);
