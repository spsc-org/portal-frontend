import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { InventoryNodesViewModel } from "./viewmodel/InventoryViewModels.js";
import { Spinner, Tooltip } from "@material-tailwind/react"
import IconButton from "../../components/Buttons/IconButton.jsx"
import Button from "../../components/Buttons/Button.jsx"
import Page from "../../components/Page.jsx";
import PageHeader from "../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../layouts/app/HeaderButtons.jsx";
import AdvancedSelect from "../../components/fields/AdvancedSelect.jsx";

const InventoryRow = ({item, actionBtn, isAdded, inventoryType}) => {
    const type = inventoryType.find(t => t.id === item.valueTypeId);
    return (
        <div className={`flex items-center justify-between rounded px-2 py-1.5 text-xs border dark:border-neutral-700 ${isAdded ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50' : 'bg-gray-50 dark:bg-neutral-700'}`}>
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                {type && <i className={`${type.icon} text-gray-600 shrink-0`} title={type.caption}/>}
                {item.inventoryNum &&
                    <span className="text-gray-600 shrink-0 font-mono">{item.inventoryNum}</span>}
                <span className={`font-medium truncate ${isAdded ? 'text-blue-700 dark:text-blue-300' : 'dark:text-gray-200'}`}>
                    {item.caption}
                </span>
                {item.serial && <span className="text-gray-600 shrink-0">{item.serial}</span>}
            </div>
            <div className="shrink-0 ml-2">
                {isAdded ? (
                    <div className="flex items-center gap-1 text-blue-500 font-semibold px-2">
                       <i className="fa-regular fa-check-circle"/> <span className="hidden sm:inline">У вузлі</span>
                    </div>
                ) : actionBtn}
            </div>
        </div>
    );
};

