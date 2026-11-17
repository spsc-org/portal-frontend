import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../../shared/mvvm/index.js";
import { cartErrorMessage } from "../../../model/projectModel.js";
import BulkFormShell from "./BulkFormShell.jsx";
import { SelectField } from "./fields.jsx";

// bulkTab9 — "Встановити стан".
const SetStateForm = ({ projectIds, userId, onDone }) => {
    const data = useVM().cartModal.options;
    const states = useMemo(() => Object.values(data?.state ?? {}), [data]);

    const [stateId, setStateId] = useState("");
    const [reason, setReason] = useState("");
    const mutation = useVM().cartModal.cmd.setState;

    const handleSubmit = () => {
        mutation.mutate([projectIds, stateId, reason, userId], { onSuccess: (result) => onDone(result) });
    };

    return (
        <BulkFormShell
            title="Встановити стан"
            description={<p>Встановлює стан для всіх відібраних проєктів.</p>}
            reason={reason}
            onReasonChange={setReason}
            onSubmit={handleSubmit}
            isPending={mutation.isPending}
            isError={mutation.isError}
            errorMessage={cartErrorMessage(mutation.error, "Не вдалося виконати операцію")}
            disabled={!stateId}
        >
            <SelectField label="Оберіть стан" value={stateId} onChange={setStateId} options={states} />
        </BulkFormShell>
    );
};

export default observer(SetStateForm);
