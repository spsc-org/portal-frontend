import React, {useState} from "react";
import {ENTITY_CONNECTION, ENTITY_ORPHAN, ENTITY_PROFILE} from "../../entities/dossierTicket/model.js";

// Три малих поля "знайти id → одразу додати" — Enter в полі викликає onAdd({type,id})
// і чистить поле. Сам onAdd вирішує caller: TicketBody шле запит одразу (тікет уже
// існує), CreateTicketModal лише накопичує в локальному стані (тікета ще нема).
const AddLinkFields = ({onAdd, isPending}) => {
    const [profileId, setProfileId] = useState("");
    const [connectionId, setConnectionId] = useState("");
    const [orphanId, setOrphanId] = useState("");

    const submit = (type, value, reset) => {
        const id = Number(value.trim());
        if (!Number.isInteger(id) || id <= 0) return;
        onAdd({type, id});
        reset("");
    };

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <input
                type="text"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit(ENTITY_PROFILE, profileId, setProfileId)}
                disabled={isPending}
                placeholder="+ досьє (id)"
                className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10.5px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <input
                type="text"
                value={connectionId}
                onChange={(e) => setConnectionId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit(ENTITY_CONNECTION, connectionId, setConnectionId)}
                disabled={isPending}
                placeholder="+ звʼязок (id)"
                className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10.5px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <input
                type="text"
                value={orphanId}
                onChange={(e) => setOrphanId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit(ENTITY_ORPHAN, orphanId, setOrphanId)}
                disabled={isPending}
                placeholder="+ сирота (id проєкту)"
                className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10.5px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
        </div>
    );
};

export default AddLinkFields;
