import { observer } from "mobx-react-lite";
import { Tab, TabPanel, Tabs, TabsBody, TabsHeader } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { UserFormViewModel } from "../viewmodel/UserFormViewModel.js";
import UserProfileFields from "./components/UserProfileFields.jsx";
import PermissionsGrid from "./components/PermissionsGrid.jsx";

const ConfirmUnlockDialog = observer(({ vm }) => (
    <Modal open={vm.confirmUnlock} size="xs" handler={vm.cancelUnlockAdmin} className="border">
        <ModalHeader className="border-b">
            <span>Увага!</span>
        </ModalHeader>
        <ModalBody>
            <p className="font-normal dark:text-gray-200">Ви дійсно хочете змінити повноваження?</p>
        </ModalBody>
        <ModalFooter className="border-t">
            <Button color="secondary" onClick={vm.cancelUnlockAdmin} className="mr-1"><span>Ні</span></Button>
            <Button variant="gradient" color="green" onClick={vm.unlockAdmin}><span>Так</span></Button>
        </ModalFooter>
    </Modal>
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
            <Modal open size="lg" handler={onClose} className="border">
                <ModalHeader className="border-b">
                    <span>{vm.title}</span>
                </ModalHeader>
                {vm.isEdit ? (
                    <ModalBody className="flex h-[42rem] max-h-[calc(100vh-12rem)] flex-col overflow-hidden p-0">
                        <EditTabs vm={vm}/>
                    </ModalBody>
                ) : (
                    <ModalBody className="h-[42rem] overflow-y-auto">
                        <UserProfileFields vm={vm}/>
                        <p className="mt-5 text-sm font-bold text-gray-700 dark:text-white">Доступи</p>
                        <div className="mt-5 mb-20">
                            <PermissionsGrid vm={vm}/>
                        </div>
                    </ModalBody>
                )}
                <ModalFooter className="border-t">
                    <Button color="secondary" onClick={onClose} className="mr-1"><span>Закрити</span></Button>
                    <LoadingButton isLoading={vm.isSaving} variant="gradient" color="green" onClick={vm.submit}>
                        <span>{vm.isEdit ? "Редагувати" : "Створити"}</span>
                    </LoadingButton>
                </ModalFooter>
            </Modal>
            <ConfirmUnlockDialog vm={vm}/>
        </span>
    );
};

export default observer(UserFormModal);
