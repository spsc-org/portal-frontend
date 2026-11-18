import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../../shared/mvvm/index.js";
import { cartErrorMessage } from "../../../model/projectModel.js";
import BulkFormShell from "./BulkFormShell.jsx";
import MultiSelect from "../../../../../components/fields/MultiSelect.jsx";

// bulkTab3 — "Оновити обмежувальні заходи": ПОВНА заміна набору заходів
// (не додавання, як у bulkTab2) — 25-й захід цією операцією теж не
// зачіпається (окрема форма). Сортуємо за `order` (order_id зі словника) —
// без цього NsdcRestrictions::getExtendedDict() віддає рядки в довільному
// порядку БД, а не в логічному "1, 1-1, 2, 3...25" порядку.
const RewriteRestrictionsForm = ({ projectIds, userId, onDone }) => {
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
    const mutation = useVM().cartModal.cmd.rewriteRestrictions;

    const handleSubmit = () => {
        mutation.mutate([projectIds, codes, reason, userId], { onSuccess: (result) => onDone(result) });
    };

    return (
        <BulkFormShell
            title="Оновити обмежувальні заходи"
            description={(
                <>
                    <p>Встановлює всім відібраним проєктам вказаний набір заходів (повна заміна).</p>
                    <p><span className="font-medium dark:text-blue-200">Увага!</span> Захід №25 цією операцією не змінюється.</p>
                </>
            )}
            reason={reason}
            onReasonChange={setReason}
            onSubmit={handleSubmit}
            isPending={mutation.isPending}
            isError={mutation.isError}
            errorMessage={cartErrorMessage(mutation.error, "Не вдалося виконати операцію")}
        >
            <MultiSelect
                surface="form"
                label="Сформуйте новий перелік обмежень"
                id="cart-rewrite-restrictions"
                options={restrictions}
                value={selectedRestrictions}
                onChange={(selected) => setCodes((selected ?? []).map((r) => r.id))}
                placeholder="Пошук за номером/назвою заходу..."
            />
        </BulkFormShell>
    );
};

export default observer(RewriteRestrictionsForm);
