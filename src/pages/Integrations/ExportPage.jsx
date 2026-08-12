import React from "react";
import { usePage } from "@inertiajs/react";
import IntegrationsLayout from "./shared/ui/IntegrationsLayout.jsx";
import { canReadIntegrationsExport } from "./shared/lib/permissions.js";
import ExportSection from "./components/ExportSection.jsx";
const ExportPage = () => {
    const { auth } = usePage().props;

    if (!canReadIntegrationsExport(auth)) {
        return (
            <IntegrationsLayout active="export">
                <div className="flex min-h-[50vh] items-center justify-center text-slate-400 dark:text-slate-600">
                    <i className="fa-solid fa-lock mr-2"></i>Немає доступу до цього розділу.
                </div>
            </IntegrationsLayout>
        );
    }

    return (
        <IntegrationsLayout data-i-doc="page:integrations-export" active="export">
            <ExportSection />
        </IntegrationsLayout>
    );
};

export default ExportPage;
