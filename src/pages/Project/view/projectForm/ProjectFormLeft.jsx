import { observer } from "mobx-react-lite"
import { useVM } from "../../../../shared/mvvm/index.js"
import { ACTION_TYPES, SUBJECT_TYPES } from "../../model/projectFormModel.js"
import { FieldNote, Hints, VocMulti } from "./controls.jsx"
import AnalysisBadge from "../liveAnalysis/AnalysisBadge.jsx"
import ConsolidatedBadge from "./ConsolidatedBadge.jsx"
import DictionaryButton from "./DictionaryButton.jsx"
import {
  CELL,
  INPUT,
  LABEL,
  TEXTAREA,
  TH,
  TOOL_BUTTON,
  borderFor,
} from "./formStyles.js"

const TypePanel = observer(() => {
  const vm = useVM().projectForm
  const { form, isEdit } = vm
  return (
    <div className="-mx-3 mb-5 flex flex-wrap">
      <div className="mb-4 w-1/4 px-3">
        <span className={`${LABEL} mb-1.5 block`}>Тип дії</span>
        {/* редагування: тип дії видно, але змінювати не можна (як V2) */}
        <div
          className={`flex flex-col gap-1.5 ${isEdit ? "pointer-events-none opacity-50" : ""}`}
        >
          {ACTION_TYPES.map((type) => (
            <label
              key={type.id}
              className="flex cursor-pointer items-center gap-2"
              title={type.title}
            >
              <input
                type="radio"
                name="actionType"
                className="h-4 w-4 accent-blue-600 dark:[color-scheme:dark]"
                checked={form.actionType === type.id}
                disabled={isEdit}
                onChange={() => vm.setActionType(type.id)}
              />
              <i className={type.icon} />
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4 w-1/6 px-3">
        <span className={`${LABEL} mb-1.5 block`}>Тип суб'єкта</span>
        <div className="grid grid-cols-2 gap-1.5">
          {SUBJECT_TYPES.map((type) => (
            <label
              key={type.id}
              className="flex cursor-pointer items-center gap-2"
              title={type.title}
            >
              <input
                type="radio"
                name="subjectTypeId"
                className="h-4 w-4 accent-blue-600 dark:[color-scheme:dark]"
                checked={form.subjectTypeId === type.id}
                onChange={() => vm.setSubjectType(type.id)}
              />
              <i className={`${type.icon} text-gray-600 dark:text-gray-400`} />
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4 w-1/3 px-3">
        <label className="mb-1.5 block" htmlFor="project-form-country">
          <span className={LABEL}>Задіяні країни</span>{" "}
          <FieldNote issue={vm.fieldError("countryId")} />
        </label>
        <VocMulti
          id="project-form-country"
          options={vm.options.country}
          value={vm.selected("country")}
          onChange={vm.setCountries}
        />
        <Hints
          items={vm.hints.country}
          onPick={(id) => vm.applyHint("country", id)}
        />
      </div>
      <div className="mb-4 w-1/4 px-3">
        <label className="mb-1.5 block">
          <span
            className={`${LABEL} text-green-600 dark:text-green-400`}
            title="Ідентифікатор в реєстрі санкцій"
          >
            <i className="fa-solid fa-solar-system" /> Реєстр
          </span>{" "}
          <AnalysisBadge
            state={vm.analysis}
            field="drsId"
            className="ml-1 align-middle"
          />
          <FieldNote issue={vm.fieldError("drsId")} />
        </label>
        <input
          className={`${INPUT} ${borderFor(vm.fieldError("drsId"))}`}
          name="drsId"
          placeholder="xxxxx"
          type="number"
          min="1"
          autoComplete="off"
          value={form.drsId ?? ""}
          onChange={(event) => vm.setField("drsId", event.target.value)}
        />
      </div>
    </div>
  )
})

const FIX_FIELDS = [
  { name: "fix_action_id", placeholder: "Ідентифікатор дії", type: "text" },
  { name: "fix_decree", placeholder: "Номер указу", type: "text" },
  { name: "fix_annex", placeholder: "№ додатку", type: "number" },
  { name: "fix_index", placeholder: "Позиція", type: "number" },
]

const FixPanel = observer(() => {
  const vm = useVM().projectForm
  return (
    <div className="mb-5 flex flex-wrap rounded-lg border border-amber-200 bg-amber-50 px-2 py-3 dark:border-amber-800 dark:bg-amber-900/20">
      <div className="mb-2 w-full text-center">
        <span className={`${LABEL} text-amber-700 dark:text-amber-400`}>
          Внесення змін
        </span>
      </div>
      {FIX_FIELDS.map((field) => (
        <div key={field.name} className="w-1/4 px-2">
          <input
            className={`${INPUT} ${borderFor(vm.fieldError(field.name))}`}
            placeholder={field.placeholder}
            type={field.type}
            min={field.type === "number" ? "1" : undefined}
            autoComplete="off"
            value={vm.form[field.name] ?? ""}
            onChange={(event) => vm.setField(field.name, event.target.value)}
          />
          <FieldNote issue={vm.fieldError(field.name)} />
        </div>
      ))}
    </div>
  )
})

const NAME_FIELDS = [
  { name: "nameUk", placeholder: "Українською мовою" },
  { name: "nameRu", placeholder: "Російською мовою" },
  { name: "nameEn", placeholder: "Іноземною мовою" },
]

const NamesPanel = observer(() => {
  const vm = useVM().projectForm
  const { layout } = vm
  return (
    <div className="-mx-3 mb-5 flex flex-wrap">
      <div className="mb-1 w-full px-3">
        <span className={LABEL}>{layout.namesCaption}</span>
      </div>
      {NAME_FIELDS.filter((field) => layout[field.name] !== false).map(
        (field) => (
          <div key={field.name} className="mb-2 w-full px-3">
            <div className="flex items-start gap-1.5">
              <textarea
                className={`${TEXTAREA} h-12 min-w-0 flex-1 ${borderFor(vm.fieldError(field.name))}`}
                placeholder={field.placeholder}
                name={field.name}
                autoComplete="off"
                value={vm.form[field.name] ?? ""}
                onChange={(event) =>
                  vm.setField(field.name, event.target.value)
                }
              />
              <AnalysisBadge
                state={vm.analysis}
                field={field.name}
                className="mt-2"
              />
              <span className="mt-2">
                <ConsolidatedBadge search={vm.consolidated} fieldKey={field.name} />
              </span>
            </div>
            <FieldNote issue={vm.fieldError(field.name)} />
          </div>
        )
      )}
    </div>
  )
})

const CitizenPanel = observer(() => {
  const vm = useVM().projectForm
  const issue = vm.fieldError("citizen")
  const missing = new Set(issue?.ids ?? [])
  const citizen = new Set((vm.form.citizen ?? []).map(Number))
  return (
    <div className="-mx-3 mb-5 flex flex-wrap">
      <div className="w-full px-3">
        <span className="mb-1.5 block">
          <span className={LABEL}>{vm.layout.citizenCaption}</span>{" "}
          <FieldNote issue={issue} />
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
          {vm.rowCountryOptions.length === 0 ? (
            <span className="rounded bg-white p-1 text-gray-700 dark:bg-neutral-600 dark:text-gray-300">
              Після вибору задіяних країн тут з'являться елементи
            </span>
          ) : (
            vm.rowCountryOptions.map((country) => (
              <label
                key={country.id}
                className={`flex cursor-pointer items-center gap-1 text-sm ${missing.has(country.id) ? "text-red-600" : "text-gray-700 dark:text-gray-400"}`}
              >
                <input
                  type="checkbox"
                  className={`h-4 w-4 ${missing.has(country.id) ? "outline outline-2 outline-red-500" : ""}`}
                  checked={citizen.has(country.id)}
                  onChange={() => vm.toggleCitizen(country.id)}
                />
                {country.caption}
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  )
})

const BirthPanel = observer(() => {
  const vm = useVM().projectForm
  return (
    <div className="mb-5">
      <span className="mb-1.5 block">
        <span className={LABEL}>Дата народження</span>
        <span className="ml-1 text-xs font-normal text-gray-600 normal-case dark:text-gray-500">
          "01.01.1980" / "1980" / "01.00.1980"
        </span>
      </span>
      <div className="flex items-center gap-2">
        <input
          name="birthDate"
          className={`${INPUT} ${borderFor(vm.fieldError("birthDate"))}`}
          type="text"
          autoComplete="off"
          value={vm.form.birthDate ?? ""}
          onChange={(event) => vm.setField("birthDate", event.target.value)}
        />
        <AnalysisBadge state={vm.analysis} field="birthDate" />
      </div>
      <FieldNote issue={vm.fieldError("birthDate")} />
    </div>
  )
})

const ADR_FIELDS = [
  { name: "adrUk", placeholder: "Українською мовою" },
  { name: "adrRu", placeholder: "На русском языке" },
  { name: "adrEn", placeholder: "Foreign language" },
]

const AdrPanel = observer(() => {
  const vm = useVM().projectForm
  return (
    <div className="mb-5 flex flex-col gap-2">
      <span className={LABEL}>Місцезнаходження / Адреса</span>
      {ADR_FIELDS.map((field) => (
        <div key={field.name}>
          <textarea
            className={`${TEXTAREA} h-9 ${borderFor(vm.fieldError(field.name))}`}
            placeholder={field.placeholder}
            autoComplete="off"
            value={vm.form[field.name] ?? ""}
            onChange={(event) => vm.setField(field.name, event.target.value)}
          />
          <FieldNote issue={vm.fieldError(field.name)} />
        </div>
      ))}
    </div>
  )
})

const RemoveRowButton = ({ onClick }) => (
  <button
    type="button"
    title="Видалити"
    onClick={onClick}
    className="inline-flex items-center rounded border border-gray-200 bg-white p-1 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-400 dark:hover:bg-red-900/20"
  >
    <i className="fa-solid fa-trash-can pointer-events-none" />
  </button>
)

export const AddRowButton = ({ onClick }) => (
  <button
    type="button"
    title="Додати рядок"
    onClick={onClick}
    className={`${TOOL_BUTTON} float-right`}
  >
    <i className="fa-solid fa-plus pointer-events-none" />
  </button>
)

const RowSelect = ({ value, options, onChange, issue, empty = true }) => (
  <select
    className={`${CELL} ${borderFor(issue)}`}
    value={value ?? ""}
    title={issue?.message}
    onChange={(event) => onChange(event.target.value)}
  >
    {empty && <option value="" />}
    {options.map((option) => (
      <option key={option.id} value={option.id}>
        {option.caption}
      </option>
    ))}
  </select>
)

const IdentifiersTable = observer(() => {
  const vm = useVM().projectForm
  const error = (row, field) => vm.rowError("identifiers", row._key, field)
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className={LABEL}>Ідентифікаційні дані</span>
        <a
          href="/dictionary/identify-v2"
          target="_blank"
          rel="noreferrer"
          className="p-1 text-gray-600 transition-colors hover:text-blue-500"
          title="Словник"
        >
          <i className="fa-duotone fa-book-font" />
        </a>
        <DictionaryButton kind="identifier" title="Додати ідентифікатор до словника" />
      </div>
      <table className="w-full overflow-hidden rounded-md border border-gray-200 text-sm dark:border-neutral-700">
        <thead className="bg-gray-50 dark:bg-neutral-900/60">
          <tr>
            <td className={`${TH} w-8`} />
            <td className={`${TH} w-1/6`}>Країна</td>
            <td className={`${TH} w-1/3`}>Тип</td>
            <td className={TH}>
              Значення <AddRowButton onClick={() => vm.addRow("identifiers")} />
            </td>
          </tr>
        </thead>
        <tbody>
          {vm.form.identifiers.map((row) => (
            <tr
              key={row._key}
              data-analysis-field="identifier"
              className="border-t border-gray-200 dark:border-neutral-700"
            >
              <td className="p-1 whitespace-nowrap">
                <RemoveRowButton
                  onClick={() => vm.removeRow("identifiers", row._key)}
                />
              </td>
              <td className="p-1">
                {vm.layout.identifierCountry ? (
                  <RowSelect
                    value={row.identifierCountryId}
                    options={vm.rowCountryOptions}
                    issue={error(row, "identifierCountryId")}
                    onChange={(value) =>
                      vm.updateRow("identifiers", row._key, {
                        identifierCountryId: value,
                      })
                    }
                  />
                ) : (
                  <span
                    className="px-2 text-xs text-gray-600 dark:text-gray-400"
                    title="Для суден країна ідентифікатора не застосовується"
                  >
                    —
                  </span>
                )}
              </td>
              <td className="p-1">
                <RowSelect
                  value={row.identifierId}
                  options={vm.identifierTypes}
                  issue={error(row, "identifierId")}
                  onChange={(value) =>
                    vm.updateRow("identifiers", row._key, {
                      identifierId: value,
                    })
                  }
                />
              </td>
              <td className="p-1">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    autoComplete="off"
                    className={`${CELL} min-w-0 flex-1 ${borderFor(error(row, "identifierValue"))}`}
                    title={error(row, "identifierValue")?.message}
                    value={row.identifierValue ?? ""}
                    disabled={Boolean(row.notSpecified)}
                    onChange={(event) =>
                      vm.updateRow("identifiers", row._key, {
                        identifierValue: event.target.value,
                      })
                    }
                  />
                  <AnalysisBadge
                    state={vm.analysis}
                    field="identifier"
                    objectId={vm.rowAnalysisId(row)}
                  />
                  <ConsolidatedBadge search={vm.consolidated} fieldKey={vm.consolidatedKey(row)} />
                </div>
                <label
                  className="mt-1 flex cursor-pointer items-center gap-1 text-xs text-gray-600 select-none dark:text-gray-400"
                  title="Свідомо підтверджено, що цей ідентифікатор відсутній (перевірили — не знайшли), а не просто ще не заповнений"
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5"
                    checked={Boolean(row.notSpecified)}
                    onChange={(event) =>
                      vm.setIdentifierNotSpecified(row._key, event.target.checked)
                    }
                  />
                  Не задано
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

const AttributesTable = observer(() => {
  const vm = useVM().projectForm
  const error = (row, field) => vm.rowError("attributes", row._key, field)
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className={LABEL}>Додаткова інформація</span>
        <DictionaryButton kind="attribute" title="Додати атрибут до словника" />
      </div>
      <table className="w-full overflow-hidden rounded-md border border-gray-200 text-sm dark:border-neutral-700">
        <thead className="bg-gray-50 dark:bg-neutral-900/60">
          <tr>
            <td className={`${TH} w-8`} />
            <td className={`${TH} w-1/3`}>Тип відомостей</td>
            <td className={TH}>
              Значення <AddRowButton onClick={() => vm.addRow("attributes")} />
            </td>
          </tr>
        </thead>
        <tbody>
          {vm.form.attributes.map((row) => (
            <tr
              key={row._key}
              className="border-t border-gray-200 dark:border-neutral-700"
            >
              <td className="p-1 whitespace-nowrap">
                <RemoveRowButton
                  onClick={() => vm.removeRow("attributes", row._key)}
                />
              </td>
              <td className="p-1">
                <RowSelect
                  value={row.attributeId}
                  options={vm.attributeTypes}
                  issue={error(row, "attributeId")}
                  onChange={(value) =>
                    vm.updateRow("attributes", row._key, { attributeId: value })
                  }
                />
              </td>
              <td className="p-1">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    autoComplete="off"
                    className={`${CELL} min-w-0 flex-1 ${borderFor(error(row, "attributeValue"))}`}
                    value={row.attributeValue ?? ""}
                    onChange={(event) =>
                      vm.updateRow("attributes", row._key, {
                        attributeValue: event.target.value,
                      })
                    }
                  />
                  {/* аналіз атрибутів — лише збережених рядків (legacy) */}
                  {row.id && (
                    <AnalysisBadge
                      state={vm.analysis}
                      field="attribute"
                      objectId={Number(row.id)}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

export { RemoveRowButton, RowSelect }

/** Ліва колонка: тип дії/суб'єкта, країни, fix, найменування, громадянство, дата/адреса, ідентифікатори. */
const ProjectFormLeft = () => {
  const vm = useVM().projectForm
  const { layout } = vm
  return (
    <div>
      <TypePanel />
      {layout.fix && <FixPanel />}
      {layout.names && <NamesPanel />}
      {layout.citizen && <CitizenPanel />}
      {layout.birth && <BirthPanel />}
      {layout.adr && <AdrPanel />}
      {layout.identifiers && (
        <div className="mb-5">
          <IdentifiersTable />
          <AttributesTable />
        </div>
      )}
    </div>
  )
}

export default observer(ProjectFormLeft)
