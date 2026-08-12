import React, { useMemo, useState } from "react";
import { useProjectOptionsQuery } from "../../../entities/project/queries.js";
import { useSetPerformerMutation, getErrorMessage } from "../../../entities/cart/queries.js";
import BulkFormShell from "./BulkFormShell.jsx";
import { SelectField } from "./fields.jsx";

// bulkTab8 — "Призначити виконавця".
const SetPerformerForm = ({ projectIds, userId, onDone }) => {
    const { data } = useProjectOptionsQuery(["user"], userId);
    const users = useMemo(() => Object.values(data?.user ?? {}), [data]);

    const [performerId, setPerformerId] = useState("");
    const [reason, setReason] = useState("");
    const mutation = useSetPerformerMutation();

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
            errorMessage={getErrorMessage(mutation.error, "Не вдалося виконати операцію")}
            disabled={!performerId}
        >
            <SelectField label="Оберіть виконавця" value={performerId} onChange={setPerformerId} options={users} />
        </BulkFormShell>
    );
};

export default SetPerformerForm;
