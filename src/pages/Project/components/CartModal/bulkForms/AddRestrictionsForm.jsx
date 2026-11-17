import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../../shared/mvvm/index.js";
import { cartErrorMessage } from "../../../model/projectModel.js";
import BulkFormShell from "./BulkFormShell.jsx";
import MultiSelect from "../../../../../components/fields/MultiSelect.jsx";

// bulkTab2 — "Додати обмежувальні заходи". Значення в списку — КОД заходу
// (item.code), не id (легасі теж шле restrictionIdList як масив кодів, не
// числових id) — 25-й захід свідомо виключений (для нього окрема форма,
// bulkTab4/RewriteRestriction25Form). Сортуємо за `order` (order_id зі
// словника) — без цього NsdcRestrictions::getExtendedDict() віддає рядки
// в довільному порядку БД, а не в логічному "1, 1-1, 2, 3...25" порядку.
const AddRestrictionsForm = ({ projectIds, userId, onDone }) => {
    const data = useVM().cartModal.options;
    const restrictions = useMemo(() => {
        return Object.values(data?.restriction ?? {})
            .filter((r) => r.code !== "25")
            .map((r) => ({ id: r.code, caption: `${r.code} ${r.caption}`, order: r.order }))
            .sort((a, b) => a.order - b.order);
    }, [data]);

    const [codes, setCodes] = useState([]);
    const selectedRestrictions = useMemo(
        () => restrictions.filter((r) => codes.includes(r.id)),
        [restrictions, codes],
    );
    const [reason, setReason] = useState("");
    const mutation = useVM().cartModal.cmd.addRestrictions;

    const handleSubmit = () => {
        mutation.mutate([projectIds, codes, reason, userId], { onSuccess: (result) => onDone(result) });
    };

    return (
        <BulkFormShell
            title="Додати обмежувальні заходи"
            description={(
                <>
                    <p>Додає обрані заходи до кожного відібраного проєкта.</p>
                    <p><span className="font-medium dark:text-blue-200">Увага!</span> Якщо захід вже є — він буде перезаписаний.</p>
                </>
            )}
            reason={reason}
            onReasonChange={setReason}
            onSubmit={handleSubmit}
            isPending={mutation.isPending}
            isError={mutation.isError}
            errorMessage={cartErrorMessage(mutation.error, "Не вдалося виконати операцію")}
            disabled={codes.length === 0}
        >
            <MultiSelect
                label="Виберіть обмеження"
                id="cart-add-restrictions"
                options={restrictions}
                value={selectedRestrictions}
                onChange={(selected) => setCodes((selected ?? []).map((r) => r.id))}
                placeholder="Пошук за номером/назвою заходу..."
            />
        </BulkFormShell>
    );
};

export default observer(AddRestrictionsForm);
