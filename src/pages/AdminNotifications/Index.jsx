
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminLayout from "@/ReactPages/Admin/shared/ui/AdminLayout.jsx";
import NotificationCategoryTable from "@/Components/NotificationCategoryTable.jsx";

// Глобальна (не per-user) матриця "категорія → канали" — та сама таблиця,
// що й на /settings (NotificationCategoryTable), але лише на читання:
// це системний дефолт (InAppNotificationCategory::channelDefaults()), а не
// персональні переваги конкретного користувача. Керування (увімк./вимк.
// категорії/каналу глобально) — наступний крок, поки що заготовка-перегляд.
const Index = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("/api/admin-notifications/categories")
            .then((res) => setCategories(res.data?.data?.categories ?? []))
            .catch((error) => {
                toast.error(error?.response?.data?.message ?? "Не вдалося завантажити категорії нотифікацій");
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <AdminLayout data-i-doc="page:admin-notifications" active="notifications">
            <div className="mx-2 mt-5 max-w-2xl">
                <div className="mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        Категорії нотифікацій
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Глобальний перелік категорій і каналів, якими система їх підтримує —
                        лише перегляд. Персональні переваги користувачів — на сторінці
                        «Налаштування» кожного користувача.
                    </p>
                </div>
                {loading ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Завантаження…</p>
                ) : (
                    <NotificationCategoryTable categories={categories} readOnly />
                )}
            </div>
        </AdminLayout>
    );
};

export default Index;
