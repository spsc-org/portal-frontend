import {
    Button,
    ButtonGroup,
    Card,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Tooltip,
    Typography
} from "@material-tailwind/react";
import React, {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {usePage} from "@inertiajs/react";
import {createColumnHelper} from "@tanstack/react-table";
import Table from "@/Components/Table/Table.jsx";
import {convertDate} from "@/utils.js";
import {format} from "date-fns";
import {serializeParams} from "../../utils.js";

const columnHelper = createColumnHelper();
const DocumentModal = ({selectedId, open = false, onClose}) => {
    const {
        auth,
        users = [],
        units = [],
        types = [],
    } = usePage().props;

    const {data: document, isLoading} = useQuery({
        queryKey: ["document", selectedId],
        queryFn: async () => {
            const response = await axios.get(`api/document/${selectedId}`, {
                headers: {"userId": auth?.user?.id}
            })
            return response?.data?.data;
        },
        enabled: !!selectedId
    });

    const redirectToProjects = () => {
        const settingsKey = 'project-settings';
        const currentSettings = JSON.parse(localStorage.getItem(settingsKey)) || {
            filters: {},
            build: 1.30
        };

        if (!currentSettings.filters) {
            currentSettings.filters = {};
        }

        if (!currentSettings.filters.fDocument) {
            currentSettings.filters.fDocument = {
                "type": "text",
                "width": "w-[150px]",
                "caption": "Документ",
                "vocName": null,
                "val": "",
                "enabled": true
            };
        }

        currentSettings.filters.fDocument.val = `${document?.regNum || ''}`.trim();
        localStorage.setItem(settingsKey, JSON.stringify(currentSettings));

        window.location.href = `/project`;
    }



    return (
        <Dialog open={open} handler={onClose} size="sm">
            <DialogHeader className="dark:text-gray-200">
                <span className="mr-5">Детальна інформація: {document?.regNum}
                    <span>  {Boolean(document?.regDate) ? format(document?.regDate, "dd.MM.yyyy") : null}</span></span>
            </DialogHeader>
            <DialogBody className="h-fit overflow-y-auto">
                <div className="mb-2 inline-flex gap-x-6 self-center dark:text-slate-400 items-center">
                    <Typography variant={"small"} className="font-normal ">Кількість
                        проєктів:</Typography>
                        <Button onClick={redirectToProjects} variant="filled" size="sm">
                            <div className="flex gap-2">
                                <div>
                                    <Typography variant={"small"} className="font-normal inline-flex">
                                        <div className="w-4">
                                            <i className="fa-regular fa-person"></i>
                                        </div>
                                        <span>{document?.personalCount || 0}</span>
                                    </Typography>
                                </div>
                                <div>
                                    <Typography variant={"small"} className="font-normal inline-flex">
                                        <div className="w-4">
                                            <i className="fa-regular fa-industry"></i>
                                        </div>
                                        <span>{document?.legalCount || 0}</span>
                                    </Typography>
                                </div>
                                <div>
                                    <Typography variant={"small"} className="font-normal inline-flex">
                                        <div className="w-4">
                                            <i className="fa-regular fa-ship"></i>
                                        </div>
                                        <span>{document?.vesselCount || 0}</span>
                                    </Typography>
                                </div>
                                <div>
                                    <Typography variant={"small"} className="font-normal inline-flex">
                                        <div className="w-4">
                                            <i className="fa-regular fa-plane"></i>
                                        </div>
                                        <span>{document?.aircraftCount || 0}</span>
                                    </Typography>
                                </div>

                            </div>
                        </Button>
                </div>

                <Card className=" p-2 grid grid-cols-2 gap-1 bg-gray-900/10 dark:bg-gray-900">
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Назва:</p>
                        <p className="font-normal dark:text-slate-400">{document?.caption}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Реєстраційний номер:</p>
                        <p className="font-normal dark:text-slate-400">{document?.regNum}
                            <span>  {Boolean(document?.regDate) ? format(document?.regDate, "dd.MM.yyyy") : null}</span>
                        </p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Тип:</p>
                        <p className="font-normal dark:text-slate-400">{Boolean(document?.typeId) ? types.find(type => type.id === document.typeId)?.caption : null}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Підрозділ:</p>
                        <p className="font-normal dark:text-slate-400">{Boolean(document?.unitId) ? units.find(unit => unit.id === document.unitId)?.caption : null}</p>
                    </div>
                    <div className="inline-flex gap-x-2 max-w-[450px]">
                        <p className="font-bold dark:text-gray-50">Шлях:</p>
                        {document?.path ?
                            <div className=" bg-slate-800 w-full dark:bg-slate-950 px-1 py-0.5 rounded-md">
                            <span
                                className="text-xs font-normal break-words text-green-500 dark:text-green-700">{document?.path}</span>
                            </div>
                            : null
                        }
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Коментар:</p>
                        <p className="font-normal dark:text-slate-400">{document?.comments}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Створений:</p>
                        <p className="font-normal dark:text-slate-400">{Boolean(document?.createdAt) ? format(document?.createdAt, "dd.MM.yyyy") : null}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Оновлений:</p>
                        <p className="font-normal dark:text-slate-400">{Boolean(document?.updatedAt) ? format(document?.updatedAt, "dd.MM.yyyy") : null}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Створив:</p>
                        <p className="font-normal dark:text-slate-400">{Boolean(document?.createdUserId) ? users.find(u => u.id === document.createdUserId)?.name : null}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Оновив:</p>
                        <p className="font-normal dark:text-slate-400">{Boolean(document?.updatedUserId) ? users.find(u => u.id === document.updatedUserId)?.name : null}</p>
                    </div>

                </Card>

            </DialogBody>
            <DialogFooter>
                <Button
                    variant="text"
                    color="red"
                    onClick={onClose}
                    className="mr-1">
                    <span>Закрити</span>
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default DocumentModal;
