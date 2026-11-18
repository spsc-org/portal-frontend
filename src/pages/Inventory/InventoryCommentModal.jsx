import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { InventoryCommentViewModel } from "./viewmodel/InventoryViewModels.js";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/Modal/Modal.jsx"
import Button from "../../components/Buttons/Button.jsx"

/**
 * modal: null | {mode:'add', inventoryId} | {mode:'edit', inventoryId, comment}
 */
/** Монтується з key (новий VM на кожне відкриття). */
const InventoryCommentModal = ({modal, onClose}) => {
    const vm = useViewModel((deps) => new InventoryCommentViewModel({ ...deps, modal }));
    const text = vm.text;
    const setText = vm.setText;
    const handleSubmit = () => vm.submit(onClose);
    const isPending = vm.isPending;

    return (
        <Modal open={!!modal} handler={onClose} size="sm">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">{modal?.mode === 'add' ? 'Додати коментар' : 'Редагувати коментар'}</h3>
            </ModalHeader>
            <ModalBody className="py-2">
                <textarea
                    autoFocus
                    rows={4}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
                    className="w-full rounded border border-gray-200 dark:border-neutral-600
                               dark:bg-neutral-900 dark:text-gray-100
                               p-2 text-sm resize-none
                               focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Текст коментаря…"
                />
                <p className="text-[11px] text-gray-600 mt-1">Ctrl+Enter — зберегти</p>
            </ModalBody>
            <ModalFooter className="gap-2 py-2">
                <Button color="secondary" size="sm" onClick={onClose}>Скасувати</Button>
                <Button size="sm" color="blue" onClick={handleSubmit} disabled={!text.trim() || isPending}>
                    {isPending ? 'Збереження…' : 'Зберегти'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(InventoryCommentModal);
