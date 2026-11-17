import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../../shared/mvvm/index.js";
import { cartErrorMessage } from "../../../model/projectModel.js";
import BulkFormShell from "./BulkFormShell.jsx";
import { SelectField } from "./fields.jsx";

// bulkTab5 — "Встановити новий термін".
const SetTermForm = ({ projectIds, userId, onDone }) => {
    const data = useVM().cartModal.options;
    const terms = useMemo(() => Object.values(data?.term ?? {}), [data]);

    const [termId, setTermId] = useState("");
    const [reason, setReason] = useState("");
    const mutation = useVM().cartModal.cmd.rewriteTerm;

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
            errorMessage={cartErrorMessage(mutation.error, "Не вдалося виконати операцію")}
            disabled={!termId}
        >
            <SelectField label="Оберіть новий термін" value={termId} onChange={setTermId} options={terms} />
        </BulkFormShell>
    );
};

export default observer(SetTermForm);
