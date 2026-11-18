import { CartPageCheckbox, CartRowCheckbox } from "../../../features/cart-select/ui/CartCheckbox.jsx";
import RowActions from "../../../features/project-row-actions/ui/RowActions.jsx";
import ActionTypeIcon from "../../../components/CartModal/cells/ActionTypeIcon.jsx";
import StateIcon from "../../../components/CartModal/cells/StateIcon.jsx";
import SubjectTypeIcon from "../../../components/CartModal/cells/SubjectTypeIcon.jsx";
import RestrictionsCell from "../../../components/CartModal/cells/RestrictionsCell.jsx";
import CategoriesCell from "../../../components/CartModal/cells/CategoriesCell.jsx";
import NamesCell from "./cells/NamesCell.jsx";
import CountriesCell from "./cells/CountriesCell.jsx";
import IdentifiersCell from "./cells/IdentifiersCell.jsx";
import NotesCell from "./cells/NotesCell.jsx";
import DocumentsCell from "./cells/DocumentsCell.jsx";
import PerformerCell from "./cells/PerformerCell.jsx";
import SkeletonRows from "./SkeletonRows.jsx";
import EditingBadge from "../../../features/project-presence/ui/EditingBadge.jsx";
import ContextMenu from "../../../shared/ui/ContextMenu.jsx";

// Колонки — як у table#main легасі (project.blade.php); ширини — ті самі
const COLUMNS = [
    { key: "cart", width: "w-6" },
    { key: "action", title: "Дія", width: "w-10" },
    { key: "state", title: "Стан", width: "w-10" },
    { key: "type", title: "Тип", width: "w-8" },
    { key: "names", title: "Назви/ДН" },
    { key: "country", title: "Країна", width: "w-12" },
    { key: "identifiers", title: "Ідентифікаційні дані" },
    { key: "notes", title: "Дод. інформація, примітки" },
    { key: "term", title: "Термін", width: "w-14" },
    { key: "restrictions", title: "Обмеження" },
    { key: "categories", title: "Категорія" },
    { key: "documents", title: "Документи" },
    { key: "performer", title: "Вик.", width: "w-16" },
    { key: "actions", title: "Керування", width: "w-32" },
];

const TH = "sticky top-0 z-10 border-b border-gray-200 bg-gray-100 px-1.5 py-2 text-left font-semibold text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300";
const TD = "border-b border-gray-200 px-1.5 py-1 align-top dark:border-neutral-700";

// View таблиці. vm — useProjectListTableViewModel().
const ProjectListTable = ({ vm }) => (
    <div
        data-i-doc="widget:project-list-table"
        className={`overflow-x-auto rounded-xl border border-gray-200 bg-white transition-opacity dark:border-neutral-700 dark:bg-neutral-800 ${vm.isRefreshing ? "opacity-60" : ""}`}
    >
        <table aria-busy={vm.isLoading || vm.isRefreshing} className="w-full table-fixed border-collapse text-left text-xs text-gray-700 dark:text-gray-300">
            {vm.isLoading && <caption className="sr-only">Завантаження списку проєктів…</caption>}
            <thead>
                <tr>
                    {COLUMNS.map((column) => (
                        <th key={column.key} className={`${TH} ${column.width ?? ""}`}>
                            {column.key === "cart" ? <CartPageCheckbox {...vm.cart.page} onToggle={vm.cart.onTogglePage} /> : column.title}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {vm.isLoading && <SkeletonRows columns={COLUMNS} count={vm.skeletonRowCount} cellClassName={TD} />}
                {!vm.isLoading && vm.rows.length === 0 && (
                    <tr>
                        <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
                            {vm.emptyText}
                        </td>
                    </tr>
                )}
                {!vm.isLoading && vm.rows.map(({ id, rowKey, row, precomputedData, isDisabled, isHighlighted, isPulsing, abilities, termCaption }) => (
                    <tr
                        key={rowKey}
                        title={`id:${id}`}
                        onClick={(event) => vm.rowEvents.onClick(event, id)}
                        onDoubleClick={(event) => vm.rowEvents.onDoubleClick(event, id)}
                        onContextMenu={(event) => vm.contextMenu.onOpen(event, { row, precomputedData })}
                        className={`group cursor-pointer transition-colors duration-1000 hover:bg-gray-50 dark:hover:bg-neutral-700/60 ${
                            isHighlighted ? "bg-blue-50 dark:bg-blue-800/20" : isDisabled ? "bg-gray-100 dark:bg-neutral-700" : ""
                        } ${isPulsing ? "animate-highlight dark:animate-darkHighlight motion-reduce:animate-none" : ""}`}
                    >
                        <td className={TD}>
                            <CartRowCheckbox id={id} checked={vm.cart.isSelected(id)} onToggle={vm.cart.onToggle} />
                        </td>
                        <td className={TD}>
                            <ActionTypeIcon actionType={row.actionType} />
                        </td>
                        <td className={TD}>
                            <StateIcon stateId={row.stateId} states={vm.states} />
                        </td>
                        <td className={TD}>
                            <SubjectTypeIcon typeId={row.subjectTypeId} />
                        </td>
                        <td className={`${TD} break-words`}>
                            <NamesCell row={row} />
                        </td>
                        <td className={TD}>
                            <CountriesCell precomputedData={precomputedData} />
                        </td>
                        <td className={`${TD} break-words`}>
                            <IdentifiersCell precomputedData={precomputedData} onOpenPhoto={vm.commands.onOpenPhoto} />
                        </td>
                        <td className={`${TD} break-words`}>
                            <NotesCell row={row} precomputedData={precomputedData} users={vm.users} commands={vm.commands} />
                        </td>
                        <td className={`${TD} break-words`}>
                            {termCaption}
                            {row.issuerId && <div title="субʼєкт">[{row.issuerId}]</div>}
                        </td>
                        <td className={TD}>
                            <RestrictionsCell precomputedData={precomputedData} />
                        </td>
                        <td className={`${TD} break-words`}>
                            <CategoriesCell precomputedData={precomputedData} />
                        </td>
                        <td className={`${TD} break-words`}>
                            <DocumentsCell row={row} precomputedData={precomputedData} />
                        </td>
                        <td className={TD}>
                            <PerformerCell row={row} precomputedData={precomputedData} users={vm.users} onDownload={vm.commands.onDownloadAttachment} />
                        </td>
                        <td className={TD}>
                            <EditingBadge editors={vm.editorsOf(id)} />
                            <div className="invisible group-focus-within:visible group-hover:visible">
                                <RowActions id={id} visibleIds={vm.pageIds} abilities={abilities} commands={vm.commands} />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {vm.contextMenu.menu && (
            <ContextMenu
                {...vm.contextMenu.menu}
                menuRef={vm.contextMenu.menuRef}
                onSelect={vm.contextMenu.onSelect}
                label="Копіювання даних проєкту"
            />
        )}
    </div>
);

export default ProjectListTable;
