import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../../shared/mvvm/index.js";
import { cartErrorMessage } from "../../../model/projectModel.js";
import BulkFormShell from "./BulkFormShell.jsx";
import { SelectField } from "./fields.jsx";

// bulkTab8 — "Призначити виконавця".
const SetPerformerForm = ({ projectIds, userId, onDone }) => {
    const data = useVM().cartModal.options;
    const users = useMemo(() => Object.values(data?.user ?? {}), [data]);

    const [performerId, setPerformerId] = useState("");
    const [reason, setReason] = useState("");
    const mutation = useVM().cartModal.cmd.setPerformer;

    const handleSubmit = () => {
        mutation.mutate([projectIds, performerId, reason, userId], { onSuccess: (result) => onDone(result) });
    };

    return (
        <BulkFormShell
            title="Призначити виконавця"
            description={<p>Встановлює виконавця для всіх відібраних проєктів.</p>}
            reason={reason}
            onReasonChange={setReason}
            onSubmit={handleSubmit}
            isPending={mutation.isPending}
            isError={mutation.isError}
            errorMessage={cartErrorMessage(mutation.error, "Не вдалося виконати операцію")}
            disabled={!performerId}
        >
            <SelectField label="Оберіть виконавця" value={performerId} onChange={setPerformerId} options={users} />
        </BulkFormShell>
    );
};

export default observer(SetPerformerForm);
