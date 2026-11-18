import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { InventoryFormViewModel } from "./viewmodel/InventoryViewModels.js";
import SingleSelect from "../../components/fields/SingleSelect.jsx";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/Modal/Modal.jsx"
import Button from "../../components/Buttons/Button.jsx"
import Input from "../../components/fields/Input.jsx";

const InventoryModal = ({open, onClose, dictionary, id, isClone = false}) => {
    const vm = useViewModel((deps) => new InventoryFormViewModel({ ...deps, id, isClone, dictionary }));
    const { inventoryLocation, inventoryType, users, responsibleUsers } = vm.lists;
    const req = (field) => vm.isRequired(field);
    const { form, errors, dialogTitle, submitText } = vm;
    const handleChangeForm = vm.changeField;
    const handleChangeOptions = vm.changeOptions;
    const onSubmit = async () => {
        if (await vm.submit()) onClose();
    };

    return (
        <Modal open={open} size="lg" handler={onClose}>
            <ModalHeader>{dialogTitle}</ModalHeader>
            <ModalBody>
                <div className="grid grid-cols-2 gap-4">
                    <Input error={errors?.caption} label="Опис" value={form.caption}
                           name="caption" isRequired={req('caption')}
                           onChange={handleChangeForm}/>
                    <Input error={errors?.details} label="Деталі" value={form.details} name="details"
                           isRequired={req('details')} onChange={handleChangeForm}/>
                    <Input error={errors?.invoice} label="Накладна" value={form.invoice} name="invoice"
                           isRequired={req('invoice')} onChange={handleChangeForm}/>
                    <Input error={errors?.serial} label="Серійний номер" isProtected={id} value={form.serial}
                           name="serial" isRequired={req('serial')}
                           onChange={handleChangeForm}/>
                    <Input error={errors?.inventoryNum} isProtected={id} label="Інв. номер" value={form.inventoryNum}
                           name="inventoryNum" isRequired={req('inventoryNum')} onChange={handleChangeForm}/>
                    <Input error={errors?.registryNum} label="Реєстр. №" value={form.registryNum}
                           name="registryNum" isRequired={req('registryNum')} onChange={handleChangeForm} maxLength={20}/>
                    <Input min={0} type="number" error={errors?.amount} label="Кількість" value={form.amount}
                           name="amount" isRequired={req('amount')}
                           onChange={handleChangeForm}/>
                    <Input min={0} type="number" error={errors?.cost} label="Вартість" value={form.cost}
                           name="cost" isRequired={req('cost')}
                           onChange={handleChangeForm}/>
                    <SingleSelect closeMenuOnSelect error={errors?.valueTypeId} options={inventoryType} label="Тип"
                                  id="valueTypeId" isRequired={req('valueTypeId')}
                                  value={form.valueTypeId}
                                  onChange={handleChangeOptions('valueTypeId')}/>
                    <SingleSelect closeMenuOnSelect error={errors?.baileeUserId} options={users}
                                  label="Відповідальний" id="baileeUserId" isRequired={req('baileeUserId')}
                                  isClearable
                                  value={form.baileeUserId}
                                  onChange={handleChangeOptions('baileeUserId')}/>
                    <SingleSelect closeMenuOnSelect error={errors?.responsibleUserId} options={responsibleUsers}
                                  label="Матеріально відповідальний"
                                  id="responsibleUserId" isRequired={req('responsibleUserId')}
                                  value={form.responsibleUserId}
                                  onChange={handleChangeOptions('responsibleUserId')}/>
                    <SingleSelect closeMenuOnSelect error={errors?.locationId} options={inventoryLocation}
                                  label="Розташування" id="locationId" isRequired={req('locationId')}
                                  value={form.locationId}
                                  onChange={handleChangeOptions('locationId')}/>
                </div>
                <div className="">
                    <Input tag="textarea" error={errors?.note} label="Примітка" value={form.note} name="note"
                           onChange={handleChangeForm}/>
                </div>

            </ModalBody>
            <ModalFooter>
                <Button
                    color="secondary"
                    onClick={onClose}
                    className="mr-1">
                    <span>Закрити</span>
                </Button>
                <Button variant="gradient" color="green" onClick={onSubmit} disabled={vm.isPending}>
                    <span>{submitText}</span>
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(InventoryModal);
