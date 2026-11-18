import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { ExportLinkedProjectsViewModel } from "../viewmodel/ProposalViewModels.js";
import { Switch, Textarea, Typography } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import LoadingButton from "../../../components/Buttons/LoadingButton.jsx";
import AdvancedSelect from "../../../components/fields/AdvancedSelect.jsx";
import {MAPPED_RESTRICTIONS, RESTRICTIONS} from "../../../lib/utils.js";


const DEFAULT_SKIP_IDENTIFIER_CODES = ['doc:passport', 'doc:f_passport', 'doc:d_passport', 'doc:s_passport', 'doc:residence'];
const DEFAULT_SKIP_ATTRIBUTE_CODES = ['birthplace', 'residence', 'regplace', 'occupation', 'partner_sanctions'];

const ExportLinkedProjectsModal = ({open = false, onClose, identifierTypes = [], attributeTypes = [], ...dialogProps}) => {

    const DEFAULT_RESTRICT_PROHIBITION = RESTRICTIONS.filter(r=> r === "11" || r === "12").map((r)=> ({value: r, label: r}));
    const DEFAULT_RESTRICT_COMPLETE = RESTRICTIONS.filter(r=> r === "2" || r === "3" || r === "9").map((r)=> ({value: r, label: r}));
    const defaultSkipIdentifierTypes = identifierTypes
        .filter(i => DEFAULT_SKIP_IDENTIFIER_CODES.includes(i.code))
        .map(i => ({value: i.id, label: i.caption}));
    const defaultSkipAttributeTypes = attributeTypes
        .filter(i => DEFAULT_SKIP_ATTRIBUTE_CODES.includes(i.code))
        .map(i => ({value: i.id, label: i.caption}));

    const vm = useViewModel((deps) => new ExportLinkedProjectsViewModel({ ...deps, defaults: {
        changeQuotes: true,
        moveVesselToRestriction: true,
        restrictionsSeparateProcessingNum24: true,
        moveAddressesToAdditionalInfo: true,
        onlyReadyProjects: true,
        shouldValidateIdentifier: true,
        restrictionsFullProhibition: DEFAULT_RESTRICT_PROHIBITION,
        restrictionsCompleteTermination: DEFAULT_RESTRICT_COMPLETE,
        skipIdentifierTypes: defaultSkipIdentifierTypes,
        skipAttributeTypes: defaultSkipAttributeTypes,
        useReasoningMacro: false,
        reasoningMacro: '[reasoning]',
    } }));
    const form = vm.form;
    const setForm = vm.setForm;
    const getFilePending = vm.isPending;
    const handleExport = () => vm.exportFile(dialogProps);
    const toggleSwitch = ({target}) => setForm(prev => ({...prev, [target.name]: target.checked}));
    const handleChangeOptions = (key = '') => (selected) => setForm(prev => ({...prev, [key]: selected}));

    return (
        <Modal open={open} handler={onClose} size="md">
            <ModalHeader className="space-x-5">
                <span>Експорт</span>
            </ModalHeader>
            <ModalBody className="overflow-y-auto max-h-[calc(100vh-200px)]">
                <Typography variant="h5" component="p" className="dark:text-gray-400">
                    Обмеження
                </Typography>
                <div className="flex flex-col space-y-4">
                    <AdvancedSelect isMulti
                                    options={MAPPED_RESTRICTIONS}
                                    label={"Підставляти  в дужках \"повна заборона\""}
                                    id="restrictionsFullProhibition"
                                    selectedOptions={form.restrictionsFullProhibition}
                                    onChange={handleChangeOptions('restrictionsFullProhibition')}/>
                    <AdvancedSelect isMulti
                                    options={MAPPED_RESTRICTIONS}
                                    label={"Підставляти в дужках \"повне припинення\""}
                                    id="restrictionsCompleteTermination"
                                    selectedOptions={form.restrictionsCompleteTermination}
                                    onChange={handleChangeOptions('restrictionsCompleteTermination')}/>
                    <Switch ripple={false}
                            color="green"
                            label="Окреме опрацювання 24ї санкції ( ставимо на перше місце та додаємо в терміни 'Безстроково')"
                            name="restrictionsSeparateProcessingNum24"
                            checked={form.restrictionsSeparateProcessingNum24}
                            onChange={toggleSwitch}/>
                    <Typography variant="h5" component="p" className="dark:text-gray-400">
                        Додаткова інформація
                    </Typography>







                    <Switch ripple={false}
                            color="green"
                            label="Переносити судна із додаткової інформації в обмеження"
                            name="moveVesselToRestriction"
                            checked={form.moveVesselToRestriction}
                            onChange={toggleSwitch}/>

                    <Switch ripple={false}
                            color="green"
                            label="Переносити адреси в додаткову інформацію"
                            name="moveAddressesToAdditionalInfo"
                            checked={form.moveAddressesToAdditionalInfo}
                            className="dark:text-gray-400"
                            onChange={toggleSwitch}/>
                    <Typography variant="h5" component="p" className="dark:text-gray-400">
                        Ідентифікатори
                    </Typography>
                    <AdvancedSelect isMulti
                                    options={identifierTypes}
                                    label={"Не виводити при експорті"}
                                    id="skipIdentifierTypes"
                                    selectedOptions={form.skipIdentifierTypes}
                                    onChange={handleChangeOptions('skipIdentifierTypes')}/>
                    <Typography variant="h5" component="p" className="dark:text-gray-400 mt-2">
                        Атрибути
                    </Typography>
                    <AdvancedSelect isMulti
                                    options={attributeTypes}
                                    label={"Не виводити обрані атрибути при експорті"}
                                    id="skipAttributeTypes"
                                    selectedOptions={form.skipAttributeTypes}
                                    onChange={handleChangeOptions('skipAttributeTypes')}/>
                    <Typography variant="h5" component="p" className="dark:text-gray-400">
                        Інше
                    </Typography>
                    <Switch ripple={true}
                            color="green"
                            label="Перевірка ідентифікаторів (тип, значення, країни)"
                            name="shouldValidateIdentifier"
                            checked={form.shouldValidateIdentifier}
                            onChange={toggleSwitch}/>
                    <Switch ripple={false}
                            color="green"
                            label="Відфільтровувати тільки готові проєкти (<Готово> та <Є питання>)"
                            name="onlyReadyProjects"
                            checked={form.onlyReadyProjects}
                            onChange={toggleSwitch}/>
                    <Switch ripple={false}
                            color="green"
                            label="Заміна усіх кавичок на однотипні"
                            name="changeQuotes"
                            checked={form.changeQuotes}
                            onChange={toggleSwitch}/>
                    <Switch ripple={false}
                            color="green"
                            label="Використати макрос для обгрунтування"
                            name="useReasoningMacro"
                            checked={form.useReasoningMacro}
                            onChange={toggleSwitch}/>
                    {form.useReasoningMacro && (
                        <div className="mt-2 space-y-2">
                            <Textarea
                                label="Макрос обгрунтування"
                                value={form.reasoningMacro}
                                onChange={(e) => setForm(prevState => ({...prevState, reasoningMacro: e.target.value}))}
                                className="dark:bg-neutral-800 dark:text-gray-300 dark:border-gray-600 dark:placeholder:text-gray-400 dark:focus:border-blue-300"
                                labelProps={{className: "dark:text-gray-200"}}
                            />
                            <div className="p-2 bg-gray-50 dark:bg-neutral-700 rounded-lg border border-gray-200 dark:border-neutral-700">
                                <Typography variant="small" className="font-bold mb-1 dark:text-gray-300">
                                    Доступні плейсхолдери:
                                </Typography>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[reasoning] <span className="text-gray-600 dark:text-gray-400">- обгрунтування</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[notes] <span className="text-gray-600 dark:text-gray-400">- примітки</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[id] <span className="text-gray-600 dark:text-gray-400">- ID проєкту</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[drsId] <span className="text-gray-600 dark:text-gray-400">- ID в ДРС</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[nameUk] <span className="text-gray-600 dark:text-gray-400">- назва (Укр)</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[adrUk] <span className="text-gray-600 dark:text-gray-400">- адреса (Укр)</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[birthDate] <span className="text-gray-600 dark:text-gray-400">- дата народж.</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[actionType] <span className="text-gray-600 dark:text-gray-400">- тип дії</span></span>
                                </div>
                                <Typography variant="small" className="text-gray-600 dark:text-gray-400 mt-2 italic text-[10px]">
                                    * Плейсхолдери будуть замінені на відповідні значення з бази даних для кожного запису.
                                </Typography>
                            </div>
                        </div>
                    )}
                </div>
            </ModalBody>
            <ModalFooter>
                <Button
                    color="secondary"
                    onClick={onClose}
                    className="mr-1">
                    <span>Закрити</span>
                </Button>
                <LoadingButton
                    isLoading={getFilePending}
                    color="green"
                    onClick={handleExport}>
                    <span>Експорт</span>
                </LoadingButton>
            </ModalFooter>
        </Modal>
    );
};

export default observer(ExportLinkedProjectsModal);
