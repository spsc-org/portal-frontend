
import React, {useEffect, useMemo, useState} from 'react';
import {usePage} from '@inertiajs/react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    Button,
    Card,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Switch,
    Tab,
    Tabs,
    TabsBody,
    TabsHeader,
    TabPanel,
} from '@material-tailwind/react';
import {mergePermissions} from '@/utils.js';
import LoadingButton from '@/Components/Buttons/LoadingButton.jsx';
import PermissionValueToggle from './PermissionValueToggle.jsx';

/**
 * Модалка масових дій над відібраними користувачами.
 * Таб «Пермішени»: чекбокс секції = брати участь у застосуванні;
 * увімкнена секція повністю перезаписує блок pages[key];
 * вимкнена (Switch off) — прибирає ключ сторінки.
 */
const BulkActionsModal = ({open, onClose, userIds = []}) => {
    const {auth, token, permissions: schema = {}} = usePage().props;
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('permissions');
    // Секції, які підуть у bulk-патч
    const [applySections, setApplySections] = useState([]);
    // Модуль увімкнений (Switch) — як activePages в UserUpdateModal
    const [enabledPages, setEnabledPages] = useState([]);
    const [formPermissions, setFormPermissions] = useState({});

    const defaults = useMemo(() => mergePermissions(schema), [schema]);

    useEffect(() => {
        if (!open) {
            return;
        }
        setActiveTab('permissions');
        setApplySections([]);
        setEnabledPages([]);
        setFormPermissions(defaults);
    }, [open, defaults]);

    const mutation = useMutation({
        mutationFn: async (body) => {
            const response = await axios.post('/api/admin-users/bulk-permissions', body, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token,
                    userId: auth?.user?.id,
                },
            });
            return response?.data;
        },
        onSuccess: (payload) => {
            const updated = payload?.data?.updated ?? 0;
            const skipped = payload?.data?.skipped ?? [];
            toast.success(
                skipped.length
                    ? `Оновлено: ${updated}. Пропущено: ${skipped.length}`
                    : `Оновлено користувачів: ${updated}`,
                {
                    style: {
                        background: 'dark:dark:bg-slate-800',
                        color: 'text-slate-400',
                    },
                },
            );
            onClose({clearSelection: true});
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Помилка масового оновлення');
        },
        onSettled: () => queryClient.invalidateQueries({queryKey: ['users']}),
    });

    const toggleApplySection = (category) => () => {
        setApplySections((prev) => (
            prev.includes(category)
                ? prev.filter((item) => item !== category)
                : [...prev, category]
        ));
    };

    const toggleEnabledPage = (category) => () => {
        setEnabledPages((prev) => (
            prev.includes(category)
                ? prev.filter((item) => item !== category)
                : [...prev, category]
        ));
    };

    const handleChangeOptions = ({pageName, action}) => (value) => {
        setFormPermissions((prev) => ({
            ...prev,
            [pageName]: {...prev[pageName], [action]: value},
        }));
    };

    const onSubmit = () => {
        if (!userIds.length) {
            toast.error('Не обрано користувачів');
            return;
        }
        if (!applySections.length) {
            toast.error('Оберіть хоча б одну секцію для застосування');
            return;
        }

        const sections = {};
        applySections.forEach((pageKey) => {
            const enabled = enabledPages.includes(pageKey);
            sections[pageKey] = enabled
                ? {enabled: true, permissions: formPermissions[pageKey] || {}}
                : {enabled: false};
        });

        mutation.mutate({userIds, sections});
    };

    return (
        <Dialog data-i-doc="modal:admin-bulk-actions" open={open} size="xl" handler={() => onClose()}>
            <DialogHeader className="border-b border-slate-200 text-slate-800 dark:border-slate-700 dark:text-slate-100">
                <span>Масові дії · обрано {userIds.length}</span>
            </DialogHeader>
            <DialogBody className="flex h-[42rem] max-h-[calc(100vh-12rem)] flex-col overflow-hidden bg-slate-50/80 p-0 dark:bg-slate-900">
                <Tabs value={activeTab} className="flex min-h-0 flex-1 flex-col">
                    <TabsHeader
                        className="mx-4 mt-3 bg-transparent"
                        indicatorProps={{
                            className: 'bg-gray-900/10 shadow-none !text-gray-900 dark:bg-blue-900/50',
                        }}
                    >
                        <Tab value="permissions" onClick={() => setActiveTab('permissions')} className="dark:text-gray-50">
                            Пермішени
                        </Tab>
                    </TabsHeader>
                    <TabsBody className="min-h-0 flex-1 overflow-y-auto">
                        {activeTab === 'permissions' && (
                            <TabPanel value="permissions">
                                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                                    Позначте секції зліва — лише вони будуть застосовані. Увімкнена секція
                                    повністю перезаписує блок прав; вимкнена — прибирає доступ до модуля.
                                </p>
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                    {Object.entries(schema).map(([category, actions]) => {
                                        const inApply = applySections.includes(category);
                                        const pageOn = enabledPages.includes(category);
                                        const sectionDisabled = !inApply || !pageOn;

                                        return (
                                            <div
                                                key={category}
                                                className={`rounded-lg border p-3 dark:border-slate-700 ${
                                                    inApply
                                                        ? 'border-blue-300 bg-white dark:border-blue-700 dark:bg-slate-800/40'
                                                        : 'border-slate-200 bg-white/70 dark:bg-slate-800/20'
                                                }`}
                                            >
                                                <label className="mb-2 flex cursor-pointer items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        className="form-checkbox h-4 w-4 cursor-pointer text-blue-600"
                                                        checked={inApply}
                                                        onChange={toggleApplySection(category)}
                                                    />
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                        Застосувати секцію
                                                    </span>
                                                </label>

                                                <div className={`flex justify-center pb-2 ${inApply ? '' : 'pointer-events-none opacity-40'}`}>
                                                    <Switch
                                                        color="green"
                                                        disabled={!inApply}
                                                        onChange={toggleEnabledPage(category)}
                                                        checked={pageOn}
                                                        label={
                                                            <span className="font-bold dark:text-gray-200">{category}</span>
                                                        }
                                                    />
                                                </div>

                                                <Card
                                                    className={`${sectionDisabled ? 'pointer-events-none opacity-25' : ''} w-full overflow-hidden border border-slate-200 bg-slate-50 p-2 shadow-none dark:border-slate-700 dark:bg-slate-900`}
                                                >
                                                    <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5">
                                                        {Object.entries(actions || {}).map(([key, values]) => (
                                                            <React.Fragment key={key}>
                                                                <p
                                                                    className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300"
                                                                    title={key}
                                                                >
                                                                    {key}
                                                                </p>
                                                                <PermissionValueToggle
                                                                    options={values}
                                                                    value={formPermissions?.[category]?.[key]}
                                                                    onChange={handleChangeOptions({
                                                                        pageName: category,
                                                                        action: key,
                                                                    })}
                                                                />
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                </Card>
                                            </div>
                                        );
                                    })}
                                </div>
                            </TabPanel>
                        )}
                    </TabsBody>
                </Tabs>
            </DialogBody>
            <DialogFooter className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <Button variant="text" color="red" onClick={() => onClose()} className="mr-1">
                    Закрити
                </Button>
                <LoadingButton
                    isLoading={mutation.isPending}
                    variant="gradient"
                    color="green"
                    onClick={onSubmit}
                    disabled={!applySections.length || !userIds.length}
                >
                    Застосувати
                </LoadingButton>
            </DialogFooter>
        </Dialog>
    );
};

export default BulkActionsModal;
