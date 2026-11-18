import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { ImportLogDetailsViewModel } from "../viewmodel/IntegrationsViewModels.js";
import { Spinner, Tabs, TabsHeader, TabsBody, Tab, TabPanel } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import {convertDate} from "../../../lib/utils.js";
import { StatusChip } from "./ImportLogShared.jsx";
import { DetailItem } from "../../../components/DetailFields.jsx";
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TH, TR } from "../../../components/Table/tableStyles.js";


const userLabel = (user) => (user?.name ? (user.email ? `${user.name} (${user.email})` : user.name) : 'Система');


const ImportLogDetailsDialog = ({open, onClose, logId}) => {
    const vm = useViewModel((deps) => new ImportLogDetailsViewModel({ ...deps, logId }));
    const log = vm.log;
    const {isLoading, isError, error} = vm.query;

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-48"><Spinner className="h-12 w-12"/></div>;
        }
        if (isError) {
            return <div className="p-4 text-sm text-red-600 dark:text-red-400">Помилка завантаження даних: {error.message}</div>;
        }
        if (!log) {
            return <div className="p-4 text-sm text-gray-600 dark:text-gray-400">Немає даних для відображення.</div>;
        }

        const tabsData = [
            {
                label: "Інформація",
                value: "info",
                content: (
                    <div className="flex flex-col gap-6 pt-4">
                        {/* --- Загальна інформація --- */}
                        <div>
                            <h4 className="mb-3 border-b border-gray-200 pb-1.5 text-sm font-bold text-gray-800 dark:border-neutral-700 dark:text-gray-200">Загальна інформація</h4>
                            <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
                                <DetailItem label="Датасет" value={log.dataset_name}/>
                                <DetailItem label="Статус">
                                    <StatusChip status={log.status} status_label={log.status_label}/>
                                </DetailItem>
                                <DetailItem label="Користувач" value={userLabel(log.user)}/>
                                <DetailItem label="Тип імпорту" value={log.import_type?.toUpperCase()}/>
                                <DetailItem label="Початок" value={convertDate(log.started_at)}/>
                                <DetailItem label="Завершення" value={convertDate(log.completed_at)}/>
                                <DetailItem label="Тривалість" value={log.duration_formatted}/>
                                <DetailItem label="Файл" value={log.file_info?.name}/>
                                <DetailItem label="Розмір файлу" value={log.file_info?.size_formatted}/>
                            </div>
                        </div>

                        {/* --- Статистика записів --- */}
                        <div>
                            <h4 className="mb-3 border-b border-gray-200 pb-1.5 text-sm font-bold text-gray-800 dark:border-neutral-700 dark:text-gray-200">Статистика записів</h4>
                            <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
                                <DetailItem label="Оброблено успішно" value={log.records_processed}/>
                                <DetailItem label="Записів з помилками" value={log.records_failed ?? 0}/>
                                <DetailItem label="Записів до імпорту" value={log.records_before}/>
                                <DetailItem label="Записів після імпорту" value={log.records_after}/>
                                <DetailItem label="Різниця" value={log.records_difference}/>
                            </div>
                        </div>

                        {/* --- Звіти та Повідомлення --- */}
                        <div>
                            <h4 className="mb-3 border-b border-gray-200 pb-1.5 text-sm font-bold text-gray-800 dark:border-neutral-700 dark:text-gray-200">Звіти та Повідомлення</h4>
                            <div className="flex flex-col gap-4">
                                {log.error_message && (
                                    <DetailItem label="Повідомлення про помилку">
                                        <pre className="whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">{log.error_message}</pre>
                                    </DetailItem>
                                )}
                                {log.warnings?.length > 0 && (
                                    <DetailItem label="Попередження">
                                        <ul className="list-inside list-disc rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
                                            {log.warnings.map((warning, index) => <li key={index}>{warning}</li>)}
                                        </ul>
                                    </DetailItem>
                                )}
                                {log.integrity_report?.length > 0 && (
                                    <DetailItem label="Звіт про цілісність даних">
                                        <div className={TABLE_WRAP}>
                                        <table className={TABLE}>
                                            <thead>
                                            <tr>
                                                <th scope="col" className={TH}>Тип</th>
                                                <th scope="col" className={twMerge(TH, "text-right")}>До</th>
                                                <th scope="col" className={twMerge(TH, "text-right")}>Після</th>
                                                <th scope="col" className={twMerge(TH, "text-right")}>Різниця</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {log.integrity_report.map(item => (
                                                <tr key={item.type} className={TR}>
                                                    <td className={twMerge(TD, "font-medium")}>{item.type}</td>
                                                    <td className={twMerge(TD, "text-right")}>{item.before}</td>
                                                    <td className={twMerge(TD, "text-right")}>{item.after}</td>
                                                    <td className={twMerge(TD, `text-right font-semibold ${item.difference > 0 ? 'text-green-600 dark:text-green-400' : item.difference < 0 ? 'text-red-600 dark:text-red-400' : ''}`)}>
                                                        {item.difference > 0 ? '+' : ''}{item.difference}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                        </div>
                                    </DetailItem>
                                )}
                                {log.field_usage_report?.length > 0 && (
                                    <DetailItem label="Звіт про використання полів">
                                        <div className={TABLE_WRAP}>
                                        <table className={TABLE}>
                                            <thead>
                                            <tr>
                                                <th scope="col" className={TH}>Поле</th>
                                                <th scope="col" className={twMerge(TH, "text-right")}>Кількість</th>
                                                <th scope="col" className={twMerge(TH, "text-right")}>Відсоток</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {log.field_usage_report.map(item => (
                                                <tr key={item.field} className={TR}>
                                                    <td className={twMerge(TD, "font-medium")}>{item.field}</td>
                                                    <td className={twMerge(TD, "text-right")}>{item.count}</td>
                                                    <td className={twMerge(TD, "text-right")}>{item.percentage}%</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                        </div>
                                    </DetailItem>
                                )}
                                {!log.error_message && log.warnings?.length === 0 && log.integrity_report?.length === 0 && log.field_usage_report?.length === 0 && (
                                    <p className="m-0 text-sm text-gray-600 dark:text-gray-400">Помилок та звітів немає.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )
            },
            {
                label: "JSON",
                value: "json",
                content: (
                    <div className="pt-4">
                        {log.full_import_report && Object.keys(log.full_import_report).length > 0 ? (
                            <pre className="max-h-[60vh] overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200">
                                {JSON.stringify(log.full_import_report, null, 2)}
                            </pre>
                        ) : (
                            <p className="m-0 text-sm text-gray-600 dark:text-gray-400">Детальний звіт відсутній для цього запису.</p>
                        )}
                    </div>
                )
            }
        ];

        return (
            <Tabs value="info">
                <TabsHeader
                    className="rounded-none border-b border-gray-200 bg-transparent p-0 dark:border-neutral-700"
                    indicatorProps={{
                        className: "rounded-none border-b-2 border-blue-600 bg-transparent shadow-none dark:border-blue-400",
                    }}
                >
                    {tabsData.map(({label, value}) => (
                        <Tab
                            key={value}
                            value={value}
                            className="py-2 text-sm text-gray-600 dark:text-gray-400"
                            activeClassName="font-semibold !text-blue-600 dark:!text-blue-400"
                        >
                            {label}
                        </Tab>
                    ))}
                </TabsHeader>
                <TabsBody>
                    {tabsData.map(({value, content}) => (
                        <TabPanel key={value} value={value} className="p-0 text-gray-700 dark:text-gray-300">
                            {content}
                        </TabPanel>
                    ))}
                </TabsBody>
            </Tabs>
        );
    };

    return (
        <Modal open={open} onClose={onClose} size="lg">
            <ModalHeader title={`Деталі логу імпорту #${logId}`}/>
            <ModalBody>
                {renderContent()}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onClose}>
                    Закрити
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(ImportLogDetailsDialog);
