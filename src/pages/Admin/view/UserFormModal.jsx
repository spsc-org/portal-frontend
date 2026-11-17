import { observer } from "mobx-react-lite";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Tab, TabPanel, Tabs, TabsBody, TabsHeader } from "@material-tailwind/react";
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { UserFormViewModel } from "../viewmodel/UserFormViewModel.js";
import UserProfileFields from "./components/UserProfileFields.jsx";
import PermissionsGrid from "./components/PermissionsGrid.jsx";

const ConfirmUnlockDialog = observer(({ vm }) => (
    <Dialog open={vm.confirmUnlock} size="xs" handler={vm.cancelUnlockAdmin} className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <DialogHeader className="border-b border-slate-200 text-slate-800 dark:border-slate-700 dark:text-slate-100">
            <span>Увага!</span>
        </DialogHeader>
        <DialogBody className="bg-slate-50/80 dark:bg-slate-900">
            <p className="font-normal dark:text-gray-200">Ви дійсно хочете змінити повноваження?</p>
        </DialogBody>
        <DialogFooter className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <Button variant="text" color="red" onClick={vm.cancelUnlockAdmin} className="mr-1"><span>Ні</span></Button>
            <Button variant="gradient" color="green" onClick={vm.unlockAdmin}><span>Так</span></Button>
        </DialogFooter>
    </Dialog>
));

/** Створення — профіль і доступи одним списком; редагування — дві вкладки. */
const EditTabs = observer(({ vm }) => (
    <Tabs value={vm.activeTab} className="flex min-h-0 flex-1 flex-col">
        <TabsHeader className="mx-4 mt-3 bg-transparent" indicatorProps={{ className: "bg-gray-900/10 dark:bg-blue-900/50 shadow-none !text-gray-900" }}>
            <Tab value="profile" onClick={() => vm.setTab("profile")} className="dark:text-gray-50">Профіль</Tab>
            <Tab value="access" onClick={() => vm.setTab("access")} className="dark:text-gray-50">Доступи</Tab>
        </TabsHeader>
        <TabsBody className="min-h-0 flex-1 overflow-y-auto">
            {vm.activeTab === "profile" && (
                <TabPanel data-i-doc="tab:admin-user-update-profile" value="profile">
                    <UserProfileFields vm={vm}/>
                </TabPanel>
            )}
            {vm.activeTab === "access" && (
                <TabPanel data-i-doc="tab:admin-user-update-access" value="access">
                    <PermissionsGrid vm={vm}/>
                </TabPanel>
            )}
        </TabsBody>
    </Tabs>
));

/** Модалка користувача: id = null — створення, інакше — редагування. data — AdminDataModel. */
const UserFormModal = ({ data, id = null, onClose }) => {
    const vm = useViewModel((deps) => new UserFormViewModel({ ...deps, data, id, onDone: onClose }));

    return (
        <span data-i-doc={vm.isEdit ? "modal:admin-user-update-modal" : "modal:admin-user-modal"} style={{ display: "contents" }}>
            <Dialog open size="lg" handler={onClose} className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <DialogHeader className="border-b border-slate-200 text-slate-800 dark:border-slate-700 dark:text-slate-100">
                    <span>{vm.title}</span>
                </DialogHeader>
                {vm.isEdit ? (
                    <DialogBody className="flex h-[42rem] max-h-[calc(100vh-12rem)] flex-col overflow-hidden p-0 bg-slate-50/80 dark:bg-slate-900">
                        <EditTabs vm={vm}/>
                    </DialogBody>
                ) : (
                    <DialogBody className="h-[42rem] overflow-y-auto bg-slate-50/80 dark:bg-slate-900">
                        <UserProfileFields vm={vm}/>
                        <p className="mt-5 text-sm font-bold text-slate-700 dark:text-white">Доступи</p>
                        <div className="mt-5 mb-20">
                            <PermissionsGrid vm={vm}/>
                        </div>
                    </DialogBody>
                )}
                <DialogFooter className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <Button variant="text" color="red" onClick={onClose} className="mr-1"><span>Закрити</span></Button>
                    <LoadingButton isLoading={vm.isSaving} variant="gradient" color="green" onClick={vm.submit}>
                        <span>{vm.isEdit ? "Редагувати" : "Створити"}</span>
                    </LoadingButton>
                </DialogFooter>
            </Dialog>
            <ConfirmUnlockDialog vm={vm}/>
        </span>
    );
};

export default observer(UserFormModal);
