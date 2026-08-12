import React, {useState} from "react";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography} from "@material-tailwind/react";
import ProfilesMasterList from "../../widgets/ProfilesMasterList/ProfilesMasterList.jsx";
import ProfileDetailPane from "../../widgets/ProfileDetailPane/ProfileDetailPane.jsx";

const DEFAULT_FILTERS = {
    q: "",
    typeFilter: 0,
    reviewOnly: false,
    connectionsCount: "",
};

// Модальне вікно вибору цільового профілю для переносу зв'язку (PATCH .../move):
// зліва повний ProfilesMasterList (локальні, неперсистентні фільтри), справа
// read-only ProfileDetailPane (canManage=false) обраного профілю-кандидата.
const MoveConnectionModal = ({open, currentProfileId, isPending, onClose, onConfirm}) => {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [selectedTargetId, setSelectedTargetId] = useState(null);

    const setQuery = (q) => setFilters((prev) => ({...prev, q}));
    const setTypeFilter = (typeFilter) => setFilters((prev) => ({...prev, typeFilter}));
    const toggleReviewOnly = () => setFilters((prev) => ({...prev, reviewOnly: !prev.reviewOnly}));
    const setConnectionsCount = (connectionsCount) => setFilters((prev) => ({...prev, connectionsCount}));

    const canConfirmMove = Boolean(selectedTargetId) && selectedTargetId !== currentProfileId;

    return (
        <Dialog data-i-doc="modal:sanction-profiles-move-connection"
            open={open}
            handler={onClose}
            size="xl"
            className="dark:bg-slate-900 border dark:border-slate-800"
            overlayProps={{className: "bg-black/20 backdrop-blur-none"}}
        >
            <DialogHeader className="dark:text-white">
                <Typography variant="h5">Перенести зв'язок</Typography>
            </DialogHeader>
            <DialogBody className="p-0 h-[80vh] overflow-hidden flex">
                <ProfilesMasterList
                    filters={filters}
                    onQueryChange={setQuery}
                    onTypeFilterChange={setTypeFilter}
                    onToggleReviewOnly={toggleReviewOnly}
                    onConnectionsCountChange={setConnectionsCount}
                    excludeId={currentProfileId}
                    activeId={selectedTargetId}
                    onSelect={setSelectedTargetId}
                />
                <ProfileDetailPane profileId={selectedTargetId} canManage={false}/>
            </DialogBody>
            <DialogFooter className="gap-2">
                <Button variant="text" color="red" onClick={onClose} disabled={isPending}>
                    Скасувати
                </Button>
                <Button
                    variant="gradient"
                    color="blue"
                    onClick={() => onConfirm(selectedTargetId)}
                    disabled={!canConfirmMove || isPending}
                >
                    {isPending ? "Перенесення…" : "Перенести сюди"}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default MoveConnectionModal;
