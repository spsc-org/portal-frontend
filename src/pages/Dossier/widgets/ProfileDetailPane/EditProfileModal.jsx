import {useState} from "react";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";

const MAX_CAPTION_LENGTH = 1000;
const MAX_NOTE_LENGTH = 2000;
// Об'єднане редагування назви (view_caption) і примітки (note) досьє — одна дія в блоці
// "Дії з профілем" замість двох окремих інлайн-контролів (2026-08-05, за проханням
// користувача: "щоби всі дії були в блоку одному"). Назва — обовʼязкова (той самий
// валідатор, що був у CaptionEditControl.jsx), примітка — довільна, обидва поля
// зберігаються окремими PATCH-запитами (updateCaptionMutation/updateNoteMutation —
// два різних бекенд-ендпоінти з окремими аудит-діями, тому НЕ обʼєднані в один запит),
// викликач чекає на обидва перед закриттям модалки.
const EditProfileModal = ({open, profile, isPending, onClose, onConfirm}) => {
    // Монтується лише відкритою (ProfileDetailPane) — початкові значення з профілю.
    const [caption, setCaption] = useState(profile?.view_caption ?? "");
    const [note, setNote] = useState(profile?.note ?? "");
    const [error, setError] = useState(null);

    const handleSave = () => {
        const trimmedCaption = caption.trim();

        if (!trimmedCaption) {
            setError("Назва не може бути порожньою");
            return;
        }
        if (trimmedCaption.length > MAX_CAPTION_LENGTH) {
            setError(`Максимальна довжина назви — ${MAX_CAPTION_LENGTH} символів`);
            return;
        }

        setError(null);
        onConfirm({caption: trimmedCaption, note});
    };

    return (
        <Dialog data-i-doc="modal:sanction-profiles-edit-profile"
            open={open}
            handler={onClose}
            size="sm"
            className="dark:bg-slate-900 border dark:border-slate-800"
            overlayProps={{className: "bg-black/20 backdrop-blur-none"}}
        >
            <DialogHeader className="dark:text-white">
                <Typography variant="h5">Редагувати картку досьє</Typography>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-3">
                <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Назва</label>
                    <input
                        type="text"
                        autoFocus
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        maxLength={MAX_CAPTION_LENGTH}
                        disabled={isPending}
                        className="w-full h-9 px-3 border border-gray-300 rounded-lg text-[13px] text-gray-900 outline-none focus:border-blue-500 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Примітка</label>
                    <textarea
                        rows={4}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={MAX_NOTE_LENGTH}
                        disabled={isPending}
                        placeholder="Додати примітку…"
                        className="w-full resize-y px-3 py-2 border border-gray-300 rounded-lg text-[13px] text-gray-900 outline-none focus:border-blue-500 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    />
                </div>
                {error && <div className="text-[11px] font-semibold text-red-600 dark:text-red-400">{error}</div>}
            </DialogBody>
            <DialogFooter className="gap-2">
                <Button variant="text" color="red" onClick={onClose} disabled={isPending}>
                    Скасувати
                </Button>
                <Button variant="gradient" color="blue" onClick={handleSave} disabled={isPending}>
                    {isPending ? "Збереження…" : "Зберегти"}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default EditProfileModal;
