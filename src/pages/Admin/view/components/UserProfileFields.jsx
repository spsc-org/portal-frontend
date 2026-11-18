import { observer } from "mobx-react-lite";
import Input from "../../../../components/fields/Input.jsx";
import SingleSelect from "../../../../components/fields/SingleSelect.jsx";

const CHECKBOXES = [
    { name: "isResponsible", label: "Відповідальна особа" },
    { name: "showActivity", label: "Відображати активність" },
    { name: "showKPI", label: "Показувати KPI" },
];

/** Поля профілю (спільні для створення й редагування). vm — UserFormViewModel. */
const UserProfileFields = ({ vm }) => {
    const { form, errors } = vm;
    const text = (name, label, extra = {}) => (
        <Input error={errors?.[name]} label={label} value={form[name] || ""} name={name} onChange={vm.handleInput} {...extra}/>
    );

    return (
        <>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {text("name", "ПІБ")}
                {text("email", "Email", { type: "email" })}
                {text("initials", "Ініціали")}
                {!vm.isEdit && text("password", "Пароль")}
                {text("dob", "Дата народження", { type: "date" })}
                {text("unit", "Підрозділ")}
                <SingleSelect
                    closeMenuOnSelect
                    options={vm.data.ranks}
                    label="Звання"
                    id="rankId"
                    error={errors?.rankId}
                    value={form.rankId}
                    onChange={(selected) => vm.setSelect("rankId", selected)}
                />
                {text("agreementTo", "Дата закінчення контракту", { type: "date" })}
                {text("positionFrom", "На посаді з", { type: "date" })}
                {text("rankFrom", "Дата присв. останнього звання", { type: "date" })}
            </div>
            {CHECKBOXES.map(({ name, label }, index) => (
                <div key={name} className={`${index === 0 ? "mt-5" : "mt-3"} rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-700/40`}>
                    <label className="cursor-pointer text-gray-600 dark:text-gray-300">
                        <input
                            type="checkbox"
                            className="cursor-pointer form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-300"
                            checked={Boolean(form[name])}
                            onChange={vm.handleCheckbox}
                            name={name}
                        />{" "}
                        {label}
                    </label>
                </div>
            ))}
        </>
    );
};

export default observer(UserProfileFields);
