import { observer } from "mobx-react-lite"
import StaffLayout from "./shared/ui/StaffLayout.jsx"
import { useViewModel } from "../../shared/mvvm/useViewModel.js"
import { ViewModelProvider } from "../../shared/mvvm/ViewModelContext.jsx"
import { usePageTitle } from "../../shared/hooks/usePageTitle.js"
import { ResponsibleRegistryViewModel } from "./viewmodel/ResponsibleViewModels.js"
import MyResponsibilities from "./view/MyResponsibilities.jsx"
import ResponsibleFunctionsTable from "./view/ResponsibleFunctionsTable.jsx"
import ResponsibleAssignmentsTable from "./view/ResponsibleAssignmentsTable.jsx"
import UsersReportModal from "./view/UsersReportModal.jsx"

// Дві рівні колонки — Функції (master) зліва, Призначення (detail) справа.
// "Користувачі" — звіт-на-вимогу (кнопка → UsersReportModal).
const FullRegistry = observer(({ vm }) => (
  <div className="mt-4">
    {vm.canReport && (
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={vm.openReport}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
        >
          <i className="fa-regular fa-chart-simple"></i>
          Звіт по користувачах
        </button>
      </div>
    )}

    <div className="flex items-start gap-4">
      <div className="w-1/2 shrink-0">
        <h2 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
          Функції
        </h2>
        <ResponsibleFunctionsTable
          vm={vm.functionsTable}
          isLoading={vm.functionsQuery.isLoading}
        />
      </div>

      <div className="w-1/2 shrink-0">
        <h2 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
          Призначення
        </h2>
        <ResponsibleAssignmentsTable vm={vm.assignmentsTable} auth={vm.auth} />
      </div>
    </div>

    {vm.canReport && (
      <UsersReportModal
        open={vm.reportOpen}
        onClose={vm.closeReport}
        users={vm.users}
        assignmentsQuery={vm.assignmentsTable.query}
      />
    )}
  </div>
))

const ResponsiblePage = () => {
  const vm = useViewModel((deps) => new ResponsibleRegistryViewModel(deps))
  usePageTitle("Відповідальні")

  return (
    <ViewModelProvider value={vm}>
      <StaffLayout data-i-doc="page:staff-responsible" active="responsible">
        {vm.hasFullAccess ? <FullRegistry vm={vm} /> : <MyResponsibilities />}
      </StaffLayout>
    </ViewModelProvider>
  )
}

export default observer(ResponsiblePage)
