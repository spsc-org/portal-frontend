import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../../shared/mvvm/index.js";
import { cartErrorMessage } from "../../../model/projectModel.js";
import { lookupUnitByRegnum } from "../../../entities/cart/api.js";
import BulkFormShell from "./BulkFormShell.jsx";
import { SelectField } from "./fields.jsx";
import SingleSelect from "../../../../../components/fields/SingleSelect.jsx";

const inputClass = "w-full h-10 px-3 py-2 border border-gray-200 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

// bulkTab7 — "Додати документ". Єдина bulk-форма БЕЗ поля "reason" (сервер
// теж його не приймає для цієї дії, див. entities/cart/api.js:addDocument).
// "Підрозділ" (addDocUnit) у легасі заповнюється зі словника `initiator`
// (той самий словник, не окрема сутність) — так само тут.
const AddDocumentForm = ({ projectIds, userId, onDone }) => {
    const data = useVM().cartModal.options;
    const documentTypes = useMemo(() => Object.values(data?.documentType ?? {}), [data]);
    const units = useMemo(() => Object.values(data?.initiator ?? {}), [data]);

    const [fields, setFields] = useState({
        addDocType: "",
        addDocRegnum: "",
        addDocRegdate: "",
        addDocListItem: "",
        addDocUnit: "",
        addDocPath: "",
        addDocCaption: "",
    });
    const setField = (name) => (value) => setFields((prev) => ({ ...prev, [name]: value }));

    const selectedUnit = useMemo(
        () => units.find((u) => String(u.id) === String(fields.addDocUnit)) ?? null,
        [units, fields.addDocUnit],
    );

    // Автопідстановка "Підрозділу" за номером документа — відповідник
    // initDocRegnumLookup() у cartManager.js (debounce 400мс,
    // GET /api/helper/validateNumber). Підставляємо unitId лише якщо
    // користувач сам ще не встиг обрати підрозділ (щоб не затирати ручний вибір).
    const [regnumLookupPending, setRegnumLookupPending] = useState(false);
    const unitTouchedRef = useRef(false);

    useEffect(() => {
        const value = fields.addDocRegnum.trim();
        if (!value) return undefined;

        const timer = setTimeout(async () => {
            setRegnumLookupPending(true);
            try {
                const res = await lookupUnitByRegnum(value);
                if (res?.success && res.unitId != null && !unitTouchedRef.current) {
                    setFields((prev) => ({ ...prev, addDocUnit: String(res.unitId) }));
                }
            } catch (error) {
                console.error("validateNumber error:", error);
            } finally {
                setRegnumLookupPending(false);
            }
        }, 400);

        return () => clearTimeout(timer);
         
    }, [fields.addDocRegnum]);

    const mutation = useVM().cartModal.cmd.addDocument;

    const handleSubmit = () => {
        mutation.mutate([projectIds, fields, userId], { onSuccess: (result) => onDone(result) });
    };

    return (
        <BulkFormShell
            title="Додати документ"
            description={(
                <>
                    <p>Прив'язує документ до відібраних проєктів.</p>
                    <p><span className="font-medium dark:text-blue-200">Увага!</span> Якщо документ не існує — він буде створений.</p>
                </>
            )}
            hasReason={false}
            onSubmit={handleSubmit}
            isPending={mutation.isPending}
            isError={mutation.isError}
            errorMessage={cartErrorMessage(mutation.error, "Не вдалося виконати операцію")}
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectField label="Тип" value={fields.addDocType} onChange={setField("addDocType")} options={documentTypes} />
                <div>
                    <label className={`${labelClass} flex items-center gap-1.5`}>
                        Номер
                        {regnumLookupPending && <i className="fas fa-spinner fa-spin text-xs text-gray-500" />}
                    </label>
                    <input type="text" value={fields.addDocRegnum} onChange={(e) => setField("addDocRegnum")(e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Дата</label>
                    <input type="date" value={fields.addDocRegdate} onChange={(e) => setField("addDocRegdate")(e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Пункт переліку</label>
                    <input type="text" value={fields.addDocListItem} onChange={(e) => setField("addDocListItem")(e.target.value)} placeholder="напр. 1.15" className={inputClass} />
                </div>
                <SingleSelect
                    surface="form"
                    label="Підрозділ"
                    id="cart-add-document-unit"
                    options={units}
                    value={selectedUnit}
                    onChange={(option) => { unitTouchedRef.current = true; setField("addDocUnit")(option?.id ? String(option.id) : ""); }}
                    isClearable
                />
                <div>
                    <label className={labelClass}>Шлях до файлу</label>
                    <input type="text" value={fields.addDocPath} onChange={(e) => setField("addDocPath")(e.target.value)} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                    <label className={labelClass}>Примітки</label>
                    <input type="text" value={fields.addDocCaption} onChange={(e) => setField("addDocCaption")(e.target.value)} className={inputClass} />
                </div>
            </div>
        </BulkFormShell>
    );
};

export default observer(AddDocumentForm);
