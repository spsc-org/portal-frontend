import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Menu,
    MenuHandler,
    MenuItem,
    MenuList
} from "@material-tailwind/react";
import React, {useState} from "react";
import {router, usePage} from "@inertiajs/react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {format} from "date-fns";
import Input from "../../Components/fields/Input.jsx";
import SingleSelect from "../../Components/fields/SingleSelect.jsx";
import DatePicker from "../../Components/fields/DatePicker.jsx";

const CreateDocumentModal = ({open, onClose}) => {
    const {auth, token, types, units, users} = usePage().props;
    const [form, setForm] = useState({
        caption: '',
        regNum: '',
        typeId: types[0],
        regDate: '',
        unitId: '',
        comments: '',
        performerId: '',
        path: '',
    });
    const [errors, setErrors] = useState(null);
    const queryClient = useQueryClient()


    const create = useMutation({
        mutationFn: async (body) => {
            const response = await axios.post('/api/document', body,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-CSRF-Token": token,
                        "userId": auth?.user?.id,
                    }
                });
            return response.data;
        },
        onSuccess: async (data) => {
            toast.success("Створено успішно", {
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            });
            create.reset();
            setForm({
                caption: '',
                regNum: '',
                typeId: types[0],
                regDate: '',
                unitId: '',
                comments: '',
                performerId: '',
                path: '',
            });
            onClose();
        },
        onError: error => {
            if (error?.response?.status === 422) {
                setErrors(error?.response?.data?.unvalidFields);
            }
        },
        onSettled: (data, error) => {
            if (!error && data?.success) {
                queryClient.setQueriesData({queryKey: ['documents']}, (oldData) => {
                    if (!Array.isArray(oldData?.data)) {
                        return oldData
                    } else {
                        const newData = [{...data.data, isUpdated: true}, ...oldData?.data];
                        return {...oldData, data: newData}
                    }
                });

            }
        },

    })
    const handleChangeSelect = (key = '') => (selected) => {
        setErrors(prev => ({...prev, [key]: ""}))
        if (key === "unitId" && form.regNum === "") {
            setForm(prevState => ({...prevState, [key]: selected, regNum: (selected?.pattern || "")}));
        } else {
            setForm(prevState => ({...prevState, [key]: selected}));
        }
    }

    const handleChangeForm = ({target}) => {
        setErrors(prev => ({...prev, [target.name]: ""}))
        setForm(prev => ({...prev, [target.name]: target.value}))
    }

    const handleSubmit = () => {
        const body = {
            ...form,
            typeId: form.typeId?.id,
            performerId: form.performerId?.id,
            unitId: form.unitId?.id
        }
        create.mutate(body);
    }

    const handleChangeDate = (date) => {
        if (date) {
            const str = format(date, "yyyy-MM-dd") || "";
            setForm(prevState => ({...prevState, regDate: str}));
            setErrors({...errors, regDate: ''});
        } else {
            setForm(prevState => ({...prevState, regDate: undefined}));
        }
    }

    const handleChangeRegNum = ({target}) => {
        setForm(prevState => ({...prevState, regNum: target.value}));
        const findUnit = units.find(unit => unit.pattern === target.value);
        if (target.value.length > 1 && findUnit) {
            setForm(prevState => ({...prevState, unitId: findUnit}));
        }
        setErrors({...errors, regNum: ''});
    }

    const handleSubmitImport = () => {
        const body = {
            ...form,
            typeId: form.typeId?.id,
            performerId: form.performerId?.id,
            unitId: form.unitId?.id
        }

        // ... (add this import at the top of the file)

        // Then replace the code block:
        create.mutateAsync(body)
            .then((data) => {
                router.visit(`/project/upload/v2`);
            });
    }

    return (
        <Dialog open={open} handler={onClose} size="sm">
            <DialogHeader>
                Створити новий документ
            </DialogHeader>
            <DialogBody>
                <div className="grid grid-cols-2 gap-2">
                    <SingleSelect size="sm" closeMenuOnSelect error={errors?.typeId}
                                  options={types}
                                  label="Тип"
                                  id="typeId"
                                  value={form.typeId}
                                  onChange={handleChangeSelect("typeId")}/>
                    <DatePicker onChange={handleChangeDate} error={errors?.regDate} date={form.regDate} errors
                                label="Дата реєстрації"/>
                    <Input error={errors?.regNum} placeholder="0/0/0 <гриф>" label="Реєстраційний номер"
                           value={form.regNum} name="regNum"
                           onChange={handleChangeRegNum}/>
                    <SingleSelect closeMenuOnSelect error={errors?.unitId} options={units}
                                  isClearable
                                  label="Підрозділ"
                                  id="unitId"
                                  value={form.unitId}
                                  onChange={handleChangeSelect("unitId")}/>
                    <SingleSelect closeMenuOnSelect error={errors?.performerId} options={users}
                                  isClearable
                                  label="Виконавець"
                                  id="performerId"
                                  value={form.performerId}
                                  onChange={handleChangeSelect("performerId")}/>
                    <Input error={errors?.path} label="Шлях" value={form.path} name="path"
                           onChange={handleChangeForm}/>
                    <Input error={errors?.caption} label="Назва" value={form.caption} name="caption"
                           onChange={handleChangeForm}/>
                </div>
                <div className="mt-4">
                    <Input error={errors?.comments} tag="textarea" label="Коментар"
                           value={form.comments} name="comments"
                           onChange={handleChangeForm}/>
                </div>
            </DialogBody>
            <DialogFooter>
                <Button
                    variant="text"
                    color="red"
                    onClick={onClose}
                    className="mr-1"
                >
                    <span>Закрити</span>
                </Button>
                <Menu>
                    <MenuHandler>
                        <Button disabled={Boolean(create.isPending)}>Створити</Button>
                    </MenuHandler>
                    <MenuList className="z-[9999] p-1.5">
                        <MenuItem onClick={handleSubmit} className="hover:bg-slate-200">Створити</MenuItem>
                    </MenuList>
                </Menu>
            </DialogFooter>
        </Dialog>
    );
};

export default CreateDocumentModal;
