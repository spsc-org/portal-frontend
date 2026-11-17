import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Typography,
} from "@material-tailwind/react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../shared/mvvm/viewModelHooks.js";
import {useState} from "react";
import Dataset1Presenter from "./datasetPresenters/1.jsx";
import DefaultDatasetPresenter from "./datasetPresenters/default.jsx";
import BasicInfoSection from "./BasicInfoSection.jsx";
import NsdcActionsTab from "./NsdcActionsTab.jsx";

// Реєстр презентерів для різних датасетів
const datasetPresenters = {
    1: Dataset1Presenter,
    // Додавайте нові презентери тут:
    // 2: Dataset2Presenter,
};

const DetailsDialog = ({open, onClose, record}) => {
    const [activeTab, setActiveTab] = useState('details');

    // Довідники (іконки типів, датасети, групи) — з VM сторінки.
    const options = useVM().searchOptions;

    if (!record) {
        return null;
    }

    // Знаходимо тип, датасет та групу
    const typeId = record.typeId || record.subjectTypeId;
    const type = options.types?.find(t => t.id === typeId);

    const datasetId = record.dataset_id || record.datasetId;
    const dataset = options.datasets?.find(d => d.id === datasetId);
    const group = options.groups?.find(g => g.dataset_ids?.includes(datasetId));

    // Вибираємо презентер для поточного датасету або дефолтний
    const Presenter = datasetPresenters[datasetId] || DefaultDatasetPresenter;
    const hasActions = Array.isArray(record.actions) && record.actions.length > 0;

    return (
        <Dialog data-i-doc="modal:advanced-search-details" open={open} handler={onClose} size="lg" className="dark:bg-slate-800">
            <DialogHeader className="flex flex-col gap-0 items-start border-b border-gray-200 dark:border-slate-700 pb-4">
                <div className="flex items-center gap-3 w-full">
                    {type && type.icon && (
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-500 dark:text-blue-400">
                            <i className={`${type.icon} text-2xl`}></i>
                        </div>
                    )}
                    <div className="flex flex-col flex-grow">
                        <Typography variant="h5" className="dark:text-slate-200">
                            Детальна інформація
                        </Typography>
                        <Typography variant="small" className="font-normal text-gray-600 dark:text-slate-400">
                            {record.dataset_name || dataset?.caption || 'Невідомий датасет'}
                        </Typography>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={activeTab === 'details' ? "filled" : "outlined"}
                            color="blue"
                            onClick={() => setActiveTab('details')}
                        >
                            Інформація
                        </Button>
                        {hasActions && (
                            <Button
                                size="sm"
                                variant={activeTab === 'actions' ? "filled" : "outlined"}
                                color="amber"
                                onClick={() => setActiveTab('actions')}
                                className="flex items-center gap-1.5"
                            >
                                <i className="ti ti-history text-sm"></i>
                                Рішення
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'actions' ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'}`}>
                                    {record.actions.length}
                                </span>
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant={activeTab === 'raw' ? "filled" : "outlined"}
                            color="blue"
                            onClick={() => setActiveTab('raw')}
                        >
                            Сирі дані
                        </Button>
                    </div>
                </div>
            </DialogHeader>

            <DialogBody className="h-[32rem] overflow-y-auto p-4">
                {activeTab === 'details' && (
                    <div data-i-doc="tab:advanced-search-details-info" className="space-y-4">
                        {/* Загальна секція для всіх датасетів */}
                        <BasicInfoSection
                            record={record}
                            type={type}
                            dataset={dataset}
                            group={group}
                            typeId={typeId}
                            datasetId={datasetId}
                        />

                        {/* Специфічний контент або стандартний вивід */}
                        <Presenter record={record} />
                    </div>
                )}

                {activeTab === 'actions' && (
                    <div data-i-doc="tab:advanced-search-details-actions">
                        <NsdcActionsTab actions={record.actions} />
                    </div>
                )}

                {activeTab === 'raw' && (
                    <div data-i-doc="tab:advanced-search-details-raw" className="bg-gray-900 p-4 rounded h-full overflow-auto">
                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                            {JSON.stringify(record, null, 2)}
                        </pre>
                    </div>
                )}
            </DialogBody>
            <DialogFooter className="border-t border-gray-200 dark:border-slate-700 pt-2">
                <Button
                    variant="text"
                    color="red"
                    onClick={onClose}
                    className="mr-1"
                >
                    <span>Закрити</span>
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default observer(DetailsDialog);
