import {useQuery} from "@tanstack/react-query";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Typography} from "@material-tailwind/react";
import React from "react";
import {usePage} from "@inertiajs/react";
import DetailsLayout from "./layouts/DetailsLayout.jsx";

const ProjectDetails = ({open, onClose, id}) => {
    const {
        auth,
        user
    } = usePage().props;

    const {data = {data: null}, isFetching} = useQuery({
        queryKey: ['project-show', id],
        queryFn: async () => {
            const response = await axios.get(`/api/project/new/${id}`, {
                headers: {"userId": auth?.user?.id}
            });
            return response.data;
        }
    })
    const project = data?.data;


    return (
        <Dialog open={open} handler={onClose} size="xxl">
            <DialogHeader>
                <div className="flex flex-col gap-1">
                    <div className="flex space-x-1">
                        <Typography variant="h4" className="dark:text-slate-200">
                            Проєкт: {project?.actionType}
                        </Typography>
                        {/*{*/}
                        {/*    Boolean(auth?.user?.permissions?.pages?.project?.update) &&*/}
                        {/*    <Link href={`/project/new/${id}/edit`}>*/}
                        {/*        <IconButton title="Редагувати проєкт" size="sm" color="blue" >*/}
                        {/*            <i className="fa-regular fa-pen-to-square"></i>*/}
                        {/*        </IconButton>*/}
                        {/*    </Link>*/}
                        {/*}*/}
                    </div>
                    <Typography variant="small">ID: {project?.id}</Typography>
                </div>
            </DialogHeader>
            <DialogBody className="relative overflow-y-auto">
                {
                    isFetching ?
                        <div className="flex justify-center">
                            <Spinner/>
                        </div>
                        : <DetailsLayout project={project}/>
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
            </DialogFooter>
        </Dialog>
    );
};

export default ProjectDetails;
