import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { ProjectsSetViewModel } from "../../viewmodel/TaskViewModels.js";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../../components/Modal/Modal.jsx"
import Button from "../../../../components/Buttons/Button.jsx"
import SingleSelect from "../../../../components/fields/SingleSelect.jsx";
import {FIELD, SECTION_LABEL} from "../../utils.jsx";

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
            <ModalHeader title={`Набір проєктів (${draft.length})`}/>
            <ModalBody className="max-h-[65vh] overflow-y-auto">
                <p className={SECTION_LABEL}>Додати проєкти</p>
                {/* Пошук проєктів для додавання — той самий фільтр-движок, що /project */}
                <div className="mb-4 rounded-lg border border-gray-200 p-3 dark:border-neutral-700">
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            value={pickerFilters.fText}
                            onChange={(e) => setPickerFilters(prev => ({...prev, fText: e.target.value}))}
                            placeholder="Глобальний пошук…"
                            aria-label="Глобальний пошук"
                            className={`${FIELD} h-9 px-3 text-xs`}
                        />
                        <input
                            value={pickerFilters.fDocument}
                            onChange={(e) => setPickerFilters(prev => ({...prev, fDocument: e.target.value}))}
                            placeholder="Документ…"
                            aria-label="Документ"
                            className={`${FIELD} h-9 px-3 text-xs`}
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
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                <span>
                                    {isPickerLoading
                                        ? "Пошук…"
                                        : `Знайдено: ${pickerTotal}${pickerTotal > pickerItems.length ? ` (показано перші ${pickerItems.length})` : ""}`}
                                </span>
                            </div>
                            <div className="mt-1.5 max-h-40 divide-y divide-gray-200 overflow-y-auto rounded-md border border-gray-200 bg-white dark:divide-neutral-700 dark:border-neutral-700 dark:bg-neutral-900">
                                {pickerItems.map(item => {
                                    const alreadyAdded = draft.some(project => project.id === item.id);
                                    return (
                                        <div key={item.id} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-neutral-700/60">
                                            <span className="shrink-0 font-mono text-[11px] text-gray-600 dark:text-gray-400">#{item.id}</span>
                                            <span className="min-w-0 flex-1 truncate text-xs text-gray-700 dark:text-gray-300">
                                                {item.name || "—"}
                                            </span>
                                            <button type="button"
                                                    disabled={alreadyAdded}
                                                    onClick={() => addPickedProject(item)}
                                                    title={alreadyAdded ? "Вже в наборі" : "Додати в набір"}
                                                    className={alreadyAdded
                                                        ? "cursor-default text-green-700 dark:text-green-400"
                                                        : "rounded px-1 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-800/20"}
                                                    aria-label={alreadyAdded ? `#${item.id} вже в наборі` : `Додати #${item.id} в набір`}>
                                                <i className={`fa-regular ${alreadyAdded ? "fa-check" : "fa-plus"}`}></i>
                                            </button>
                                        </div>
                                    );
                                })}
                                {!isPickerLoading && pickerItems.length === 0 &&
                                    <p className="px-2 py-3 text-center text-xs text-gray-600 dark:text-gray-400">Нічого не знайдено</p>
                                }
                            </div>
                        </div>
                    }
                </div>

                <p className={SECTION_LABEL}>
                    У наборі
                </p>
                {draft.length > 3 &&
                    <input
                        value={projectsSearch}
                        onChange={(e) => setProjectsSearch(e.target.value)}
                        placeholder="Пошук серед доданих…"
                        aria-label="Пошук серед доданих"
                        className={`${FIELD} mb-2 h-9 px-3 text-xs`}
                    />
                }
                <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-neutral-700 dark:border-neutral-700">
                    {draft
                        .filter(project => !projectsSearch
                            || String(project.id).includes(projectsSearch)
                            || (project.name || '').toLowerCase().includes(projectsSearch.toLowerCase()))
                        .map(project => (
                            <div key={project.id} className="flex items-center gap-2 px-2.5 py-1.5">
                                <span className="shrink-0 font-mono text-[11px] text-gray-600 dark:text-gray-400">#{project.id}</span>
                                <span className="min-w-0 flex-1 truncate text-xs text-gray-700 dark:text-gray-300">
                                    {project.name || "—"}
                                </span>
                                <button type="button"
                                        onClick={() => setDraft(prev => prev.filter(item => item.id !== project.id))}
                                        title="Прибрати з набору"
                                        aria-label={`Прибрати #${project.id} з набору`}
                                        className="rounded px-1 text-gray-600 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                                    <i className="fa-regular fa-xmark"></i>
                                </button>
                            </div>
                        ))}
                    {draft.length === 0 &&
                        <p className="px-2.5 py-3 text-center text-xs text-gray-600 dark:text-gray-400">Набір порожній</p>
                    }
                </div>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Великі набори зручно збирати в розділі «Проєкти» через корзину («Створити задачу»).
                </p>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onClose}>Скасувати</Button>
                <Button color="primary" disabled={updateLinkedProjectsMutation.isPending}
                        onClick={saveDraft}>
                    {updateLinkedProjectsMutation.isPending ? 'Зберігаю…' : 'Зберегти'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(ProjectsSetModal);
