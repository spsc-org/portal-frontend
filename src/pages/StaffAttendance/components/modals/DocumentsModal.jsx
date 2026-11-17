import PropTypes from 'prop-types';
import { Dialog, DialogHeader } from "@material-tailwind/react";
import DocumentManager from '../DocumentManager.jsx';

const DocumentsModal = ({ isOpen, onClose, absence }) => {
    return (
        <Dialog data-i-doc="modal:staff-attendance-documents" open={isOpen} handler={onClose} size="md">
            <DialogHeader className="flex justify-between items-center">
                Документи — {absence?.user}
                <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                    <i className="fa-solid fa-times"></i>
                </button>
            </DialogHeader>
            {absence && (
                <div className="p-4">
                    <DocumentManager key={absence.id} absenceId={absence.id} documents={absence.documents || []} />
                </div>
            )}
        </Dialog>
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
