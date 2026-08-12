
import React, {useEffect, useState} from 'react';
import {usePage} from "@inertiajs/react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    Button,
    Card,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    IconButton,
    Switch,
    Tab,
    Tabs,
    TabsBody,
    TabsHeader,
    TabPanel
} from "@material-tailwind/react";
import Input from "@/Components/fields/Input.jsx";
import {filterPermissions, mergePermissions} from "@/utils.js";
import SingleSelect from "@/Components/fields/SingleSelect.jsx";
import {format} from "date-fns";
import LoadingButton from "../../Components/Buttons/LoadingButton.jsx";
import PermissionValueToggle from "./PermissionValueToggle.jsx";

const UserUpdateModal = ({open, onClose, id}) => {
    const {auth, token, permissions = {}} = usePage().props;

    const {data: options} = useQuery({
        queryKey: ['admin-options'],
        queryFn: () => axios.get('/api/admin-users/options', {
            headers: {
                'Content-Type': 'application/json',
                'userId': auth?.user?.id,
            },
        }).then(r => r.data.data),
        enabled: Boolean(auth?.user?.id),
        staleTime: Infinity,
    });
    const ranks = options?.ranks ?? [];
    const [errors, setErrors] = useState(null);
    const [form, setForm] = useState({
        name: "",
        email: "",
        initials: "",
        isResponsible: false,
        showActivity: false,
        showKPI: false,
        dob: "",
        unit: "",
        permissions: {},
        rankId: "",
        agreementTo: undefined,
        positionFrom: undefined,
        rankFrom: undefined,
    });
    const queryClient = useQueryClient();
    const [activePages, setActivePages] = useState([]);
    const [activeTab, setActiveTab] = useState("profile");

    useEffect(() => {
        if (open) {
            setActiveTab("profile");
        }
    }, [open]);

    const {data, isSuccess} = useQuery({
        queryKey: ['user-edit', id],
        queryFn: async () => {
            const response = await axios.get(`api/admin-users/${id}`, {headers: {"userId": auth?.user?.id}});
            return response?.data
        },
        enabled: !!id,
    })

    const isAdmin = Boolean(data?.data?.permissions?.pages?.['admin-users']?.read);
    const [locked, setLocked] = useState(true);
    const [isConfirm, setIsConfirm] = useState(false);

    useEffect(() => {
        if (isSuccess) {
            const body = {
                email: data.data?.email,
                name: data.data?.name,
                isResponsible: Boolean(data.data?.isResponsible),
                showActivity: Boolean(data?.data?.permissions?.general?.showActivity),
                showKPI: Boolean(data?.data?.showKPI),
                initials: data?.data?.initials,
                dob: data?.data.dob,
                unit: data?.data?.unit || "",
                permissions: mergePermissions(permissions, data?.data),
                rankId: ranks.find(r => r?.id === data?.data?.rankId),
                agreementTo: data?.data?.agreementTo ? format(data?.data?.agreementTo, "yyyy-MM-dd") : "",
                positionFrom: data?.data?.positionFrom ? format(data?.data?.positionFrom, "yyyy-MM-dd") : "",
                rankFrom: data?.data?.rankFrom ? format(data?.data?.rankFrom, "yyyy-MM-dd") : "",
            }
            setActivePages(Array.isArray(Object.keys(data?.data?.permissions?.pages)) ?
                Object.keys(data?.data?.permissions?.pages) : []);
            setForm(body);
        }
    }, [data, isSuccess, permissions]);

    const mutation = useMutation({
        mutationFn: async (body) => {
            const response = await axios.patch(`api/admin-users/${id}`, body,
                {
                    cache: "no-cache", mode: 'same-origin', credentials: "same-origin",
                    headers: {"Content-Type": "application/json", "X-CSRF-Token": token, "userId": auth?.user?.id},
                });
            return response?.data;
        },
        onSuccess: async () => {
            toast.success("Оновлено успішно", {
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            });
            mutation.reset();
            setForm({
                name: "",
                email: "",
                initials: "",
                isResponsible: false,
                showActivity: false,
                showKPI: false,
                dob: "",
                unit: "",
                permissions: {}
            });
            onClose();
        },
        onError: error => {
            if (error.status === 204) {
                toast.error("Зміни не були внесені, оскільки дані залишилися незмінними");
            }
            if (error?.response?.status === 422) {
                setErrors(error?.response?.data?.unvalidFields);
                // Усі валідовані поля — на табі профілю, показуємо помилки одразу
                setActiveTab("profile");
            }
        },
        onSettled: () => queryClient.invalidateQueries({queryKey: ['users']}),
    })

    const handleChangeForm = ({target}) => {
        setForm({...form, [target.name]: target.value});
    }

    const handleChangeCheckbox = ({target}) => {
        setForm({...form, [target.name]: target.checked});
    }

    const onSubmit = () => {
        const filtered = filterPermissions(form.permissions, activePages);
        const body = {
            ...form,
            rankId: form.rankId?.id,
            permissions: {
                general: {
                    showActivity: form.showActivity,
                },
                pages: filtered
            },
            showKPI: form.showKPI,
        }
        mutation.mutate(body);
    }

    const handleChangePages = (category) => () => {
        if (activePages.indexOf(category) === -1) {
            setActivePages([...activePages, category]);
        } else {
            const result = activePages.filter(item => item !== category);
            setActivePages(result);
        }
    }

    const handleChangeOptions = ({pageName, action}) => (value) => {
        const updatedRow = {...form.permissions[pageName], [action]: value};
        setForm({...form, permissions: {...form.permissions, [pageName]: updatedRow}});
    }

    const toggleLock = () => {
        if (locked) {
            setIsConfirm(true);
        }
    }

    const onConfirm = () => {
        setLocked(false);
        setIsConfirm(false);
    }

    const handleChangeSelect = (key = '') => (selected) => {
        setErrors(prev => ({...prev, [key]: ""}))
        setForm(prevState => ({...prevState, [key]: selected}));
    }

    const handleChangeDate = (field) => (date) => {
        if (date) {
            const str = format(date, "yyyy-MM-dd") || "";
            setForm(prevState => ({...prevState, [field]: str}));
            setErrors({...errors, [field]: ''});
        } else {
            setForm(prevState => ({...prevState, [field]: undefined}));
        }
    }

    return (
        <span data-i-doc="modal:admin-user-update-modal" style={{display: "contents"}}>
            <Dialog open={open} size="lg" handler={onClose}>
                <DialogHeader className="border-b border-slate-200 text-slate-800 dark:border-slate-700 dark:text-slate-100">
                    <span>Редагування: {data?.data?.name}</span>
                </DialogHeader>
                <DialogBody className="flex h-[42rem] max-h-[calc(100vh-12rem)] flex-col overflow-hidden p-0 bg-slate-50/80 dark:bg-slate-900">
                    <Tabs value={activeTab} className="flex min-h-0 flex-1 flex-col">
                        <TabsHeader className="mx-4 mt-3 bg-transparent" indicatorProps={{
                            className: "bg-gray-900/10 dark:bg-blue-900/50 shadow-none !text-gray-900",
                        }}>
                            <Tab value="profile" onClick={() => setActiveTab("profile")} className="dark:text-gray-50">Профіль</Tab>
                            <Tab value="access" onClick={() => setActiveTab("access")} className="dark:text-gray-50">Доступи</Tab>
                        </TabsHeader>
                        <TabsBody className="min-h-0 flex-1 overflow-y-auto">
                            {}
                            {activeTab === "profile" && <TabPanel data-i-doc="tab:admin-user-update-profile" value="profile">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <Input error={errors?.name} label="ПІБ" value={form.name || ""}
                               name="name"
                               onChange={handleChangeForm}/>
                        <Input error={errors?.email} label="Email" type="email" value={form.email || ""}
                               name="email"
                               onChange={handleChangeForm}/>
                        <Input error={errors?.initials} label="Ініціали" value={form.initials || ""}
                               name="initials"
                               onChange={handleChangeForm}/>
                        <Input error={errors?.dob} label="Дата народження" type="date" value={form.dob || ""}
                               name="dob"
                               onChange={handleChangeForm}/>

                        <Input error={errors?.unit} label="Підрозділ" value={form.unit || ""}
                               name="unit"
                               onChange={handleChangeForm}/>

                        <SingleSelect closeMenuOnSelect options={ranks}
                                      label="Звання"
                                      id="rankId"
                                      error={errors?.rankId}
                                      value={form?.rankId}
                                      onChange={handleChangeSelect('rankId')}/>
                        <Input error={errors?.agreementTo} label="Дата закінчення контракту" type="date"
                               value={form.agreementTo}
                               name="agreementTo"
                               onChange={handleChangeForm}/>
                        <Input error={errors?.positionFrom} label="На посаді з" type="date" value={form.positionFrom}
                               name="positionFrom"
                               onChange={handleChangeForm}/>
                        <Input error={errors?.rankFrom} label="Дата присв. останнього звання" type="date"
                               value={form.rankFrom}
                               name="rankFrom"
                               onChange={handleChangeForm}/>

                    </div>
                    <div className="mt-5 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40">
                        <label className="cursor-pointer text-slate-600 dark:text-slate-300">
                            <input
                                type="checkbox"
                                className="cursor-pointer form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-300"
                                checked={form.isResponsible}
                                onChange={handleChangeCheckbox}
                                name="isResponsible"
                            />{' '}
                            Відповідальна особа
                        </label>
                    </div>
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40">
                        <label className="cursor-pointer text-slate-600 dark:text-slate-300">
                            <input
                                type="checkbox"
                                className="cursor-pointer form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-300"
                                checked={form.showActivity}
                                onChange={handleChangeCheckbox}
                                name="showActivity"
                            />{' '}
                            Відображати активність
                        </label>

                    </div>
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40">
                        <label className="cursor-pointer text-slate-600 dark:text-slate-300">
                            <input
                                type="checkbox"
                                className="cursor-pointer form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-300"
                                checked={form.showKPI}
                                onChange={handleChangeCheckbox}
                                name="showKPI"
                            />{' '}
                            Показувати KPI
                        </label>
                    </div>
                            </TabPanel>}
                            {}
                            {activeTab === "access" && <TabPanel data-i-doc="tab:admin-user-update-access" value="access">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {
                            Object.entries(permissions || {}).length > 0 && Object.entries(form.permissions || {}).length &&
                            Object.entries(permissions).map(([category, action], index) => {
                                const isSelfAdminLock = id === auth.user.id && isAdmin && category === "admin";
                                const sectionDisabled = activePages.indexOf(category) === -1
                                    || (isSelfAdminLock && locked);

                                return (
                                    <div key={index} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/30">
                                        <div className="flex justify-center pb-2">
                                            <Switch
                                                color="green"
                                                disabled={isSelfAdminLock && locked}
                                                onChange={handleChangePages(category)}
                                                checked={activePages.some(item => item === category)}
                                                label={
                                                    <span className="font-bold dark:text-gray-200">
                                                        {category}
                                                    </span>
                                                }
                                            />
                                            {isSelfAdminLock && (
                                                <IconButton
                                                    disabled={!locked}
                                                    variant="text"
                                                    size="sm"
                                                    title="Розблокувати редагування"
                                                    className="ml-1 dark:text-gray-200"
                                                    onClick={toggleLock}
                                                >
                                                    <i className="far fa-unlock"></i>
                                                </IconButton>
                                            )}
                                        </div>
                                        <div>
                                            <Card
                                                className={`${sectionDisabled ? "pointer-events-none opacity-25" : ""} w-full overflow-hidden border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900 p-2 shadow-none`}
                                            >
                                                <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5">
                                                    {Object.entries(action || {}).map(([key, values]) => (
                                                        <React.Fragment key={key}>
                                                            <p className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300" title={key}>
                                                                {key}
                                                            </p>
                                                            <PermissionValueToggle
                                                                options={values}
                                                                value={form.permissions[category][key]}
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
                                    </div>
                                )
                            })
                        }
                    </div>
                            </TabPanel>}
                        </TabsBody>
                    </Tabs>
                </DialogBody>
                <DialogFooter className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <Button
                        variant="text"
                        color="red"
                        onClick={onClose}
                        className="mr-1">
                        <span>Закрити</span>
                    </Button>
                    <LoadingButton isLoading={mutation.isPending} variant="gradient" color="green" onClick={onSubmit}>
                        <span>Редагувати</span>
                    </LoadingButton>
                </DialogFooter>
            </Dialog>

            <Dialog open={isConfirm} size="xs" handler={onClose} className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <DialogHeader className="border-b border-slate-200 text-slate-800 dark:border-slate-700 dark:text-slate-100">
                    <span>Увага!</span>
                </DialogHeader>
                <DialogBody className="bg-slate-50/80 dark:bg-slate-900">
                    <p className="font-normal dark:text-gray-200">
                        Ви дійсно хочете змінити повноваження?
                    </p>
                </DialogBody>
                <DialogFooter className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => setIsConfirm(false)}
                        className="mr-1">
                        <span>Ні</span>
                    </Button>
                    <Button variant="gradient" color="green" onClick={onConfirm}>
                        <span>Так</span>
                    </Button>
                </DialogFooter>
            </Dialog>
        </span>

    );
};

export default UserUpdateModal;
