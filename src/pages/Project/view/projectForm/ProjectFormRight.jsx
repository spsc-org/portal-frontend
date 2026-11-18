import { observer } from "mobx-react-lite"
import { useVM } from "../../../../shared/mvvm/index.js"
import { FORM_RESTRICTION_KEYS } from "../../model/projectFormModel.js"
import {
  missingPhrases,
  reasoningItems,
} from "../../model/liveAnalysisModel.js"
import AnalysisBadge from "../liveAnalysis/AnalysisBadge.jsx"
import DictionaryButton from "./DictionaryButton.jsx"
import {
  HighlightTextarea,
  RequiredPhrases,
} from "../liveAnalysis/AnalysisText.jsx"
import {
  FieldNote,
  Hints,
  VocMulti,
  VocSearchSelect,
  VocSelect,
} from "./controls.jsx"
import { LABEL, TEXTAREA, TOOL_BUTTON, borderFor } from "./formStyles.js"

const Reasoning = observer(() => {
  const vm = useVM().projectForm
  const analysis = vm.analysis.textResult("reasoning")
  return (
    <div className="mb-4 px-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span className={LABEL}>Обгрунтування</span>
          <AnalysisBadge state={vm.analysis} field="reasoning" />
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title={vm.reasoningMax ? "Згорнути" : "Розгорнути"}
            className={TOOL_BUTTON}
            onClick={vm.toggleReasoningMax}
          >
            <i
              className={`fa-solid ${vm.reasoningMax ? "fa-minimize" : "fa-maximize"} pointer-events-none`}
            />
          </button>
          <button
            type="button"
            title="Заповнити останніми даними"
            className={TOOL_BUTTON}
            onClick={vm.pasteLast}
            data-testid="project-form-paste-last"
          >
            <i className="fa-regular fa-paste pointer-events-none" />
          </button>
        </div>
      </div>
      <HighlightTextarea
        spellCheck
        items={reasoningItems(analysis?.validationData)}
        className={`${TEXTAREA} ${vm.reasoningMax ? "h-[600pt]" : "h-28"} ${borderFor(vm.fieldError("reasoning"))}`}
        name="reasoning"
        autoComplete="off"
        value={vm.form.reasoning ?? ""}
        onChange={(event) => vm.setField("reasoning", event.target.value)}
      />
      <RequiredPhrases phrases={missingPhrases(analysis)} />
      <FieldNote issue={vm.fieldError("reasoning")} />
    </div>
  )
})

// Як у легасі (ProjectModalManager: input.style = "background-color: green|orange|red"):
// колір — фон самого чекбокса. @tailwindcss/forms робить його appearance:none, тож квадрат
// заливається кольором повністю, а у відміченому стані зверху — біла галочка плагіна.
// text-* — currentColor для :checked (плагін), щоб колір не змінювався при відмітці.
const SWATCH = {
  green: "bg-green-700 text-green-700",
  orange: "bg-amber-500 text-amber-500",
  red: "bg-red-600 text-red-600",
}

