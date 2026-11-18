import { observer } from "mobx-react-lite"
import { useVM } from "../../../shared/mvvm/index.js"
import { fieldLabelForPath } from "../shared/lib/projectSnapshot.js"
import ProjectFormLeft from "./projectForm/ProjectFormLeft.jsx"
import ProjectFormRight from "./projectForm/ProjectFormRight.jsx"
import ProjectFormBottom from "./projectForm/ProjectFormBottom.jsx"
import { avatarInitials } from "../../../lib/avatarInitials.js"

const formatTime = (value) => {
  const date = new Date(String(value ?? "").replace(" ", "T"))
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
}

/** Хто ще зараз редагує цей проєкт (presence editing_project_id) — суто інформаційно. */
const CoEditors = observer(() => {
  const vm = useVM().projectForm
  if (vm.coEditors.length === 0) return null
  return (
    <div
      className="flex shrink-0 items-center gap-1.5"
      data-i-doc="component:project-v2-co-editors"
    >
      {vm.coEditors.map((user) => {
        const since = user.editing_started_at
          ? formatTime(user.editing_started_at)
          : ""
        return (
          <div
            key={user.id}
            title={`Також редагує: ${user.name}${since ? ` (з ${since})` : ""}`}
            className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 py-1 pr-2 pl-1 dark:border-amber-700 dark:bg-amber-900/30"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-200 text-[10px] font-semibold text-amber-800 dark:bg-amber-800 dark:text-amber-100">
              {avatarInitials(user.initials, user.name)}
            </span>
            <span className="text-xs whitespace-nowrap text-amber-800 dark:text-amber-200">
              {user.name}
              {since ? ` · з ${since}` : ""}
            </span>
          </div>
        )
      })}
    </div>
  )
})

const UnsavedIndicator = observer(() => {
  const vm = useVM().projectForm
  if (!vm.dirty) return null
  return (
    <div
      className="flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400"
      data-testid="project-form-unsaved"
    >
      <div className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-amber-400" />
        <span>Є незбережені дані</span>
      </div>
      {vm.isEdit && (
        <button
          type="button"
          onClick={vm.revertToLatest}
          className="rounded border border-amber-400 px-2 py-1 text-xs whitespace-nowrap hover:bg-amber-100 dark:border-amber-600 dark:hover:bg-amber-900/40"
        >
          <i className="fa-solid fa-rotate-left mr-1" />
          Повернутись на актуальну версію
        </button>
      )}
    </div>
  )
})

const DraftOffer = observer(() => {
  const vm = useVM().projectForm
  if (!vm.draftOffer) return null
  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
      <span>
        <i className="fa-solid fa-clock-rotate-left mr-1" />У вас є незбережені
        зміни від {new Date(vm.draftOffer.updatedAt).toLocaleString("uk-UA")}.
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={vm.restoreDraft}
          className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-500"
        >
          Відновити
        </button>
        <button
          type="button"
          onClick={vm.discardDraft}
          className="rounded border border-amber-400 px-2 py-1 text-xs font-medium hover:bg-amber-100 dark:border-amber-600 dark:hover:bg-amber-900/40"
        >
          Відхилити
        </button>
      </div>
    </div>
  )
})

