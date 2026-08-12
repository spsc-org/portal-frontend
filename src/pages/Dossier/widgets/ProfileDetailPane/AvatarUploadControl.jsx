import React, {useRef, useState} from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 МБ — узгоджено з серверним max:5120 (КБ)

// Тригери зміни аватара — БЕЗ самого зображення (те лишається в шапці ProfileDetailPane як
// SubjectAvatar, видиме всім). Призначено для розміщення всередині ModeratorBlock, разом з
// рештою дій над профілем — щоб не ховати кнопку "камера" непомітним оверлеєм на фото, а
// показати явно, поруч з іншими діями модератора. Клієнтська перевірка типу/розміру — лише
// UX-підказка, серверна валідація лишається джерелом істини.
const AvatarUploadControl = ({profile, isUploading, isDeleting, onUpload, onRequestDelete}) => {
    const inputRef = useRef(null);
    const [localError, setLocalError] = useState(null);
    const isBusy = isUploading || isDeleting;

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        event.target.value = ""; // дає змогу повторно обрати той самий файл

        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            setLocalError("Дозволені формати: JPEG, PNG, WEBP");
            return;
        }
        if (file.size > MAX_SIZE_BYTES) {
            setLocalError("Розмір файлу не має перевищувати 5 МБ");
            return;
        }

        setLocalError(null);
        onUpload(file);
    };

    return (
        <div data-i-doc="component:sanction-profiles-avatar-moderator-controls" className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => inputRef.current?.click()}
                    title={isUploading ? "Завантаження…" : "Завантажити фото"}
                    className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-full border border-blue-300 bg-white text-blue-700 cursor-pointer transition hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-blue-700 dark:text-blue-300"
                >
                    <i className={`fa-solid ${isUploading ? "fa-spinner fa-spin" : "fa-camera"} text-[12px]`}></i>
                </button>
                {profile?.avatar_url && (
                    <button
                        type="button"
                        disabled={isBusy}
                        onClick={onRequestDelete}
                        title={isDeleting ? "Видалення…" : "Видалити фото"}
                        className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-full border border-red-200 bg-white text-red-600 cursor-pointer transition hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-red-800 dark:text-red-400"
                    >
                        <i className={`fa-solid ${isDeleting ? "fa-spinner fa-spin" : "fa-trash"} text-[12px]`}></i>
                    </button>
                )}
            </div>

            {localError && (
                <div className="text-[10.5px] font-semibold text-red-600 dark:text-red-400">{localError}</div>
            )}
        </div>
    );
};

export default AvatarUploadControl;
