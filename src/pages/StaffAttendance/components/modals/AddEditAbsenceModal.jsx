import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogHeader, DialogBody, DialogFooter, Button, Select, Option, Input, Textarea, Checkbox } from "@material-tailwind/react";
import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { usePage } from '@inertiajs/react';
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import CustomToast from "@/Components/CustomToast.jsx";
import { VALIDATION_MESSAGES } from '../../constants/attendanceConfig.js';
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

const AddEditAbsenceModal = ({
    isOpen,
    onClose,
    editingAbsence,
    data,
    setData,
    reset,
    options,
    onOpenDelete
}) => {
    const { token } = usePage().props;
    const queryClient = useQueryClient();
    const [isOpenEnded, setIsOpenEnded] = useState(!data.end_date);
    const [documents, setDocuments] = useState([]);

    // Кількість календарних днів включно з першим і останнім; null — коли рахувати нема з чого
    const dayCount = useMemo(() => {
        if (isOpenEnded || !data.start_date || !data.end_date) {
            return null;
        }
        const start = parseISO(data.start_date);
        const end = parseISO(data.end_date);
        if (!isValid(start) || !isValid(end)) {
            return null;
        }
        return differenceInCalendarDays(end, start) + 1;
    }, [data.start_date, data.end_date, isOpenEnded]);

    useEffect(() => {
        if (isOpen && editingAbsence?.id) {
            setDocuments(editingAbsence.documents || []);
            setIsOpenEnded(!editingAbsence.end_date);
        } else {
            setDocuments([]);
        }
        if (isOpen && !editingAbsence) {
            setData('status', 'approved');
            setData('type', 'remote');
            setIsOpenEnded(false);
        }
    }, [isOpen, editingAbsence]);

    const submitMutation = useMutation({
        mutationFn: async (payload) => {
            const url = editingAbsence ? `/staff/${editingAbsence.id}` : '/staff';
            const method = editingAbsence ? 'PATCH' : 'POST';
            const response = await axios({
                method,
                url,
                data: payload,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token,
                }
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success(editingAbsence ? 'Заявку успішно оновлено' : 'Заявку успішно створено');
        },
        onError: ({ response }) => {
            const message = response?.data?.message || 'Помилка при збереженні заявки';
            toast.custom((t) => <CustomToast t={t} title="Помилка збереження заявки" message={message}/>);
        },
        onSettled: (data, error) => {
            if (!error) {
                onClose();
                reset();
                queryClient.invalidateQueries({ queryKey: ['staff-calendar'] });
            }
        },
    });

    const submitRequest = (e) => {
        e.preventDefault();

        if (!data.user_id) {
            toast.custom((t) => <CustomToast t={t} title="Помилка" message={VALIDATION_MESSAGES.SELECT_EMPLOYEE} />);
            return;
        }

        if (!data.type) {
            toast.custom((t) => <CustomToast t={t} title="Помилка" message={VALIDATION_MESSAGES.SELECT_TYPE} />);
            return;
        }

        if (!data.start_date) {
            toast.custom((t) => <CustomToast t={t} title="Помилка" message={VALIDATION_MESSAGES.SPECIFY_START_DATE} />);
            return;
        }

        if (!isOpenEnded && !data.end_date) {
            toast.custom((t) => <CustomToast t={t} title="Помилка" message={VALIDATION_MESSAGES.SPECIFY_END_DATE} />);
            return;
        }

        if (!isOpenEnded && new Date(data.start_date) > new Date(data.end_date)) {
            toast.custom((t) => <CustomToast t={t} title="Помилка" message={VALIDATION_MESSAGES.INVALID_DATE_RANGE} />);
            return;
        }

        const payload = {
            ...data,
            user_id: parseInt(data.user_id, 10),
            end_date: isOpenEnded ? null : data.end_date,
            travel_days: parseInt(data.travel_days, 10) || 0
        };
        submitMutation.mutate(payload);
    };

    return (
        <Dialog data-i-doc="modal:staff-attendance-add-edit-absence" open={isOpen} handler={onClose} size="lg">
            <DialogHeader>{editingAbsence ? "Редагування" : "Створити заявку"}</DialogHeader>
            <form onSubmit={submitRequest}>
                <DialogBody className="flex flex-col gap-4">
                    {/* Row 1: Користувач + Статус (2 cols) */}
                    <div className="grid grid-cols-2 gap-4 items-end">
                        <Select
                            label="Співробітник"
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
                                                : "border-blue-gray-100 hover:border-blue-gray-300 dark:border-slate-700 dark:hover:border-slate-500"
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
                </DialogBody>
                <DialogFooter className="justify-end gap-2">
                    <Button variant="text" color="blue-gray" onClick={onClose} disabled={submitMutation.isPending}>Скасувати</Button>
                    {editingAbsence && (
                        <Button
                            variant="text"
                            color="red"
                            onClick={onOpenDelete}
                            disabled={submitMutation.isPending}
                        >
                            Видалити
                        </Button>
                    )}
                    <Button type="submit" disabled={submitMutation.isPending}>
                        {submitMutation.isPending ? 'Зберігаю...' : 'Зберегти'}
                    </Button>
                </DialogFooter>
            </form>
        </Dialog>
    );
};

AddEditAbsenceModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    editingAbsence: PropTypes.shape({
        id: PropTypes.number,
        user_id: PropTypes.number,
        type_slug: PropTypes.string,
        status_slug: PropTypes.string,
        start_date: PropTypes.string,
        end_date: PropTypes.string,
        reason: PropTypes.string,
        travel_days: PropTypes.number,
        documents: PropTypes.array,
    }),
    data: PropTypes.shape({
        id: PropTypes.string,
        user_id: PropTypes.string,
        type: PropTypes.string,
        status: PropTypes.string,
        start_date: PropTypes.string,
        end_date: PropTypes.string,
        reason: PropTypes.string,
        travel_days: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }).isRequired,
    setData: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired,
    options: PropTypes.shape({
        users: PropTypes.array,
        absence_types: PropTypes.array,
        statuses: PropTypes.array,
    }).isRequired,
    onOpenDelete: PropTypes.func.isRequired,
};

export default AddEditAbsenceModal;
