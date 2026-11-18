import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import { DetailGrid, DetailItem } from "../../../components/DetailFields.jsx";
import { observer } from "mobx-react-lite";
import { format } from "date-fns";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { openProjectsForDocument } from "../../../entities/document/documentApi.js";
import { DocumentDetailsViewModel } from "../viewmodel/DocumentListViewModel.js";

/** dictionaries — { types, units, users } з options сторінки. */
const DocumentModal = ({selectedId, open = false, onClose, dictionaries}) => {
    const vm = useViewModel((deps) => new DocumentDetailsViewModel({ ...deps, documentId: selectedId }));
    const document = vm.document;
    const { users = [], units = [], types = [] } = dictionaries ?? {};
    // Фільтр "Документ" переноситься в налаштування legacy-сторінки /project.
    const redirectToProjects = () => openProjectsForDocument(document?.regNum);

    const fmt = (value) => (value ? format(value, "dd.MM.yyyy") : null);
    const COUNTS = [
        { icon: "fa-person", title: "Фізичні особи", value: document?.personalCount },
        { icon: "fa-industry", title: "Юридичні особи", value: document?.legalCount },
        { icon: "fa-ship", title: "Судна", value: document?.vesselCount },
        { icon: "fa-plane", title: "Повітряні судна", value: document?.aircraftCount },
    ];

    return (
        <Modal data-i-doc="modal:document-details" open={open} onClose={onClose} size="sm">
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">
                    Документ{document?.regNum ? ` ${document.regNum}` : ""}
                    {document?.regDate && <span className="ml-1 font-normal normal-case text-gray-600 dark:text-gray-400">від {fmt(document.regDate)}</span>}
                </h3>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-5">
                <DetailItem label="Кількість проєктів">
                    <Button size="sm" color="secondary" onClick={redirectToProjects} title="Відкрити проєкти з цим документом" className="mt-1 gap-3">
                        {COUNTS.map(({ icon, title, value }) => (
                            <span key={icon} className="inline-flex items-center gap-1" title={title}>
                                <i className={`fa-regular ${icon} text-xs text-gray-600 dark:text-gray-400`} aria-hidden="true"></i>
                                {value || 0}
                            </span>
                        ))}
                    </Button>
                </DetailItem>

                <DetailGrid>
                    <DetailItem label="Назва" value={document?.caption}/>
                    <DetailItem label="Реєстраційний номер" value={document?.regNum ? `${document.regNum}${document?.regDate ? ` від ${fmt(document.regDate)}` : ""}` : null}/>
                    <DetailItem label="Тип" value={document?.typeId ? types.find(type => type.id === document.typeId)?.caption : null}/>
                    <DetailItem label="Підрозділ" value={document?.unitId ? units.find(unit => unit.id === document.unitId)?.caption : null}/>
                    <DetailItem label="Створений" value={fmt(document?.createdAt)}/>
                    <DetailItem label="Оновлений" value={fmt(document?.updatedAt)}/>
                    <DetailItem label="Створив" value={document?.createdUserId ? users.find(u => u.id === document.createdUserId)?.name : null}/>
                    <DetailItem label="Оновив" value={document?.updatedUserId ? users.find(u => u.id === document.updatedUserId)?.name : null}/>
                </DetailGrid>
                <DetailItem label="Шлях">
                    {document?.path
                        ? <code className="block break-words rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200">{document.path}</code>
                        : <span className="text-gray-500">—</span>}
                </DetailItem>
                <DetailItem label="Коментар" value={document?.comments}/>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onClose}>
                    Закрити
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(DocumentModal);
