import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../../shared/mvvm/index.js";
import { cartErrorMessage } from "../../../model/projectModel.js";
import BulkFormShell from "./BulkFormShell.jsx";
import { SelectField } from "./fields.jsx";

// bulkTab10 — "Призначити валідатора".
const SetValidatorForm = ({ projectIds, userId, onDone }) => {
    const data = useVM().cartModal.options;
    const users = useMemo(() => Object.values(data?.user ?? {}), [data]);

    const [validatorId, setValidatorId] = useState("");
    const [reason, setReason] = useState("");
    const mutation = useVM().cartModal.cmd.setValidator;

    const handleSubmit = () => {
        mutation.mutate([projectIds, validatorId, reason, userId], { onSuccess: (result) => onDone(result) });
    };

    return (
        <BulkFormShell
            title="Призначити валідатора"
            description={<p>Встановлює валідатора для всіх відібраних проєктів.</p>}
            reason={reason}
            onReasonChange={setReason}
            onSubmit={handleSubmit}
            isPending={mutation.isPending}
            isError={mutation.isError}
            errorMessage={cartErrorMessage(mutation.error, "Не вдалося виконати операцію")}
            disabled={!validatorId}
        >
            <SelectField label="Оберіть валідатора" value={validatorId} onChange={setValidatorId} options={users} />
        </BulkFormShell>
    );
};

export default observer(SetValidatorForm);
