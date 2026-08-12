import React, { useMemo, useState } from "react";
import { useProjectOptionsQuery } from "../../../entities/project/queries.js";
import { useSetStateMutation, getErrorMessage } from "../../../entities/cart/queries.js";
import BulkFormShell from "./BulkFormShell.jsx";
import { SelectField } from "./fields.jsx";

// bulkTab9 — "Встановити стан".
const SetStateForm = ({ projectIds, userId, onDone }) => {
    const { data } = useProjectOptionsQuery(["state"], userId);
    const states = useMemo(() => Object.values(data?.state ?? {}), [data]);

    const [stateId, setStateId] = useState("");
    const [reason, setReason] = useState("");
    const mutation = useSetStateMutation();

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
            errorMessage={getErrorMessage(mutation.error, "Не вдалося виконати операцію")}
            disabled={!stateId}
        >
            <SelectField label="Оберіть стан" value={stateId} onChange={setStateId} options={states} />
        </BulkFormShell>
    );
};

export default SetStateForm;
