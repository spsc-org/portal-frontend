import IconButton from "../../../shared/ui/IconButton.jsx";

// View: кнопки керування рядком. abilities — model/abilities.js:getRowAbilities(),
// commands — viewModel/useProjectRowCommands().
const RowActions = ({ id, visibleIds, abilities, commands }) => {
    const disabled = !commands.canAct;

    return (
        <div className="flex flex-wrap gap-1">
            <IconButton icon="fa-regular fa-rectangle-history" title="Картка" disabled={disabled} onClick={() => commands.onOpenCard(id, visibleIds)} />
            <IconButton icon="fa-regular fa-message-plus" title="Додати тікет" disabled={disabled} onClick={() => commands.onAddTicket(id)} />
            {abilities.edit && <IconButton icon="fa-solid fa-pen-to-square" title="Редагувати" disabled={disabled} onClick={() => commands.onEdit(id)} />}
            {abilities.copy && <IconButton icon="fa-solid fa-copy" title="Копіювати" disabled={disabled} onClick={() => commands.onCopy(id)} />}
            {abilities.remove && (
                <IconButton icon="fa-solid fa-trash-can" title="Видалити" tone="danger" disabled={disabled} onClick={() => commands.onDelete(id)} />
            )}
        </div>
    );
};

export default RowActions;