/** Злиття після 409: інформаційне повідомлення або список конфліктів з вибором варіанта. */
const MergeBanner = observer(() => {
  const vm = useVM().projectForm
  const { notice, conflicts } = vm
  if (!notice && conflicts.length === 0) return null
  return (
    <div
      className="mb-3 overflow-hidden rounded-lg border border-orange-300 bg-orange-50 text-sm text-orange-900 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
      data-i-doc="component:project-v2-conflict-banner"
    >
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        {conflicts.length > 0 ? (
          <span>
            <i className="fa-solid fa-triangle-exclamation mr-1" />
            {conflicts.length} конфлікт(ів) потребує вашого рішення — збереження
            недоступне, поки не вирішено всі.
          </span>
        ) : (
          <span>
            <i className="fa-solid fa-circle-info mr-1" />
            {notice.message}
          </span>
        )}
        {conflicts.length === 0 && (
          <button
            type="button"
            onClick={vm.dismissNotice}
            className="text-xs text-orange-700 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-200"
          >
            ✕
          </button>
        )}
      </div>
      <ul className="divide-y divide-orange-200 dark:divide-orange-800">
        {conflicts.length === 0 && notice.labels.length > 0 && (
          <li className="px-3 py-2">
            <div className="mb-1 text-[10px] font-semibold tracking-wide text-orange-500 uppercase dark:text-orange-400">
              Змінені поля
            </div>
            <div className="flex flex-wrap gap-1.5">
              {notice.labels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800 dark:bg-orange-900/40 dark:text-orange-200"
                >
                  {label}
                </span>
              ))}
            </div>
          </li>
        )}
        {conflicts.map((conflict, index) => (
          <li key={conflict.path} className="px-3 py-2">
            <div className="mb-1 text-xs font-semibold">
              {fieldLabelForPath(conflict.path)}
            </div>
            <div className="divide-y divide-orange-200/70 dark:divide-orange-800/70">
              {[
                ["theirs", vm.theirsLabel, conflict.theirs, true],
                ["mine", "Ваш варіант", conflict.mine, false],
              ].map(([choice, owner, value, current]) => {
                const text = vm.formatConflictValue(conflict.path, value)
                return (
                  <div
                    key={choice}
                    className={`flex items-center justify-between gap-3 py-1 ${current ? "-mx-2 rounded bg-orange-100/60 px-2 dark:bg-orange-900/30" : ""}`}
                  >
                    <div className="min-w-0 text-xs">
                      <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-orange-500 uppercase dark:text-orange-400">
                        {owner}
                        {current && (
                          <span className="font-normal text-orange-600 normal-case dark:text-orange-300">
                            · зараз у формі
                          </span>
                        )}
                      </div>
                      <div className="font-mono break-words">
                        {text ?? <em>(видалено)</em>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => vm.resolveConflict(index, choice)}
                      className={`shrink-0 rounded border px-2.5 py-1 text-xs whitespace-nowrap transition-colors ${
                        current
                          ? "border-orange-400 bg-orange-200 text-orange-900 dark:border-orange-500 dark:bg-orange-800/60 dark:text-orange-100"
                          : "border-gray-300 hover:border-orange-400 hover:bg-orange-100 dark:border-gray-600 dark:hover:bg-orange-900/40"
                      }`}
                    >
                      {current ? "✓ Обрано" : "Обрати цей варіант"}
                    </button>
                  </div>
                )
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
})

const Footer = observer(() => {
  const vm = useVM().projectForm
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex items-center justify-between gap-4 border-t border-gray-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
        {vm.saving && (
          <i className="fa-solid fa-spinner fa-spin text-gray-500" />
        )}
        <div
          className="flex flex-col text-sm text-red-600 dark:text-red-400"
          data-testid="project-form-errors"
        >
          {vm.errors.general.map((message) => (
            <span key={message}>{message}</span>
          ))}
        </div>
        {vm.showIgnore && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              className="h-4 w-4 accent-blue-600 dark:[color-scheme:dark]"
              checked={vm.force}
              onChange={(event) => vm.setForce(event.target.checked)}
            />
            <span>⚠️ Ігнорувати попередження та помилки</span>
          </label>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <UnsavedIndicator />
        <button
          type="submit"
          disabled={!vm.canSubmit}
          data-testid="project-form-submit"
          className="w-36 cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          ОК
        </button>
      </div>
    </div>
  )
})

/** "N збігів" у шапці форми — зведена таблиця консолідованого пошуку (legacy #btnAllConsolidatedResults). */
const ConsolidatedAllButton = observer(() => {
    const search = useVM().projectForm.consolidated;
    if (search.total === 0) return null;
    return (
        <button
            type="button"
            onClick={search.openAll}
            title="Всі збіги в консолідованій базі"
            data-testid="consolidated-all"
            className="col-start-2 inline-flex items-center gap-1 rounded border border-violet-500 bg-violet-600 px-2 py-1 text-xs text-white shadow-lg shadow-violet-500/30 ring-2 ring-violet-300 transition-all hover:scale-[1.03] hover:bg-violet-700 active:scale-[0.98] dark:border-violet-400 dark:bg-violet-500 dark:ring-violet-700 dark:hover:bg-violet-400"
        >
            <i className="fa-solid fa-layer-group" />
            <span className="mx-0.5 font-semibold">{search.total}</span> збігів
        </button>
    );
});

/** Модалка створення/редагування проєкту (порт #modalProjectV2). Стан — ProjectFormViewModel. */
const ProjectFormModal = () => {
  const vm = useVM().projectForm
  if (!vm.isOpen) return null
  const { caption } = vm
  return (
    <div
      className="fixed inset-0 z-[1055] bg-gray-900/50 p-3 dark:bg-black/70"
      data-testid="project-create-modal"
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-700 shadow-xl dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300">
        <div
          className={`relative grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b px-4 py-3 transition-colors duration-300 ${
            vm.consolidated.total > 0
              ? "border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30"
              : "border-gray-200 dark:border-neutral-700"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <h3 className="min-w-0 truncate text-base font-bold text-gray-800 uppercase dark:text-gray-300">
              {caption.prefix}{" "}
              {caption.action && <i className={caption.action.icon} />}{" "}
              {caption.action?.caption}
              {vm.isEdit && (
                <span className="ml-2 font-normal text-gray-600 normal-case">
                  #{vm.projectId}
                </span>
              )}
            </h3>
            <CoEditors />
            {vm.isEdit && (
              <button
                type="button"
                onClick={() => vm.runAnalysis()}
                title="Запустити живий аналіз усіх полів"
                data-testid="project-form-live-analysis"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-400 dark:hover:border-blue-400 dark:hover:text-blue-300"
              >
                <i className="fa-solid fa-microscope" /> Живий аналіз
              </button>
            )}
          </div>
          <ConsolidatedAllButton />
          <button
            type="button"
            onClick={vm.close}
            aria-label="Закрити"
            className="col-start-3 flex h-8 w-8 items-center justify-center justify-self-end rounded-full bg-gray-200 text-gray-700 transition-colors hover:bg-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none dark:bg-black dark:text-gray-300 dark:hover:bg-neutral-700"
          >
            <i className="fa-solid fa-xmark pointer-events-none" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {vm.loading || !vm.form ? (
            <div className="flex h-full items-center justify-center text-gray-600">
              <i className="fa-solid fa-spinner fa-spin mr-2" />
              Завантаження проєкту…
            </div>
          ) : (
            <form
              className="px-4 pt-4"
              onSubmit={vm.submit}
              autoComplete="off"
              // втрата фокусу поля, що аналізується (name або рядок ідентифікатора) → аналіз цього поля
              onBlur={(event) =>
                vm.scheduleAnalysis(
                  event.target.closest("[data-analysis-field]")?.dataset
                    .analysisField ?? event.target.name
                )
              }
            >
              <DraftOffer />
              <MergeBanner />
              <div className="grid grid-cols-1 items-start gap-x-8 lg:grid-cols-2">
                <ProjectFormLeft />
                <ProjectFormRight />
              </div>
              <ProjectFormBottom />
              <Footer />
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default observer(ProjectFormModal)
