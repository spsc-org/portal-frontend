import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { ProposalDetailsViewModel } from "./viewmodel/ProposalViewModels.js";
import { useProposalProps } from "./viewmodel/useProposalProps.js";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/Modal/Modal.jsx"
import Button from "../../components/Buttons/Button.jsx"
import { DetailGrid, DetailItem, DetailSection } from "../../components/DetailFields.jsx";
import {format} from "date-fns";

const formatDate = (value) => (value ? format(value, "dd.MM.yyyy") : null);

/** Деталі подання (Portal UI kit: шапка модалки, секції, «підпис — значення»). */
const ProposalDetailsModal = ({selectedId: id, open = false, onClose}) => {
    const { users = [], issuers = [], proposalState = [] } = useProposalProps();
    const vm = useViewModel((deps) => new ProposalDetailsViewModel({ ...deps, id }));
    const proposal = vm.proposal;
    const userName = (userId) => (userId ? users.find((u) => u.id === userId)?.name : null);

    return (
        <Modal open={open} onClose={onClose} size="md">
            <ModalHeader>
                <h3 className="flex min-w-0 items-center gap-2 text-base font-bold uppercase">
                    <span className="truncate">Подання{proposal?.outgoingNumber ? ` ${proposal.outgoingNumber}` : ""}</span>
                    {proposal?.isHistorical && (
                        <i className="fa-solid fa-lock text-sm text-blue-600 dark:text-blue-400" title="Зафіксований" aria-label="Зафіксований" />
                    )}
                </h3>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-5">
                <DetailItem label="Назва" value={proposal?.caption}/>

                <DetailSection title="Реєстрація">
                    <DetailGrid>
                        <DetailItem label="Реєстраційний номер" value={proposal?.outgoingNumber}/>
                        <DetailItem label="Реєстраційна дата" value={formatDate(proposal?.outgoingDate)}/>
                        <DetailItem label="Суб'єкт подання" value={proposal?.issuerId ? issuers.find((i) => i.id === proposal.issuerId)?.caption : null}/>
                        <DetailItem label="Стан" value={proposal?.stateId ? proposalState.find((s) => s.id === proposal.stateId)?.caption : null}/>
                        <DetailItem label="К-сть юридичних" value={proposal?.calcLegal}/>
                        <DetailItem label="К-сть фізичних" value={proposal?.calcPerson}/>
                    </DetailGrid>
                </DetailSection>

                <DetailSection title="Історія">
                    <DetailGrid>
                        <DetailItem label="Створив" value={userName(proposal?.createdUserId)}/>
                        <DetailItem label="Дата створення" value={formatDate(proposal?.createdAt)}/>
                        <DetailItem label="Оновив" value={userName(proposal?.updatedUserId)}/>
                        <DetailItem label="Дата оновлення" value={formatDate(proposal?.updatedAt)}/>
                        <DetailItem label="Дата видалення" value={formatDate(proposal?.deletedAt)}/>
                    </DetailGrid>
                </DetailSection>

                <DetailSection title="Зміст">
                    <div className="flex flex-col gap-3">
                        <DetailItem label="Summary">
                            {proposal?.calcSummary
                                ? <div dangerouslySetInnerHTML={{__html: proposal.calcSummary}}/>
                                : <span className="text-gray-500 dark:text-gray-500">—</span>}
                        </DetailItem>
                        <DetailItem label="Опис" className="[&>div:last-child]:max-h-44 [&>div:last-child]:overflow-auto [&>div:last-child]:whitespace-pre-wrap" value={proposal?.description}/>
                        <DetailItem label="Коментар" className="[&>div:last-child]:max-h-44 [&>div:last-child]:overflow-auto [&>div:last-child]:whitespace-pre-wrap" value={proposal?.comments}/>
                    </div>
                </DetailSection>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onClose}>
                    Закрити
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(ProposalDetailsModal);
