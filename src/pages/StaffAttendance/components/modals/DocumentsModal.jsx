import PropTypes from 'prop-types';
import { Modal, ModalHeader } from "../../../../components/Modal/Modal.jsx"
import CloseButton from "../../../../components/Buttons/CloseButton.jsx"
import DocumentManager from '../DocumentManager.jsx';

const DocumentsModal = ({ isOpen, onClose, absence }) => {
    return (
        <Modal data-i-doc="modal:staff-attendance-documents" open={isOpen} handler={onClose} size="md">
            <ModalHeader hideClose className="flex justify-between items-center">
                Документи — {absence?.user}
                <CloseButton onClick={onClose} />
            </ModalHeader>
            {absence && (
                <div className="p-4">
                    <DocumentManager key={absence.id} absenceId={absence.id} documents={absence.documents || []} />
                </div>
            )}
        </Modal>
    );
};

DocumentsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    absence: PropTypes.shape({
        id: PropTypes.number,
        user: PropTypes.string,
        documents: PropTypes.array,
    }),
};

export default DocumentsModal;
