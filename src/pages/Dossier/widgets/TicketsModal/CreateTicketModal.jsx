import React, {useEffect, useState} from "react";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import {previewLinks as fetchLinksPreview} from "../../entities/dossierTicket/api.js";
import {useTicketMutations} from "../../features/manage-tickets/useTicketMutations.js";
import {entityLabel as entityTypeLabel} from "../../entities/dossierTicket/model.js";
import {clearDraft, readDraft, writeDraft} from "../../entities/dossierTicket/draftStorage.js";
import AddLinkFields from "./AddLinkFields.jsx";

const linkKey = (link) => `${link.type}-${link.id}`;

// Окрема модалка створення НОВОГО тікета — навмисно відділена від перегляду вже
// існуючих (SingleTicketModal): в одному вікні одночасно "готовий тікет" і чорновик
// нового плутали. Додаткові привʼязки — той самий патерн, що й у TicketBody (AddLinkFields,
// одна сутність за раз, Enter додає в список нижче з кнопкою видалення) — тікета ще
// нема, тож onAdd лише накопичує в локальному стані, реальний запит іде разом зі
// створенням. Чорновик (текст + список привʼязок) переживає закриття/повторне
// відкриття цієї ж модалки (draftStorage, ключ — базова сутність).
const CreateTicketModal = ({open, onClose, entityType, entityId, entityLabel, onCreated}) => {
    const {createMutation} = useTicketMutations(entityType, entityId);
    const [text, setText] = useState("");
    const [extraLinks, setExtraLinks] = useState([]);
    const [linkPreview, setLinkPreview] = useState([]);

    useEffect(() => {
        if (!open) return;
        const draft = readDraft(entityType, entityId);
        setText(draft?.text ?? "");
        setExtraLinks(Array.isArray(draft?.extraLinks) ? draft.extraLinks : []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, entityType, entityId]);

    useEffect(() => {
        if (!open) return;
        writeDraft(entityType, entityId, {text, extraLinks});
    }, [open, entityType, entityId, text, extraLinks]);

    useEffect(() => {
        if (extraLinks.length === 0) {
            setLinkPreview([]);
            return;
        }
        const timer = setTimeout(() => {
            fetchLinksPreview(extraLinks).then(setLinkPreview).catch(() => setLinkPreview([]));
        }, 400);
        return () => clearTimeout(timer);
    }, [extraLinks]);

    const addLink = (link) => {
        setExtraLinks((prev) => (prev.some((l) => linkKey(l) === linkKey(link)) ? prev : [...prev, link]));
    };

    const removeLink = (link) => {
        setExtraLinks((prev) => prev.filter((l) => linkKey(l) !== linkKey(link)));
    };

    const submit = () => {
        if (!text.trim()) return;

        createMutation.mutate(
            {text: text.trim(), extraLinks},
            {
                onSuccess: (ticket) => {
                    setText("");
                    setExtraLinks([]);
                    setLinkPreview([]);
                    clearDraft(entityType, entityId);
                    onCreated?.(ticket);
                    onClose();
                },
            },
        );
    };

    const previewByKey = new Map(linkPreview.map((p) => [linkKey(p), p]));

    return (
        <Dialog data-i-doc="modal:dossier-create-ticket"
            open={open}
            handler={onClose}
            size="sm"
            className="dark:bg-slate-900 border dark:border-slate-800"
            overlayProps={{className: "bg-black/20 backdrop-blur-none"}}
        >
            <DialogHeader className="dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-ticket text-base"></i>
                <Typography variant="h5">Новий тікет{entityLabel ? ` — ${entityLabel}` : ""}</Typography>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-2">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Опишіть проблему…"
                    rows={3}
                    autoFocus
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
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
                                    className={`flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 text-[11px] dark:bg-gray-800/60 ${
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
                                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                        <i className="fa-solid fa-xmark text-[10px]"></i>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                <AddLinkFields onAdd={addLink}/>
            </DialogBody>
            <DialogFooter className="gap-2">
                <Button variant="text" color="gray" onClick={onClose}>
                    Закрити
                </Button>
                <Button
                    variant="gradient"
                    color="blue"
                    disabled={!text.trim() || createMutation.isPending}
                    onClick={submit}
                >
                    {createMutation.isPending ? "Створюю…" : "Додати тікет"}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default CreateTicketModal;
