import React, {useState} from 'react';
import {usePage} from "@inertiajs/react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Button, Dialog, DialogBody, DialogHeader, IconButton, Spinner, Tooltip} from "@material-tailwind/react";
import toast from "react-hot-toast";

const InventoryNodesPanel = ({open, onClose}) => {
    const {auth, inventoryType = []} = usePage().props;
    const queryClient = useQueryClient();
    const token = document.querySelector('meta[name="csrfToken"]')?.getAttribute('content');
    const headers = {userId: auth?.user?.id};
    const authHeaders = {...headers, 'X-CSRF-Token': token};

    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [nodeSearch, setNodeSearch] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [nodeForm, setNodeForm] = useState({name: '', notes: ''});
    const [showAddItems, setShowAddItems] = useState(false);
    const [itemSearch, setItemSearch] = useState('');

    const invalidateAll = () => {
        queryClient.invalidateQueries({queryKey: ['inventory-nodes']});
        queryClient.invalidateQueries({queryKey: ['inventories']});
    };
    const invalidateDetail = () => {
        queryClient.invalidateQueries({queryKey: ['inventory-node', selectedNodeId]});
        queryClient.invalidateQueries({queryKey: ['inventory-nodes']});
    };

    // --- Queries ---

    const {data: nodesData, isFetching: isNodesFetching} = useQuery({
        queryKey: ['inventory-nodes', nodeSearch],
        queryFn: async () => {
            const res = await axios.get('api/inventory-nodes', {
                params: {limit: 500, ...(nodeSearch ? {search: nodeSearch} : {})},
                headers,
            });
            return res.data;
        },
        enabled: open,
    });

    const {data: nodeDetail, isFetching: isDetailFetching} = useQuery({
        queryKey: ['inventory-node', selectedNodeId],
        queryFn: async () => {
            const res = await axios.get(`api/inventory-nodes/${selectedNodeId}`, {headers});
            return res.data;
        },
        enabled: !!selectedNodeId,
    });

    const {data: inventoryForAdd, isFetching: isInventoryFetching} = useQuery({
        queryKey: ['inventory-add-to-node', itemSearch],
        queryFn: async () => {
            const res = await axios.get('api/inventory', {
                params: {
                    filters: JSON.stringify({
                        fText: itemSearch,
                        fBaileeUser: [],
                        fLocation: [],
                        fResponsibleUser: [],
                        fType: [],
                    }),
                    limit: 30,
                    page: 0,
                    hideDeleted: true,
                    userId: auth?.user?.id,
                },
                headers,
            });
            return res.data;
        },
        enabled: showAddItems,
    });

    // --- Mutations ---

    const createMutation = useMutation({
        mutationFn: (data) => axios.post('api/inventory-nodes', data, {headers: authHeaders}),
        onSuccess: (res) => {
            toast.success('Вузол створено');
            setIsCreating(false);
            setNodeForm({name: '', notes: ''});
            invalidateAll();
            const id = res.data?.data?.id;
            if (id) setSelectedNodeId(id);
        },
        onError: () => toast.error('Помилка створення вузла'),
    });

    const updateMutation = useMutation({
        mutationFn: ({id, data}) => axios.put(`api/inventory-nodes/${id}`, data, {headers: authHeaders}),
        onSuccess: () => {
            toast.success('Вузол оновлено');
            setIsEditing(false);
            invalidateDetail();
        },
        onError: () => toast.error('Помилка оновлення вузла'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => axios.delete(`api/inventory-nodes/${id}`, {headers: authHeaders}),
        onSuccess: () => {
            toast.success('Вузол видалено');
            setSelectedNodeId(null);
            invalidateAll();
        },
        onError: () => toast.error('Помилка видалення вузла'),
    });

    const addItemMutation = useMutation({
        mutationFn: (inventoryId) =>
            axios.post(`api/inventory-nodes/${selectedNodeId}/items`, {inventory_id: inventoryId}, {headers: authHeaders}),
        onSuccess: () => {
            toast.success('Елемент додано до вузла');
            invalidateDetail();
            queryClient.invalidateQueries({queryKey: ['inventories']});
        },
        onError: () => toast.error('Помилка додавання елемента'),
    });

    const removeItemMutation = useMutation({
        mutationFn: (inventoryId) =>
            axios.delete(`api/inventory-nodes/${selectedNodeId}/items/${inventoryId}`, {headers: authHeaders}),
        onSuccess: () => {
            toast.success('Елемент прибрано з вузла');
            invalidateDetail();
            queryClient.invalidateQueries({queryKey: ['inventories']});
        },
        onError: () => toast.error('Помилка видалення елемента'),
    });

    // --- Derived state ---

    const nodes = nodesData?.data ?? [];
    const currentItems = nodeDetail?.data?.items ?? [];
    const currentItemIds = new Set(currentItems.map(i => i.id));
    const availableItems = (inventoryForAdd?.data ?? []).filter(i => !currentItemIds.has(i.id));

    // --- Handlers ---

    const handleSelectNode = (id) => {
        setSelectedNodeId(id);
        setIsEditing(false);
        setIsCreating(false);
        setShowAddItems(false);
        setItemSearch('');
    };

    const handleStartCreate = () => {
        setIsCreating(true);
        setIsEditing(false);
        setSelectedNodeId(null);
        setShowAddItems(false);
        setNodeForm({name: '', notes: ''});
    };

    const handleStartEdit = () => {
        setIsEditing(true);
        setNodeForm({
            name: nodeDetail?.data?.name ?? '',
            notes: nodeDetail?.data?.notes ?? '',
        });
    };

    const handleDeleteNode = () => {
        if (confirm(`Видалити вузол "${nodeDetail?.data?.name}"?`)) {
            deleteMutation.mutate(selectedNodeId);
        }
    };

    const handleClose = () => {
        setSelectedNodeId(null);
        setIsCreating(false);
        setIsEditing(false);
        setShowAddItems(false);
        setItemSearch('');
        setNodeSearch('');
        onClose();
    };

    // --- Sub-components ---

    const InventoryRow = ({item, actionBtn}) => {
        const type = inventoryType.find(t => t.id === item.valueTypeId);
        return (
            <div className="flex items-center justify-between rounded px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border dark:border-gray-700">
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    {type && <i className={`${type.icon} text-gray-500 shrink-0`} title={type.caption}/>}
                    {item.inventoryNum &&
                        <span className="text-gray-400 shrink-0 font-mono">{item.inventoryNum}</span>}
                    <span className="font-medium dark:text-gray-200 truncate">{item.caption}</span>
                    {item.serial && <span className="text-gray-400 shrink-0">{item.serial}</span>}
                </div>
                <div className="shrink-0 ml-2">{actionBtn}</div>
            </div>
        );
    };

    const inputCls = "w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200";

    return (
        <Dialog open={open} handler={handleClose} size="xl">
            <DialogHeader className="flex items-center justify-between border-b dark:border-gray-700 dark:text-gray-200 py-3">
                <span className="text-base font-semibold">Вузли інвентарю</span>
                <IconButton variant="text" color="gray" onClick={handleClose} size="sm">
                    <i className="fa-regular fa-xmark text-base"/>
                </IconButton>
            </DialogHeader>

            <DialogBody className="flex flex-row !p-0 overflow-hidden" style={{height: '72vh'}}>

                {/* ── Left: Nodes list ─────────────────────────── */}
                <div className="w-2/5 border-r dark:border-gray-700 flex flex-col overflow-hidden">
                    <div className="p-3 border-b dark:border-gray-700 space-y-2">
                        <Button size="sm" className="w-full" color="green" onClick={handleStartCreate}>
                            <i className="fa-regular fa-plus mr-1.5"/>Новий вузол
                        </Button>
                        <input
                            className={inputCls}
                            placeholder="Пошук вузлів..."
                            value={nodeSearch}
                            onChange={e => setNodeSearch(e.target.value)}
                        />
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {isNodesFetching && (
                            <div className="flex justify-center p-4"><Spinner className="h-5 w-5"/></div>
                        )}
                        {!isNodesFetching && nodes.length === 0 && (
                            <p className="text-center text-xs text-gray-400 p-4">Вузлів немає</p>
                        )}
                        {nodes.map(node => (
                            <button
                                key={node.id}
                                onClick={() => handleSelectNode(node.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-left border-b dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${
                                    selectedNodeId === node.id
                                        ? 'bg-blue-50 dark:bg-gray-700 border-l-2 border-l-blue-500'
                                        : ''
                                }`}
                            >
                                <div className="min-w-0">
                                    <div className="text-sm font-medium dark:text-gray-200 truncate">{node.name}</div>
                                    <div className="text-xs text-gray-400">{node.items_count} ел.</div>
                                </div>
                                <i className="fa-regular fa-chevron-right text-gray-300 text-xs shrink-0 ml-2"/>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Right: Node detail ───────────────────────── */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* Empty state */}
                    {!isCreating && !selectedNodeId && (
                        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                            <div className="text-center space-y-2">
                                <i className="fa-regular fa-diagram-nested text-3xl text-gray-300"/>
                                <p>Оберіть вузол або створіть новий</p>
                            </div>
                        </div>
                    )}

                    {/* Create form */}
                    {isCreating && (
                        <div className="p-4 space-y-3">
                            <h3 className="font-semibold text-sm dark:text-gray-200">Новий вузол</h3>
                            <input
                                className={inputCls}
                                placeholder="Назва вузла *"
                                value={nodeForm.name}
                                onChange={e => setNodeForm(p => ({...p, name: e.target.value}))}
                                autoFocus
                            />
                            <textarea
                                className={inputCls}
                                placeholder="Нотатки (необов'язково)"
                                rows={3}
                                value={nodeForm.notes}
                                onChange={e => setNodeForm(p => ({...p, notes: e.target.value}))}
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    color="green"
                                    onClick={() => createMutation.mutate(nodeForm)}
                                    disabled={!nodeForm.name.trim() || createMutation.isPending}
                                >
                                    {createMutation.isPending ? <Spinner className="h-3 w-3"/> : 'Зберегти'}
                                </Button>
                                <Button size="sm" variant="text" onClick={() => setIsCreating(false)}>
                                    Скасувати
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Node detail */}
                    {!isCreating && selectedNodeId && (
                        <div className="flex flex-col overflow-hidden flex-1">

                            {/* Header */}
                            <div className="p-4 border-b dark:border-gray-700">
                                {isDetailFetching && !nodeDetail ? (
                                    <Spinner className="h-4 w-4"/>
                                ) : isEditing ? (
                                    <div className="space-y-2">
                                        <input
                                            className={inputCls}
                                            value={nodeForm.name}
                                            onChange={e => setNodeForm(p => ({...p, name: e.target.value}))}
                                            autoFocus
                                        />
                                        <textarea
                                            className={inputCls}
                                            rows={2}
                                            placeholder="Нотатки"
                                            value={nodeForm.notes}
                                            onChange={e => setNodeForm(p => ({...p, notes: e.target.value}))}
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                color="green"
                                                onClick={() => updateMutation.mutate({id: selectedNodeId, data: nodeForm})}
                                                disabled={!nodeForm.name.trim() || updateMutation.isPending}
                                            >
                                                {updateMutation.isPending ? <Spinner className="h-3 w-3"/> : 'Зберегти'}
                                            </Button>
                                            <Button size="sm" variant="text" onClick={() => setIsEditing(false)}>
                                                Скасувати
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold dark:text-gray-200 text-sm">{nodeDetail?.data?.name}</h3>
                                            {nodeDetail?.data?.notes && (
                                                <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{nodeDetail.data.notes}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <Tooltip content="Редагувати вузол">
                                                <IconButton size="sm" variant="outlined" onClick={handleStartEdit}>
                                                    <i className="fa-regular fa-pen text-xs"/>
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip content="Видалити вузол">
                                                <IconButton
                                                    size="sm"
                                                    variant="outlined"
                                                    color="red"
                                                    onClick={handleDeleteNode}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <i className="fa-regular fa-trash text-xs"/>
                                                </IconButton>
                                            </Tooltip>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Items */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">

                                {/* Current items header */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium dark:text-gray-200">
                                        Елементи ({currentItems.length})
                                    </span>
                                    <Button
                                        size="sm"
                                        variant={showAddItems ? 'filled' : 'outlined'}
                                        color="blue"
                                        onClick={() => setShowAddItems(p => !p)}
                                    >
                                        <i className={`fa-regular fa-${showAddItems ? 'chevron-up' : 'plus'} mr-1`}/>
                                        {showAddItems ? 'Сховати' : 'Додати'}
                                    </Button>
                                </div>

                                {/* Current items list */}
                                {isDetailFetching && (
                                    <div className="flex justify-center py-4"><Spinner className="h-5 w-5"/></div>
                                )}
                                {!isDetailFetching && currentItems.length === 0 && !showAddItems && (
                                    <p className="text-xs text-gray-400">Вузол порожній. Додайте елементи.</p>
                                )}
                                <div className="space-y-1">
                                    {currentItems.map(item => (
                                        <InventoryRow
                                            key={item.id}
                                            item={item}
                                            actionBtn={
                                                <Tooltip content="Прибрати з вузла">
                                                    <IconButton
                                                        size="sm"
                                                        variant="text"
                                                        color="red"
                                                        onClick={() => removeItemMutation.mutate(item.id)}
                                                        disabled={removeItemMutation.isPending}
                                                    >
                                                        <i className="fa-regular fa-xmark text-xs"/>
                                                    </IconButton>
                                                </Tooltip>
                                            }
                                        />
                                    ))}
                                </div>

                                {/* Add items section */}
                                {showAddItems && (
                                    <div className="border-t pt-3 dark:border-gray-700 space-y-2">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Пошук інвентарю для додавання
                                        </p>
                                        <input
                                            className={inputCls}
                                            placeholder="Введіть назву, серійний номер, інв. номер..."
                                            value={itemSearch}
                                            onChange={e => setItemSearch(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="space-y-1 max-h-56 overflow-y-auto">
                                            {isInventoryFetching && (
                                                <div className="flex justify-center py-3">
                                                    <Spinner className="h-4 w-4"/>
                                                </div>
                                            )}
                                            {!isInventoryFetching && availableItems.length === 0 && (
                                                <p className="text-xs text-gray-400 text-center py-2">
                                                    {itemSearch ? 'Нічого не знайдено' : 'Введіть текст для пошуку'}
                                                </p>
                                            )}
                                            {availableItems.map(item => (
                                                <InventoryRow
                                                    key={item.id}
                                                    item={item}
                                                    actionBtn={
                                                        <Tooltip content="Додати до вузла">
                                                            <IconButton
                                                                size="sm"
                                                                variant="outlined"
                                                                color="green"
                                                                onClick={() => addItemMutation.mutate(item.id)}
                                                                disabled={addItemMutation.isPending}
                                                            >
                                                                <i className="fa-regular fa-plus text-xs"/>
                                                            </IconButton>
                                                        </Tooltip>
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
            </DialogBody>
        </Dialog>
    );
};

export default InventoryNodesPanel;
