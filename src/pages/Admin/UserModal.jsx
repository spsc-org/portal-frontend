
import {Button, Card, Dialog, DialogBody, DialogFooter, DialogHeader, Switch} from "@material-tailwind/react";
import {usePage} from "@inertiajs/react";
import React, {useState} from "react";
import Input from "@/Components/fields/Input.jsx";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {filterPermissions, mergePermissions} from "@/utils.js";
import SingleSelect from "@/Components/fields/SingleSelect.jsx";
import axios from "axios";
import {format} from "date-fns";
import PermissionValueToggle from "./PermissionValueToggle.jsx";

const UserModal = ({open, onClose}) => {
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
        password: "",
        dob: "",
        unit: "",
        permissions: mergePermissions(permissions),
        rankId: "",
        agreementTo: undefined,
        positionFrom: undefined,
        rankFrom: undefined,
    });

    const [activePages, setActivePages] = useState(permissions ? Object.keys(permissions) : []);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (body) => {
            const response = await axios.post('api/admin-users', body,
                {
                    cache: "no-cache", mode: 'same-origin', credentials: "same-origin",
                    headers: {"Content-Type": "application/json", "X-CSRF-Token": token, "userId": auth?.user?.id},
                });
            return response.data;
        },
        onSuccess: async () => {
            toast.success("Створено успішно", {
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
                password: "",
                dob: "",
                unit: "",
                permissions: mergePermissions(permissions)
            });
            onClose();
        },
        onError: error => {
            if (error?.response?.status === 422) {
                setErrors(error?.response?.data?.unvalidFields);
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
                    "showActivity": form.showActivity,
                },
                pages: filtered
            },
            showKPI: form.showKPI,
        }
        mutation.mutate(body);
    }

    const handleChangeOptions = ({pageName, action}) => (value) => {
        const updatedRow = {...form.permissions[pageName], [action]: value};
        setForm({...form, permissions: {...form.permissions, [pageName]: updatedRow}});
    }

    const handleChangePages = (category) => () => {
        if (activePages.indexOf(category) === -1) {
            setActivePages([...activePages, category]);
        } else {
            const result = activePages.filter(item => item !== category);
            setActivePages(result);
        }
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
        <Dialog data-i-doc="modal:admin-user-modal" open={open} size="lg" handler={onClose} className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <DialogHeader className="border-b border-slate-200 text-slate-800 dark:border-slate-700 dark:text-slate-100">
                <span>Додаванная користувача</span>
            </DialogHeader>
            <DialogBody className="h-[42rem] overflow-y-auto bg-slate-50/80 dark:bg-slate-900">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <Input error={errors?.name} label="ПІБ" value={form.name}
                           name="name"
                           onChange={handleChangeForm}/>
                    <Input error={errors?.email} label="Email" type="email" value={form.email}
                           name="email"
                           onChange={handleChangeForm}/>
                    <Input error={errors?.initials} label="Ініціали" value={form.initials}
                           name="initials"
                           onChange={handleChangeForm}/>
                    <Input error={errors?.password} label="Пароль" value={form.password}
                           name="password"
                           onChange={handleChangeForm}/>
                    <Input error={errors?.dob} label="Дата народження" type="date" value={form.dob}
                           name="dob"
                           onChange={handleChangeForm}/>

                    <Input error={errors?.unit} label="Підрозділ" value={form.unit}
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
                <p className="mt-5 text-sm font-bold text-slate-700 dark:text-white">
                    Доступи
                </p>
                <div className="mt-5 mb-20 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {
                        Object.entries(permissions).length > 0 && Object.entries(form.permissions).length &&
                        Object.entries(permissions).map(([category, action], index) => {
                            return (
                                <div key={index} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/30">
                                    <div className="flex justify-center pb-2">
                                        <Switch
                                            color="green"
                                            onChange={handleChangePages(category)}
                                            checked={activePages.some(item => item === category)}
                                            label={
                                                <span className="font-bold dark:text-gray-200">
                                                    {category}
                                                </span>
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Card
                                            className={`${activePages.indexOf(category) === -1 ? "pointer-events-none opacity-25" : ""} w-full overflow-hidden border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900 p-2 shadow-none transition`}
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
            </DialogBody>
            <DialogFooter className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <Button
                    variant="text"
                    color="red"
                    onClick={onClose}
                    className="mr-1">
                    <span>Закрити</span>
                </Button>
                <Button variant="gradient" color="green" onClick={onSubmit}>
                    <span>Створити</span>
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default UserModal;