const NodesPage = () => {
    const vm = useViewModel((deps) => new InventoryNodesViewModel(deps));
    const { inventoryType, networkConnections, dictionary } = vm;

    // --- Static Data ---
    const nodeTypes = [
        {value: 'workplace', caption: 'Робоче місце'},
        {value: 'system', caption: 'Система'},
        {value: 'other', caption: 'Інше'},
    ];

    const { selectedNodeId, nodeSearch, itemFilters, isCreating, isEditing, nodeForm, showAddItems } = vm;
    const { nodes, isNodesFetching, nodeDetail, isDetailFetching, currentItems, currentItemIds, searchItems, isInventoryFetching } = vm;
    const setNodeSearch = vm.setNodeSearch;
    const setItemFilters = vm.setItemFilters;
    const setNodeForm = vm.setNodeForm;
    const setShowAddItems = vm.setShowAddItems;
    const setIsCreating = vm.setIsCreating;
    const setIsEditing = vm.setIsEditing;
    const handleSelectNode = vm.selectNode;
    const handleStartCreate = vm.startCreate;
    const handleStartEdit = vm.startEdit;
    const handleDeleteNode = () => {
        if (window.confirm(`Видалити вузол "${nodeDetail?.data?.name}"?`)) vm.remove();
    };
    const createMutation = { mutate: vm.create, isPending: vm.createCmd.isPending };
    const updateMutation = { mutate: ({id, data}) => vm.update(id, data), isPending: vm.updateCmd.isPending };
    const deleteMutation = vm.deleteCmd;
    const addItemMutation = { mutate: vm.addItem, isPending: vm.addItemCmd.isPending };
    const removeItemMutation = { mutate: vm.removeItem, isPending: vm.removeItemCmd.isPending };

    const inputCls = "w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-neutral-900 dark:border-neutral-600 dark:text-gray-200";

    const getNetworkLabel = (value) => networkConnections.find(c => c.value === value)?.caption ?? '---';
    const getTypeLabel = (value) => nodeTypes.find(t => t.value === value)?.caption ?? '---';

    return (
            <Page>
                <div data-i-doc="page:inventory-nodes" className="flex flex-col h-[calc(100vh-120px)] mt-2 mx-2 border rounded-xl bg-white dark:bg-neutral-800 dark:border-neutral-700 overflow-hidden shadow-sm">
                    <PageHeader
                        title="Вузли інвентарю"
                        actions={<HeaderButton icon="fa-regular fa-plus" onClick={handleStartCreate}>Новий вузол</HeaderButton>}
                    />

                    <div className="flex flex-row flex-1 overflow-hidden">
                        {/* ── Left: Nodes list ─────────────────────────── */}
                        <div className="w-1/6 border-r dark:border-neutral-700 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-neutral-800/50">
                            <div className="p-4 border-b dark:border-neutral-700">
                                <div className="relative">
                                    <i className="fa-regular fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"/>
                                    <input
                                        className={`${inputCls} pl-8`}
                                        placeholder="Пошук вузлів..."
                                        value={nodeSearch}
                                        onChange={e => setNodeSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="overflow-y-auto flex-1">
                                {isNodesFetching && (
                                    <div className="flex justify-center p-8"><Spinner className="h-6 w-6"/></div>
                                )}
                                {!isNodesFetching && nodes.length === 0 && (
                                    <p className="text-center text-sm text-gray-600 p-8">Вузлів не знайдено</p>
                                )}
                                {nodes.map(node => (
                                    <button
                                        key={node.id}
                                        onClick={() => handleSelectNode(node.id)}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-left border-b dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-700 transition-all ${
                                            selectedNodeId === node.id
                                                ? 'bg-white dark:bg-neutral-700 border-l-4 border-l-blue-500 shadow-sm'
                                                : ''
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold dark:text-gray-200 truncate">{node.name}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="text-xs text-gray-600">{node.items_count} ел.</div>
                                                <div className="text-[10px] bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-gray-400 px-1 rounded uppercase font-bold">
                                                    {getTypeLabel(node.type)}
                                                </div>
                                            </div>
                                        </div>
                                        <i className={`fa-regular fa-chevron-right text-xs transition-transform ${selectedNodeId === node.id ? 'translate-x-1 text-blue-500' : 'text-gray-300'}`}/>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Right: Node detail ───────────────────────── */}
                        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-800">
                            {!isCreating && !selectedNodeId && (
                                <div className="flex-1 flex items-center justify-center text-gray-600">
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto">
                                            <i className="fa-regular fa-diagram-nested text-4xl text-gray-300"/>
                                        </div>
                                        <p className="text-base">Оберіть вузол зі списку зліва для перегляду деталей</p>
                                    </div>
                                </div>
                            )}

                            {isCreating && (
                                <div className="p-6 max-w-2xl mx-auto w-full space-y-6">
                                    <h3 className="font-bold text-xl dark:text-gray-200">Створення нового вузла</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1 col-span-2">
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Назва вузла</label>
                                            <input
                                                className={`${inputCls} p-2.5 text-base`}
                                                placeholder="Введіть назву..."
                                                value={nodeForm.name}
                                                onChange={e => setNodeForm(p => ({...p, name: e.target.value}))}
                                                autoFocus
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Тип вузла</label>
                                            <select
                                                className={`${inputCls} p-2.5 text-base h-11`}
                                                value={nodeForm.type}
                                                onChange={e => setNodeForm(p => ({...p, type: e.target.value}))}
                                            >
                                                {nodeTypes.map(t => (
                                                    <option key={t.value} value={t.value}>{t.caption}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Підключення до мережі</label>
                                            <select
                                                className={`${inputCls} p-2.5 text-base h-11`}
                                                value={nodeForm.network_connection}
                                                onChange={e => setNodeForm(p => ({...p, network_connection: e.target.value}))}
                                            >
                                                {networkConnections.map(c => (
                                                    <option key={c.value} value={c.value}>{c.caption}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1 col-span-2">
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Відповідальний користувач</label>
                                            <AdvancedSelect
                                                size="md"
                                                options={Object.values(dictionary?.user ?? {})}
                                                label="Оберіть користувача"
                                                selectedOptions={dictionary?.user?.[nodeForm.responsible_user_id] ? [dictionary.user[nodeForm.responsible_user_id]] : []}
                                                onChange={val => setNodeForm(p => ({...p, responsible_user_id: val?.[0]?.value || null}))}
                                            />
                                        </div>

                                        <div className="space-y-1 col-span-2">
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Нотатки</label>
                                            <textarea
                                                className={`${inputCls} p-2.5 text-base`}
                                                placeholder="Опис вузла, комплектація тощо..."
                                                rows={4}
                                                value={nodeForm.notes}
                                                onChange={e => setNodeForm(p => ({...p, notes: e.target.value}))}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            color="green"
                                            onClick={() => createMutation.mutate(nodeForm)}
                                            disabled={!nodeForm.name.trim() || createMutation.isPending}
                                            className="flex items-center gap-2">
                                            {createMutation.isPending ? <Spinner className="h-4 w-4"/> : <i className="fa-regular fa-check"/>}
                                            Зберегти вузол
                                        </Button>
                                        <Button variant="text" onClick={() => setIsCreating(false)} className="dark:text-gray-300">
                                            Скасувати
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {!isCreating && selectedNodeId && (
                                <div className="flex flex-col overflow-hidden flex-1">
                                    {/* Node Header */}
                                    <div className="p-6 border-b dark:border-neutral-700 bg-gray-50/30 dark:bg-neutral-700/30">
                                        {isDetailFetching && !nodeDetail ? (
                                            <div className="flex items-center gap-3 dark:text-gray-300"><Spinner className="h-5 w-5"/> Завантаження...</div>
                                        ) : isEditing ? (
                                            <div className="max-w-2xl grid grid-cols-2 gap-4">
                                                <div className="col-span-2">
                                                    <input
                                                        className={`${inputCls} p-2.5 text-base`}
                                                        value={nodeForm.name}
                                                        onChange={e => setNodeForm(p => ({...p, name: e.target.value}))}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-600 uppercase">Тип</label>
                                                    <select
                                                        className={`${inputCls} p-2 text-sm h-10`}
                                                        value={nodeForm.type}
                                                        onChange={e => setNodeForm(p => ({...p, type: e.target.value}))}
                                                    >
                                                        {nodeTypes.map(t => (
                                                            <option key={t.value} value={t.value}>{t.caption}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-600 uppercase">Мережа</label>
                                                    <select
                                                        className={`${inputCls} p-2 text-sm h-10`}
                                                        value={nodeForm.network_connection}
                                                        onChange={e => setNodeForm(p => ({...p, network_connection: e.target.value}))}
                                                    >
                                                        {networkConnections.map(c => (
                                                            <option key={c.value} value={c.value}>{c.caption}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-gray-600 uppercase">Відповідальний</label>
                                                    <AdvancedSelect
                                                        size="sm"
                                                        options={Object.values(dictionary?.user ?? {})}
                                                        selectedOptions={dictionary?.user?.[nodeForm.responsible_user_id] ? [dictionary.user[nodeForm.responsible_user_id]] : []}
                                                        onChange={val => setNodeForm(p => ({...p, responsible_user_id: val?.[0]?.value || null}))}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <textarea
                                                        className={`${inputCls} p-2 text-sm`}
                                                        rows={3}
                                                        placeholder="Нотатки"
                                                        value={nodeForm.notes}
                                                        onChange={e => setNodeForm(p => ({...p, notes: e.target.value}))}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        color="green"
                                                        onClick={() => updateMutation.mutate({id: selectedNodeId, data: nodeForm})}
                                                        disabled={!nodeForm.name.trim() || updateMutation.isPending}>
                                                        Зберегти зміни
                                                    </Button>
                                                    <Button size="sm" variant="text" onClick={() => setIsEditing(false)} className="dark:text-gray-300">
                                                        Скасувати
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-bold dark:text-gray-200 text-2xl">{nodeDetail?.data?.name}</h3>
                                                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold uppercase">
                                                            {getTypeLabel(nodeDetail?.data?.type)}
                                                        </span>
                                                        <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                                            nodeDetail?.data?.network_connection === 'not_connected'
                                                            ? 'bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-gray-400'
                                                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                                                        }`}>
                                                            <i className="fa-regular fa-network-wired mr-1.5 text-[10px]"/>
                                                            {getNetworkLabel(nodeDetail?.data?.network_connection)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-3">
                                                        {nodeDetail?.data?.responsible_user && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                                <i className="fa-regular fa-user-shield text-blue-500"/>
                                                                <span className="font-medium">{nodeDetail.data.responsible_user.name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {nodeDetail?.data?.notes && (
                                                        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line leading-relaxed dark:text-gray-400">{nodeDetail.data.notes}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <Tooltip content="Редагувати">
                                                        <IconButton variant="outlined" color="yellow" onClick={handleStartEdit}>
                                                            <i className="fa-regular fa-pen"/>
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip content="Видалити вузол">
                                                        <IconButton
                                                            variant="outlined"
                                                            color="red"
                                                            onClick={handleDeleteNode}
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            <i className="fa-regular fa-trash"/>
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Items Section */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-semibold dark:text-gray-200 flex items-center gap-2">
                                                Склад вузла <span className="text-sm font-normal text-gray-600 bg-gray-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full">{currentItems.length}</span>
                                            </h4>
                                            <Button
                                                size="sm"
                                                variant={showAddItems ? 'filled' : 'outlined'}
                                                color="blue"
                                                onClick={() => setShowAddItems(p => !p)}
                                                className="flex items-center gap-2">
                                                <i className={`fa-regular fa-${showAddItems ? 'chevron-up' : 'plus'}`}/>
                                                {showAddItems ? 'Завершити додавання' : 'Додати обладнання'}
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            {isDetailFetching && (
                                                <div className="flex justify-center py-10"><Spinner className="h-8 w-8"/></div>
                                            )}
                                            {!isDetailFetching && currentItems.length === 0 && !showAddItems && (
                                                <div className="text-center py-12 border-2 border-dashed rounded-xl dark:border-neutral-700">
                                                    <p className="text-gray-600 italic">Цей вузол поки що не має обладнання</p>
                                                </div>
                                            )}
                                            {currentItems.map(item => (
                                                <InventoryRow
                                                    key={item.id}
                                                    item={item}
                                                    actionBtn={
                                                        <IconButton
                                                            size="sm"
                                                            variant="text"
                                                            color="red"
                                                            onClick={() => removeItemMutation.mutate(item.id)}
                                                            disabled={removeItemMutation.isPending}
                                                        >
                                                            <i className="fa-regular fa-xmark text-sm"/>
                                                        </IconButton>
                                                    }
                                                />
                                            ))}
                                        </div>

                                        {showAddItems && (
                                            <div className="mt-8 pt-8 border-t dark:border-neutral-700 space-y-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <i className="fa-regular fa-magnifying-glass-plus text-blue-500"/>
                                                        <p className="text-sm font-bold dark:text-gray-200 uppercase tracking-wider">
                                                            Пошук обладнання для додавання
                                                        </p>
                                                    </div>
                                                    {(itemFilters.search || itemFilters.type.length > 0 || itemFilters.user.length > 0) && (
                                                        <Button
                                                            variant="text"
                                                            size="sm"
                                                            color="blue-gray"
                                                            className="text-[10px] h-7 dark:text-gray-300"
                                                            onClick={() => setItemFilters({search: '', type: [], user: []})}>
                                                            Скинути фільтри пошуку
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <input
                                                        className={`${inputCls} p-2 shadow-inner h-10`}
                                                        placeholder="Назва, S/N, Інв. №..."
                                                        value={itemFilters.search}
                                                        onChange={e => setItemFilters(p => ({...p, search: e.target.value}))}
                                                        autoFocus
                                                    />
                                                    <AdvancedSelect
                                                        size="sm"
                                                        isMulti
                                                        options={inventoryType}
                                                        label="Тип обладнання"
                                                        selectedOptions={itemFilters.type}
                                                        onChange={val => setItemFilters(p => ({...p, type: val}))}
                                                    />
                                                    <AdvancedSelect
                                                        size="sm"
                                                        isMulti
                                                        options={Object.values(dictionary?.user ?? {})}
                                                        label="Відповідальний"
                                                        selectedOptions={itemFilters.user}
                                                        onChange={val => setItemFilters(p => ({...p, user: val}))}
                                                    />
                                                </div>

                                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar border rounded-lg p-2 bg-gray-50/50 dark:bg-neutral-700/20">
                                                    {isInventoryFetching && (
                                                        <div className="flex justify-center py-6"><Spinner className="h-6 w-6"/></div>
                                                    )}
                                                    {!isInventoryFetching && searchItems.length === 0 && (
                                                        <div className="text-center py-6 bg-gray-50 dark:bg-neutral-700 rounded-lg">
                                                            <p className="text-sm text-gray-600">
                                                                {itemFilters.search || itemFilters.type.length || itemFilters.user.length ? 'Збігів не знайдено' : 'Почніть вводити текст або оберіть фільтри'}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {searchItems.map(item => (
                                                        <InventoryRow
                                                            key={item.id}
                                                            item={item}
                                                            isAdded={currentItemIds.has(item.id)}
                                                            actionBtn={
                                                                <Button
                                                                    size="sm"
                                                                    variant="outlined"
                                                                    color="green"
                                                                    onClick={() => addItemMutation.mutate(item.id)}
                                                                    disabled={addItemMutation.isPending}
                                                                    className="py-1 px-3">
                                                                    Додати
                                                                </Button>
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Page>
    );
};

export default observer(NodesPage);
