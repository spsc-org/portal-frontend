import {usePage} from "@inertiajs/react";
import {useQuery} from "@tanstack/react-query";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import {format} from "date-fns";
import React, {useMemo} from "react";


const ProposalDetailsModal = ({selectedId: id, open = false, onClose}) => {
    const {auth, users = [], issuers = [], proposalState = []} = usePage().props;
    const {data = {data: null}} = useQuery({
        queryKey: ['proposal-update', id],
        queryFn: async () => {
            const response = await axios.get(`/api/proposal/new/${id}`, {
                headers: {"userId": auth?.user?.id}
            });
            return response.data;
        }
    })

    const proposal = useMemo(() => {
        const {data: result} = data;
        return {
            ...result,
            createdAt: result?.createdAt || result?.created_at,
            updatedAt: result?.updatedAt || result?.updated_at,
            deletedAt: result?.deletedAt || result?.deleted_at,
        }

    }, [data])
    return (
        <Dialog open={open} handler={onClose} size="md">
            <DialogHeader className="dark:text-gray-200 space-x-5">
                <span>Подання: {proposal?.outgoingNumber}</span>
                {
                    proposal?.isHistorical &&
                    <i className="fa-solid fa-lock text-blue-600" title="Зафіксований"></i>

                }
            </DialogHeader>
            <DialogBody className="h-[26rem] overflow-y-auto">
                <div className="grid grid-cols-2 mb-2">
                    <div className="flex flex-col gap-x-2">
                        <p className="font-bold dark:text-gray-50">Назва:</p>
                        <p className="font-normal dark:text-slate-400">{proposal?.caption}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Реєстраційний номер:</p>
                        <p className="font-normal dark:text-slate-400">{proposal?.outgoingNumber}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Реєстраційна дата:</p>
                        <p className="font-normal dark:text-slate-400">{proposal?.outgoingDate ? format(proposal?.outgoingDate, "dd.MM.yyyy") : "-"}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Суб'єкт подання:</p>
                        <p className="font-normal dark:text-slate-400">{proposal?.issuerId ? issuers.find(i => i.id === proposal?.issuerId)?.caption : "-"}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Стан:</p>
                        <p className="font-normal dark:text-slate-400">{proposal?.stateId ? proposalState.find(s => s.id === proposal?.stateId)?.caption : "-"}</p>
                    </div>

                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">К-сть юридичних:</p>
                        <p className="font-normal dark:text-slate-400">{proposal?.calcLegal}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">К-сть фізичних:</p>
                        <p className="font-normal dark:text-slate-400">{proposal?.calcPerson}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Дата створення:</p>
                        <p className="font-normal dark:text-slate-400">{proposal?.createdAt ? format(proposal?.createdAt, "dd.MM.yyyy") : "-"}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Створив:</p>
                        <p className="font-normal dark:text-slate-400">{proposal?.createdUserId ? users.find(s => s.id === proposal?.createdUserId)?.name : "-"}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Дата оновлення:</p>
                        <p className="font-normal dark:text-slate-400">{proposal?.updatedAt ? format(proposal?.updatedAt, "dd.MM.yyyy") : "-"}</p>
                    </div>

                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Оновив:</p>
                        <p className="font-normal dark:text-slate-400">{proposal?.updatedUserId ? users.find(s => s.id === proposal?.updatedUserId)?.name : "-"}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Дата видалення:</p>
                        <p className="font-normal dark:text-slate-400">{proposal?.deletedAt ? format(proposal?.deletedAt, "dd.MM.yyyy") : "-"}</p>
                    </div>

                </div>
                <div className="flex flex-col gap-x-2">
                    <p className="font-bold dark:text-gray-50">Summary:</p>
                    <p className="font-normal dark:text-slate-400">{proposal?.calcSummary ?
                        <div dangerouslySetInnerHTML={{__html: proposal?.calcSummary}}></div> : null}</p>
                </div>
                <div className="flex flex-col gap-x-2 max-h-44 overflow-auto">
                    <p className="font-bold dark:text-gray-50">Опис:</p>
                    <p className="font-normal dark:text-slate-400">{proposal?.description}</p>
                </div>
                <div className="flex flex-col gap-x-2 max-h-44 overflow-auto">
                    <p className="font-bold dark:text-gray-50">Коментар:</p>
                    <p className="font-normal dark:text-slate-400 ">{proposal?.comments}</p>
                </div>

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

export default ProposalDetailsModal;
