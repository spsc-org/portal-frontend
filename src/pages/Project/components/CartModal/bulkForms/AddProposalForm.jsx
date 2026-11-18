import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../../shared/mvvm/index.js";
import { cartErrorMessage } from "../../../model/projectModel.js";
import BulkFormShell from "./BulkFormShell.jsx";
import MultiSelect from "../../../../../components/fields/MultiSelect.jsx";

// bulkTab1 — "Додати подання". Легасі фільтрує подання за стан (stateId 1
// або 2 — "Проєкт"/"Готово", лише ті, що відкриті для внесення змін),
// той самий фільтр застосовуємо тут з тих самих даних словника.
// MultiSelect — спільний компонент проєкту (react-select), той самий, що
// й в UserGroup/GroupModal.jsx: value/onChange працюють з ОБ'ЄКТАМИ опцій,
// не з голими id, тож id-масив (потрібен для payload) і "поточний вибір"
// (для value проп) тримаємо окремо й синхронізуємо через useMemo.
const AddProposalForm = ({ projectIds, userId, onDone }) => {
    const data = useVM().cartModal.options;
    const proposals = useMemo(
        () => Object.values(data?.proposal ?? {}).filter((p) => p.stateId === 1 || p.stateId === 2),
        [data],
    );

    const [proposalIds, setProposalIds] = useState([]);
    const selectedProposals = useMemo(
        () => proposals.filter((p) => proposalIds.includes(p.id)),
        [proposals, proposalIds],
    );
    const [reason, setReason] = useState("");
    const mutation = useVM().cartModal.cmd.linkProjectsToProposals;

    const handleSubmit = () => {
        mutation.mutate(
            [projectIds, proposalIds.map(Number), reason, userId],
            { onSuccess: (result) => onDone(result) },
        );
    };

    return (
        <BulkFormShell
            title="Додати подання"
            description={(
                <>
                    <p>Оберіть подання, в які треба додати відібрані проєкти.</p>
                    <p><span className="font-medium dark:text-blue-200">Увага!</span> Можна додати лише подання, що відкриті для внесення змін.</p>
                </>
            )}
            reason={reason}
            onReasonChange={setReason}
            onSubmit={handleSubmit}
            isPending={mutation.isPending}
            isError={mutation.isError}
            errorMessage={cartErrorMessage(mutation.error, "Не вдалося виконати операцію")}
            disabled={proposalIds.length === 0}
        >
            <MultiSelect
                surface="form"
                label="Оберіть подання"
                id="cart-add-proposal"
                options={proposals}
                value={selectedProposals}
                onChange={(selected) => setProposalIds((selected ?? []).map((p) => p.id))}
                placeholder="Пошук за назвою подання..."
            />
        </BulkFormShell>
    );
};

export default observer(AddProposalForm);
