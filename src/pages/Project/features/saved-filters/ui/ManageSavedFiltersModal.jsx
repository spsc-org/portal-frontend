import { observer } from "mobx-react-lite";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../../../../../components/Modal/Modal.jsx";
import Button from "../../../../../components/Buttons/Button.jsx";
import IconButton from "../../../../../components/Buttons/IconButton.jsx";
import { FIELD_CLASS } from "./fieldClass.js";

// «Керувати наборами»: перейменування (Enter / втрата фокусу), за замовчуванням (★),
// перезапис поточними фільтрами, видалення.
const ManageSavedFiltersModal = ({ saved }) => {
    const items = saved.manageOpen ? saved.sets : [];
    return (
        <Modal open={saved.manageOpen} onClose={saved.closeManage} size="md" data-i-doc="modal:project-manage-saved-filters">
            <ModalHeader title="Збережені набори фільтрів" />
            <ModalBody className="flex flex-col gap-2">
                {items.length === 0 ? (
                    <p className="m-0 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Збережених наборів ще немає. Налаштуйте фільтри й натисніть «Зберегти фільтри».
                    </p>
                ) : (
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                        {items.map((set) => {
                            const summary = saved.items.find((item) => item.id === set.id)?.summary ?? "";
                            const error = saved.renameErrors[set.id];
                            return (
                                <li key={set.id} className="flex items-start gap-2 rounded-lg border border-gray-200 p-2 dark:border-neutral-700">
                                    <IconButton
                                        size="sm"
                                        variant="text"
                                        title={set.isDefault ? "За замовчуванням (зняти)" : "Зробити за замовчуванням"}
                                        aria-pressed={set.isDefault}
                                        onClick={() => saved.toggleDefault(set.id)}
                                        className={set.isDefault ? "text-amber-500 dark:text-amber-400" : ""}
                                    >
                                        <i className={`${set.isDefault ? "fa-solid" : "fa-regular"} fa-star text-sm`} aria-hidden="true" />
                                    </IconButton>
                                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                                        <input
                                            type="text"
                                            maxLength={60}
                                            aria-label={`Назва набору «${set.name}»`}
                                            value={saved.renames[set.id] ?? set.name}
                                            onChange={(event) => saved.setRename(set.id, event.target.value)}
                                            onBlur={() => saved.commitRename(set.id)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    event.preventDefault();
                                                    event.currentTarget.blur();
                                                }
                                            }}
                                            aria-invalid={Boolean(error)}
                                            className={`${FIELD_CLASS} ${error ? "border-red-500 dark:border-red-500" : ""}`}
                                        />
                                        {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
                                        <span className="truncate text-xs text-gray-600 dark:text-gray-400" title={summary}>
                                            {summary}
                                            {set.id === saved.activeId && <span className="ml-1 text-blue-600 dark:text-blue-400">· вибраний</span>}
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        color="secondary"
                                        disabled={!saved.hasActiveFilters}
                                        title="Замінити фільтри набору поточними фільтрами сторінки"
                                        onClick={() => saved.overwrite(set.id)}
                                    >
                                        Оновити поточними
                                    </Button>
                                    <IconButton
                                        size="sm"
                                        variant="text"
                                        title={`Видалити «${set.name}»`}
                                        onClick={() => saved.removeFromManage(set.id)}
                                        className="hover:text-red-600 dark:hover:text-red-400"
                                    >
                                        <i className="fa-regular fa-trash-can text-sm" aria-hidden="true" />
                                    </IconButton>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={saved.closeManage}>
                    Закрити
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(ManageSavedFiltersModal);
