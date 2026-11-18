import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { FileDownloadViewModel } from "../../../entities/file/FileDownloadViewModel.js";
import { DecreeFilesViewModel } from "../viewmodel/DecreeViewModels.js";
import { Typography } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import {format} from "date-fns";
import {BOOLEANS, SANC_DECREE_TYPES} from "../../../lib/utils.js";

const DecreeModal = ({selectedId, open = false, onClose}) => {
    const vm = useViewModel((deps) => new DecreeFilesViewModel({ ...deps, decreeId: selectedId }));
    const downloads = useViewModel((deps) => new FileDownloadViewModel(deps));
    const decree = vm.decree;
    const decreeFile = vm.decreeFile;
    const attachmentFiles = vm.attachmentFiles;
    const findFile = (path) => vm.files.find((file) => file?.path === path);
    const getFile = (path) => {
        const file = findFile(path);
        downloads.download({ id: file?.id ?? path, fileUrl: path, fileName: file?.name });
    };

    const handleDownload = (path) => (event) => {
        event.preventDefault();
        if (path) {
            getFile(path);
        }

    }

    return (<Modal data-i-doc="modal:decree-details" open={open} handler={onClose} size="md">
        <ModalHeader>
                <span className="mr-5">Указ: {decree?.code}
                    <span>{decree?.date ? ` від ${format(decree?.date, "dd.MM.yyyy")}` : null}</span>
                </span>
            {Boolean(decree?.link) && <a title={decree?.link} href={decree?.link} target="_blank">
                <Button size="sm"
                        variant="outlined"
                        color="blue">
                    <i className="fa-regular fa-arrow-up-right-from-square"></i>
                </Button>
            </a>}
        </ModalHeader>
        <ModalBody className="h-[26rem] overflow-y-auto">
            <div className="grid grid-cols-2 mb-2">
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Код:</p>
                    <p className="font-normal dark:text-gray-400">{decree?.code}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Тип:</p>
                    <p className="font-normal dark:text-gray-400">{decree?.typeId ? SANC_DECREE_TYPES.find(i => i.value === decree?.typeId)?.label : ""}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Дата:</p>
                    <p className="font-normal dark:text-gray-400">{decree?.date ? format(decree?.date, "dd.MM.yyyy") : "-"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Діючий:</p>
                    <p className="font-normal dark:text-gray-400">{decree?.isActive ? BOOLEANS.find(i => parseInt(i.value) === decree?.isActive).label : ""}</p>
                </div>

                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">rnboId:</p>
                    <p className="font-normal dark:text-gray-400">{decree?.rnboId}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Створив:</p>
                    <p className="font-normal dark:text-gray-400">{decree?.createdUserId}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Дата створення:</p>
                    <p className="font-normal dark:text-gray-400">{decree?.created_at ? format(decree?.created_at, "dd.MM.yyyy") : "-"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Змінив:</p>
                    <p className="font-normal dark:text-gray-400">{decree?.updatedUserId}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Дата зміни:</p>
                    <p className="font-normal dark:text-gray-400">{decree?.updated_at ? format(decree?.updated_at, "dd.MM.yyyy") : "-"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Дата видалення:</p>
                    <p className="font-normal dark:text-gray-400">{decree?.deleted_at ? format(decree?.deleted_at, "dd.MM.yyyy") : "-"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                    <p className="font-bold dark:text-gray-50">Коментар:</p>
                    <p className="font-normal dark:text-gray-400">{decree?.comment}</p>
                </div>
            </div>
            <Typography variant="h5" className="dark:text-gray-50">Указ:</Typography>
            <div className="mt-2">
                {decreeFile ? <div className="inline-flex gap-x-2">
                    <div className="inline-flex min-w-80 p-2 rounded-md bg-gray-200">
                        <Typography variant="small"
                                    className="w-full leading-none">{decreeFile?.name}</Typography>
                    </div>
                    {/*<a target="_blank" href={`/storage/${encodeURIComponent(decreeFile?.path)}`}>*/}
                        <Button
                            onClick={handleDownload(decreeFile?.path)}
                            size="sm"
                            title="Завантажити"
                            color="blue">
                            <i className="fa-regular fa-download"></i>
                        </Button>
                    {/*</a>*/}
                </div> : <Typography variant="paragraph"
                                     className="font-normal dark:text-gray-400"
                >Указ відсутній</Typography>}
            </div>
            <Typography variant="h5" className="dark:text-gray-50">Додатки:</Typography>
            <div className="mt-2 max-h-60 shadow-lx overflow-auto">
                {attachmentFiles.length ?
                    <div className="flex flex-col gap-2"> {attachmentFiles.map((file, index) => {
                        return (<div key={index} className="inline-flex gap-x-2">
                            <span className="font-normal dark:text-gray-400">{index + 1}.</span>
                            <div className="inline-flex min-w-80 p-2 rounded-md bg-gray-200">
                                <Typography variant="small"
                                            className="w-full leading-none">{file?.name}</Typography>
                            </div>
                            <Button
                                onClick={handleDownload(file?.path)}
                                size="sm"
                                title="Завантажити"
                                color="blue">
                                <i className="fa-regular fa-download"></i>
                            </Button>
                        </div>)
                    })}</div> : <Typography variant="paragraph"
                                            className="font-normal dark:text-gray-400"
                    >Додатки відсутні</Typography>}
            </div>

        </ModalBody>
        <ModalFooter>
            <Button
                color="secondary"
                onClick={onClose}
                className="mr-1">
                <span>Закрити</span>
            </Button>
        </ModalFooter>
    </Modal>);
};

export default observer(DecreeModal);
