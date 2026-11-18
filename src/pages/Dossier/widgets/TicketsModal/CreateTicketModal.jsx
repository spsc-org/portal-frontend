import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { CreateTicketViewModel } from "../../viewmodel/DossierViewModels.js";

import { Typography } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../../components/Modal/Modal.jsx"
import Button from "../../../../components/Buttons/Button.jsx"

import {entityLabel as entityTypeLabel} from "../../entities/dossierTicket/model.js";
import AddLinkFields from "./AddLinkFields.jsx";

const linkKey = (link) => `${link.type}-${link.id}`;

// Окрема модалка створення НОВОГО тікета — навмисно відділена від перегляду вже
// існуючих (SingleTicketModal): в одному вікні одночасно "готовий тікет" і чорновик
// нового плутали. Додаткові привʼязки — той самий патерн, що й у TicketBody (AddLinkFields,
// одна сутність за раз, Enter додає в список нижче з кнопкою видалення) — тікета ще
// нема, тож onAdd лише накопичує в локальному стані, реальний запит іде разом зі
// створенням. Чорновик (текст + список привʼязок) переживає закриття/повторне
// відкриття цієї ж модалки (draftStorage, ключ — базова сутність).
/** Монтується лише відкритою: чернетка читається при відкритті й пишеться на кожну зміну. */
const CreateTicketModal = ({open, onClose, entityType, entityId, entityLabel, onCreated}) => {
    const vm = useViewModel((deps) => new CreateTicketViewModel({ ...deps, entityType, entityId }));
    const { text, extraLinks, linkPreview } = vm;
    const setText = vm.setText;
    const createMutation = vm.cmd.create;
    const addLink = (link) => vm.addLink(link, linkKey);
    const removeLink = (link) => vm.removeLink(link, linkKey);
    const submit = () => vm.submit(onCreated, onClose);

    const previewByKey = new Map(linkPreview.map((p) => [linkKey(p), p]));

    return (
        <Modal data-i-doc="modal:dossier-create-ticket"
            open={open}
            handler={onClose}
            size="sm"
            className="border"
            overlayProps={{className: "bg-black/20 backdrop-blur-none"}}>
            <ModalHeader className="flex items-center gap-2">
                <i className="fa-solid fa-ticket text-base"></i>
                <Typography variant="h5">Новий тікет{entityLabel ? ` — ${entityLabel}` : ""}</Typography>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-2">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Опишіть проблему…"
                    rows={3}
                    autoFocus
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-600 dark:text-gray-100"
                />

                {extraLinks.length > 0 && (
                    <div className="flex flex-col gap-1">
                        {extraLinks.map((link) => {
                            const preview = previewByKey.get(linkKey(link));
                            const found = preview?.found;
                            const label = `${entityTypeLabel(link.type)} #${link.id}${
                                preview ? (found ? (preview.label ? ` — ${preview.label}` : "") : " — не знайдено") : ""
                            }`;

                            return (
                                <div
                                    key={linkKey(link)}
                                    className={`flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 text-[11px] dark:bg-neutral-700/60 ${
                                        found === false ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"
                                    }`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        {preview && (
                                            <i className={`fa-solid ${found ? "fa-check text-green-600" : "fa-xmark"} text-[10px]`}></i>
                                        )}
                                        {label}
                                    </span>
                                    <button
                                        type="button"
                                        title="Прибрати"
                                        onClick={() => removeLink(link)}
                                        className="text-gray-600 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                        <i className="fa-solid fa-xmark text-[10px]"></i>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                <AddLinkFields onAdd={addLink}/>
            </ModalBody>
            <ModalFooter className="gap-2">
                <Button variant="text" color="gray" onClick={onClose}>
                    Закрити
                </Button>
                <Button
                    variant="gradient"
                    color="blue"
                    disabled={!text.trim() || createMutation.isPending}
                    onClick={submit}>
                    {createMutation.isPending ? "Створюю…" : "Додати тікет"}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(CreateTicketModal);
