import React, {useState} from "react";
import {usePage} from "@inertiajs/react";
import axios from "axios";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";
import DeveloperLayout from "../../Components/Developer/DeveloperLayout.jsx";
import ConfirmModal from "../../Components/Modal/ConfirmModal.jsx";

const canReadDeveloperDebug = (auth) => Boolean(auth?.user?.permissions?.pages?.["developer-debug"]?.read);

const clearPhoneHandbook = async () => {
    const response = await axios.post("/api/developer-debug/phone/clear");
    return response.data.data;
};
// Чиста React-сторінка інструментів розробника. Розділи додаються поступово
// з конкретною потребою (без наперед вигаданих — YAGNI); перший — очищення
// довідника Телефонів (тестові дані, розділ ще не в проді). Гейтиться лише
// developer-debug.read — свідомо без окремих прав конкретних розділів.
const Index = () => {
    const {auth} = usePage().props;
    const [confirmClearPhones, setConfirmClearPhones] = useState(false);

    const clearPhonesMutation = useMutation({
        mutationFn: clearPhoneHandbook,
        onSuccess: ({cleared_count: clearedCount}) => {
            toast.success(`Довідник телефонів очищено: видалено записів — ${clearedCount}`);
            setConfirmClearPhones(false);
        },
        onError: () => toast.error("Не вдалося очистити довідник телефонів"),
    });

    if (!canReadDeveloperDebug(auth)) {
        return (
            <DeveloperLayout active="debug">
                <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                        <i className="fa-solid fa-lock mb-2 text-xl"></i>
                        <p>Немає доступу до інструментів розробника.</p>
                    </div>
                </div>
            </DeveloperLayout>
        );
    }

    return (
        <DeveloperLayout data-i-doc="page:developer-debug" active="debug">
            <div className="mx-auto max-w-2xl p-6">
                <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Досьє — інструменти дедуплікації
                    </h2>
                    <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
                        Первинна генерація/оновлення досьє з ДРС, звʼязування проєктів, створення досьє для сиріт,
                        перерахунок стану підсанкційності — той самий розділ, що раніше жив лише під /develop.
                    </p>
                    <a href="/develop/dossier"
                       className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30">
                        <i className="fa-regular fa-arrow-up-right-from-square mr-1.5"></i>Відкрити інструменти досьє
                    </a>
                </div>

                <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Нотифікації — тестові повідомлення
                    </h2>
                    <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
                        Генерація тестової нотифікації обраному юзеру за типом (задача, досьє, тікет
                        проєкту, інвентар, оголошення, системне) і перегляд поточного стану бейджів/дзвіника.
                    </p>
                    <a href="/develop/notifications"
                       className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30">
                        <i className="fa-regular fa-arrow-up-right-from-square mr-1.5"></i>Відкрити тестові нотифікації
                    </a>
                </div>

                <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Telescope — моніторинг запитів
                    </h2>
                    <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
                        Запити, SQL-запити, черги, винятки, кеш, пошта та інші події застосунку
                        в реальному часі (Laravel Telescope).
                    </p>
                    <a href="/telescope"
                       className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30">
                        <i className="fa-regular fa-arrow-up-right-from-square mr-1.5"></i>Відкрити Telescope
                    </a>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Довідник телефонів
                    </h2>
                    <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
                        Незворотно видаляє УСІ записи довідника (включно з номерами, коментарями,
                        обраним) — для очищення тестових даних.
                    </p>
                    <button type="button" onClick={() => setConfirmClearPhones(true)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30">
                        <i className="fa-regular fa-trash-can mr-1.5"></i>Очистити весь довідник
                    </button>
                </div>
            </div>

            <ConfirmModal
                open={confirmClearPhones}
                onClose={() => setConfirmClearPhones(false)}
                onConfirm={() => clearPhonesMutation.mutate()}
                isLoading={clearPhonesMutation.isPending}
                title="Очистити весь довідник телефонів?"
                message="Усі записи, номери, коментарі та обране буде видалено безповоротно. Цю дію неможливо скасувати."
            />
        </DeveloperLayout>
    );
};

export default Index;
