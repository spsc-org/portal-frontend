import { observer } from "mobx-react-lite";
import { Checkbox, Typography } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import ConfirmModal from "../../../components/Modal/ConfirmModal.jsx";
import { COPY_OPTIONS } from "../viewmodel/ProjectListViewModels.js";

/** Копіювання проєкту — legacy Page.confirmAndCopy (myApp.showConfirm з чекбоксами). */
const CopyProjectDialog = observer(({ vm }) => (
    <Modal open={vm.copyTarget != null} handler={vm.closeCopy} size="xs">
        <ModalHeader>Копіювання проєкту</ModalHeader>
        <ModalBody className="flex flex-col gap-2">
            <Typography className="text-sm dark:text-gray-300">
                Створити копію проєкту #{vm.copyTarget}. Оберіть що включити до копії:
            </Typography>
            {COPY_OPTIONS.map(({ group, items }) => (
                <div key={group} className="flex flex-col">
                    <span className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">{group}</span>
                    {items.map((item) => (
                        <Checkbox
                            key={item.id}
                            label={item.label}
                            checked={Boolean(vm.copyOptions[item.id])}
                            onChange={() => vm.toggleCopyOption(item.id)}
                            labelProps={{ className: "text-sm dark:text-gray-300" }}
                            data-testid={`copy-option-${item.id}`}
                        />
                    ))}
                </div>
            ))}
        </ModalBody>
        <ModalFooter className="gap-2">
            <Button variant="text" onClick={vm.closeCopy}>
                Скасувати
            </Button>
            <Button color="blue" onClick={vm.copy} data-testid="copy-confirm">
                Копіювати
            </Button>
        </ModalFooter>
    </Modal>
));

/** Перегляд фото вкладень — legacy TableManager.openPhotoPreview. */
const PhotoPreview = observer(({ vm }) => {
    const { photo } = vm;
    if (!photo) return null;
    const current = photo.photos[photo.index] ?? {};
    const src = current.url ?? current.src ?? current.path;
    const many = photo.photos.length > 1;
    return (
        <div
            className="fixed inset-0 z-[1060] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(event) => event.target === event.currentTarget && vm.closePhoto()}
        >
            <div className="relative flex max-h-screen w-full max-w-3xl flex-col items-center p-4">
                <button type="button" className="absolute right-0 top-0 z-10 px-3 py-1 text-3xl leading-none text-white hover:text-gray-300" title="Закрити" onClick={vm.closePhoto}>
                    &times;
                </button>
                <div className="relative flex w-full items-center justify-center">
                    {many && (
                        <button type="button" className="absolute left-0 select-none px-3 text-4xl text-white hover:text-gray-300" onClick={() => vm.stepPhoto(-1)}>
                            &#8249;
                        </button>
                    )}
                    <img src={src} alt={current.name ?? ""} className="max-h-[80vh] max-w-full rounded border border-gray-700 bg-gray-900 object-contain shadow-lg" />
                    {many && (
                        <button type="button" className="absolute right-0 select-none px-3 text-4xl text-white hover:text-gray-300" onClick={() => vm.stepPhoto(1)}>
                            &#8250;
                        </button>
                    )}
                </div>
                <div className="mt-3 flex flex-col items-center gap-2">
                    <p className="text-sm text-white">{current.name}</p>
                    {many && (
                        <div className="text-xs text-gray-600">
                            {photo.index + 1} / {photo.photos.length}
                        </div>
                    )}
                    {src && (
                        <a href={src} download={current.name} className="text-xs text-blue-300 hover:underline">
                            Завантажити
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
});

/** Модалки сторінки списку: копіювання, видалення, фото. */
const ProjectListDialogs = ({ vm }) => (
    <>
        <CopyProjectDialog vm={vm} />
        <ConfirmModal
            open={vm.deleteTarget != null}
            onClose={vm.closeDelete}
            onConfirm={vm.confirmDelete}
            title="Видалення проєкту"
            message={`Видалити проєкт #${vm.deleteTarget}? Дію неможливо скасувати.`}
        />
        <PhotoPreview vm={vm} />
    </>
);

export default observer(ProjectListDialogs);
