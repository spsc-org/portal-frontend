import React, { useMemo, useState } from "react";
import { useProjectOptionsQuery } from "../../../entities/project/queries.js";
import { useRewriteTermMutation, getErrorMessage } from "../../../entities/cart/queries.js";
import BulkFormShell from "./BulkFormShell.jsx";
import { SelectField } from "./fields.jsx";

// bulkTab5 — "Встановити новий термін".
const SetTermForm = ({ projectIds, userId, onDone }) => {
    const { data } = useProjectOptionsQuery(["term"], userId);
    const terms = useMemo(() => Object.values(data?.term ?? {}), [data]);

    const [termId, setTermId] = useState("");
    const [reason, setReason] = useState("");
    const mutation = useRewriteTermMutation();

    const handleSubmit = () => {
        mutation.mutate([projectIds, termId, reason, userId], { onSuccess: (result) => onDone(result) });
    };

    return (
        <BulkFormShell
            title="Встановити новий термін"
            description={<p>Для відібраних проєктів можна встановити інший термін зі списку.</p>}
            reason={reason}
            onReasonChange={setReason}
            onSubmit={handleSubmit}
            isPending={mutation.isPending}
            isError={mutation.isError}
            errorMessage={getErrorMessage(mutation.error, "Не вдалося виконати операцію")}
            disabled={!termId}
        >
            <SelectField label="Оберіть новий термін" value={termId} onChange={setTermId} options={terms} />
        </BulkFormShell>
    );
};

export default SetTermForm;
