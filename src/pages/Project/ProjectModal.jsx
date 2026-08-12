import {usePage} from "@inertiajs/react";
import {useQuery} from "@tanstack/react-query";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Typography} from "@material-tailwind/react";
import React, {useState} from "react";
import EditLayout from "./layouts/EditLayout.jsx";

const ProjectModal = ({open, onClose, id}) => {
    const {
        auth,
    } = usePage().props;

    const {data = {data: null}, isFetching} = useQuery({
        queryKey: ['project-show', id],
        queryFn: async () => {
            const response = await axios.get(`/api/project/new/${id}`, {
                headers: {"userId": auth?.user?.id}
            });
            return response.data;
        }
    });
    const project = data?.data;
    const isEdit  = Boolean(project);


    const handleSubmit = () => {

    }

    return (
        <Dialog open={open} handler={onClose} size="xxl">
            <DialogHeader>
                {
                    isEdit ?
                        <div className="flex flex-col gap-1">
                            <Typography variant="h4" className="dark:text-slate-200">
                                Проєкт: {project?.actionType}
                            </Typography>
                            <Typography variant="small">ID: {project?.id}</Typography>

                        </div>
                        :
                        <Typography variant="h5">Створити проєкт</Typography>
                }
            </DialogHeader>
            <DialogBody className="relative overflow-y-auto">
            {
                    isEdit && isFetching ?
                        <div className="flex justify-center">
                            <Spinner/>
                        </div>
                        :
                        <EditLayout pproject={project}/>
                }

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
                <Button color="green" onClick={handleSubmit}
                        // disabled={Boolean(isFetching)}
                    disabled
                >
                    {
                        isEdit ? "Редагувати" : "Створити"
                    }
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default ProjectModal;
