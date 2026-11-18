import { observer } from "mobx-react-lite";
import { Menu, MenuHandler, MenuItem, MenuList, Typography } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/Modal/Modal.jsx"
import Button from "../../components/Buttons/Button.jsx"
import { format } from "date-fns";
import Input from "../../components/fields/Input.jsx";
import SingleSelect from "../../components/fields/SingleSelect.jsx";
import DatePicker from "../../components/fields/DatePicker.jsx";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { DocumentFormViewModel } from "../../entities/document/DocumentFormViewModel.js";

/**
 * Створення (mode="create", колишній ProjectImport/CreateDocumentModal) або
 * редагування (mode="update", колишній Document/UpdateDocumentModal) документа.
 * Монтується відкритою; dictionaries — { types, units, users } зі сторінки.
 */
const DocumentFormModal = ({ open, onClose, mode = "create", documentId = null, dictionaries, onCreated }) => {
    const vm = useViewModel((deps) => new DocumentFormViewModel({ ...deps, mode, documentId, dictionaries }));
    const { form, errors, isProtected, types, units, users } = vm;
    const doc = vm.document;

    const handleSubmit = async () => {
        const data = await vm.submit();
        if (data) {
            onCreated?.(data);
            onClose();
        }
    };

    const fields = (
        <>
            <Input error={errors?.regNum} placeholder="0/0/0 <гриф>" label="Реєстраційний номер"
                   value={form.regNum} name="regNum"
                   onChange={vm.changeRegNum}/>
            <SingleSelect closeMenuOnSelect error={errors?.unitId} options={units}
                          isClearable
                          label="Підрозділ"
                          id="unitId"
                          value={form.unitId}
                          onChange={vm.changeSelect("unitId")}/>
            <SingleSelect closeMenuOnSelect error={errors?.performerId} options={users}
                          isClearable
                          label="Виконавець"
                          id="performerId"
                          value={form.performerId}
                          onChange={vm.changeSelect("performerId")}/>
            <Input error={errors?.path} label="Шлях" value={form.path} name="path"
                   onChange={vm.changeField}/>
            <Input error={errors?.caption} label="Назва" value={form.caption} name="caption"
                   onChange={vm.changeField}/>
        </>
    );

    const comments = (
        <div className="mt-4">
            <Input error={errors?.comments} tag="textarea" label="Коментар"
                   value={form.comments} name="comments"
                   onChange={vm.changeField}/>
        </div>
    );

    if (mode === "update") {
        return (
            <Modal data-i-doc="modal:document-update" open={open} handler={onClose} size="sm">
                <ModalHeader>
                    <Typography variant="h5" className="dark:text-gray-200">
                        Редагувати документ: {doc?.regNum} {doc?.regDate ?
                        <span>від {format(doc.regDate, "dd.MM.yyyy")}</span>
                        : ""}
                    </Typography>
                </ModalHeader>
                <ModalBody>
                    <div className="mb-2">
                        <label className="cursor-pointer text-gray-600 dark:text-gray-400">
                            <input
                                type="checkbox"
                                className="cursor-pointer form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-300"
                                checked={isProtected}
                                onChange={(e) => vm.setProtected(e.target.checked)}
                                name="isResponsible"
                            />{' '}
                            Зняти блокування
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <SingleSelect closeMenuOnSelect error={errors?.typeId}
                                      options={types}
                                      label="Тип"
                                      id="typeId"
                                      value={form.typeId}
                                      onChange={vm.changeSelect("typeId")}/>
                        {isProtected ?
                            <Input error={errors?.regDate} disabled={isProtected}
                                   label="Дата реєстрації"
                                   value={form.regDate ? format(form.regDate, "dd.MM.yyyy") : ''} name="regDate"
                            />
                            :
                            <DatePicker onChange={vm.changeDate} value={form.regDate} disabled={isProtected}
                                        label="Дата реєстрації"/>
                        }
                        {fields}
                    </div>
                    {comments}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={onClose} className="mr-1">
                        <span>Закрити</span>
                    </Button>
                    <Button variant="gradient" color="green" onClick={handleSubmit} disabled={vm.isPending}>
                        Редагувати
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    return (
        <Modal data-i-doc="modal:document-create" open={open} handler={onClose} size="sm">
            <ModalHeader>
                Створити новий документ
            </ModalHeader>
            <ModalBody>
                <div className="grid grid-cols-2 gap-2">
                    <SingleSelect size="sm" closeMenuOnSelect error={errors?.typeId}
                                  options={types}
                                  label="Тип"
                                  id="typeId"
                                  value={form.typeId}
                                  onChange={vm.changeSelect("typeId")}/>
                    <DatePicker onChange={vm.changeDate} error={errors?.regDate} date={form.regDate} errors
                                label="Дата реєстрації"/>
                    {fields}
                </div>
                {comments}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onClose} className="mr-1">
                    <span>Закрити</span>
                </Button>
                <Menu>
                    <MenuHandler>
                        <Button disabled={vm.isPending}>Створити</Button>
                    </MenuHandler>
                    <MenuList className="p-1.5">
                        <MenuItem onClick={handleSubmit} className="hover:bg-gray-200">Створити</MenuItem>
                    </MenuList>
                </Menu>
            </ModalFooter>
        </Modal>
    );
};

export default observer(DocumentFormModal);
