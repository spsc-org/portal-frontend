import { observer } from "mobx-react-lite";
import { Spinner, Typography } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"

/** Пов'язані проєкти суб'єкта (поки — сирий JSON, як і в Inertia-версії). */
const SubjectDetailsModal = ({ vm }) => (
    <Modal open={vm.detailsId != null} handler={vm.closeDetails} size="xl">
        <ModalHeader>
            <Typography variant="h5" className="dark:text-gray-200">Пов'язані проєкти</Typography>
        </ModalHeader>
        <ModalBody className="h-[32rem] relative overflow-y-auto">
            {vm.detailsQuery.isLoading && (
                <div className="bg-gray-950/20 absolute top-0 left-0 w-full h-full z-[999] flex justify-center items-center">
                    <Spinner className="h-12 w-12"/>
                </div>
            )}
            {vm.detailsQuery.data && JSON.stringify(vm.linkedProjects, null, 2)}
        </ModalBody>
        <ModalFooter>
            <Button color="secondary" onClick={vm.closeDetails} className="mr-1">
                <span>Закрити</span>
            </Button>
        </ModalFooter>
    </Modal>
);

export default observer(SubjectDetailsModal);
