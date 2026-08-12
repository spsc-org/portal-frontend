import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Button,
    Typography,
    Textarea,
    Spinner,
} from "@material-tailwind/react";
import toast from "react-hot-toast";
import axios from "axios";
import FEEDBACK_SCOPES from "./feedbackFormConfig.js";

// Лінивий імпорт — AttachmentsGallery тягне важкі залежності (photoswipe,
// react-images-uploading), а цей модал монтується глобально на кожній
// сторінці (app.jsx), тож звичайний імпорт роздував би головний бандл для
// всіх, навіть якщо форму зворотного зв'язку ніхто не відкриває.
const AttachmentsGallery = lazy(() => import("../AttachmentsGallery.jsx"));

const DEFAULT_SCOPE_ID = FEEDBACK_SCOPES[0].id;

// Повні літеральні класи (не шаблонні border-${color}-500) — щоб Tailwind
// гарантовано зібрав їх у білд незалежно від того, чи трапляється той самий
// рядок десь-інде в коді. Додаючи новий колір у feedbackFormConfig.js —
// додай сюди відповідний запис.
const PILL_COLOR_CLASSES = {
    blue: "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    red: "border-red-400 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400",
    orange: "border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
};
const PILL_INACTIVE_CLASSES = "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600";

/**
 * Спільний стиль кнопок-вибору для обох рівнів (Стосується/Різновид) — одна
 * і та сама форма (пігулка), різниця лише в розмірі: рівень 1 (`size="md"`,
 * головна категорія — проєкт) трохи більший за рівень 2 (`size="sm"`,
 * підкатегорія — тег), щоб ієрархія була видна візуально, а не лише за
 * порядком на екрані.
 */
