import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { GROUPS, IDENTIFIER_API } from "../model/dictionaryApi.js";
import { IdentifierFormViewModel } from "../viewmodel/DictionaryViewModels.js";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import SingleSelect from "../../../components/fields/SingleSelect.jsx";
import Input from "../../../components/fields/Input.jsx";
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";

const IdentifyModal = ({open, onClose, id, dictionaries}) => {
    const vm = useViewModel((deps) => new IdentifierFormViewModel({ ...deps, api: IDENTIFIER_API.v1, id, dictionaries }));
    const { countries = [], subjectTypes = [] } = dictionaries;
    const { form, errors } = vm;
    const data = vm.editQuery?.data;
    const handleChangeForm = vm.changeField;
    const handleChangeOptions = vm.changeOptions;
    const onSubmit = async () => {
        if (await vm.submit()) onClose();
    };
    const createMutation = { isPending: vm.isPending };
    const updateMutation = createMutation;

    return (
        <Modal open={open} size="lg" handler={onClose}>
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase"><span>{id ? `Редагування: ${data?.data?.current_version?.code}` : "Додати"}</span></h3>
            </ModalHeader>
            <ModalBody className="max-h-[calc(100vh-12rem)] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                    <Input shrink error={errors?.code} label="Код" value={form.code}
                           name="code"
                           onChange={handleChangeForm}/>
                    <Input shrink error={errors?.pattern} label="Паттерн" value={form.pattern}
                           name="pattern"
                           onChange={handleChangeForm}/>
                    <SingleSelect isClearable error={errors?.subjectTypeId} closeMenuOnSelect options={subjectTypes}
                                  label="Тип суб'єкта"
                                  id="subjectTypeId"
                                  value={form.subjectTypeId}
                                  onChange={handleChangeOptions('subjectTypeId')}/>
                    <SingleSelect isClearable error={errors?.belongCountryId} closeMenuOnSelect options={countries}
                                  label="Країна"
                                  id="belongCountryId"
                                  value={form.belongCountryId}
                                  onChange={handleChangeOptions('belongCountryId')}/>
                    <SingleSelect closeMenuOnSelect options={GROUPS} label="Група" error={errors?.group} id="group"
                                  value={form.group}
                                  onChange={handleChangeOptions('group')}/>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <Input shrink error={errors?.name_uk} label="Назва українською" value={form.name_uk}
                           name="name_uk"
                           onChange={handleChangeForm}/>
                    <Input shrink error={errors?.name_en} label="Назва англійською" value={form.name_en}
                           name="name_en"
                           onChange={handleChangeForm}/>
                    <Input shrink error={errors?.name_doc} label="Виводити як" value={form.name_doc}
                           name="name_doc"
                           onChange={handleChangeForm}/>
                </div>
                <div>
                    <Input error={errors?.description_uk} tag="textarea" label="description_uk"
                           value={form.description_uk} name="description_uk"
                           onChange={handleChangeForm}/>
                </div>
                <div>
                    <Input error={errors?.description_en} tag="textarea" label="description_en"
                           value={form.description_en} name="description_en"
                           onChange={handleChangeForm}/>
                </div>
                <div>
                    <Input error={errors?.comment} tag="textarea" label="Коментар"
                           value={form.comment} name="comment"
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
                <LoadingButton isLoading={createMutation.isPending || updateMutation.isPending} variant="gradient" color="green" onClick={onSubmit}>
                    <span>{id ? 'Редагувати' : 'Створити'}</span>
                </LoadingButton>
            </ModalFooter>
        </Modal>
    );
};
export default observer(IdentifyModal);
