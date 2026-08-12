import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import IntegrationsLayout from "./shared/ui/IntegrationsLayout.jsx";
import { canReadIntegrationsDatasets } from "./shared/lib/permissions.js";
import ImportDataDialog from "./components/ImportDataDialog.jsx";
import ImportLogTable from "./components/ImportLogTable.jsx";
import DatasetTable from "./components/DatasetTable.jsx";
const DatasetsPage = () => {
    const { auth } = usePage().props;
    const [selectedDataset, setSelectedDataset] = useState(null);
    const queryClient = useQueryClient();

    const { data: searchOptions = {} } = useQuery({
        queryKey: ['searchOptions'],
        queryFn: async () => {
            const response = await axios.get('/api/consolidated-data/import/datasets');
            return {
                searchMethods: [],
                datasets: response.data.datasets ?? [],
            };
        },
        staleTime: Infinity,
    });

    const handleImportSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['searchOptions'] });
        queryClient.invalidateQueries({ queryKey: ['importLogs'] });
    };

    if (!canReadIntegrationsDatasets(auth)) {
        return (
            <IntegrationsLayout active="datasets">
                <div className="flex min-h-[50vh] items-center justify-center text-slate-400 dark:text-slate-600">
                    <i className="fa-solid fa-lock mr-2"></i>Немає доступу до цього розділу.
                </div>
            </IntegrationsLayout>
        );
    }

    return (
        <IntegrationsLayout data-i-doc="page:integrations-datasets" active="datasets">
            <DatasetTable
                datasets={searchOptions.datasets}
                onImportClick={setSelectedDataset}
            />
            <div className="mt-6">
                <ImportLogTable />
            </div>

            {selectedDataset && (
                <ImportDataDialog
                    open
                    onClose={() => setSelectedDataset(null)}
                    dataset={selectedDataset}
                    onImportSuccess={handleImportSuccess}
                />
            )}
        </IntegrationsLayout>
    );
};

export default DatasetsPage;
