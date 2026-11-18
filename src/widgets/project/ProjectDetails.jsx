import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { ProjectDetailsViewModel } from "./ProjectDetailsViewModel.js";
import { Spinner, Typography } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/Modal/Modal.jsx"
import Button from "../../components/Buttons/Button.jsx"
import DetailsLayout from "./DetailsLayout.jsx";

/** Модалка перегляду проєкту (спільна: подання, досьє, етап 6 — /project). */
const ProjectDetails = ({open, onClose, id}) => {
    const vm = useViewModel((deps) => new ProjectDetailsViewModel({ ...deps, id }));
    const project = vm.project;
    const isFetching = vm.isFetching;

    return (
        <Modal open={open} handler={onClose} size="xxl">
            <ModalHeader>
                <div className="flex flex-col gap-1">
                    <div className="flex space-x-1">
                        <Typography variant="h4" className="dark:text-gray-200">
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
            </ModalHeader>
            <ModalBody className="relative overflow-y-auto">
                {
                    isFetching ?
                        <div className="flex justify-center">
                            <Spinner/>
                        </div>
                        : <DetailsLayout project={project} vocabulary={vm.vocabulary}/>
                }
            </ModalBody>
            <ModalFooter>
                <Button
                    color="secondary"
                    onClick={onClose}
                    className="mr-1">
                    <span>Закрити</span>
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(ProjectDetails);
