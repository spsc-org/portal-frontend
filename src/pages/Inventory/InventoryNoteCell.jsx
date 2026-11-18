
const truncate = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : str;

const CommentCard = ({c, author, isOwn, onEdit, onDelete}) => {
    const initials = author?.initials ?? `#${c.userId}`;

    return (
        <div className="group/card relative mb-1 last:mb-0">

            {/* Компактний чіп */}
            <div className="flex items-center gap-1.5 px-2 py-1
                            bg-blue-50 dark:bg-blue-900/30
                            border border-blue-100 dark:border-blue-800
                            border-l-[3px] border-l-blue-400 dark:border-l-blue-500
                            rounded text-xs cursor-default select-none max-w-[220px]">
                <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center
                                 text-[9px] font-semibold text-blue-700 dark:text-blue-200 shrink-0"
                      title={author?.caption ?? ''}>
                    {initials}
                </span>
                <span className="truncate text-gray-700 dark:text-gray-300 leading-none">
                    {truncate(c.comment, 40)}
                </span>
            </div>

            {/* Popup при hover */}
            <div className="absolute left-full top-0 z-[200] w-64 ml-1
                            opacity-0 pointer-events-none
                            group-hover/card:opacity-100 group-hover/card:pointer-events-auto
                            transition-opacity duration-150
                            bg-white dark:bg-neutral-800
                            border border-gray-200 dark:border-neutral-600
                            border-l-[4px] border-l-blue-400 dark:border-l-blue-500
                            rounded-lg shadow-xl text-xs p-2.5">

                <div className="flex items-start gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center
                                     text-[11px] font-semibold text-blue-700 dark:text-blue-200 shrink-0"
                          title={author?.caption ?? ''}>
                        {initials}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 leading-snug break-words">{c.comment}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-500">{c.createdAt?.slice(0, 16)}</span>
                    {isOwn && (
                        <div className="flex gap-0.5">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(c); }}
                                    title="Редагувати"
                                    className="bg-white dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600
                                               rounded-full p-1 transition-colors">
                                <i className="fa-regular fa-pen-to-square text-blue-500 pointer-events-none"/>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                                    title="Видалити"
                                    className="bg-white dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600
                                               rounded-full p-1 transition-colors">
                                <i className="fa-regular fa-trash text-red-500 pointer-events-none"/>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const InventoryNoteCell = ({note, comments = [], users = [], inventoryId, currentUserId, onOpenModal, onDeleteComment}) => {
    const handleDelete = (commentId) => onDeleteComment(commentId);

    return (
        <div className="flex flex-col" onClick={e => e.stopPropagation()}>
            {note && (
                <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    {truncate(note, 60)}
                </span>
            )}

            {comments.map(c => (
                <CommentCard
                    key={c.id}
                    c={c}
                    author={users.find(u => u.id === c.userId)}
                    isOwn={c.userId === currentUserId}
                    onEdit={(c) => onOpenModal({mode: 'edit', inventoryId, comment: c})}
                    onDelete={handleDelete}
                />
            ))}

            <button
                onClick={(e) => { e.stopPropagation(); onOpenModal({mode: 'add', inventoryId}); }}
                className="self-start mt-0.5 flex items-center gap-1 text-[11px]
                           text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <i className="fa-regular fa-plus fa-xs"/>
                <span>Коментар</span>
            </button>
        </div>
    );
};

export default InventoryNoteCell;
