
// Редактор списку номерів одного суб'єкта (телефон + необов'язкова примітка
// до КОНКРЕТНОГО номера, окремо від примітки до всього запису) —
// перевикористовується в CreatePhoneModal і EditPhoneModal. Поле "Мітка"
// прибрано (2026-08-03, пряма вимога користувача) — зайве, примітки до
// номера достатньо.
const PhoneNumbersEditor = ({value = [], onChange}) => {
    const updateAt = (index, patch) => {
        onChange(value.map((item, i) => (i === index ? {...item, ...patch} : item)));
    };
    const removeAt = (index) => {
        onChange(value.filter((_, i) => i !== index));
    };
    const addRow = () => {
        onChange([...value, {phone: "", note: ""}]);
    };

    return (
        <div data-i-doc="component:handbook-phone-numbers-editor">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Номери телефону
            </label>
            <div className="flex flex-col gap-2">
                {value.map((item, index) => (
                    <div key={index} className="flex items-start gap-1.5 rounded-md border border-slate-200 p-2 dark:border-slate-700">
                        <div className="grid flex-1 grid-cols-2 gap-1.5">
                            <input
                                type="text"
                                value={item.phone}
                                onChange={(e) => updateAt(index, {phone: e.target.value})}
                                placeholder="+380…"
                                className="rounded-md border border-slate-200 bg-white p-1.5 text-sm text-slate-900 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                            <input
                                type="text"
                                value={item.note || ""}
                                onChange={(e) => updateAt(index, {note: e.target.value})}
                                placeholder="Примітка до номера"
                                className="rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-700 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            />
                        </div>
                        <button type="button" onClick={() => removeAt(index)} title="Прибрати номер"
                                className="mt-1.5 shrink-0 text-slate-400 transition hover:text-red-500">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={addRow}
                    className="mt-1.5 text-[11px] font-medium text-blue-600 transition hover:underline dark:text-blue-400">
                <i className="fa-regular fa-plus mr-1"></i>Додати номер
            </button>
        </div>
    );
};

export default PhoneNumbersEditor;
