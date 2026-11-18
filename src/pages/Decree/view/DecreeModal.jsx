import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { FileDownloadViewModel } from "../../../entities/file/FileDownloadViewModel.js";
import { DecreeFilesViewModel } from "../viewmodel/DecreeViewModels.js";
import IconButton from "../../../components/Buttons/IconButton.jsx"
import { DetailGrid, DetailItem, DetailSection } from "../../../components/DetailFields.jsx";
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

    const fmt = (value) => (value ? format(value, "dd.MM.yyyy") : null);
    const fileRow = (file, index) => (
        <li key={index ?? "decree"} className="flex items-center gap-2">
            {index != null && <span className="w-5 shrink-0 text-right text-xs text-gray-600 dark:text-gray-400">{index + 1}.</span>}
            <span className="min-w-0 flex-1 truncate rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200" title={file?.name}>
                {file?.name}
            </span>
            <IconButton size="sm" title="Завантажити" onClick={handleDownload(file?.path)}>
                <i className="fa-regular fa-download"></i>
            </IconButton>
        </li>
    );

    return (<Modal data-i-doc="modal:decree-details" open={open} onClose={onClose} size="md">
        <ModalHeader>
            <h3 className="min-w-0 truncate text-base font-bold uppercase">
                Указ{decree?.code ? ` ${decree.code}` : ""}
                {decree?.date && <span className="ml-1 font-normal normal-case text-gray-600 dark:text-gray-400">від {fmt(decree.date)}</span>}
            </h3>
            {Boolean(decree?.link) && (
                <a className="ml-auto" title={decree?.link} href={decree?.link} target="_blank" rel="noreferrer">
                    <IconButton size="sm" title="Відкрити указ">
                        <i className="fa-regular fa-arrow-up-right-from-square"></i>
                    </IconButton>
                </a>
            )}
        </ModalHeader>
        <ModalBody className="flex flex-col gap-5">
            <DetailGrid>
                <DetailItem label="Код" value={decree?.code}/>
                <DetailItem label="Тип" value={decree?.typeId ? SANC_DECREE_TYPES.find(i => i.value === decree?.typeId)?.label : null}/>
                <DetailItem label="Дата" value={fmt(decree?.date)}/>
                <DetailItem label="Діючий" value={decree?.isActive ? BOOLEANS.find(i => parseInt(i.value) === decree?.isActive)?.label : null}/>
                <DetailItem label="rnboId" value={decree?.rnboId}/>
                <DetailItem label="Створив" value={decree?.createdUserId}/>
                <DetailItem label="Дата створення" value={fmt(decree?.created_at)}/>
                <DetailItem label="Змінив" value={decree?.updatedUserId}/>
                <DetailItem label="Дата зміни" value={fmt(decree?.updated_at)}/>
                <DetailItem label="Дата видалення" value={fmt(decree?.deleted_at)}/>
            </DetailGrid>
            <DetailItem label="Коментар" value={decree?.comment}/>

            <DetailSection title="Указ">
                {decreeFile
                    ? <ul className="m-0 list-none p-0">{fileRow(decreeFile)}</ul>
                    : <p className="m-0 text-sm text-gray-600 dark:text-gray-400">Указ відсутній</p>}
            </DetailSection>

            <DetailSection title="Додатки">
                {attachmentFiles.length
                    ? <ul className="m-0 flex max-h-60 list-none flex-col gap-2 overflow-auto p-0">
                        {attachmentFiles.map((file, index) => fileRow(file, index))}
                    </ul>
                    : <p className="m-0 text-sm text-gray-600 dark:text-gray-400">Додатки відсутні</p>}
            </DetailSection>
        </ModalBody>
        <ModalFooter>
            <Button color="secondary" onClick={onClose}>
                Закрити
            </Button>
        </ModalFooter>
    </Modal>);
};

export default observer(DecreeModal);
