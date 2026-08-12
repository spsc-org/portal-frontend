import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import IntegrationsLayout from "./shared/ui/IntegrationsLayout.jsx";
import { canReadIntegrationsVesselImo } from "./shared/lib/permissions.js";
import VesselImoTable from "./components/VesselImo/VesselImoTable.jsx";
import VesselImoImportDialog from "./components/VesselImo/VesselImoImportDialog.jsx";
import VesselImoLogTable from "./components/VesselImo/VesselImoLogTable.jsx";
import VesselImoDetailsTable from "./components/VesselImo/VesselImoDetailsTable.jsx";
import VesselImoDetailsImportDialog from "./components/VesselImo/VesselImoDetailsImportDialog.jsx";
import { useVesselImoListsQuery } from "./entities/vesselImo/queries.js";
const VesselImoPage = () => {
    const { auth } = usePage().props;
    const [vesselImportOpen, setVesselImportOpen] = useState(false);
    const [vesselDetailsImportOpen, setVesselDetailsImportOpen] = useState(false);

    const hasAccess = canReadIntegrationsVesselImo(auth);
    const { data: vesselLists } = useVesselImoListsQuery(hasAccess);

    if (!hasAccess) {
        return (
            <IntegrationsLayout active="vessel-imo">
                <div className="flex min-h-[50vh] items-center justify-center text-slate-400 dark:text-slate-600">
                    <i className="fa-solid fa-lock mr-2"></i>Немає доступу до цього розділу.
                </div>
            </IntegrationsLayout>
        );
    }

    return (
        <IntegrationsLayout data-i-doc="page:integrations-vessel-imo" active="vessel-imo">
            <VesselImoTable
                lists={vesselLists}
                onImportClick={() => setVesselImportOpen(true)}
            />
            <VesselImoDetailsTable
                onImportClick={() => setVesselDetailsImportOpen(true)}
            />
            <VesselImoLogTable />

            {vesselImportOpen && (
                <VesselImoImportDialog
                    open
                    onClose={() => setVesselImportOpen(false)}
                    onImportSuccess={() => setVesselImportOpen(false)}
                />
            )}

            {vesselDetailsImportOpen && (
                <VesselImoDetailsImportDialog
                    open
                    onClose={() => setVesselDetailsImportOpen(false)}
                    onImportSuccess={() => setVesselDetailsImportOpen(false)}
                />
            )}
        </IntegrationsLayout>
    );
};

export default VesselImoPage;
