import { observer } from 'mobx-react-lite';
import TaskLayout from '../../../components/TaskLayout';
import MetaRow from '../../../components/MetaRow';
import NotificationCategoryTable from '../../../components/NotificationCategoryTable.jsx';
import { NOTIFICATION_CHANNEL_COLUMNS } from '../../../components/notificationChannels.js';
import { useVM } from '../../../shared/mvvm/viewModelHooks.js';

const ON_OFF = [
    { value: 'on', label: 'Увімк.' },
    { value: 'off', label: 'Вимк.' },
];

function SectionCard({ title, hint = null, children }) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
            <div className="border-b border-gray-200 px-4 py-2.5 dark:border-neutral-700">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-500">{title}</p>
                {hint && <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{hint}</p>}
            </div>
            <div className="px-4 py-3">{children}</div>
        </div>
    );
}

function SegmentedControl({ value, options, disabled, onChange }) {
    return (
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 dark:border-neutral-700">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(option.value)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                        value === option.value
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

function SettingsView() {
    const vm = useVM();

    if (vm.isLoading) {
        return (
            <TaskLayout title="Налаштування">
                <p className="text-xs text-gray-600 dark:text-gray-400">Завантаження…</p>
            </TaskLayout>
        );
    }

    return (
        <TaskLayout data-i-doc="page:settings" title="Налаштування">
            <div className="max-w-2xl space-y-3">
                <SectionCard title="Вигляд">
                    <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-gray-50/60 px-3 dark:divide-neutral-700 dark:border-neutral-700 dark:bg-neutral-700/40">
                        <MetaRow icon="fa-regular fa-moon" label="Тема">
                            <SegmentedControl
                                value={vm.theme}
                                disabled={vm.saving}
                                onChange={vm.setTheme}
                                options={[
                                    { value: 'light', label: 'Світла' },
                                    { value: 'dark', label: 'Темна' },
                                ]}
                            />
                        </MetaRow>
                    </div>
                </SectionCard>

                <SectionCard title="Нотифікації" hint="Для кожної категорії оберіть, якими каналами отримувати сповіщення.">
                    <NotificationCategoryTable
                        categories={vm.categories}
                        onToggle={vm.toggleChannel}
                        disabled={vm.saving}
                        renderCategoryExtra={(item) => (
                            item.category === 'project_ticket' ? (
                                <tr className="bg-gray-50/60 dark:bg-neutral-700/40">
                                    <td colSpan={1 + NOTIFICATION_CHANNEL_COLUMNS.length} className="px-3 py-2 pl-6">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-gray-600 dark:text-gray-300">
                                                Підписка на нові тікети
                                                <span className="mt-0.5 block text-[11px] text-gray-600 dark:text-gray-500">
                                                    Якщо увімкнено, ви отримуватимете сповіщення про КОЖЕН
                                                    новий тікет будь-якого проєкту в системі.
                                                </span>
                                            </span>
                                            <SegmentedControl
                                                value={vm.projectTicketSubscribed ? 'on' : 'off'}
                                                disabled={vm.saving}
                                                onChange={(next) => vm.setProjectTicketSubscription(next === 'on')}
                                                options={ON_OFF}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ) : null
                        )}
                    />
                </SectionCard>

                <SectionCard
                    title="Мітки i-doc"
                    hint="Кольорові підписи над елементами інтерфейсу — назва сторінки/модалки/вкладки тощо, для навігації в документації."
                >
                    <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-3 dark:border-neutral-700 dark:bg-neutral-700/40">
                        <MetaRow icon="fa-regular fa-tag" label="Показувати мітки">
                            <SegmentedControl
                                value={vm.showIDocLabels ? 'on' : 'off'}
                                disabled={vm.saving}
                                onChange={(next) => vm.setShowIDocLabels(next === 'on')}
                                options={ON_OFF}
                            />
                        </MetaRow>
                    </div>
                </SectionCard>
            </div>
        </TaskLayout>
    );
}

export default observer(SettingsView);
