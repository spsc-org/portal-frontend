import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { ProjectDetailsViewModel } from "./ProjectDetailsViewModel.js";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Typography} from "@material-tailwind/react";
import DetailsLayout from "./DetailsLayout.jsx";

/** Модалка перегляду проєкту (спільна: подання, досьє, етап 6 — /project). */
const ProjectDetails = ({open, onClose, id}) => {
    const vm = useViewModel((deps) => new ProjectDetailsViewModel({ ...deps, id }));
    const project = vm.project;
    const isFetching = vm.isFetching;

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
                        : <DetailsLayout project={project} vocabulary={vm.vocabulary}/>
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

export default observer(ProjectDetails);
