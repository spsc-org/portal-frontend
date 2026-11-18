import { observer } from "mobx-react-lite";
import { Spinner } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"

/** Пов'язані проєкти суб'єкта (поки — сирий JSON, як і в Inertia-версії). */
const SubjectDetailsModal = ({ vm }) => (
    <Modal open={vm.detailsId != null} onClose={vm.closeDetails} size="xl">
        <ModalHeader title="Пов'язані проєкти"/>
        <ModalBody className="relative min-h-[16rem]">
            {vm.detailsQuery.isLoading && (
                <div className="flex h-48 items-center justify-center">
                    <Spinner className="h-12 w-12"/>
                </div>
            )}
            {vm.detailsQuery.data && (
                <pre className="m-0 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200">
                    {JSON.stringify(vm.linkedProjects, null, 2)}
                </pre>
            )}
        </ModalBody>
        <ModalFooter>
            <Button color="secondary" onClick={vm.closeDetails}>
                Закрити
            </Button>
        </ModalFooter>
    </Modal>
);

export default observer(SubjectDetailsModal);
