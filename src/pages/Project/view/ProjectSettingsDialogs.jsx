import { observer } from "mobx-react-lite";
import { useVM } from "../../../shared/mvvm/index.js";
import { RULE_CATEGORIES } from "../viewmodel/PersonalReasonRulesViewModel.js";

/** Спільна оболонка модалок сторінки (Portal UI kit: rounded-xl, border, header/footer). */
const DialogShell = ({ title, icon, onClose, children, footer, width = "max-w-3xl", testId }) => (
    <div
        className="fixed inset-0 z-[1055] flex items-start justify-center overflow-y-auto bg-gray-500/50 pt-8 dark:bg-neutral-900/70"
        data-testid={testId}
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
        <div className={`m-3 flex w-full ${width} flex-col rounded-xl border border-gray-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800`}>
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-neutral-700">
                <h3 className="font-bold uppercase text-gray-800 dark:text-gray-300">
                    {icon && <i className={`${icon} mr-2 text-blue-500`} />}
                    {title}
                </h3>
                <button type="button" onClick={onClose} aria-label="Закрити" className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                    <i className="fas fa-xmark text-lg" />
                </button>
            </div>
            <div className="px-4 py-3">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-neutral-700">{footer}</div>}
        </div>
    </div>
);

const PRIMARY = "rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300";
const SECONDARY = "rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700";
const CHECK_LABEL = "flex cursor-pointer items-center gap-x-2 whitespace-nowrap rounded-md px-1.5 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700";
const CHECKBOX = "h-4 w-4 shrink-0 cursor-pointer accent-blue-600 dark:[color-scheme:dark]";

/** "Налаштування" (legacy modal-settings): видимі фільтри + чернетки форми проєкту. */
const SettingsModal = observer(() => {
    const vm = useVM().settings;
    if (!vm.isOpen) return null;
    return (
        <DialogShell
            title="Налаштування"
            icon="fa-solid fa-gear"
            onClose={vm.close}
            testId="project-settings-modal"
            footer={
                <>
                    <button type="button" className={SECONDARY} onClick={vm.close}>
                        Скасувати
                    </button>
                    <button type="button" className={PRIMARY} onClick={vm.save} data-testid="project-settings-save">
                        Зберегти
                    </button>
                </>
            }
        >
            <section className="mb-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">Видимі фільтри</h4>
                <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {vm.filters.map((filter) => (
                        <li key={filter.key}>
                            <label className={CHECK_LABEL}>
                                <input type="checkbox" className={CHECKBOX} name={filter.key} checked={Boolean(vm.visibility[filter.key])} onChange={() => vm.toggle(filter.key)} />
                                {filter.caption}
                            </label>
                        </li>
                    ))}
                </ul>
            </section>
            <section>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">Чернетки</h4>
                <label className={CHECK_LABEL}>
                    <input type="checkbox" className={CHECKBOX} checked={vm.useProjectDraft} onChange={(event) => vm.setUseProjectDraft(event.target.checked)} />
                    Використовувати чернетку у картках проєкту
                </label>
            </section>
        </DialogShell>
    );
});

const ScopeRow = observer(({ title, items, selected, onToggle, onAll, disabled }) => (
    <tr className="align-top">
        <td className="whitespace-nowrap py-1 pr-2 text-sm text-gray-600 dark:text-gray-400">{title}:</td>
        <td className="py-1">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                {items.map((item) => (
                    <label key={item.id} className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                        <input type="checkbox" className={CHECKBOX} disabled={disabled} checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
                        {item.caption}
                    </label>
                ))}
            </div>
        </td>
        <td className="py-1 pl-2">
            <button type="button" disabled={disabled} className="rounded-lg border border-gray-200 bg-white px-2 py-1 disabled:opacity-50 text-sm text-gray-900 hover:bg-gray-100 hover:text-blue-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700" onClick={onAll}>
                усі
            </button>
        </td>
    </tr>
));

