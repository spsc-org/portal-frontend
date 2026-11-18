import { Card, Typography } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
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

    return (
        <Modal data-i-doc="modal:document-details" open={open} handler={onClose} size="sm">
            <ModalHeader>
                <span className="mr-5">Детальна інформація: {document?.regNum}
                    <span>  {document?.regDate ? format(document?.regDate, "dd.MM.yyyy") : null}</span></span>
            </ModalHeader>
            <ModalBody className="h-fit overflow-y-auto">
                <div className="mb-2 inline-flex gap-x-6 self-center dark:text-gray-400 items-center">
                    <Typography variant={"small"} className="font-normal ">Кількість
                        проєктів:</Typography>
                        <Button onClick={redirectToProjects} variant="filled" size="sm">
                            <div className="flex gap-2">
                                <div>
                                    <Typography as="div" variant={"small"} className="font-normal inline-flex">
                                        <div className="w-4">
                                            <i className="fa-regular fa-person"></i>
                                        </div>
                                        <span>{document?.personalCount || 0}</span>
                                    </Typography>
                                </div>
                                <div>
                                    <Typography as="div" variant={"small"} className="font-normal inline-flex">
                                        <div className="w-4">
                                            <i className="fa-regular fa-industry"></i>
                                        </div>
                                        <span>{document?.legalCount || 0}</span>
                                    </Typography>
                                </div>
                                <div>
                                    <Typography as="div" variant={"small"} className="font-normal inline-flex">
                                        <div className="w-4">
                                            <i className="fa-regular fa-ship"></i>
                                        </div>
                                        <span>{document?.vesselCount || 0}</span>
                                    </Typography>
                                </div>
                                <div>
                                    <Typography as="div" variant={"small"} className="font-normal inline-flex">
                                        <div className="w-4">
                                            <i className="fa-regular fa-plane"></i>
                                        </div>
                                        <span>{document?.aircraftCount || 0}</span>
                                    </Typography>
                                </div>

                            </div>
                        </Button>
                </div>

                <Card className=" p-2 grid grid-cols-2 gap-1 bg-gray-900/10 dark:bg-neutral-800">
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Назва:</p>
                        <p className="font-normal dark:text-gray-400">{document?.caption}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Реєстраційний номер:</p>
                        <p className="font-normal dark:text-gray-400">{document?.regNum}
                            <span>  {document?.regDate ? format(document?.regDate, "dd.MM.yyyy") : null}</span>
                        </p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Тип:</p>
                        <p className="font-normal dark:text-gray-400">{document?.typeId ? types.find(type => type.id === document.typeId)?.caption : null}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Підрозділ:</p>
                        <p className="font-normal dark:text-gray-400">{document?.unitId ? units.find(unit => unit.id === document.unitId)?.caption : null}</p>
                    </div>
                    <div className="inline-flex gap-x-2 max-w-[450px]">
                        <p className="font-bold dark:text-gray-50">Шлях:</p>
                        {document?.path ?
                            <div className=" bg-gray-800 w-full dark:bg-neutral-900 px-1 py-0.5 rounded-md">
                            <span
                                className="text-xs font-normal break-words text-green-500 dark:text-green-700">{document?.path}</span>
                            </div>
                            : null
                        }
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Коментар:</p>
                        <p className="font-normal dark:text-gray-400">{document?.comments}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Створений:</p>
                        <p className="font-normal dark:text-gray-400">{document?.createdAt ? format(document?.createdAt, "dd.MM.yyyy") : null}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Оновлений:</p>
                        <p className="font-normal dark:text-gray-400">{document?.updatedAt ? format(document?.updatedAt, "dd.MM.yyyy") : null}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Створив:</p>
                        <p className="font-normal dark:text-gray-400">{document?.createdUserId ? users.find(u => u.id === document.createdUserId)?.name : null}</p>
                    </div>
                    <div className="inline-flex gap-x-2">
                        <p className="font-bold dark:text-gray-50">Оновив:</p>
                        <p className="font-normal dark:text-gray-400">{document?.updatedUserId ? users.find(u => u.id === document.updatedUserId)?.name : null}</p>
                    </div>

                </Card>

            </ModalBody>
            <ModalFooter>
                <Button
                    color="secondary"
                    onClick={onClose}
                    className="mr-1">
                    <span>Закрити</span>
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(DocumentModal);
