import { observer } from "mobx-react-lite";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../../../../../components/Modal/Modal.jsx";
import Button from "../../../../../components/Buttons/Button.jsx";
import { FIELD_CLASS } from "./fieldClass.js";

// «Зберегти фільтри»: новий набір (назва + «за замовчуванням») або оновлення вибраного.
const SaveFiltersModal = ({ saved }) => {
    const draft = saved.saveDraft;
    const isUpdate = draft?.mode === "update";
    const onSubmit = (event) => {
        event.preventDefault();
        saved.submitSave();
    };
    return (
        <Modal open={Boolean(draft)} onClose={saved.closeSave} size="xs" data-i-doc="modal:project-save-filters">
            <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
                <ModalHeader title="Зберегти фільтри" />
                <ModalBody className="flex flex-col gap-3">
                    {saved.canUpdateActive && (
                        <fieldset className="flex flex-col gap-1.5">
                            <legend className="sr-only">Куди зберегти</legend>
                            <label className="flex cursor-pointer items-center gap-2">
                                <input type="radio" name="save-mode" checked={isUpdate} onChange={() => saved.setSaveMode("update")} className="h-4 w-4 text-blue-600" />
                                <span>
                                    Оновити «<b>{saved.active.name}</b>»
                                </span>
                            </label>
                            <label className="flex cursor-pointer items-center gap-2">
                                <input type="radio" name="save-mode" checked={!isUpdate} onChange={() => saved.setSaveMode("new")} className="h-4 w-4 text-blue-600" />
                                <span>Зберегти як новий набір</span>
                            </label>
                        </fieldset>
                    )}

                    {!isUpdate && (
                        <div className="flex flex-col gap-1">
                            <label htmlFor="saved-filter-name" className="text-xs text-gray-600 dark:text-gray-400">
                                Назва набору
                            </label>
                            <input
                                id="saved-filter-name"
                                type="text"
                                autoFocus
                                maxLength={60}
                                value={draft?.name ?? ""}
                                onChange={(event) => saved.setSaveName(event.target.value)}
                                placeholder="Напр. «Юр. особи — діючі»"
                                aria-invalid={Boolean(draft?.error)}
                                className={`${FIELD_CLASS} ${draft?.error ? "border-red-500 dark:border-red-500" : ""}`}
                            />
                            {draft?.error && <span className="text-xs text-red-600 dark:text-red-400">{draft.error}</span>}
                        </div>
                    )}

                    <p className="m-0 text-xs text-gray-600 dark:text-gray-400">{saved.currentSummary}</p>

                    <label className="flex cursor-pointer items-start gap-2">
                        <input
                            type="checkbox"
                            checked={Boolean(draft?.isDefault)}
                            onChange={(event) => saved.setSaveDefault(event.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded text-blue-600"
                        />
                        <span>
                            За замовчуванням
                            <span className="block text-xs text-gray-600 dark:text-gray-400">Застосовується на першому відкритті та після «Скинути все»</span>
                        </span>
                    </label>
                </ModalBody>
                <ModalFooter>
                    <Button type="button" color="secondary" onClick={saved.closeSave}>
                        Скасувати
                    </Button>
                    <Button type="submit" data-testid="saved-filters-submit">
                        {isUpdate ? "Оновити" : "Зберегти"}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
};

export default observer(SaveFiltersModal);