/** "Фільтрація за поданнями" (legacy modal-filterProposals). */
const ProposalFilterModal = observer(() => {
    const vm = useVM().proposalFilter;
    if (!vm.isOpen) return null;
    const { extended } = vm;
    return (
        <DialogShell title="Фільтрація за поданнями" icon="fa-regular fa-filter" onClose={vm.close} width="max-w-6xl" testId="project-proposal-filter-modal">
            <div className="mb-3 rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-600 shadow-sm dark:bg-neutral-700 dark:text-slate-300">
                Це нежадібний фільтр. Якщо він увімкнений, то будуть глобально відібрані усі записи, повʼязані з обраними поданнями, незалежно від інших фільтрів.
            </div>
            <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                Off
                <span className="relative inline-block h-5 w-11">
                    <input
                        type="checkbox"
                        className="peer h-5 w-11 cursor-pointer appearance-none rounded-full bg-slate-200 transition-colors checked:bg-slate-800 dark:bg-neutral-600 dark:checked:bg-blue-500"
                        checked={extended.enabled}
                        onChange={(event) => vm.setEnabled(event.target.checked)}
                        data-testid="proposal-filter-enabled"
                    />
                    <span className="pointer-events-none absolute left-0 top-0 h-5 w-5 rounded-full border border-slate-300 bg-white shadow-sm transition-transform peer-checked:translate-x-6" />
                </span>
                On
            </label>
            <table className="mb-3 w-full">
                <tbody>
                    <ScopeRow title="Субʼєкт подання" items={vm.issuers} selected={extended.settings.issuer} onToggle={vm.toggleIssuer} onAll={vm.allIssuers} disabled={vm.isLoading} />
                    <ScopeRow title="Стан" items={vm.states} selected={extended.settings.state} onToggle={vm.toggleState} onAll={vm.allStates} disabled={vm.isLoading} />
                </tbody>
            </table>
            <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-blue-100 text-xs uppercase text-gray-600 dark:bg-blue-900/40 dark:text-gray-300">
                        <tr>
                            <th className="px-2 py-1 text-left">id</th>
                            <th className="px-2 py-1" />
                            <th className="px-2 py-1 text-left">Субʼєкт подання</th>
                            <th className="px-2 py-1 text-left">Стан</th>
                            <th className="px-2 py-1 text-left">Назва</th>
                            <th className="px-2 py-1 text-left">Реєстр.номер</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700 dark:divide-neutral-700 dark:text-gray-300">
                        {vm.isLoading && (
                            <tr>
                                <td colSpan={6} className="py-3 text-center text-gray-400">
                                    <i className="fa-solid fa-spinner fa-spin mr-2" />
                                    Завантаження подань…
                                </td>
                            </tr>
                        )}
                        {!vm.isLoading && vm.visible.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-3 text-center text-gray-400">
                                    Оберіть субʼєкти подання і стани, щоб побачити подання
                                </td>
                            </tr>
                        )}
                        {vm.visible.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                                <td className="px-2 py-1">{row.id}</td>
                                <td className="px-2 py-1">
                                    <input type="checkbox" className={CHECKBOX} checked={vm.isChecked(row.id)} onChange={() => vm.toggleRow(row.id)} />
                                </td>
                                <td className="px-2 py-1">{row.issuerCaption}</td>
                                <td className="whitespace-nowrap px-2 py-1">
                                    {row.stateIcon && <i className={`${row.stateIcon} mr-1`} title={row.stateCaption} />}
                                    {row.stateCaption}
                                </td>
                                <td className="px-2 py-1">{row.caption}</td>
                                <td className="whitespace-nowrap px-2 py-1 text-xs">
                                    {row.outgoingNumber ?? ""}
                                    <br />
                                    {row.outgoingDate ?? ""}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DialogShell>
    );
});

