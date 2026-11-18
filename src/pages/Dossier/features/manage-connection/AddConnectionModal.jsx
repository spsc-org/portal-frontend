import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { SourceSearchViewModel } from "../../viewmodel/DossierViewModels.js";
import {useEffect, useState} from "react";
import { Spinner } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../../components/Modal/Modal.jsx"
import Button from "../../../../components/Buttons/Button.jsx"
import {MODEL_CLASS_OPTIONS} from "../../shared/config/sourceTypes.js";

import ConnectionSourceDetails from "../../widgets/ProfileDetailPane/ConnectionSourceDetails.jsx";
// Ручне створення звʼязку профіль↔джерело (POST .../connections, той самий link(),
// що й "Прив'язати" в DuplicatesPanel — тут без пошуку дублікатів-профілів, напряму):
// вибір типу джерела → пошук довільним текстом (SourceSearchService, LIKE по
// name/aliases чи nameUk/nameRu/nameEn, і по id, якщо запит — саме число) → вибір
// кандидата зі списку → живий preview обраного (ConnectionSourceDetails, той самий
// компонент, що й у Картці звʼязку), перш ніж підтвердити привʼязку.
const AddConnectionModal = ({open, isPending, onClose, onConfirm}) => {
    const vm = useViewModel((deps) => new SourceSearchViewModel({ ...deps, initialModelClass: String(MODEL_CLASS_OPTIONS[0].id) }));
    const modelClass = vm.modelClass;
    const setModelClass = vm.setModelClass;
    const [query, setQuery] = useState("");
    const debouncedQuery = vm.debouncedQuery;
    const setDebouncedQuery = vm.setDebouncedQuery;
    const [selected, setSelected] = useState(null);

    // Дебаунс введення 300 мс (таймер — у View).
    useEffect(() => {
        const timer = setTimeout(() => vm.setDebouncedQuery(query.trim()), 300);
        return () => clearTimeout(timer);
    }, [vm, query]);

    const searchEnabled = debouncedQuery.length >= 2;
    const results = vm.results;
    const isFetching = vm.isFetching;

    const handleClose = () => {
        setModelClass(String(MODEL_CLASS_OPTIONS[0].id));
        setQuery("");
        setDebouncedQuery("");
        setSelected(null);
        onClose();
    };

    return (
        <Modal data-i-doc="modal:sanction-profiles-add-connection"
            open={open}
            handler={handleClose}
            size="sm"
            className="border"
            overlayProps={{className: "bg-black/20 backdrop-blur-none"}}>
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">Додати звʼязок</h3>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-3">
                <select
                    value={modelClass}
                    onChange={(e) => {
                        setModelClass(e.target.value);
                        setSelected(null);
                    }}
                    className="h-9 px-2.5 border border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-200"
                >
                    {MODEL_CLASS_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>{option.caption}</option>
                    ))}
                </select>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setSelected(null);
                    }}
                    placeholder="Пошук за назвою, ім'ям, id…"
                    className="h-9 px-3 border border-gray-200 rounded-lg text-[12.5px] text-gray-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-200"
                />

                {searchEnabled && !selected && (
                    <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-lg dark:border-neutral-700">
                        {isFetching && (
                            <div className="flex justify-center py-4"><Spinner className="h-5 w-5"/></div>
                        )}
                        {!isFetching && results.length === 0 && (
                            <div className="px-3 py-3 text-[12px] text-gray-600">Нічого не знайдено.</div>
                        )}
                        {!isFetching && results.map((candidate) => (
                            <button
                                key={candidate.model_id}
                                type="button"
                                onClick={() => setSelected(candidate)}
                                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12.5px] text-gray-800 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 dark:text-gray-200 dark:border-neutral-700 dark:hover:bg-blue-900/30"
                            >
                                <span className="truncate">{candidate.caption || `#${candidate.model_id}`}</span>
                                <span className="flex-none text-[10px] font-mono text-gray-600">#{candidate.model_id}</span>
                            </button>
                        ))}
                    </div>
                )}

                {selected && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 dark:border-blue-800 dark:bg-blue-900/30">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[12.5px] font-semibold text-blue-800 dark:text-blue-200 truncate">
                                {selected.caption || `#${selected.model_id}`}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                title="Обрати інший запис"
                                className="flex-none text-[11px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-300"
                            >
                                Змінити
                            </button>
                        </div>
                        <ConnectionSourceDetails modelClass={Number(modelClass)} modelId={selected.model_id}/>
                    </div>
                )}
            </ModalBody>
            <ModalFooter className="gap-2">
                <Button color="secondary" onClick={handleClose} disabled={isPending}>
                    Скасувати
                </Button>
                <Button
                    variant="gradient"
                    color="blue"
                    onClick={() => onConfirm({modelClass: Number(modelClass), modelId: selected.model_id})}
                    disabled={!selected || isPending}>
                    {isPending ? "Привʼязую…" : "Привʼязати"}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(AddConnectionModal);
