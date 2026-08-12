import React, {useState} from "react";
import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Switch,
    Textarea,
    Tooltip,
    Typography
} from "@material-tailwind/react";
import LoadingButton from "../../../Components/Buttons/LoadingButton.jsx";
import AdvancedSelect from "../../../Components/fields/AdvancedSelect.jsx";
import {downloadFile, MAPPED_RESTRICTIONS, RESTRICTIONS} from "../../../utils.js";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";
import CustomToast from "../../../Components/CustomToast.jsx";
import {usePage} from "@inertiajs/react";


const DEFAULT_SKIP_IDENTIFIER_CODES = ['doc:passport', 'doc:f_passport', 'doc:d_passport', 'doc:s_passport', 'doc:residence'];
const DEFAULT_SKIP_ATTRIBUTE_CODES = ['birthplace', 'residence', 'regplace', 'occupation', 'partner_sanctions'];

const ExportLinkedProjectsModal = ({open = false, onClose, identifierTypes = [], attributeTypes = [], ...dialogProps}) => {
    const {auth} = usePage().props;

    const DEFAULT_RESTRICT_PROHIBITION = RESTRICTIONS.filter(r=> r === "11" || r === "12").map((r)=> ({value: r, label: r}));
    const DEFAULT_RESTRICT_COMPLETE = RESTRICTIONS.filter(r=> r === "2" || r === "3" || r === "9").map((r)=> ({value: r, label: r}));
    const defaultSkipIdentifierTypes = identifierTypes
        .filter(i => DEFAULT_SKIP_IDENTIFIER_CODES.includes(i.code))
        .map(i => ({value: i.id, label: i.caption}));
    const defaultSkipAttributeTypes = attributeTypes
        .filter(i => DEFAULT_SKIP_ATTRIBUTE_CODES.includes(i.code))
        .map(i => ({value: i.id, label: i.caption}));

    const [form, setForm] = useState({
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
    });

    const {mutate: getFile, isPending: getFilePending} = useMutation({
        mutationFn: async ({actionId, typeId, id, form}) => {
            const formParams = {
                changeQuotes: form.changeQuotes,
                moveVesselToRestriction: form.moveVesselToRestriction,
                restrictionsSeparateProcessingNum24: form.restrictionsSeparateProcessingNum24,
                moveAddressesToAdditionalInfo: form.moveAddressesToAdditionalInfo,
                onlyReadyProjects: form.onlyReadyProjects,
                shouldValidateIdentifier: form.shouldValidateIdentifier,
                restrictionsFullProhibition: form.restrictionsFullProhibition.map(item => item.value),
                restrictionsCompleteTermination: form.restrictionsCompleteTermination.map(item => item.value),
                skipIdentifierTypes: form.skipIdentifierTypes.map(item => item.value),
                skipAttributeTypes: form.skipAttributeTypes.map(item => item.value),
                useReasoningMacro: form.useReasoningMacro,
                reasoningMacro: form.reasoningMacro,
            }
            const response = await axios.get(`/api/proposal/${id}/export`, {
                params: {
                    actionTypeId: actionId,
                    subjectTypeId: typeId,
                    ...formParams
                },
                headers: {
                    "userId": auth?.user?.id, 'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                }, responseType: 'blob',
            });
            const contentDisposition = response.headers["content-disposition"];
            const utf8FilenameRegex = /filename\*=UTF-8''([\w%\-\.]+)(?:; ?|$)/i;
            const asciiFilenameRegex = /^filename=(["']?)(.*?[^\\])\1(?:; ?|$)/i;
            let filename = "";

            if (utf8FilenameRegex.test(contentDisposition)) {
                filename = decodeURIComponent(utf8FilenameRegex.exec(contentDisposition)[1]);
            } else {
                const filenameStart = contentDisposition.toLowerCase().indexOf('filename=');
                if (filenameStart >= 0) {
                    const partialDisposition = contentDisposition.slice(filenameStart);
                    const matches = asciiFilenameRegex.exec(partialDisposition);
                    if (matches != null && matches[2]) {
                        filename = matches[2];
                    }
                }
            }
            downloadFile(response.data, filename);
        },
        onError: error => {
            const contentType = error.response.headers['content-type'];
            if (contentType && contentType.includes('application/json')) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        if (errorData?.message) {
                            const msg = `${errorData?.message} ${errorData?.error}`;
                            toast.custom((t) => <CustomToast t={t} message={msg}/>)
                        } else {
                            toast.custom((t) => <CustomToast t={t} message={"Виникла помилка завантаження."}/>)
                        }
                    } catch (e) {
                        console.error("Failed to parse error JSON");
                    }
                };
                reader.readAsText(error.response.data);
            }
        }
    });


    const handleExport = () => {
        if (getFilePending) {
            return;
        }
        console.log(dialogProps);
        getFile({form, ...dialogProps})
    }


    const toggleSwitch = ({target}) => {
        setForm(prevState => ({...prevState, [target.name]: target.checked}));
    }

    const handleChangeOptions = (key = '') => (newSelectedIds) => {
        setForm(prevState =>
            ({...prevState, [key]: newSelectedIds}));
    };

    return (
        <Dialog open={open} handler={onClose} size="md">
            <DialogHeader className="dark:text-gray-200 space-x-5">
                <span>Експорт</span>
            </DialogHeader>
            <DialogBody className="overflow-y-auto max-h-[calc(100vh-200px)]">
                <Typography variant="h5" component="p" className="dark:text-slate-400">
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
                    <Typography variant="h5" component="p" className="dark:text-slate-400">
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
                            className="dark:text-slate-400"
                            onChange={toggleSwitch}/>
                    <Typography variant="h5" component="p" className="dark:text-slate-400">
                        Ідентифікатори
                    </Typography>
                    <AdvancedSelect isMulti
                                    options={identifierTypes}
                                    label={"Не виводити при експорті"}
                                    id="skipIdentifierTypes"
                                    selectedOptions={form.skipIdentifierTypes}
                                    onChange={handleChangeOptions('skipIdentifierTypes')}/>
                    <Typography variant="h5" component="p" className="dark:text-slate-400 mt-2">
                        Атрибути
                    </Typography>
                    <AdvancedSelect isMulti
                                    options={attributeTypes}
                                    label={"Не виводити обрані атрибути при експорті"}
                                    id="skipAttributeTypes"
                                    selectedOptions={form.skipAttributeTypes}
                                    onChange={handleChangeOptions('skipAttributeTypes')}/>
                    <Typography variant="h5" component="p" className="dark:text-slate-400">
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
                                className="dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 dark:placeholder:text-gray-400 dark:focus:border-blue-300"
                                labelProps={{className: "dark:text-slate-200"}}
                            />
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <Typography variant="small" className="font-bold mb-1 dark:text-gray-300">
                                    Доступні плейсхолдери:
                                </Typography>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[reasoning] <span className="text-gray-500 dark:text-gray-400">- обгрунтування</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[notes] <span className="text-gray-500 dark:text-gray-400">- примітки</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[id] <span className="text-gray-500 dark:text-gray-400">- ID проєкту</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[drsId] <span className="text-gray-500 dark:text-gray-400">- ID в ДРС</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[nameUk] <span className="text-gray-500 dark:text-gray-400">- назва (Укр)</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[adrUk] <span className="text-gray-500 dark:text-gray-400">- адреса (Укр)</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[birthDate] <span className="text-gray-500 dark:text-gray-400">- дата народж.</span></span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">[actionType] <span className="text-gray-500 dark:text-gray-400">- тип дії</span></span>
                                </div>
                                <Typography variant="small" className="text-gray-500 dark:text-gray-400 mt-2 italic text-[10px]">
                                    * Плейсхолдери будуть замінені на відповідні значення з бази даних для кожного запису.
                                </Typography>
                            </div>
                        </div>
                    )}
                </div>
            </DialogBody>
            <DialogFooter>
                <Button
                    variant="text"
                    color="red"
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
            </DialogFooter>
        </Dialog>
    );
};

export default ExportLinkedProjectsModal;
