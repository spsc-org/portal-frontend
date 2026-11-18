import { observer } from 'mobx-react-lite';
import PropTypes from 'prop-types';
import { Select, Option, Input, Textarea, Checkbox } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../../components/Modal/Modal.jsx"
import Button from "../../../../components/Buttons/Button.jsx"
import StatusToggle from '../StatusToggle.jsx';

// Українська плюралізація: 1 день, 2-4 дні, 5+ днів (11-14 — завжди днів)
const formatDaysLabel = (n) => {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs >= 11 && abs <= 14) return 'днів';
    if (last === 1) return 'день';
    if (last >= 2 && last <= 4) return 'дні';
    return 'днів';
};

/** vm — AttendanceViewModel (форма заявки живе у VM сторінки). */
const AddEditAbsenceModal = ({ vm }) => {
    const isOpen = vm.isCreateModalOpen;
    const onClose = vm.closeForm;
    const editingAbsence = vm.editingAbsence;
    const data = vm.form;
    const setData = vm.setData;
    const options = vm.options;
    const onOpenDelete = vm.openDeleteFromForm;
    const { isOpenEnded, setIsOpenEnded, dayCount } = vm;
    const submitMutation = vm.cmd.saveAbsence;

    const submitRequest = (e) => {
        e.preventDefault();
        vm.submitForm();
    };

    return (
        <Modal data-i-doc="modal:staff-attendance-add-edit-absence" open={isOpen} handler={onClose} size="lg">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">{editingAbsence ? "Редагування" : "Створити заявку"}</h3>
            </ModalHeader>
            <form onSubmit={submitRequest}>
                <ModalBody className="flex flex-col gap-4">
                    {/* Row 1: Користувач + Статус (2 cols) */}
                    <div className="grid grid-cols-2 gap-4 items-end">
                        <Select
                            label="Співробітник"
                            className="dark:border-gray-600 dark:text-gray-300"
                            labelProps={{ className: "dark:text-gray-400" }}
                            menuProps={{ className: "dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300" }}
                            onChange={(val) => setData('user_id', val)}
                            value={data.user_id}
                        >
                            {options.users.map(u => <Option key={u.id} value={String(u.id)}>{u.caption}</Option>)}
                        </Select>
                        <StatusToggle
                            value={data.status}
                            options={options.statuses}
                            onChange={(val) => setData('status', val)}
                        />
                    </div>

                    {/* Row 2: Тип (радіогрупа, зліва, високий блок) + решта дрібних полів у стовпчик справа */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-blue-gray-700 dark:text-blue-gray-200">Тип</label>
                            <div className="flex flex-wrap gap-2">
                                {options.absence_types.map(t => (
                                    <label
                                        key={t.value}
                                        className={`flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                            data.type === t.value
                                                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/25"
                                                : "border-blue-gray-100 hover:border-blue-gray-300 dark:border-neutral-700 dark:hover:border-neutral-500"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="absence_type"
                                            value={t.value}
                                            checked={data.type === t.value}
                                            onChange={() => setData('type', t.value)}
                                            className="sr-only"
                                        />
                                        <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: t.color }}/>
                                        {t.caption}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Input
                                type="number"
                                value={data.travel_days}
                                onChange={e => setData('travel_days', e.target.value)}
                                label="Днів на дорогу"
                                min="0"
                            />
                            <Input
                                type="date"
                                value={data.start_date}
                                onChange={e => setData('start_date', e.target.value)}
                                label="Початок"
                            />
                            <div className="flex flex-col gap-2">
                                <Checkbox
                                    label="Незавершено"
                                    checked={isOpenEnded}
                                    onChange={(e) => {
                                        setIsOpenEnded(e.target.checked);
                                        if (e.target.checked) {
                                            setData('end_date', '');
                                        }
                                    }}
                                />
                                {!isOpenEnded && (
                                    <Input
                                        type="date"
                                        value={data.end_date}
                                        onChange={e => setData('end_date', e.target.value)}
                                        label="Кінець"
                                    />
                                )}
                            </div>

                            {/* Лічильник днів за вибраним періодом — під Кінець, поруч із рештою дрібних полів */}
                            {dayCount !== null && (
                                dayCount > 0 ? (
                                    <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-900/25 dark:text-blue-200">
                                        <i className="fa-regular fa-calendar-days"></i>
                                        <span>Тривалість: <b>{dayCount}</b> {formatDaysLabel(dayCount)}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/25 dark:text-red-300">
                                        <i className="fa-solid fa-triangle-exclamation"></i>
                                        <span>Дата початку пізніше дати кінця</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Row 5: Примітка (full-width) */}
                    <Textarea
                        label="Примітка"
                        value={data.reason}
                        onChange={e => setData('reason', e.target.value)}
                    />
                </ModalBody>
                <ModalFooter className="justify-end gap-2">
                    <Button color="secondary" onClick={onClose} disabled={submitMutation.isPending}>Скасувати</Button>
                    {editingAbsence && (
                        <Button
                            variant="text"
                            color="red"
                            onClick={onOpenDelete}
                            disabled={submitMutation.isPending}>
                            Видалити
                        </Button>
                    )}
                    <Button type="submit" disabled={submitMutation.isPending}>
                        {submitMutation.isPending ? 'Зберігаю...' : 'Зберегти'}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
};

AddEditAbsenceModal.propTypes = {
    vm: PropTypes.object.isRequired,
};

export default observer(AddEditAbsenceModal);
