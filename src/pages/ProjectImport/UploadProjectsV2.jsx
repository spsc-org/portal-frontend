import {useEffect, useState} from "react";
import {
    Button,
    Card,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Menu, MenuHandler, MenuItem, MenuList,
    Spinner,
    Tooltip,
    Typography
} from "@material-tailwind/react";
import {usePage} from "@inertiajs/react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {format} from "date-fns";
import toast from "react-hot-toast";
import DuplicateProjectsModal from "./DuplicateProjectsModal.jsx";
import {useDialog} from "../../hooks/useDialog.js";
import {DictionaryProvider} from "../Dictionary/DictionaryContext.jsx";
import Page from "../../Components/Page.jsx";
import LoadingButton from "../../Components/Buttons/LoadingButton.jsx";
import ImportFile from "../../Components/Modal/ImportFile.jsx";
import {downloadFile} from "../../utils.js";
import TableValidationV2 from "./components/TableValidationV2.jsx";
import {
    CATEG_CLASS,
    IDENT_ICONS,
    PROPOSAL_CLASS,
    safeParsePrecomputed,
    SUBJECT_ITEM_TYPE_COLUMN_INDEX
} from "./utils.js";


const UploadProjectsV2 = () => {
    const {
        auth,
        token,
        id,
        previousUrl,
        itemType = [],
        projectActionType = [],
        projectState = [],
        users = [],
        terms = []
    } = usePage().props;
    const {
        open: duplicateOpen,
        handleOpen: handleDuplicateOpen,
        handleClose: handleDuplicateClose,
        dialogProps: duplicateDialogProps
    } = useDialog();
    const {
        open: invalidFieldsOpen,
        handleOpen: handleInvalidFieldsOpen,
        handleClose: handleInvalidFieldsClose,
        dialogProps: invalidFieldsDialogProps
    } = useDialog();
    const [projects, setProjects] = useState(null);
    const [errors, setErrors] = useState(null);
    const [warnings, setWarnings] = useState(null);
    const [duplicate, setDuplicate] = useState(null);
    const [isModal, setIsModal] = useState(false);
    const [confirmImportOpen, setConfirmImportOpen] = useState(false);
    const [selectedItemTypeId, setSelectedItemTypeId] = useState(itemType?.[0]?.id ?? null);
    const [importedProjectIds, setImportedProjectIds] = useState([]);
    const [importedProjectsData, setImportedProjectsData] = useState([]);
    const [importedItemTypeId, setImportedItemTypeId] = useState(null);
    const [isImportDetailsLoading, setIsImportDetailsLoading] = useState(false);


    useEffect(() => {
        setSelectedItemTypeId(itemType?.[1]?.id ?? null);
    }, [itemType]);

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
        mutationFn: async (typeId) => {
            const response = await axios.get('/api/v2/project/download/layout', {
                params: {
                    documentId: id,
                    subjectTypeId: typeId,
                },
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
            const response = await axios.post('/api/v2/project/import/validate', formData, {
                params: {
                    documentId: id || undefined,
                    itemTypeId: selectedItemTypeId ?? undefined,
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
                handleDuplicateOpen(response.duplicates)
                setDuplicate(response.duplicates)
            }
        },
        onError: async () => toast.error('Помилка відновлення'),

    })

    const importProjects = useMutation({
        mutationFn: async (body) => {
            const {forceImport, ...payload} = body || {};
            const response = await axios.post(`/api/v2/project/import`, payload, {
                params: {
                    documentId: id || undefined,
                    itemTypeId: selectedItemTypeId ?? undefined,
                    forceImport: forceImport ? true : undefined,
                },
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": token,
                    "userId": auth.user.id
                }
            });
            return response.data;
        },
        onSuccess: async (response, variables) => {
            upload.reset();
            setErrors(null);
            setProjects(null);

            const insertedIds = response?.insertedProjectIds || [];
            const typeId = variables?.itemTypeId ?? selectedItemTypeId ?? null;
            setImportedProjectIds(insertedIds);
            setImportedItemTypeId(typeId);
            setImportedProjectsData([]);

            if (!insertedIds.length) {
                return;
            }

            setIsImportDetailsLoading(true);
            try {
                const detailsResponse = await axios.get(`/api/project/data`, {
                    params: {
                        fetchData: true,
                        limit: Math.max(insertedIds.length, 100),
                        page: 0,
                        filters: JSON.stringify({fId: insertedIds.join(",")})
                    },
                    headers: {
                        "Content-Type": "application/json",
                        "userId": auth?.user?.id
                    }
                });
                setImportedProjectsData(detailsResponse?.data?.data || []);
            } catch (error) {
                toast.error("Не вдалося отримати деталі імпорту");
            } finally {
                setIsImportDetailsLoading(false);
            }
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
                setIsModal(false);
                setProjects(result);
                if (Object.keys(result?.warnings || {}).length > 0) {
                    setWarnings(result?.warnings);
                }
                if (Object.keys(result?.errors || {}).length > 0) {
                    setErrors(result?.errors)
                } else if (errors) {
                    setErrors(null)
                }
            })
            .catch((error) => {
                const status = error?.response?.status;
                const responseData = error?.response?.data || {};
                const responseErrors = responseData?.errors || {};

                if (status === 422) {
                    const errorMessage = responseErrors?.message || responseData?.message || "Некоректні параметри запиту";
                    toast.error(`422 Невалідні дані. ${errorMessage}`);

                    const invalidFields = responseErrors?.invadiFields || responseErrors?.invalidFields;
                    if (invalidFields) {
                        handleInvalidFieldsOpen({
                            message: errorMessage,
                            invalidFields: Array.isArray(invalidFields) ? invalidFields : [invalidFields],
                        });
                    }
                    return;
                }

                toast.error(error?.message || "Помилка завантаження");
            })
    }

    const performImport = (forceImport = false) => {
        importProjects.mutate({
            projects: projects.data,
            warnings: warnings,
            duplicate: duplicate,
            itemTypeId: selectedItemTypeId ?? undefined,
            forceImport,
        });
    }

    const hasWarnings = Boolean(warnings && Object.keys(warnings).length);

    const handleSubmit = () => {
        if (hasWarnings) {
            setConfirmImportOpen(true);
            return;
        }
        performImport(false);
    }

    const handleConfirmImport = () => {
        setConfirmImportOpen(false);
        performImport(true);
    }

    const handleCancelImport = () => {
        setConfirmImportOpen(false);
    }

    const findDuplicates = () => {
        const body = {}
        if (projects?.data.length) {
            const subjectColumns = SUBJECT_ITEM_TYPE_COLUMN_INDEX[selectedItemTypeId] || [];
            subjectColumns.forEach(({column, index}) => {
                body[column] = projects.data.map((item) => item[index]);
            });
        }
        findDuplicateMutation.mutate(body)
    }

    const itemTypeOptions = Boolean(itemType?.length) && (
        <div>
            <Typography variant="small" className="dark:text-gray-300">Оберіть тип суб'єкта та файл</Typography>
            <div className="mb-2 flex flex-wrap gap-1">
                {itemType.map((type) => (
                    <label key={type.id} className="cursor-pointer">
                        <input
                            type="radio"
                            name="itemType"
                            value={type.id}
                            checked={selectedItemTypeId === type.id}
                            onChange={() => setSelectedItemTypeId(type.id)}
                            className="peer sr-only"
                        />
                        <span
                            className="flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:border-blue-400/70 dark:hover:bg-blue-900/20 dark:peer-checked:border-blue-400 dark:peer-checked:bg-blue-900/30 dark:peer-checked:text-blue-200 sm:text-sm">
                        {type.caption}
                    </span>
                    </label>
                ))}
            </div>
        </div>
    )
    const importedCount = importedProjectIds.length;
    const renderStateIcon = (stateId) => {
        const state = projectState.find((item) => item.id === stateId);
        if (!state) return null;
        return <i className={`text-xl ${state.icon} ${state.style}`}></i>;
    };
    const renderSubjectType = (subjectTypeId) => {
        const subject = itemType.find((item) => item.id === subjectTypeId);
        return subject?.icon ? <i className={subject.icon}></i> : "";
    };
    const renderCountries = (parsed) => {
        if (!Array.isArray(parsed?.countries) || !parsed.countries.length) return <i>Відсутні країни</i>;
        return parsed.countries.map((country, idx) => (
            <div key={`${country.iso}-${idx}`} className="text-xs">{country.iso} - {country.name}</div>
        ));
    };
    const renderIdentifiers = (parsed) => {
        if (!Array.isArray(parsed?.identifiers) || !parsed.identifiers.length) return <i>Немає ідентифікаторів</i>;
        return parsed.identifiers.map((item, idx) => (
            <p key={`${item.id || idx}-${idx}`} className="text-xs">
                {IDENT_ICONS[item.group] && <i className={`${IDENT_ICONS[item.group]} mr-1`}></i>}
                {item.caption} {item.value} {item.country ? `[${item.country}]` : ""}
            </p>
        ));
    };
    const renderAttributes = (row, parsed) => {
        return (
            <div className="text-xs">
                {Array.isArray(parsed?.attributes) && parsed.attributes.length ? (
                    parsed.attributes.map((item, idx) => (
                        <p key={idx}><span className="underline">{item.caption}:</span> {item.value ||
                            <i>Відсутнє значення</i>}</p>
                    ))
                ) : (
                    <i>Немає атрибутів</i>
                )}
                {row.notes ? <p className="mt-1"><span className="underline">Примітки:</span> {row.notes}</p> : null}
            </div>
        );
    };

    const renderCategories = (parsed) => {
        if (!Array.isArray(parsed?.categories) || !parsed.categories.length) return <i>Немає категорій</i>;
        return parsed.categories.map((item, idx) => (
            <p key={idx} className="text-xs"><i
                className={`fa-solid fa-tag mr-1 ${CATEG_CLASS[item.typeId] || ""}`}></i>{item.caption}</p>
        ));
    };
    const renderDocuments = (row, parsed) => {
        console.log(row, parsed);
        return (
            <div className="text-xs">
                {Array.isArray(parsed?.proposals) && parsed.proposals.length ? (
                    parsed.proposals.map((item) => (
                        <p key={item.id}>
                            <i className={`fa-solid fa-briefcase mr-1 ${PROPOSAL_CLASS[item.stateId] || "text-gray-600"}`}></i>
                            {item.caption}
                        </p>
                    ))
                ) : (
                    <i>Відсутнє подання</i>
                )}
                <hr className="my-1"/>
                {Array.isArray(parsed?.documents) && parsed.documents.length ? (
                    parsed.documents.map((item, idx) => (
                        <p key={`${item.regNum || idx}-${idx}`}>
                            <i className="fa-regular fa-file-lines mr-1"></i>
                            {[item.regNum, item.regDate, item.unitCaption].filter(Boolean).join(" ")}
                        </p>
                    ))
                ) : (
                    <i>Відсутні документи</i>
                )}
            </div>
        );
    };

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:project-import-upload-v2"
                    className="mb-2 flex flex-col gap-y-2 border border-gray-100 bg-white px-2.5 py-2 shadow-sm dark:border-gray-700/60 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-x-2">
                        <a href={previousUrl.includes('/document') ? '/document' : '/project'} className="shrink-0">
                            <Tooltip content="Назад">
                                <Button size="sm" variant="text"
                                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-gray-700/60">
                                    <i className="fa-regular fa-arrow-left text-base"></i>
                                    <span className="hidden sm:inline">Назад</span>
                                </Button>
                            </Tooltip>
                        </a>
                        <div className="hidden h-9 w-px bg-gray-200 dark:bg-gray-700 sm:block"></div>
                        <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                            <i className="fa-solid fa-file-import text-lg"></i>
                        </span>
                        <div className="min-w-0">
                            <Typography variant="h5"
                                        className="truncate text-lg font-semibold leading-tight text-gray-900 dark:text-slate-100">
                                Імпорт проєктів НОВИЙ
                            </Typography>
                            {Boolean(data?.data) &&
                                <Typography variant="small" color="gray"
                                            className="flex flex-wrap items-center gap-x-1.5 text-xs font-normal text-gray-500 dark:text-slate-400">
                                    <i className="fa-regular fa-file-lines"></i>
                                    <span>Документ: {data?.data?.regNum}</span>
                                    {data?.data?.regDate &&
                                        <span className="text-gray-400 dark:text-slate-500">
                                            від {format(data?.data?.regDate, "dd.MM.yyyy")}
                                        </span>
                                    }
                                </Typography>
                            }
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-x-2">
                        <Menu placement="bottom-end">
                            <MenuHandler>
                                <LoadingButton variant="outlined"
                                               isLoading={isPending}
                                               disabled={isPending}>
                                    <span className="flex items-center gap-2">
                                        <i className="fa-solid fa-download"></i>
                                        <span>Завантажити шаблон</span>
                                        <i className="fa-solid fa-chevron-down text-xs opacity-70"></i>
                                    </span>
                                </LoadingButton>
                            </MenuHandler>
                            <MenuList className="min-w-[12rem]">
                                {(itemType || []).map(type => (
                                    <MenuItem key={type.id} onClick={() => getFile(type.id)}
                                              className="flex items-center gap-2">
                                        <i className="fa-regular fa-file-excel text-green-600"></i>
                                        {type.caption}
                                    </MenuItem>
                                ))}
                            </MenuList>
                        </Menu>
                        {
                            Boolean(projects?.data?.length) &&
                            <LoadingButton isLoading={upload.isPending} onClick={handleSubmit}
                                           color="green"
                                           disabled={isFetching || Boolean(errors) || Boolean(upload.isPending)}>
                                <span className="flex items-center gap-2">
                                    <i className="fa-solid fa-cloud-arrow-up"></i>
                                    <span>Імпортувати</span>
                                </span>
                            </LoadingButton>
                        }
                    </div>
                </div>
                <Card
                    className="m-0 border border-gray-100 p-2.5 shadow-lg dark:border-gray-700/60 dark:bg-gray-800 sm:p-3">
                    <div className="flex flex-col gap-2.5">
                        <div
                            className="flex flex-col gap-2 border-b border-gray-100 pb-2.5 dark:border-gray-700/60 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-2.5">
                                <span
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                    <i className="fa-solid fa-folder-plus"></i>
                                </span>
                                <div className="space-y-0.5">
                                    <Typography variant="h6"
                                                className="leading-tight text-gray-900 dark:text-slate-100">
                                        Додати проєкти
                                    </Typography>
                                    <Typography variant="small" color="gray"
                                                className="text-xs font-normal text-gray-500 dark:text-slate-400">
                                        Оберіть тип проєкту та завантажте файл у шаблоні.
                                    </Typography>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button size="sm" color="blue" disabled={!selectedItemTypeId}
                                        onClick={handleAddProjects}
                                        className="flex items-center gap-1.5 px-3 py-2 shadow-sm">
                                    <i className="fa-regular fa-plus"></i>
                                    <span className="hidden sm:inline">Додати файл</span>
                                    <span className="sm:hidden">Додати</span>
                                </Button>
                                {
                                    Boolean(projects?.data?.length) &&
                                    <LoadingButton isLoading={findDuplicateMutation.isPending} size="sm"
                                                   variant="outlined" color="blue"
                                                   disabled={findDuplicateMutation.isPending}
                                                   onClick={findDuplicates}>
                                        <span className="flex items-center gap-1.5">
                                            <i className="fa-solid fa-database"></i>
                                            <span className="hidden sm:inline">Перевірити дублікати</span>
                                            <span className="sm:hidden">Дублікати</span>
                                        </span>
                                    </LoadingButton>
                                }
                            </div>
                        </div>
                    </div>

                    <div className="mt-1">
                        <TableValidationV2 validation={errors} warnings={warnings} data={projects?.data}
                                           headers={projects?.headerColumns}/>
                    </div>
                </Card>
                {
                    isModal &&
                    <ImportFile
                        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        open={isModal}
                        extraContent={itemTypeOptions}
                        handleSubmit={handleUpload}
                        isLoading={upload.isPending}
                        formatText="Формати: .xls, .xlsx"
                        onClose={closeImport}/>
                }
                {
                    importProjects.isSuccess &&
                    <Dialog open={importProjects.isSuccess} size="xl">
                        <DialogHeader
                            className="dark:text-gray-200">Імпортовано успішно</DialogHeader>
                        <DialogBody className="max-h-[65vh] overflow-auto pt-0">
                            <Typography className="mb-2 text-sm font-medium dark:text-slate-200">
                                Додано проєктів: {importedCount}
                            </Typography>
                            {
                                isImportDetailsLoading &&
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <Spinner className="h-4 w-4"/>
                                    <span>Завантаження деталей...</span>
                                </div>
                            }
                            {
                                !isImportDetailsLoading && Boolean(importedProjectsData?.length) &&
                                <div
                                    className="rounded-md border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                                    <div className="overflow-auto">
                                        <table className="min-w-full text-xs text-slate-700 dark:text-slate-200">
                                            <thead
                                                className="bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-slate-200">
                                            <tr>
                                                <th className="border border-slate-200 px-2 py-1 dark:border-gray-700">Дія</th>
                                                <th className="border border-slate-200 px-2 py-1 dark:border-gray-700">Стан</th>
                                                <th className="border border-slate-200 px-2 py-1 dark:border-gray-700">Тип</th>
                                                <th className="border border-slate-200 px-2 py-1 dark:border-gray-700">Назви/ДН</th>
                                                <th className="border border-slate-200 px-2 py-1 dark:border-gray-700">Країни</th>
                                                <th className="border border-slate-200 px-2 py-1 dark:border-gray-700">Ідентифікаційні
                                                    дані
                                                </th>
                                                <th className="border border-slate-200 px-2 py-1 dark:border-gray-700">Дод.інформація</th>
                                                <th className="border border-slate-200 px-2 py-1 dark:border-gray-700">Термін</th>
                                                <th className="border border-slate-200 px-2 py-1 dark:border-gray-700">Категорії</th>
                                                <th className="border border-slate-200 px-2 py-1 dark:border-gray-700">Документи</th>
                                                <th className="border border-slate-200 px-2 py-1 dark:border-gray-700">Виконавець</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {importedProjectsData.map((row) => {
                                                const parsed = row.precomputedData;
                                                const action = projectActionType.find((item) => item.id === row.actionType);
                                                const performer = users.find((u) => u.id === row.performerId);
                                                const termCaption = terms.find((t) => t.id === row.termId)?.caption || "";

                                                return (
                                                    <tr key={row.id}
                                                        className="bg-white hover:bg-slate-50 dark:bg-gray-900 dark:hover:bg-gray-800/70">
                                                        <td className="align-top border border-slate-200 px-2 py-1 dark:border-gray-700">
                                                            <Tooltip content={action?.caption || ""}>
                                                                <span>{action?.icon ?
                                                                    <i className={action.icon}></i> : action?.caption || ""}</span>
                                                            </Tooltip>
                                                        </td>
                                                        <td className="align-top border border-slate-200 px-2 py-1 dark:border-gray-700">{renderStateIcon(row.stateId)}</td>
                                                        <td className="align-top border border-slate-200 px-2 py-1 dark:border-gray-700">{renderSubjectType(row.subjectTypeId)}</td>
                                                        <td className="align-top border border-slate-200 px-2 py-1 dark:border-gray-700">
                                                            {row.nameUk ? <><strong><i
                                                                className="fa-light fa-input-text mr-1"></i>{row.nameUk}
                                                            </strong><br/></> : null}
                                                            {row.nameRu ? <><i
                                                                className="fa-light fa-input-text mr-1"></i>{row.nameRu}<br/></> : null}
                                                            {row.nameEn ? <><i
                                                                className="fa-light fa-input-text mr-1"></i>{row.nameEn}<br/></> : null}
                                                            {row.birthDate ? <><i
                                                                className="fa-solid fa-calendar-days mr-1"></i>{row.birthDate}<br/></> : null}
                                                            {row.drsId ? <span className="text-green-500"><i
                                                                className="fa-solid fa-solar-system mr-1"></i>{row.drsId}</span> : null}

                                                        </td>
                                                        <td className="align-top border border-slate-200 px-2 py-1 dark:border-gray-700">{renderCountries(parsed)}</td>
                                                        <td className="align-top border border-slate-200 px-2 py-1 dark:border-gray-700">{renderIdentifiers(parsed)}</td>
                                                        <td className="align-top border border-slate-200 px-2 py-1 dark:border-gray-700">{renderAttributes(row, parsed)}</td>
                                                        <td className="align-top border border-slate-200 px-2 py-1 dark:border-gray-700">{termCaption}</td>
                                                        <td className="align-top border border-slate-200 px-2 py-1 dark:border-gray-700">{renderCategories(parsed)}</td>
                                                        <td className="align-top border border-slate-200 px-2 py-1 dark:border-gray-700">{renderDocuments(row, parsed)}</td>
                                                        <td className="align-top border border-slate-200 px-2 py-1 dark:border-gray-700">{performer?.name || ""}</td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            }
                        </DialogBody>
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
                    duplicateOpen && <DuplicateProjectsModal {...duplicateDialogProps} open={duplicateOpen}
                                                             onClose={handleDuplicateClose}/>
                }
                {
                    confirmImportOpen && (
                        <Dialog open={confirmImportOpen} size="sm" handler={handleCancelImport}>
                            <DialogHeader className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                <i className="fa-regular fa-triangle-exclamation"></i>
                                <span>Підтвердження імпорту</span>
                            </DialogHeader>
                            <DialogBody className="dark:text-slate-200">
                                Дані містять неточності, всеодно імпортувати?
                            </DialogBody>
                            <DialogFooter className="gap-2">
                                <Button variant="outlined" color="red"
                                        onClick={handleCancelImport}
                                        disabled={importProjects.isPending}>
                                    Ні
                                </Button>
                                <LoadingButton isLoading={importProjects.isPending}
                                               color="green"
                                               onClick={handleConfirmImport}
                                               disabled={importProjects.isPending}>
                                    Так
                                </LoadingButton>
                            </DialogFooter>
                        </Dialog>
                    )
                }
                {
                    invalidFieldsOpen && (
                        <Dialog open={invalidFieldsOpen} size="lg" handler={handleInvalidFieldsClose}>
                            <DialogHeader className="flex items-center gap-2 text-red-700 dark:text-red-300">
                                <i className="fa-regular fa-triangle-exclamation"></i>
                                <span>422 Невалідні дані</span>
                            </DialogHeader>
                            <div className="px-4 pb-2">
                                <Typography className="text-sm text-slate-700 dark:text-slate-200">
                                    {invalidFieldsDialogProps?.message || "Некоректні параметри запиту"}
                                </Typography>
                            </div>
                            <div className="px-4 pb-1">
                                <div
                                    className="max-h-[55vh] overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
                                    {(invalidFieldsDialogProps?.invalidFields || []).map((item, index) => (
                                        <div key={index}
                                             className="mb-3 rounded border border-slate-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800/80">
                                            <Typography
                                                className="mb-1 text-xs font-semibold text-red-700 dark:text-red-300">
                                                {index + 1}. Помилка
                                            </Typography>
                                            <Typography
                                                className="whitespace-pre-line text-xs leading-5 text-slate-700 dark:text-slate-200">
                                                {(String(item || "")).split("; ").join(";\n")}
                                            </Typography>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button color="red" onClick={handleInvalidFieldsClose}>
                                    Закрити
                                </Button>
                            </DialogFooter>
                        </Dialog>
                    )
                }
            </Page>
        </DictionaryProvider>
    );
};

export default UploadProjectsV2;
