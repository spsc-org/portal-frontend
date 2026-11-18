import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { ProjectsSetViewModel } from "../../viewmodel/TaskViewModels.js";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../../components/Modal/Modal.jsx"
import Button from "../../../../components/Buttons/Button.jsx"
import SingleSelect from "../../../../Components/fields/SingleSelect.jsx";

// Модалка кураторства набору проєктів задачі (taskLink): таблиця з
// пошуком по доданих, видалення рядків, додавання через фільтр-движок
// проєктів (той самий, що на /project). Масовий відбір за фільтрами —
// на сторінці /project через корзину (не дублюємо фільтри тут).
// Винесено з TaskViewPanel.jsx — самодостатня модалка, монтується лише
// поки відкрита; чернетка (draft) ініціалізується з initialProjects при
// монтуванні (== відкритті).
const ProjectsSetModal = ({onClose, taskId, initialProjects}) => {
    const vm = useViewModel((deps) => new ProjectsSetViewModel({ ...deps, taskId, initialProjects }));
    const { draft, projectsSearch, pickerFilters, hasPickerCriteria, pickerItems, pickerTotal, isPickerLoading } = vm;
    const setDraft = vm.setDraft;
    const setProjectsSearch = vm.setProjectsSearch;
    const setPickerFilters = vm.setPickerFilters;
    const pickerVocOptions = vm.vocOptions;
    const updateLinkedProjectsMutation = vm.saveCmd;
    const saveDraft = () => vm.save(onClose);
    const addPickedProject = vm.addPicked;

    return (
        <Modal data-i-doc="modal:task-view-panel-projects-set" open handler={onClose} size="md">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">Набір проєктів ({draft.length})</h3>
            </ModalHeader>
            <ModalBody className="max-h-[65vh] overflow-y-auto pt-0">
                {/* Пошук проєктів для додавання — той самий фільтр-движок, що /project */}
                <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50/60 p-2.5 dark:border-neutral-700 dark:bg-neutral-700/40">
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            value={pickerFilters.fText}
                            onChange={(e) => setPickerFilters(prev => ({...prev, fText: e.target.value}))}
                            placeholder="Глобальний пошук…"
                            className="rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:border-blue-300 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-200"
                        />
                        <input
                            value={pickerFilters.fDocument}
                            onChange={(e) => setPickerFilters(prev => ({...prev, fDocument: e.target.value}))}
                            placeholder="Документ…"
                            className="rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:border-blue-300 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-200"
                        />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                        <SingleSelect size="xs" closeMenuOnSelect isClearable id="picker-type"
                                      options={pickerVocOptions.subjectType}
                                      value={pickerFilters.fType}
                                      onChange={(option) => setPickerFilters(prev => ({...prev, fType: option || null}))}
                                      placeholder="Тип особи"/>
                        <SingleSelect size="xs" closeMenuOnSelect isClearable id="picker-proposal"
                                      options={pickerVocOptions.proposal}
                                      value={pickerFilters.fProposal}
                                      onChange={(option) => setPickerFilters(prev => ({...prev, fProposal: option || null}))}
                                      placeholder="Пакет"/>
                        <SingleSelect size="xs" closeMenuOnSelect isClearable id="picker-action"
                                      options={pickerVocOptions.action}
                                      value={pickerFilters.fAction}
                                      onChange={(option) => setPickerFilters(prev => ({...prev, fAction: option || null}))}
                                      placeholder="Тип дії"/>
                    </div>
                    {hasPickerCriteria &&
                        <div className="mt-2">
                            <div className="flex items-center justify-between text-[10px] text-gray-600">
                                <span>
                                    {isPickerLoading
                                        ? "Пошук…"
                                        : `Знайдено: ${pickerTotal}${pickerTotal > pickerItems.length ? ` (показано перші ${pickerItems.length})` : ""}`}
                                </span>
                            </div>
                            <div className="mt-1 max-h-40 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200 bg-white dark:divide-neutral-700 dark:border-neutral-700 dark:bg-neutral-800">
                                {pickerItems.map(item => {
                                    const alreadyAdded = draft.some(project => project.id === item.id);
                                    return (
                                        <div key={item.id} className="flex items-center gap-2 px-2 py-1">
                                            <span className="shrink-0 font-mono text-[10px] text-gray-600">#{item.id}</span>
                                            <span className="min-w-0 flex-1 truncate text-xs text-gray-700 dark:text-gray-300">
                                                {item.name || "—"}
                                            </span>
                                            <button type="button"
                                                    disabled={alreadyAdded}
                                                    onClick={() => addPickedProject(item)}
                                                    title={alreadyAdded ? "Вже в наборі" : "Додати в набір"}
                                                    className={alreadyAdded
                                                        ? "cursor-default text-green-500"
                                                        : "text-blue-500 transition hover:text-blue-600"}>
                                                <i className={`fa-regular ${alreadyAdded ? "fa-check" : "fa-plus"}`}></i>
                                            </button>
                                        </div>
                                    );
                                })}
                                {!isPickerLoading && pickerItems.length === 0 &&
                                    <p className="px-2 py-2 text-center text-xs text-gray-600">Нічого не знайдено</p>
                                }
                            </div>
                        </div>
                    }
                </div>

                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-500">
                    У наборі
                </p>
                {draft.length > 3 &&
                    <input
                        value={projectsSearch}
                        onChange={(e) => setProjectsSearch(e.target.value)}
                        placeholder="Пошук серед доданих…"
                        className="mb-2 w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:border-blue-300 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-200"
                    />
                }
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-neutral-700 dark:border-neutral-700">
                    {draft
                        .filter(project => !projectsSearch
                            || String(project.id).includes(projectsSearch)
                            || (project.name || '').toLowerCase().includes(projectsSearch.toLowerCase()))
                        .map(project => (
                            <div key={project.id} className="flex items-center gap-2 px-2.5 py-1.5">
                                <span className="shrink-0 font-mono text-[11px] text-gray-600">#{project.id}</span>
                                <span className="min-w-0 flex-1 truncate text-xs text-gray-700 dark:text-gray-300">
                                    {project.name || "—"}
                                </span>
                                <button type="button"
                                        onClick={() => setDraft(prev => prev.filter(item => item.id !== project.id))}
                                        title="Прибрати з набору"
                                        className="text-gray-600 transition hover:text-red-500">
                                    <i className="fa-regular fa-xmark"></i>
                                </button>
                            </div>
                        ))}
                    {draft.length === 0 &&
                        <p className="px-2.5 py-3 text-center text-xs text-gray-600">Набір порожній</p>
                    }
                </div>
                <p className="mt-2 text-[10px] text-gray-600 dark:text-gray-500">
                    Великі набори зручно збирати в розділі «Проєкти» через корзину («Створити задачу»).
                </p>
            </ModalBody>
            <ModalFooter className="gap-2">
                <Button color="secondary" onClick={onClose}>Скасувати</Button>
                <Button color="green" disabled={updateLinkedProjectsMutation.isPending}
                        onClick={saveDraft}>
                    {updateLinkedProjectsMutation.isPending ? 'Зберігаю…' : 'Зберегти'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(ProjectsSetModal);
