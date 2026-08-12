import React, {useState} from "react";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import ProfileAutocomplete from "./ProfileAutocomplete.jsx";
import {useDossierOptionsQuery} from "../../entities/dossier/queries.js";

// Модальне вікно додавання profile-to-profile звʼязку (заміняє колишню
// AddRelationForm.jsx, i-doc:component:sanction-profiles-add-relation-form,
// видалену 2026-07-17 після перенесення вмісту в цю модалку): автокомпліт
// вибору профілю + вибір типу з довідника profile_connection_type (GET /api/dossier/options)
// + нотатка. Мутація — переюз linkMutation з useProfileRelationMutations.
const AddRelationModal = ({open, excludeId, linkMutation, onClose}) => {
    const {data: options} = useDossierOptionsQuery();
    const connectionTypes = options?.connectionTypes ?? [];
    const [relatedProfile, setRelatedProfile] = useState(null);
    const [connectionTypeId, setConnectionTypeId] = useState(connectionTypes[0]?.id ?? "");
    const [note, setNote] = useState("");

    const canSubmit = Boolean(relatedProfile) && Boolean(connectionTypeId);

    const resetAndClose = () => {
        setRelatedProfile(null);
        setConnectionTypeId(connectionTypes[0]?.id ?? "");
        setNote("");
        onClose();
    };

    const handleSubmit = () => {
        if (!canSubmit) return;
        linkMutation.mutate(
            {
                relatedProfileId: relatedProfile.id,
                connectionTypeId: Number(connectionTypeId),
                note: note.trim() || undefined,
            },
            {onSuccess: () => resetAndClose()}
        );
    };

    return (
        <Dialog data-i-doc="modal:sanction-profiles-add-relation"
            open={open}
            handler={resetAndClose}
            size="sm"
            className="dark:bg-slate-900 border dark:border-slate-800"
            overlayProps={{className: "bg-black/20 backdrop-blur-none"}}
        >
            <DialogHeader className="dark:text-white">
                <Typography variant="h5">Додати пов'язаний профіль</Typography>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-3.5">
                <div>
                    <div className="text-[12px] font-semibold text-gray-600 mb-1.5 dark:text-gray-400">Профіль</div>
                    <ProfileAutocomplete selected={relatedProfile} onSelect={setRelatedProfile} excludeId={excludeId}/>
                </div>
                <div>
                    <div className="text-[12px] font-semibold text-gray-600 mb-1.5 dark:text-gray-400">Тип зв'язку</div>
                    <select
                        value={connectionTypeId}
                        onChange={(e) => setConnectionTypeId(e.target.value)}
                        className="w-full h-10 px-2.5 border border-gray-300 rounded-lg bg-white text-[12.5px] text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                    >
                        {connectionTypes.map((type) => (
                            <option key={type.id} value={type.id}>{type.caption}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <div className="text-[12px] font-semibold text-gray-600 mb-1.5 dark:text-gray-400">Нотатка</div>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={1000}
                        placeholder="Нотатка (опційно, напр. «за даними ЗМІ»)…"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[12.5px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 resize-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                    />
                </div>
                {!relatedProfile && (
                    <div className="text-[11.5px] text-gray-400">Оберіть профіль, щоб додати звʼязок.</div>
                )}
            </DialogBody>
            <DialogFooter className="gap-2">
                <Button variant="text" color="red" onClick={resetAndClose} disabled={linkMutation.isPending}>
                    Скасувати
                </Button>
                <Button
                    variant="gradient"
                    color="blue"
                    onClick={handleSubmit}
                    disabled={!canSubmit || linkMutation.isPending}
                >
                    {linkMutation.isPending ? "Додавання…" : "Додати"}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default AddRelationModal;