const categoryOf = (id) => RULE_CATEGORIES.find((category) => category.id === id) ?? RULE_CATEGORIES[0];
const INLINE_SELECT = "w-full cursor-pointer rounded border border-transparent bg-transparent px-2 py-1 text-xs hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:bg-neutral-800 dark:hover:border-neutral-600";
const TH = "px-4 py-2 font-medium";

const PersonalRules = observer(() => {
    const vm = useVM().reasonRules;
    const { draft } = vm;
    const add = (event) => {
        event.preventDefault();
        vm.add();
    };
    return (
        <>
            <form className="mb-3 flex flex-wrap items-center gap-2" onSubmit={add}>
                <input
                    type="text"
                    placeholder="Введіть фразу..."
                    value={draft.phrase}
                    onChange={(event) => vm.setDraft({ phrase: event.target.value })}
                    className="min-w-[240px] flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100"
                    data-testid="reason-rule-phrase"
                />
                <select value={draft.category} onChange={(event) => vm.setDraft({ category: event.target.value })} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-900">
                    {RULE_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.caption}
                        </option>
                    ))}
                </select>
                <select value={draft.countryId} onChange={(event) => vm.setDraft({ countryId: event.target.value })} className="max-w-[180px] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-900">
                    <option value="">(Будь-яка)</option>
                    {vm.countries.map((country) => (
                        <option key={country.id} value={country.id}>
                            {country.caption}
                        </option>
                    ))}
                </select>
                <label className="flex cursor-pointer items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <input type="checkbox" className="h-4 w-4 cursor-pointer" checked={draft.caseSensitive} onChange={(event) => vm.setDraft({ caseSensitive: event.target.checked })} />
                    Чутл.регістр
                </label>
                <button type="submit" className={PRIMARY} disabled={!draft.phrase.trim()}>
                    <i className="fa-solid fa-plus mr-1" />
                    Додати
                </button>
            </form>
            <table className="w-full text-left">
                <thead className="bg-gray-100 text-xs uppercase text-gray-500 dark:bg-neutral-900">
                    <tr>
                        <th className={`${TH} w-[30%]`}>Фраза</th>
                        <th className={`${TH} w-[120px]`}>Категорія</th>
                        <th className={`${TH} w-[140px]`}>Країна</th>
                        <th className={`${TH} w-[80px] text-center`}>Регістр</th>
                        <th className={`${TH} w-[80px] text-center`}>Активне</th>
                        <th className={`${TH} w-[60px] text-right`}>Дії</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                    {vm.personal.map((rule) => (
                        <tr key={rule.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700/50 ${rule.is_active ? "" : "opacity-60"}`}>
                            <td className="px-4 py-2">
                                <input
                                    type="text"
                                    defaultValue={rule.phrase}
                                    onBlur={(event) => vm.update(rule.id, { phrase: event.target.value })}
                                    onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
                                    className="w-full border-0 border-b border-transparent bg-transparent px-0 py-1 font-mono text-sm text-gray-800 hover:border-gray-300 focus:border-blue-400 focus:outline-none focus:ring-0 dark:text-gray-200"
                                />
                            </td>
                            <td className="px-4 py-2">
                                <select className={INLINE_SELECT} value={rule.category} onChange={(event) => vm.update(rule.id, { category: event.target.value })}>
                                    {RULE_CATEGORIES.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.caption}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-4 py-2">
                                <select className={INLINE_SELECT} value={rule.target_country_id ?? ""} onChange={(event) => vm.update(rule.id, { target_country_id: event.target.value || null })}>
                                    <option value="">(Будь-яка)</option>
                                    {vm.countries.map((country) => (
                                        <option key={country.id} value={country.id}>
                                            {country.caption}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-4 py-2 text-center">
                                <input type="checkbox" className="h-4 w-4 cursor-pointer" checked={Boolean(rule.is_case_sensitive)} onChange={(event) => vm.update(rule.id, { is_case_sensitive: event.target.checked })} />
                            </td>
                            <td className="px-4 py-2 text-center">
                                <button
                                    type="button"
                                    title={rule.is_active ? "Вимкнути" : "Увімкнути"}
                                    onClick={() => vm.update(rule.id, { is_active: !rule.is_active })}
                                    className={`text-xl transition-colors ${rule.is_active ? "text-green-500 hover:text-green-600" : "text-gray-300 hover:text-green-500"}`}
                                >
                                    <i className={`fa-solid ${rule.is_active ? "fa-toggle-on" : "fa-toggle-off"}`} />
                                </button>
                            </td>
                            <td className="px-4 py-2 text-right">
                                <button type="button" title="Видалити" onClick={() => vm.remove(rule.id)} className="p-1 text-gray-400 transition-colors hover:text-red-500">
                                    <i className="fa-solid fa-trash-can" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {!vm.isLoading && vm.personal.length === 0 && <p className="py-4 text-center text-sm text-gray-400">Особистих правил ще немає</p>}
        </>
    );
});

const GlobalRules = observer(() => {
    const vm = useVM().reasonRules;
    return (
        <>
            <table className="w-full text-left">
                <thead className="bg-gray-100 text-xs uppercase text-gray-500 dark:bg-neutral-900">
                    <tr>
                        <th className={`${TH} w-[35%]`}>Фраза</th>
                        <th className={`${TH} w-[120px]`}>Категорія</th>
                        <th className={`${TH} w-[150px]`}>Країна</th>
                        <th className={`${TH} w-[100px] text-center`}>Регістр</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                    {vm.global.map((rule) => {
                        const category = categoryOf(rule.category);
                        return (
                            <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                                <td className="px-4 py-2 font-mono text-sm text-gray-800 dark:text-gray-200">{rule.phrase}</td>
                                <td className="px-4 py-2">
                                    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs ${category.badge}`}>
                                        <i className={`fa-solid ${category.icon}`} /> {category.caption}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                    {rule.target_country_id ? vm.countryName(rule.target_country_id) : <span className="italic text-gray-400">Будь-яка</span>}
                                </td>
                                <td className="px-4 py-2 text-center">{rule.is_case_sensitive ? <i className="fa-solid fa-check text-blue-500" /> : <span className="text-gray-300">—</span>}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {!vm.isLoading && vm.global.length === 0 && <p className="py-4 text-center text-sm text-gray-400">Системних правил немає</p>}
        </>
    );
});