const PillButton = ({active, color = "blue", size = "md", icon, onClick, children}) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition-all ${
            size === "md" ? "px-3.5 py-1.5 text-[13px]" : "px-2.5 py-1 text-[11px]"
        } ${active ? PILL_COLOR_CLASSES[color] : PILL_INACTIVE_CLASSES}`}
    >
        {icon && <i className={`fa-solid ${icon} ${size === "md" ? "text-[11px]" : "text-[10px]"}`}></i>}
        {children}
    </button>
);

// Чернетка форми (опис + вибрані рівні) переживає закриття вкладки/оновлення
// сторінки — лише текст/вибір, файли не серіалізуються в localStorage і
// свідомо не зберігаються (їх все одно треба вибрати заново).
const DRAFT_STORAGE_KEY = "feedback-form-draft";

const loadDraft = () => {
    try {
        return JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
};

const CreateIssueGlobalModal = () => {
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState(() => loadDraft().description || "");
    const [scopeId, setScopeId] = useState(() => {
        const saved = loadDraft().scopeId;
        return FEEDBACK_SCOPES.some(s => s.id === saved) ? saved : DEFAULT_SCOPE_ID;
    });
    const [typeId, setTypeId] = useState(() => {
        const draft = loadDraft();
        const scope = FEEDBACK_SCOPES.find(s => s.id === draft.scopeId);
        return scope?.types.some(t => t.id === draft.typeId) ? draft.typeId : (scope?.types[0]?.id ?? FEEDBACK_SCOPES[0].types[0]?.id ?? null);
    });
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState({ url: "", activeModal: null });

    // Зберігаємо чернетку при кожній зміні (не лише при закритті) — щоб
    // пережити й аварійне закриття вкладки, не тільки штатне.
    useEffect(() => {
        try {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ description, scopeId, typeId }));
        } catch {
            // localStorage недоступний (приватний режим тощо) — тихо ігноруємо
        }
    }, [description, scopeId, typeId]);

    const currentScope = FEEDBACK_SCOPES.find(s => s.id === scopeId) || FEEDBACK_SCOPES[0];
    // currentType — undefined, коли в обраного scope немає рівня 2 (types: [])
    const currentType = currentScope.types.find(t => t.id === typeId);

    // Зміна "Стосується" — типи різні в різних scope, тож типId треба
    // скинути на перший доступний варіант нового scope (або null, якщо
    // рівня 2 немає взагалі).
    const handleScopeChange = (nextScopeId) => {
        const nextScope = FEEDBACK_SCOPES.find(s => s.id === nextScopeId);
        setScopeId(nextScopeId);
        setTypeId(nextScope?.types[0]?.id ?? null);
    };

    /**
     * Збір технічного контексту (URL, активна модалка)
     */
    const gatherContext = useCallback(() => {
        try {
            const currentUrl = window.location.href;
            const openModals = document.querySelectorAll('[role="dialog"]');
            let modalInfo = null;

            openModals.forEach(modal => {
                // Ігноруємо поточне вікно зворотного зв'язку
                if (!modal.innerText.includes("Зворотний зв'язок")) {
                    const header = modal.querySelector('h1, h2, h3, h4, h5, [class*="header"], [class*="title"]');
                    modalInfo = header?.innerText?.trim() || "Активне вікно";
                }
            });

            return { url: currentUrl, activeModal: modalInfo };
        } catch (e) {
            console.error("Context gathering failed", e);
            return { url: window.location.href, activeModal: null };
        }
    }, []);

    /**
     * API: Створення задачі (JSON)
     */
    const sendIssueData = async (payload) => {
        const token = document.querySelector('meta[name="csrfToken"]')?.getAttribute('content');
        const userId = document.querySelector('meta[name="userId"]')?.getAttribute('content');

        return axios.post("/api/task/issue/json", payload, {
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": token,
                "userId": userId,
            },
        });
    };

    /**
     * API: Завантаження вкладень
     */
    const uploadAttachments = async (taskId, filesToUpload) => {
        const token = document.querySelector('meta[name="csrfToken"]')?.getAttribute('content');
        const userId = document.querySelector('meta[name="userId"]')?.getAttribute('content');
        const formData = new FormData();

        filesToUpload.forEach((file, index) => {
            formData.append(`attachments[${index}]`, file);
        });

        return axios.post(`/api/task/issue/${taskId}/attach`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                "X-CSRF-Token": token,
                "userId": userId,
            },
        });
    };

    /**
     * Черга файлів до відправки форми (AttachmentsGallery, той самий
     * компонент, що й у задачах) — задачі ще не існує, тож файли лежать
     * локально (data_url-прев'ю) і йдуть на сервер лише після сабміту.
     */
    const handleUpdateFiles = (list) => {
        setFiles(list.filter((item) => item?.file).map((item, index) => ({
            id: item.id ?? `${item.file.name}-${index}`,
            file: item.file,
            data_url: item.data_url,
            fileName: item.file.name,
        })));
    };

    const handleDeleteFile = (attachment) => (event) => {
        event.preventDefault();
        setFiles((prev) => prev.filter((item) => item.id !== attachment.id));
    };

    /**
     * Глобальні події та шорткати
     */
    useEffect(() => {
        window.openIssueModal = () => {
            setContext(gatherContext());
            setOpen(true);
        };

        const handleKeyDown = (e) => {
            // Alt + B (eng/ua)
            if (e.altKey && (e.code === 'KeyB' || e.key === 'b' || e.key === 'и')) {
                e.preventDefault();
                setOpen(prev => {
                    const newState = !prev;
                    if (newState) setContext(gatherContext());
                    return newState;
                });
            }
            if (e.key === 'Escape') setOpen(false);
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => {
            delete window.openIssueModal;
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [gatherContext]);

    /**
     * Відправка форми
     */
    const handleSubmit = async () => {
        if (!description.trim()) {
            toast.error("Будь ласка, введіть опис");
            return;
        }

        setLoading(true);
        try {
            const response = await sendIssueData({
                description,
                tag: currentType?.label ?? null,
                project: currentScope.project,
                context: currentScope.showContext ? context : null
            });

            const taskId = response.data?.data?.id;

            if (taskId && files.length > 0) {
                await uploadAttachments(taskId, files.map((item) => item.file));
            }

            toast.success("Ваше звернення успішно надіслано");
            setOpen(false);
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Виникла помилка при відправці");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setDescription("");
        setScopeId(DEFAULT_SCOPE_ID);
        setTypeId(FEEDBACK_SCOPES[0].types[0]?.id ?? null);
        setFiles([]);
        try {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {
            // ігноруємо
        }
    };

    return (
        <Dialog data-i-doc="modal:global-feedback-form"
            open={open}
            handler={() => setOpen(false)}
            size="lg"
            className="dark:bg-slate-900 border-none shadow-2xl overflow-hidden rounded-2xl max-w-[900px] z-[99999]"
            containerProps={{ className: "z-[99999]" }}
            backdropProps={{ className: "z-[99998]" }}
            style={{ zIndex: 99999 }}
        >
            <DialogHeader className="flex flex-col items-start gap-1 bg-slate-50 dark:bg-slate-800/50 px-8 py-4 border-b dark:border-slate-800">
                <Typography variant="h5" className="text-slate-900 dark:text-white font-bold">
                    Зворотний зв'язок
                </Typography>
                <Typography variant="small" className="text-slate-500 dark:text-slate-400 font-normal">
                    Допоможіть нам стати краще. Повідомте про помилку або поділіться ідеєю.
                </Typography>
            </DialogHeader>

            <DialogBody className="p-0 flex min-h-[520px] max-h-[75vh]">
                {/* Сайдбар: рівень 1 — "Стосується" (головна категорія, куди піде задача) */}
                <div className="w-52 shrink-0 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-1">
                    <Typography variant="small" className="font-bold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                        Стосується
                    </Typography>
                    {FEEDBACK_SCOPES.map((s) => (
                        <button key={s.id} type="button" onClick={() => handleScopeChange(s.id)}
                                className={`w-full text-left rounded-lg border-l-2 px-3 py-2.5 text-[13px] font-semibold transition-all ${
                                    scopeId === s.id
                                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                        : "border-transparent text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60"
                                }`}>
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Контент: рівень 2 (Різновид, підкатегорія — тег) + сама форма */}
                <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
                    {currentScope.types.length > 0 &&
                        <div className="flex items-center gap-2">
                            {currentScope.types.map((t) => (
                                <PillButton key={t.id} size="sm" color={t.color} icon={t.icon}
                                            active={typeId === t.id} onClick={() => setTypeId(t.id)}>
                                    {t.label}
                                </PillButton>
                            ))}
                        </div>
                    }

                    {/* Поле вводу + Довідка */}
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <div className="flex-1 w-full">
                            <Typography variant="small" className="font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                                Детальний опис
                            </Typography>
                            <Textarea
                                placeholder={currentType?.placeholder ?? "Опишіть вашу ідею чи зауваження..."}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={10}
                                className="dark:text-white !border-slate-200 dark:!border-slate-700 focus:!border-blue-500"
                                containerProps={{ className: "min-w-[0]" }}
                            />
                        </div>

                        {currentType &&
                            <div className="w-full lg:w-80 flex flex-col pt-[26px]">
                                <div className="flex-1">
                                    <div className={`bg-${currentType.color}-50 dark:bg-${currentType.color}-900/10 border border-${currentType.color}-100 dark:border-${currentType.color}-800/50 p-5 rounded-xl animate-in fade-in zoom-in duration-300`}>
                                        <Typography variant="small" className={`font-bold text-${currentType.color}-900 dark:text-${currentType.color}-400 mb-3 flex items-center gap-2`}>
                                            <i className={`fa-solid ${currentType.icon}`}></i> {currentType.helpTitle}
                                        </Typography>
                                        {currentType.helpItems ? (
                                            <ul className={`text-[11px] text-${currentType.color}-800 dark:text-${currentType.color}-500 space-y-3 list-disc list-inside opacity-90 leading-relaxed`}>
                                                {currentType.helpItems.map((item, idx) => (
                                                    <li key={idx}><strong>{item.label}</strong> {item.text}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className={`text-[11px] text-${currentType.color}-900/80 dark:text-${currentType.color}-400/80 leading-relaxed`}>
                                                {currentType.helpDescription}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        }
                    </div>

                    {/* Скріншоти та Контекст */}
                    <div className="flex flex-col lg:flex-row gap-6 items-end">
                        <div className="flex-1 w-full flex flex-col gap-2">
                            <Typography variant="small" className="font-bold text-slate-700 dark:text-slate-300 ml-1">
                                Скріншоти або файли
                            </Typography>
                            <Suspense fallback={<Spinner className="h-4 w-4"/>}>
                                <AttachmentsGallery data={files} onUpdateList={handleUpdateFiles} onDeleteAttachment={handleDeleteFile}/>
                            </Suspense>
                        </div>

                        {currentScope.showContext &&
                            <div className="w-full lg:w-80 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 rounded-xl">
                                <Typography variant="small" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-microchip"></i> Контекст звернення
                                </Typography>
                                <div className="space-y-1.5 overflow-hidden">
                                    <div className="flex items-start gap-2 overflow-hidden">
                                        <i className="fa-solid fa-link text-[10px] mt-1 text-slate-400"></i>
                                        <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate" title={context.url}>
                                            {context.url}
                                        </span>
                                    </div>
                                    {context.activeModal && (
                                        <div className="flex items-center gap-2">
                                            <i className="fa-solid fa-window-restore text-[10px] text-slate-400"></i>
                                            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                                                Вікно: {context.activeModal}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </DialogBody>

            <DialogFooter className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3 border-t dark:border-slate-800">
                <Button
                    variant="text"
                    color="red"
                    size="md"
                    onClick={() => setOpen(false)}
                    className="hover:bg-red-50 dark:hover:bg-red-900/20 px-6"
                >
                    Скасувати
                </Button>
                <Button
                    variant="gradient"
                    color={currentType?.color ?? "blue"}
                    size="md"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="rounded-lg shadow-lg px-10"
                >
                    {loading ? "Надсилаємо..." : "Надіслати звернення"}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default CreateIssueGlobalModal;
