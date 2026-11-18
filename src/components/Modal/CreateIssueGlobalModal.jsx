import { lazy, Suspense } from "react";
import { observer } from "mobx-react-lite";
import { Typography, Textarea, Spinner } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "./Modal.jsx"
import Button from "../Buttons/Button.jsx"
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { FeedbackViewModel } from "../../widgets/feedback/FeedbackViewModel.js";

// Лінивий імпорт — AttachmentsGallery тягне важкі залежності (photoswipe,
// react-images-uploading), а модалка змонтована глобально (App.jsx).
const AttachmentsGallery = lazy(() => import("../AttachmentsGallery.jsx"));

// Повні літеральні класи (не шаблонні border-${color}-500) — щоб Tailwind
// гарантовано зібрав їх у білд. Новий колір у feedbackFormConfig.js — додай сюди.
const PILL_COLOR_CLASSES = {
    blue: "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    red: "border-red-400 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400",
    orange: "border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
};
const PILL_INACTIVE_CLASSES = "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-neutral-700 dark:hover:border-gray-600";

/** Кнопка-вибір рівня 2 (Різновид). */
const PillButton = ({ active, color = "blue", icon, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
            active ? PILL_COLOR_CLASSES[color] : PILL_INACTIVE_CLASSES
        }`}
    >
        {icon && <i className={`fa-solid ${icon} text-[10px]`}></i>}
        {children}
    </button>
);

/** Глобальна форма зворотного зв'язку. Стан і сабміт — FeedbackViewModel. */
const CreateIssueGlobalModal = () => {
    const vm = useViewModel((deps) => new FeedbackViewModel(deps));
    const { currentScope, currentType, context } = vm;

    return (
        <Modal data-i-doc="modal:global-feedback-form"
            open={vm.isOpen}
            handler={vm.close}
            size="lg"
            className="border-none overflow-hidden max-w-[900px] z-[99999]"
            containerProps={{ className: "z-[99999]" }}
            backdropProps={{ className: "z-[99998]" }}
            style={{ zIndex: 99999 }}>
            <ModalHeader className="flex flex-col items-start gap-1 px-8 py-4 border-b">
                <Typography variant="h5" className="text-gray-900 dark:text-white font-bold">
                    Зворотний зв'язок
                </Typography>
                <Typography variant="small" className="text-gray-600 dark:text-gray-400 font-normal">
                    Допоможіть нам стати краще. Повідомте про помилку або поділіться ідеєю.
                </Typography>
            </ModalHeader>

            <ModalBody className="p-0 flex min-h-[520px] max-h-[75vh]">
                {/* Рівень 1 — "Стосується" (куди піде задача) */}
                <div className="w-52 shrink-0 border-r border-gray-200 dark:border-neutral-700 p-4 flex flex-col gap-1">
                    <Typography variant="small" className="font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1">
                        Стосується
                    </Typography>
                    {vm.scopes.map((s) => (
                        <button key={s.id} type="button" onClick={() => vm.setScope(s.id)}
                                className={`w-full text-left rounded-lg border-l-2 px-3 py-2.5 text-[13px] font-semibold transition-all ${
                                    vm.scopeId === s.id
                                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                        : "border-transparent text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-neutral-700/60"
                                }`}>
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Рівень 2 (Різновид — тег задачі) + сама форма */}
                <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
                    {currentScope.types.length > 0 &&
                        <div className="flex items-center gap-2">
                            {currentScope.types.map((t) => (
                                <PillButton key={t.id} color={t.color} icon={t.icon}
                                            active={vm.typeId === t.id} onClick={() => vm.setType(t.id)}>
                                    {t.label}
                                </PillButton>
                            ))}
                        </div>
                    }

                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <div className="flex-1 w-full">
                            <Typography variant="small" className="font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                                Детальний опис
                            </Typography>
                            <Textarea
                                placeholder={currentType?.placeholder ?? "Опишіть вашу ідею чи зауваження..."}
                                value={vm.description}
                                onChange={(e) => vm.setDescription(e.target.value)}
                                rows={10}
                                className="dark:text-white !border-gray-200 dark:!border-neutral-700 focus:!border-blue-500"
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

                    <div className="flex flex-col lg:flex-row gap-6 items-end">
                        <div className="flex-1 w-full flex flex-col gap-2">
                            <Typography variant="small" className="font-bold text-gray-700 dark:text-gray-300 ml-1">
                                Скріншоти або файли
                            </Typography>
                            <Suspense fallback={<Spinner className="h-4 w-4"/>}>
                                <AttachmentsGallery
                                    data={vm.files}
                                    onUpdateList={vm.setFiles}
                                    onDeleteAttachment={(attachment) => (event) => {
                                        event.preventDefault();
                                        vm.removeFile(attachment);
                                    }}
                                />
                            </Suspense>
                        </div>

                        {currentScope.showContext &&
                            <div className="w-full lg:w-80 bg-gray-50 dark:bg-neutral-700/50 border border-gray-200 dark:border-neutral-700 p-3 rounded-xl">
                                <Typography variant="small" className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-microchip"></i> Контекст звернення
                                </Typography>
                                <div className="space-y-1.5 overflow-hidden">
                                    <div className="flex items-start gap-2 overflow-hidden">
                                        <i className="fa-solid fa-link text-[10px] mt-1 text-gray-500"></i>
                                        <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate" title={context.url}>
                                            {context.url}
                                        </span>
                                    </div>
                                    {context.activeModal && (
                                        <div className="flex items-center gap-2">
                                            <i className="fa-solid fa-window-restore text-[10px] text-gray-500"></i>
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
            </ModalBody>

            <ModalFooter className="px-8 py-4 flex gap-3 border-t">
                <Button
                    color="secondary"
                    size="md"
                    onClick={vm.close}
                    className="hover:bg-red-50 dark:hover:bg-red-900/20 px-6">
                    Скасувати
                </Button>
                <Button
                    variant="gradient"
                    color={currentType?.color ?? "blue"}
                    size="md"
                    onClick={vm.submit}
                    disabled={vm.isSubmitting}
                    className="rounded-lg shadow-lg px-10">
                    {vm.isSubmitting ? "Надсилаємо..." : "Надіслати звернення"}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(CreateIssueGlobalModal);
