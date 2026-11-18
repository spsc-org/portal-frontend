import { observer } from "mobx-react-lite";
import { Switch, Tab, TabPanel, Tabs, TabsBody, TabsHeader } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { BulkPermissionsViewModel } from "../viewmodel/BulkPermissionsViewModel.js";
import { PermissionActions } from "./components/PermissionsGrid.jsx";

/** Масові дії над відібраними користувачами. Монтується лише коли відкрита. */
const BulkActionsModal = ({ data, userIds, onClose }) => {
    const vm = useViewModel((deps) => new BulkPermissionsViewModel({ ...deps, data, userIds, onDone: onClose }));

    return (
        <Modal data-i-doc="modal:admin-bulk-actions" open size="xl" handler={() => onClose()}>
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase"><span>Масові дії · обрано {userIds.length}</span></h3>
            </ModalHeader>
            <ModalBody className="flex h-[42rem] max-h-[calc(100vh-12rem)] flex-col overflow-hidden p-0">
                <Tabs value="permissions" className="flex min-h-0 flex-1 flex-col">
                    <TabsHeader className="mx-4 mt-3 bg-transparent" indicatorProps={{ className: "bg-gray-900/10 shadow-none !text-gray-900 dark:bg-blue-900/50" }}>
                        <Tab value="permissions" className="dark:text-gray-50">Пермішени</Tab>
                    </TabsHeader>
                    <TabsBody className="min-h-0 flex-1 overflow-y-auto">
                        <TabPanel value="permissions">
                            <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                                Позначте секції зліва — лише вони будуть застосовані. Увімкнена секція
                                повністю перезаписує блок прав; вимкнена — прибирає доступ до модуля.
                            </p>
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                {vm.schemaEntries.map(([category, actions]) => {
                                    const inApply = vm.isApplied(category);
                                    const pageOn = vm.isEnabled(category);
                                    return (
                                        <div key={category} className={`rounded-lg border p-3 dark:border-neutral-700 ${
                                            inApply ? "border-blue-300 bg-white dark:border-blue-700 dark:bg-neutral-700/40" : "border-gray-200 bg-white/70 dark:bg-neutral-700/20"
                                        }`}>
                                            <label className="mb-2 flex cursor-pointer items-center gap-2 border-b border-gray-100 pb-2 dark:border-neutral-700">
                                                <input type="checkbox" className="form-checkbox h-4 w-4 cursor-pointer text-blue-600"
                                                       checked={inApply} onChange={() => vm.toggleApply(category)}/>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Застосувати секцію</span>
                                            </label>
                                            <div className={`flex justify-center pb-2 ${inApply ? "" : "pointer-events-none opacity-40"}`}>
                                                <Switch color="green" disabled={!inApply} onChange={() => vm.toggleEnabled(category)} checked={pageOn}
                                                        label={<span className="font-bold dark:text-gray-200">{category}</span>}/>
                                            </div>
                                            <PermissionActions
                                                actions={actions}
                                                values={vm.permissions[category]}
                                                disabled={!inApply || !pageOn}
                                                onChange={(action, value) => vm.setPermission(category, action, value)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </TabPanel>
                    </TabsBody>
                </Tabs>
            </ModalBody>
            <ModalFooter className="border-t">
                <Button color="secondary" onClick={() => onClose()} className="mr-1">Закрити</Button>
                <LoadingButton isLoading={vm.mutation.isPending} variant="gradient" color="green" onClick={vm.submit} disabled={!vm.canSubmit}>
                    Застосувати
                </LoadingButton>
            </ModalFooter>
        </Modal>
    );
};

export default observer(BulkActionsModal);
