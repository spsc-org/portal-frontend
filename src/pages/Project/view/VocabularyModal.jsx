import { observer } from "mobx-react-lite";
import { useVM } from "../../../shared/mvvm/index.js";
import { ATTRIBUTE_SUBJECT_TYPES, IDENTIFIER_GROUPS, IDENTIFIER_SUBJECT_TYPES } from "../model/vocabularyModel.js";

const LABEL = "mb-1 block text-xs font-bold uppercase text-gray-700 dark:text-gray-300";
const CONTROL = "w-full rounded-md border px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:bg-neutral-900 dark:text-gray-100";

const Field = observer(({ name, label, children }) => {
    const vm = useVM().vocabularyModal;
    const error = vm.errors[name];
    return (
        <div>
            <label className={LABEL} htmlFor={name}>
                {label}
            </label>
            {children(`${CONTROL} ${error ? "border-red-500" : "border-gray-300 dark:border-neutral-600"}`)}
            {error && <span className="text-xs text-red-500">🛑️ {error}</span>}
        </div>
    );
});

const TextInput = observer(({ name, label, required, autoFocus }) => {
    const vm = useVM().vocabularyModal;
    return (
        <Field name={name} label={label}>
            {(className) => <input id={name} type="text" required={required} autoFocus={autoFocus} className={className} value={vm.values[name] ?? ""} onChange={(event) => vm.setValue(name, event.target.value)} />}
        </Field>
    );
});

const TextArea = observer(({ name, label }) => {
    const vm = useVM().vocabularyModal;
    return (
        <Field name={name} label={label}>
            {(className) => <textarea id={name} required rows={3} className={className} value={vm.values[name] ?? ""} onChange={(event) => vm.setValue(name, event.target.value)} />}
        </Field>
    );
});

const SelectInput = observer(({ name, label, options, required, autoFocus, placeholder = "" }) => {
    const vm = useVM().vocabularyModal;
    return (
        <Field name={name} label={label}>
            {(className) => (
                <select id={name} required={required} autoFocus={autoFocus} className={className} value={vm.values[name] ?? ""} onChange={(event) => vm.setValue(name, event.target.value)}>
                    {placeholder !== null && <option value="">{placeholder}</option>}
                    {options.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.caption}
                        </option>
                    ))}
                </select>
            )}
        </Field>
    );
});

/** Поля за видом словника (modal-identifier / modal-attribute / modal-category.blade.php). */
const VocabularyFields = observer(() => {
    const vm = useVM().vocabularyModal;
    if (vm.kind === "identifier") {
        return (
            <>
                <div className="rounded-md bg-amber-50 p-2 text-xs font-bold text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                    <p>⚠️ Перед тим як додавати новий ідентифікатор, впевніться, що він відсутній у переліку ідентифікаційних даних та додаткової інформації!</p>
                    <p>Якщо вже точно впевнені, що такий відсутній - дуже зважено підійдіть до формування його назви та опису.</p>
                </div>
                <SelectInput name="modalIdentifier-group" label="Вид ідентифікатора*" options={IDENTIFIER_GROUPS} required autoFocus />
                <TextInput name="modalIdentifier-caption" label="Скорочена назва (абревіатура)*" required />
                <TextArea name="modalIdentifier-description" label="Опис*" />
                <SelectInput name="modalIdentifier-type" label="Застосовується до таких суб'єктів*" options={IDENTIFIER_SUBJECT_TYPES} required />
                <SelectInput name="modalIdentifier-country" label="Застосовується до таких країн" options={vm.countries} />
            </>
        );
    }
    if (vm.kind === "attribute") {
        return (
            <>
                <TextInput name="modalAttribute-caption" label="Назва атрибуту*" required autoFocus />
                <TextArea name="modalAttribute-description" label="Опис*" />
                <SelectInput name="modalAttribute-type" label="Застосовується до наступної категорії суб'єктів" options={ATTRIBUTE_SUBJECT_TYPES} placeholder={null} />
            </>
        );
    }
    return <TextInput name="modalCategory-caption" label="Назва категорії*" required autoFocus />;
});

/** Модалка поповнення словника з форми проєкту. Стан — VocabularyModalViewModel (vm.vocabularyModal). */
const VocabularyModal = () => {
    const vm = useVM().vocabularyModal;
    if (!vm.isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[1065] flex items-start justify-center overflow-y-auto bg-gray-900/50 pt-16 dark:bg-black/70"
            data-testid="vocabulary-modal"
            onMouseDown={(event) => event.target === event.currentTarget && vm.close()}
        >
            <form onSubmit={vm.submit} className="m-3 flex w-full max-w-lg flex-col rounded-xl border border-gray-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-neutral-700">
                    <h3 className="font-bold uppercase text-gray-800 dark:text-gray-300">{vm.title}</h3>
                    <button type="button" onClick={vm.close} aria-label="Закрити" className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                        <i className="fas fa-xmark text-lg" />
                    </button>
                </div>
                <div className="flex flex-col gap-3 px-4 py-3">
                    {vm.kind !== "category" && <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Зірочкою позначені поля, обов'язкові до заповнення.</p>}
                    <VocabularyFields />
                    {vm.general.length > 0 && <div className="text-sm text-red-600 dark:text-red-400">{vm.general.join(" ")}</div>}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-neutral-700">
                    {vm.saving && <i className="fa-solid fa-spinner fa-spin text-gray-400" />}
                    <button type="button" onClick={vm.close} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700">
                        Скасувати
                    </button>
                    <button type="submit" disabled={vm.saving} data-testid="vocabulary-submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
                        ОК
                    </button>
                </div>
            </form>
        </div>
    );
};

export default observer(VocabularyModal);