const Restrictions = observer(() => {
  const vm = useVM().projectForm
  const { form, restrictionColors } = vm
  const allChecked = FORM_RESTRICTION_KEYS.every((key) => form[key])
  const greens = FORM_RESTRICTION_KEYS.filter(
    (key) => restrictionColors[key]?.color === "green"
  )
  const greensChecked = greens.length > 0 && greens.every((key) => form[key])
  return (
    <div className="mb-4 px-3" data-testid="project-form-restrictions">
      <div className="mb-1 flex items-center justify-between">
        <span className={LABEL}>Обмеження</span>
        <div className="h-5 text-xs">
          {vm.hints.restrictions && (
            <button
              type="button"
              title="Установити попередній набір обмежень"
              onClick={vm.applyRestrictionHint}
              className="cursor-pointer rounded bg-gray-200 px-1 text-blue-500 italic dark:bg-blue-800 dark:text-gray-300"
            >
              Попередній набір
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
          <label className="flex cursor-pointer items-center gap-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5"
              checked={allChecked}
              onChange={(event) => vm.setAllRestrictions(event.target.checked)}
            />
            Всі
          </label>
          <label className="flex cursor-pointer items-center gap-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5"
              checked={greensChecked}
              onChange={(event) =>
                vm.setGreenRestrictions(event.target.checked)
              }
            />
            Зелені
          </label>
        </div>
      </div>
      <FieldNote issue={vm.fieldError("restrictions")} />
      <div className="flex flex-wrap gap-x-1 gap-y-0.5">
        {FORM_RESTRICTION_KEYS.map((key) => {
          const meta = restrictionColors[key]
          const code = key.slice(1)
          return (
            <div
              key={key}
              className={
                key === "r6"
                  ? "flex min-w-[3.5rem] items-center gap-1"
                  : "min-w-[3.5rem]"
              }
            >
              <label
                className="flex cursor-pointer items-center gap-1 text-sm text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                title={meta?.caption}
              >
                <input
                  type="checkbox"
                  name={key}
                  className={`h-4 w-4 cursor-pointer rounded border border-gray-300 dark:border-neutral-600 ${SWATCH[meta?.color] ?? "text-blue-600"}`}
                  checked={Boolean(form[key])}
                  onChange={() => vm.toggleRestriction(key)}
                />
                <span>{code}</span>
              </label>
              {/* текст санкції 6 видно лише коли її позначено; при знятті значення не стирається */}
              {key === "r6" && form.r6 && (
                <span className="relative inline-block">
                  <input
                    type="text"
                    placeholder="текст (опційно)"
                    value={form.r6Text ?? ""}
                    onChange={(event) =>
                      vm.setField("r6Text", event.target.value)
                    }
                    className={`h-6 w-56 rounded border border-gray-200 pr-5 pl-1.5 text-xs text-gray-900 transition-colors dark:border-neutral-600 dark:text-gray-100 ${form.r6Text ? "bg-yellow-100 dark:bg-yellow-900/40" : "bg-white dark:bg-neutral-900"}`}
                  />
                  {form.r6Text && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => vm.setField("r6Text", "")}
                      className="absolute top-1/2 right-1 -translate-y-1/2 text-xs leading-none text-gray-600 hover:text-red-500"
                    >
                      &times;
                    </button>
                  )}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-start gap-2">
        <label className="w-6 shrink-0 pt-2 text-sm text-gray-700 dark:text-gray-300">
          25
        </label>
        <textarea
          name="r25"
          className={`${TEXTAREA} h-14 flex-1 border-gray-200 dark:border-neutral-600`}
          value={form.r25 ?? ""}
          onChange={(event) => vm.setField("r25", event.target.value)}
        />
      </div>
    </div>
  )
})

const Labeled = ({ title, issue, children, className = "w-1/3", htmlFor }) => (
  <div className={`${className} px-3`}>
    <label className="mb-1.5 block" htmlFor={htmlFor}>
      <span className={LABEL}>{title}</span> <FieldNote issue={issue} />
    </label>
    {children}
  </div>
)

const Selects = observer(() => {
  const vm = useVM().projectForm
  const { form, options, hints } = vm
  return (
    <>
      <div className="mb-4 flex flex-wrap">
        {vm.layout.term && (
          <Labeled title="Термін" issue={vm.fieldError("termId")}>
            <VocSelect
              name="termId"
              options={options.term}
              value={form.termId}
              issue={vm.fieldError("termId")}
              onChange={(value) => vm.setField("termId", value)}
            />
          </Labeled>
        )}
        <Labeled title="Суб'єкт подання" issue={vm.fieldError("issuerId")}>
          <VocSelect
            name="issuerId"
            options={options.issuer}
            value={form.issuerId}
            issue={vm.fieldError("issuerId")}
            onChange={(value) => vm.setField("issuerId", value)}
          />
        </Labeled>
        <Labeled
          title="Підстави"
          issue={vm.fieldError("reasons")}
          htmlFor="project-form-reasons"
        >
          <VocMulti
            id="project-form-reasons"
            options={options.reason}
            value={vm.selected("reasons", "reason")}
            issue={vm.fieldError("reasons")}
            onChange={(value) => vm.setMulti("reasons", value)}
          />
        </Labeled>
      </div>
      <div className="mb-4 flex flex-wrap">
        <Labeled
          title="Основна діяльність"
          issue={vm.fieldError("category1")}
          htmlFor="project-form-cat1"
        >
          <VocMulti
            id="project-form-cat1"
            options={options.category1}
            value={vm.selected("category1")}
            onChange={(value) => vm.setMulti("category1", value)}
          />
          <Hints
            items={hints.category1}
            onPick={(id) => vm.applyHint("category1", id)}
          />
        </Labeled>
        <Labeled
          title="Протиправна діяльність"
          issue={vm.fieldError("category2")}
          htmlFor="project-form-cat2"
        >
          <VocMulti
            id="project-form-cat2"
            options={options.category2}
            value={vm.selected("category2")}
            onChange={(value) => vm.setMulti("category2", value)}
          />
          <Hints
            items={hints.category2}
            onPick={(id) => vm.applyHint("category2", id)}
          />
        </Labeled>
        <Labeled
          title="Додаткові категорії"
          issue={vm.fieldError("category3")}
          htmlFor="project-form-cat3"
        >
          <div className="flex items-start gap-1">
            <div className="min-w-0 flex-1">
              <VocMulti
                id="project-form-cat3"
                options={options.category3}
                value={vm.selected("category3")}
                onChange={(value) => vm.setMulti("category3", value)}
              />
            </div>
            <DictionaryButton kind="category" title="Додати категорію до словника" />
          </div>
          <Hints
            items={hints.category3}
            onPick={(id) => vm.applyHint("category3", id)}
          />
        </Labeled>
      </div>
      <div className="mb-4 flex flex-wrap">
        <Labeled
          title="Пакет"
          issue={vm.fieldError("proposal")}
          className="w-1/4"
          htmlFor="project-form-proposal"
        >
          <VocMulti
            id="project-form-proposal"
            options={options.proposal}
            value={vm.selected("proposal")}
            onChange={(value) => vm.setMulti("proposal", value)}
          />
          <Hints
            items={hints.proposal}
            onPick={(id) => vm.applyHint("proposal", id)}
          />
        </Labeled>
        <Labeled
          title="Виконавець"
          issue={vm.fieldError("performerId")}
          className="w-1/4"
        >
          <VocSelect
            name="performerId"
            options={options.user}
            value={form.performerId}
            issue={vm.fieldError("performerId")}
            onChange={(value) => vm.setField("performerId", value)}
          />
          <Hints
            items={hints.performerId}
            onPick={(id) => vm.applyHint("performerId", id)}
          />
        </Labeled>
        <Labeled
          title="Валідатор"
          issue={vm.fieldError("validatorId")}
          className="w-1/4"
        >
          <VocSelect
            name="validatorId"
            options={options.user}
            value={form.validatorId}
            issue={vm.fieldError("validatorId")}
            onChange={(value) => vm.setField("validatorId", value)}
          />
          <Hints
            items={hints.validatorId}
            onPick={(id) => vm.applyHint("validatorId", id)}
          />
        </Labeled>
        <Labeled
          title="Стан"
          issue={vm.fieldError("stateId")}
          className="w-1/4"
        >
          <VocSelect
            name="stateId"
            options={options.state}
            value={form.stateId}
            issue={vm.fieldError("stateId")}
            onChange={(value) => vm.setField("stateId", value)}
            empty={false}
          />
          <Hints
            items={hints.stateId}
            onPick={(id) => vm.applyHint("stateId", id)}
          />
        </Labeled>
      </div>
      <div className="mb-4 flex flex-wrap">
        <Labeled
          title="Указ"
          issue={vm.fieldError("decreeId")}
          className="w-1/4"
          htmlFor="project-form-decree"
        >
          <VocSearchSelect
            id="project-form-decree"
            options={options.decree}
            value={form.decreeId}
            onChange={(value) => vm.setField("decreeId", value)}
          />
        </Labeled>
      </div>
    </>
  )
})

/** Права колонка: обґрунтування, обмеження, термін/суб'єкт/підстави, категорії, пакет/виконавці/стан, указ. */
const ProjectFormRight = () => {
  const vm = useVM().projectForm
  return (
    <div>
      <Reasoning />
      {/* розгорнуте обґрунтування ховає решту колонки (legacy #blockAfterReasoning) */}
      {!vm.reasoningMax && (
        <>
          {vm.layout.restrictions && <Restrictions />}
          <Selects />
        </>
      )}
    </div>
  )
}

export default observer(ProjectFormRight)
