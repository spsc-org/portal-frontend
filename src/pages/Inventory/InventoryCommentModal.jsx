import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { InventoryCommentViewModel } from "./viewmodel/InventoryViewModels.js";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader} from "@material-tailwind/react";

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
        <Dialog open={!!modal} handler={onClose} size="sm">
            <DialogHeader className="text-sm py-3">
                {modal?.mode === 'add' ? 'Додати коментар' : 'Редагувати коментар'}
            </DialogHeader>
            <DialogBody className="py-2">
                <textarea
                    autoFocus
                    rows={4}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
                    className="w-full rounded border border-gray-300 dark:border-gray-600
                               dark:bg-gray-700 dark:text-gray-100
                               p-2 text-sm resize-none
                               focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Текст коментаря…"
                />
                <p className="text-[11px] text-gray-400 mt-1">Ctrl+Enter — зберегти</p>
            </DialogBody>
            <DialogFooter className="gap-2 py-2">
                <Button size="sm" color="white" onClick={onClose}>Скасувати</Button>
                <Button size="sm" color="blue" onClick={handleSubmit} disabled={!text.trim() || isPending}>
                    {isPending ? 'Збереження…' : 'Зберегти'}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default observer(InventoryCommentModal);
