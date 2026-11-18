import { observer } from 'mobx-react-lite';
import { useVM } from '../../../shared/mvvm/viewModelHooks.js';
import { STATUS_OPTIONS } from '../viewmodel/NotificationsViewModel.js';
import { SegmentedControl, TypeChip } from './components/FilterControls.jsx';
import NotificationItem from './components/NotificationItem.jsx';
import PageHeader from '../../../layouts/app/PageHeader.jsx';
import { HeaderButton } from '../../../layouts/app/HeaderButtons.jsx';

function NotificationsView() {
    const vm = useVM();

    return (
        <div data-i-doc="page:notifications" className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
            <PageHeader
                title="Нотифікації"
                actions={<HeaderButton tone="default" icon="fa-solid fa-check-double" onClick={vm.markAllRead}>Прочитати всі</HeaderButton>}
            />

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                <div className="space-y-2.5 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-700/70">
                    <SegmentedControl value={vm.statusFilter} options={STATUS_OPTIONS} onChange={vm.setStatusFilter} />

                    {vm.typeOptions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            <TypeChip active={vm.typeFilter === ''} onClick={() => vm.setTypeFilter('')}>
                                Усі типи
                            </TypeChip>
                            {vm.typeOptions.map((option) => (
                                <TypeChip
                                    key={option.value}
                                    active={vm.typeFilter === option.value}
                                    onClick={() => vm.setTypeFilter(option.value)}
                                >
                                    {option.label}
                                </TypeChip>
                            ))}
                        </div>
                    )}
                </div>

                {vm.isLoading && (
                    <p className="px-4 py-10 text-center text-xs text-gray-600 dark:text-gray-400">Завантаження…</p>
                )}

                {vm.isEmpty && (
                    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                        <i className="fa-regular fa-bell-slash text-2xl text-gray-300 dark:text-gray-600" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">Немає нотифікацій</p>
                        <p className="text-xs text-gray-600 dark:text-gray-500">Спробуйте змінити фільтри вище</p>
                    </div>
                )}

                {!vm.isLoading && vm.notifications.map((n, idx) => (
                    <NotificationItem key={n.id} notification={n} isLast={idx === vm.notifications.length - 1} />
                ))}
            </div>
        </div>
    );
}

export default observer(NotificationsView);
