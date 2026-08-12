import React, {useState} from "react";
import {usePage} from "@inertiajs/react";
import StaffLayout from "./shared/ui/StaffLayout.jsx";
import {canViewFullResponsibleRegistry, canViewUsersReport} from "./shared/lib/responsiblePermissions.js";
import {useResponsibleFunctionsQuery, useResponsibleOptionsQuery} from "./entities/responsible/queries.js";
import MyResponsibilities from "./widgets/MyResponsibilities/MyResponsibilities.jsx";
import ResponsibleFunctionsTable from "./widgets/ResponsibleFunctionsTable/ResponsibleFunctionsTable.jsx";
import ResponsibleAssignmentsTable from "./widgets/ResponsibleAssignmentsTable/ResponsibleAssignmentsTable.jsx";
import UsersReportModal from "./features/users-report/UsersReportModal.jsx";

// Дві рівні колонки (по 1/2 ширини) — Функції зліва, Призначення справа
// (це двоє — щоденна робота). "Користувачі" — не щоденний інструмент, тому
// не окрема колонка, а звіт-на-вимогу (кнопка → модалка UsersReportModal).
const FullRegistry = ({auth}) => {
    const {data: optionsData} = useResponsibleOptionsQuery();
    const users = optionsData?.users || [];

    const {data: functionsData, isLoading} = useResponsibleFunctionsQuery();
    const functions = functionsData || [];

    // Клік по функції (master) фільтрує "Призначення" (detail) — на цю
    // функцію; повторний клік або скидання знімає фільтр.
    const [selectedFunctionId, setSelectedFunctionId] = useState(null);
    const [isReportOpen, setIsReportOpen] = useState(false);

    const canReport = canViewUsersReport(auth);

    return (
        <div className="mt-4">
            {canReport &&
                <div className="mb-3 flex justify-end">
                    <button type="button" onClick={() => setIsReportOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400">
                        <i className="fa-regular fa-chart-simple"></i>
                        Звіт по користувачах
                    </button>
                </div>
            }

            <div className="flex items-start gap-4">
                <div className="w-1/2 shrink-0">
                    <h2 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">Функції</h2>
                    <ResponsibleFunctionsTable auth={auth} functions={functions} users={users} isLoading={isLoading}
                                               selectedFunctionId={selectedFunctionId} onSelectFunction={setSelectedFunctionId}/>
                </div>

                <div className="w-1/2 shrink-0">
                    <h2 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">Призначення</h2>
                    <ResponsibleAssignmentsTable auth={auth} functions={functions} users={users} selectedFunctionId={selectedFunctionId}/>
                </div>
            </div>

            {canReport &&
                <UsersReportModal open={isReportOpen} onClose={() => setIsReportOpen(false)} users={users}/>
            }
        </div>
    );
};

const ResponsiblePage = () => {
    const {auth} = usePage().props;
    const hasFullAccess = canViewFullResponsibleRegistry(auth);

    return (
        <StaffLayout data-i-doc="page:staff-responsible" active="responsible">
            {hasFullAccess
                ? <FullRegistry auth={auth}/>
                : <MyResponsibilities/>
            }
        </StaffLayout>
    );
};

export default ResponsiblePage;