/** "Правила обґрунтувань" (legacy modal-reason-rules): особисті + системні. */
const ReasonRulesModal = observer(() => {
    const vm = useVM().reasonRules;
    if (!vm.isOpen) return null;
    const tabClass = (tab) =>
        `border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            vm.tab === tab ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        }`;
    return (
        <DialogShell title="Правила обґрунтувань" icon="fa-solid fa-list-check" onClose={vm.close} width="max-w-5xl" testId="project-reason-rules-modal">
            <nav className="mb-3 flex gap-2 border-b border-gray-200 dark:border-neutral-700">
                <button type="button" className={tabClass("personal")} onClick={() => vm.setTab("personal")}>
                    Мої правила
                </button>
                <button type="button" className={tabClass("global")} onClick={() => vm.setTab("global")}>
                    Системні правила
                </button>
            </nav>
            {vm.isLoading ? (
                <p className="py-4 text-center text-sm text-gray-400">
                    <i className="fa-solid fa-spinner fa-spin mr-2" />
                    Завантаження…
                </p>
            ) : vm.tab === "personal" ? (
                <PersonalRules />
            ) : (
                <GlobalRules />
            )}
        </DialogShell>
    );
});

/** Модалки налаштувань сторінки /project. */
const ProjectSettingsDialogs = () => (
    <>
        <SettingsModal />
        <ProposalFilterModal />
        <ReasonRulesModal />
    </>
);

export default ProjectSettingsDialogs;
