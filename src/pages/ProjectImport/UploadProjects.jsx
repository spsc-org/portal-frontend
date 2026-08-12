import {useState} from "react";
import {
    Button,
    Card,
    Dialog,
    DialogFooter,
    DialogHeader,
    IconButton,
    Spinner,
    Tooltip,
    Typography
} from "@material-tailwind/react";
import {Link, usePage} from "@inertiajs/react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {format} from "date-fns";
import toast from "react-hot-toast";
import DuplicateProjectsModal from "./DuplicateProjectsModal.jsx";
import {useDialog} from "../../hooks/useDialog.js";
import {DictionaryProvider} from "../Dictionary/DictionaryContext.jsx";
import Page from "../../Components/Page.jsx";
import LoadingButton from "../../Components/Buttons/LoadingButton.jsx";
import TableValidation from "./components/TableValidation.jsx";
import ImportFile from "../../Components/Modal/ImportFile.jsx";
import {downloadFile} from "../../utils.js";

const UploadProjects = () => {
    const {auth, token, id, previousUrl} = usePage().props;
    const {open, handleOpen, handleClose, dialogProps} = useDialog();
    const [projects, setProjects] = useState(null);
    const [errors, setErrors] = useState(null);
    const [warnings, setWarnings] = useState(null);
    const [duplicate, setDuplicate] = useState(null);
    const [isModal, setIsModal] = useState(false);

    const {data, isFetching} = useQuery({
        queryKey: ['document-update', id],
        queryFn: async () => {
            const response = await axios.get(`/api/document/${id}`, {
                headers: {"userId": auth?.user?.id}
            })
            return response.data;
        },
        enabled: !!id
    });

    const {mutate: getFile, isPending} = useMutation({
        mutationFn: async () => {
            const response = await axios.get('/api/document/download/layout', {
                params: {
                    documentId: id
                },
                headers: {"userId": auth?.user?.id},
                responseType: 'blob',
            })
            const contentDisposition = response.headers["content-disposition"];
            const filename = contentDisposition.split("filename=")[1];
            downloadFile(response.data, filename);
        }
    });

    const upload = useMutation({
        mutationFn: async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const response = await axios.post('/api/document/validate', formData, {
                params: {
                    documentId: id || undefined
                },
                headers: {
                    "Content-Type": "multipart/form-data",
                    "X-CSRF-Token": token,
                    "userId": auth.user.id
                }
            });
            return response.data;
        }
    });

    const findDuplicateMutation = useMutation({
        mutationFn: async (body) => {
            const response = await axios.post('/api/document/find-duplicates', body,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": token,
                        "userId": auth.user.id
                    }
                });
            return response.data;
        },
        onSuccess: async (response) => {
            if (response?.success) {
                const areAllArraysEmpty = Object.values(response.duplicates).every(arr => arr.length === 0);
                if (areAllArraysEmpty) {
                    return toast.error('Дублікатів не знайдено');
                }
                handleOpen(response.duplicates)
                setDuplicate(response.duplicates)
            }
        },
        onError: async () => toast.error('Помилка відновлення'),

    })

    const importProjects = useMutation({
        mutationFn: async (body) => {
            const response = await axios.post(`/api/document/import-projects`, body, {
                params: {
                    documentId: id || undefined
                },
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": token,
                    "userId": auth.user.id
                }
            });
            return response.data;
        },
        onSuccess: async () => {
            upload.reset();
            setErrors(null);
            setProjects(null)
        },
    })

    const closeImport = () => {
        upload.reset();
        setIsModal(false);
    }

    const handleAddProjects = () => {
        setIsModal(true);
    }

    const handleUpload = (file) => {
        if (projects) {
            setProjects(null);
        }
        upload.mutateAsync(file)
            .then((result) => {
                if (result.data && result.data.length === 0) {
                    throw new Error("Файл пустий, або містить невідповідні значення")
                }
                setIsModal(false);
                setProjects(result);
                if (Object.keys(result?.warnings || {}).length > 0) {
                    setWarnings(result?.warnings);
                }
                if (Object.keys(result?.unvalidFields || {}).length > 0) {
                    setErrors(result?.unvalidFields)
                } else if (errors) {
                    setErrors(null)
                }
            })
            .catch((error) => {
                toast.error(error.message);
            })
    }

    const handleSubmit = () => {
        importProjects.mutate({projects: projects.data, warnings: warnings, duplicate: duplicate});
    }

    const findDuplicates = () => {
        const body = {}
        if (projects?.data.length) {
            body["nameUk"] = projects?.data.map((item) => item[6]);
            body["nameRu"] = projects?.data.map((item) => item[7]);
            body["nameEn"] = projects?.data.map((item) => item[8]);
            body["tax"] = projects?.data.map((item) => item[11]);
            body["reg"] = projects?.data.map((item) => item[12]);
            body["doc"] = projects?.data.map((item) => item[13]);
            body["drsId"] = projects?.data.map((item) => item[56]);
        }
        findDuplicateMutation.mutate(body)
    }

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:project-import-upload" className="p-2 m-2 flex justify-between">
                    <div className="flex gap-x-2">
                        <a href={previousUrl.includes('/document') ? '/document' : '/project'}>
                            <Button size="sm" variant="text">
                                <i className="fa-regular fa-arrow-left"></i>
                                <span className="ml-1">
                            Назад
                            </span>
                            </Button>
                        </a>
                        <div>
                            <Typography variant="h5" className="font-medium dark:text-slate-200">
                                Імпорт проєктів
                            </Typography>

                            {Boolean(data?.data) &&
                                <Typography variant="small" color="gray" className="font-normal dark:text-slate-300">
                                    Документ: {data?.data?.regNum} {data?.data?.regDate ?
                                    <span>від {format(data?.data?.regDate, "dd.MM.yyyy")}</span>
                                    : ""}
                                </Typography>
                            }
                        </div>
                        <Link href="/project/upload/v2">
                            <Button size="sm" color="blue">
                                Новий імпорт
                            </Button>
                        </Link>
                    </div>
                    <div className="flex gap-x-2">
                        <LoadingButton className="mr-2"
                                       variant="outlined"
                                       isLoading={isPending}
                                       disabled={isPending}
                                       onClick={() => getFile()}>Завантажити шаблон
                        </LoadingButton>

                        <LoadingButton isLoading={upload.isPending} onClick={handleSubmit}
                                       disabled={isFetching || Boolean(errors) || Boolean(upload.isPending)}>
                            Додати
                        </LoadingButton>
                    </div>
                </div>
                <Card className="py-4 px-2 m-1 shadow-md dark:bg-gray-800">
                    <div className="flex flex-row items-center gap-x-2">
                        <Typography variant="h6" className="dark:text-slate-200">
                            Додати проєкти
                        </Typography>
                        <IconButton size="sm" color="blue" onClick={handleAddProjects}>
                            <i className="fa-regular fa-plus"></i>
                        </IconButton>
                        {
                            Boolean(projects?.data) &&
                            <Tooltip content="Перевірити дублікати">
                                <IconButton disabled={findDuplicateMutation.isPending} size="sm" color="blue"
                                            onClick={findDuplicates}>
                                    {
                                        findDuplicateMutation.isPending ?
                                            <Spinner/> :
                                            <i className="fa-solid fa-database"></i>
                                    }
                                </IconButton>
                            </Tooltip>
                        }
                    </div>
                    <TableValidation validation={errors} warnings={warnings} data={projects?.data}
                                     headers={projects?.headerColumns}/>
                </Card>
                {
                    isModal &&
                    <ImportFile
                        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        open={isModal}
                        handleSubmit={handleUpload}
                        isLoading={upload.isPending}
                        formatText="Формати: .xls, .xlsx"
                        onClose={closeImport}/>
                }
                {
                    importProjects.isSuccess &&
                    <Dialog open={importProjects.isSuccess} size="xs">
                        <DialogHeader
                            className="dark:text-gray-200">Імпортовано успішно</DialogHeader>
                        <DialogFooter>
                            <Button variant="gradient" color="green" className="w-full" onClick={() => {
                                window.open(id ? `/project?documentId=${id}` : "/project", "_self")
                            }}>
                                <span>Ок</span>
                            </Button>
                        </DialogFooter>
                    </Dialog>
                }

                {
                    open && <DuplicateProjectsModal {...dialogProps} open={open} onClose={handleClose}/>
                }
            </Page>
        </DictionaryProvider>
    );
};

export default UploadProjects;
