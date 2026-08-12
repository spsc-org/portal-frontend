import React, {useState} from 'react';
import {usePage, Link} from "@inertiajs/react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Button, IconButton, Spinner, Tooltip} from "@material-tailwind/react";
import toast from "react-hot-toast";
import Page from "@/Components/Page.jsx";
import {DictionaryProvider} from "@/ReactPages/Dictionary/DictionaryContext.jsx";
import AdvancedSelect from "@/Components/fields/AdvancedSelect.jsx";

const NodesPage = () => {
    const {auth, inventoryType = [], networkConnections = []} = usePage().props;
    const queryClient = useQueryClient();
    const token = document.querySelector('meta[name="csrfToken"]')?.getAttribute('content');
    const headers = {userId: auth?.user?.id};
    const authHeaders = {...headers, 'X-CSRF-Token': token};

    // --- Static Data ---
    const nodeTypes = [
        {value: 'workplace', caption: 'Робоче місце'},
        {value: 'system', caption: 'Система'},
        {value: 'other', caption: 'Інше'},
    ];

    // --- State ---
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [nodeSearch, setNodeSearch] = useState('');

    const [itemFilters, setItemFilters] = useState({
        search: '',
        type: [],
        user: []
    });

    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [nodeForm, setNodeForm] = useState({
        name: '',
        notes: '',
        network_connection: 'not_connected',
        type: 'workplace',
        responsible_user_id: null
    });
    const [showAddItems, setShowAddItems] = useState(false);

    const invalidateAll = () => {
        queryClient.invalidateQueries({queryKey: ['inventory-nodes']});
        queryClient.invalidateQueries({queryKey: ['inventories']});
    };
    const invalidateDetail = () => {
        queryClient.invalidateQueries({queryKey: ['inventory-node', selectedNodeId]});
        queryClient.invalidateQueries({queryKey: ['inventory-nodes']});
    };

    // --- Queries ---
    const {data: dictionary} = useQuery({
        queryKey: ['dictionary', 'inventory/options'],
        queryFn: async () => {
            const response = await axios.get('/api/inventory/options');
            return response.data.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const {data: nodesData, isFetching: isNodesFetching} = useQuery({
        queryKey: ['inventory-nodes', nodeSearch],
        queryFn: async () => {
            const res = await axios.get('/api/inventory-nodes', {
                params: {limit: 500, search: nodeSearch},
                headers,
            });
            return res.data;
        },
    });

    const {data: nodeDetail, isFetching: isDetailFetching} = useQuery({
        queryKey: ['inventory-node', selectedNodeId],
        queryFn: async () => {
            const res = await axios.get(`/api/inventory-nodes/${selectedNodeId}`, {headers});
            return res.data;
        },
        enabled: !!selectedNodeId,
    });

    const {data: inventoryForAdd, isFetching: isInventoryFetching} = useQuery({
        queryKey: ['inventory-add-to-node', itemFilters],
        queryFn: async () => {
            const res = await axios.get('/api/inventory', {
                params: {
                    filters: JSON.stringify({
                        fText: itemFilters.search,
                        fBaileeUser: itemFilters.user.map(o => o.value),
                        fLocation: [],
                        fResponsibleUser: [],
                        fType: itemFilters.type.map(o => o.value),
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
        mutationFn: (data) => axios.post('/api/inventory-nodes', data, {headers: authHeaders}),
        onSuccess: (res) => {
            toast.success('Вузол створено');
            setIsCreating(false);
            setNodeForm({name: '', notes: '', network_connection: 'not_connected', type: 'workplace', responsible_user_id: null});
            invalidateAll();
            const id = res.data?.data?.id;
            if (id) setSelectedNodeId(id);
        },
        onError: () => toast.error('Помилка створення вузла'),
    });

    const updateMutation = useMutation({
        mutationFn: ({id, data}) => axios.put(`/api/inventory-nodes/${id}`, data, {headers: authHeaders}),
        onSuccess: () => {
            toast.success('Вузол оновлено');
            setIsEditing(false);
            invalidateDetail();
        },
        onError: () => toast.error('Помилка оновлення вузла'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => axios.delete(`/api/inventory-nodes/${id}`, {headers: authHeaders}),
        onSuccess: () => {
            toast.success('Вузол видалено');
            setSelectedNodeId(null);
            invalidateAll();
        },
        onError: () => toast.error('Помилка видалення вузла'),
    });

    const addItemMutation = useMutation({
        mutationFn: (inventoryId) =>
            axios.post(`/api/inventory-nodes/${selectedNodeId}/items`, {inventory_id: inventoryId}, {headers: authHeaders}),
        onSuccess: () => {
            toast.success('Елемент додано до вузла');
            invalidateDetail();
            queryClient.invalidateQueries({queryKey: ['inventories']});
        },
        onError: () => toast.error('Помилка додавання елемента'),
    });

    const removeItemMutation = useMutation({
        mutationFn: (inventoryId) =>
            axios.delete(`/api/inventory-nodes/${selectedNodeId}/items/${inventoryId}`, {headers: authHeaders}),
        onSuccess: () => {
            toast.success('Елемент прибрано з вузла');
            invalidateDetail();
            queryClient.invalidateQueries({queryKey: ['inventories']});
        },
        onError: () => toast.error('Помилка видалення елемента'),
    });

    const nodes = nodesData?.data ?? [];
    const currentItems = nodeDetail?.data?.items ?? [];
    const currentItemIds = new Set(currentItems.map(i => i.id));
    const searchItems = inventoryForAdd?.data ?? [];

    const handleSelectNode = (id) => {
        setSelectedNodeId(id);
        setIsEditing(false);
        setIsCreating(false);
        setShowAddItems(false);
        setItemFilters({search: '', type: [], user: []});
    };

    const handleStartCreate = () => {
        setIsCreating(true);
        setIsEditing(false);
        setSelectedNodeId(null);
        setShowAddItems(false);
        setNodeForm({name: '', notes: '', network_connection: 'not_connected', type: 'workplace', responsible_user_id: null});
    };

    const handleStartEdit = () => {
        setIsEditing(true);
        setNodeForm({
            name: nodeDetail?.data?.name ?? '',
            notes: nodeDetail?.data?.notes ?? '',
            network_connection: nodeDetail?.data?.network_connection ?? 'not_connected',
            type: nodeDetail?.data?.type ?? 'workplace',
            responsible_user_id: nodeDetail?.data?.responsible_user_id ?? null,
        });
    };

    const handleDeleteNode = () => {
        if (confirm(`Видалити вузол "${nodeDetail?.data?.name}"?`)) {
            deleteMutation.mutate(selectedNodeId);
        }
    };

    const InventoryRow = ({item, actionBtn, isAdded}) => {
        const type = inventoryType.find(t => t.id === item.valueTypeId);
        return (
            <div className={`flex items-center justify-between rounded px-2 py-1.5 text-xs border dark:border-gray-700 ${isAdded ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    {type && <i className={`${type.icon} text-gray-500 shrink-0`} title={type.caption}/>}
                    {item.inventoryNum &&
                        <span className="text-gray-400 shrink-0 font-mono">{item.inventoryNum}</span>}
                    <span className={`font-medium truncate ${isAdded ? 'text-blue-700 dark:text-blue-300' : 'dark:text-gray-200'}`}>
                        {item.caption}
                    </span>
                    {item.serial && <span className="text-gray-400 shrink-0">{item.serial}</span>}
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

    const inputCls = "w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200";

    const getNetworkLabel = (value) => networkConnections.find(c => c.value === value)?.caption ?? '---';
    const getTypeLabel = (value) => nodeTypes.find(t => t.value === value)?.caption ?? '---';

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:inventory-nodes" className="flex flex-col h-[calc(100vh-120px)] mt-2 mx-2 border rounded-xl bg-white dark:bg-gray-900 dark:border-gray-700 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between border-b dark:border-gray-700 p-4">
                        <div className="flex items-center gap-4">
                            <Link href="/inventory">
                                <Button size="sm" variant="text" className="flex items-center gap-2 dark:text-gray-300">
                                    <i className="fa-regular fa-arrow-left"/> До обліку
                                </Button>
                            </Link>
                            <h1 className="text-lg font-bold dark:text-gray-200">Вузли інвентарю</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" color="green" onClick={handleStartCreate} className="flex items-center gap-2">
                                <i className="fa-regular fa-plus"/> Новий вузол
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-row flex-1 overflow-hidden">
                        {/* ── Left: Nodes list ─────────────────────────── */}
                        <div className="w-1/6 border-r dark:border-gray-700 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="p-4 border-b dark:border-gray-700">
                                <div className="relative">
                                    <i className="fa-regular fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"/>
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
                                    <p className="text-center text-sm text-gray-400 p-8">Вузлів не знайдено</p>
                                )}
                                {nodes.map(node => (
                                    <button
                                        key={node.id}
                                        onClick={() => handleSelectNode(node.id)}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-left border-b dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all ${
                                            selectedNodeId === node.id
                                                ? 'bg-white dark:bg-gray-800 border-l-4 border-l-blue-500 shadow-sm'
                                                : ''
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold dark:text-gray-200 truncate">{node.name}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="text-xs text-gray-500">{node.items_count} ел.</div>
                                                <div className="text-[10px] bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-1 rounded uppercase font-bold">
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
                        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
                            {!isCreating && !selectedNodeId && (
                                <div className="flex-1 flex items-center justify-center text-gray-400">
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
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
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Назва вузла</label>
                                            <input
                                                className={`${inputCls} p-2.5 text-base`}
                                                placeholder="Введіть назву..."
                                                value={nodeForm.name}
                                                onChange={e => setNodeForm(p => ({...p, name: e.target.value}))}
                                                autoFocus
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Тип вузла</label>
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
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Підключення до мережі</label>
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
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Відповідальний користувач</label>
                                            <AdvancedSelect
                                                size="md"
                                                options={Object.values(dictionary?.user ?? {})}
                                                label="Оберіть користувача"
                                                selectedOptions={dictionary?.user?.[nodeForm.responsible_user_id] ? [dictionary.user[nodeForm.responsible_user_id]] : []}
                                                onChange={val => setNodeForm(p => ({...p, responsible_user_id: val?.[0]?.value || null}))}
                                            />
                                        </div>

                                        <div className="space-y-1 col-span-2">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Нотатки</label>
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
                                            className="flex items-center gap-2"
                                        >
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
                                    <div className="p-6 border-b dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30">
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
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Тип</label>
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
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Мережа</label>
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
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Відповідальний</label>
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
                                                        disabled={!nodeForm.name.trim() || updateMutation.isPending}
                                                    >
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
                                                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
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
                                                        <p className="text-sm text-gray-500 mt-2 whitespace-pre-line leading-relaxed dark:text-gray-400">{nodeDetail.data.notes}</p>
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
                                                Склад вузла <span className="text-sm font-normal text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{currentItems.length}</span>
                                            </h4>
                                            <Button
                                                size="sm"
                                                variant={showAddItems ? 'filled' : 'outlined'}
                                                color="blue"
                                                onClick={() => setShowAddItems(p => !p)}
                                                className="flex items-center gap-2"
                                            >
                                                <i className={`fa-regular fa-${showAddItems ? 'chevron-up' : 'plus'}`}/>
                                                {showAddItems ? 'Завершити додавання' : 'Додати обладнання'}
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            {isDetailFetching && (
                                                <div className="flex justify-center py-10"><Spinner className="h-8 w-8"/></div>
                                            )}
                                            {!isDetailFetching && currentItems.length === 0 && !showAddItems && (
                                                <div className="text-center py-12 border-2 border-dashed rounded-xl dark:border-gray-800">
                                                    <p className="text-gray-400 italic">Цей вузол поки що не має обладнання</p>
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
                                            <div className="mt-8 pt-8 border-t dark:border-gray-700 space-y-4 animate-in fade-in slide-in-from-top-2">
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
                                                            onClick={() => setItemFilters({search: '', type: [], user: []})}
                                                        >
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

                                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar border rounded-lg p-2 bg-gray-50/50 dark:bg-gray-800/20">
                                                    {isInventoryFetching && (
                                                        <div className="flex justify-center py-6"><Spinner className="h-6 w-6"/></div>
                                                    )}
                                                    {!isInventoryFetching && searchItems.length === 0 && (
                                                        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                            <p className="text-sm text-gray-400">
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
                                                                    className="py-1 px-3"
                                                                >
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
        </DictionaryProvider>
    );
};

export default NodesPage;
