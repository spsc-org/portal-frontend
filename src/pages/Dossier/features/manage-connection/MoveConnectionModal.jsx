import {useState} from "react";
import { Typography } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../../components/Modal/Modal.jsx"
import Button from "../../../../components/Buttons/Button.jsx"
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
        <Modal data-i-doc="modal:sanction-profiles-move-connection"
            open={open}
            handler={onClose}
            size="xl"
            className="border"
            overlayProps={{className: "bg-black/20 backdrop-blur-none"}}>
            <ModalHeader>
                <Typography variant="h5">Перенести зв'язок</Typography>
            </ModalHeader>
            <ModalBody className="p-0 h-[80vh] overflow-hidden flex">
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
                <ProfileDetailPane key={selectedTargetId ?? "none"} profileId={selectedTargetId} canManage={false}/>
            </ModalBody>
            <ModalFooter className="gap-2">
                <Button color="secondary" onClick={onClose} disabled={isPending}>
                    Скасувати
                </Button>
                <Button
                    variant="gradient"
                    color="blue"
                    onClick={() => onConfirm(selectedTargetId)}
                    disabled={!canConfirmMove || isPending}>
                    {isPending ? "Перенесення…" : "Перенести сюди"}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default MoveConnectionModal;
