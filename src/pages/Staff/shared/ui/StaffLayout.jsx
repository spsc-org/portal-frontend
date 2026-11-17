import { observer } from "mobx-react-lite"
import SecondaryNavLayout from "../../../../components/SecondaryNav/SecondaryNavLayout.jsx"
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js"
import { makeViewModel } from "../../../../shared/mvvm/makeViewModel.js"
import { STAFF_NAVIGATION } from "../config/navigation.js"
import { staffOptionsQuery } from "../../model/staffCommands.js"

// Спільні довідники простору /staff підвантажуються оболонкою (той самий
// queryKey, що й у StaffAttendance — один кеш, без повторного запиту).
class StaffLayoutViewModel {
  constructor({ scope }) {
    this.scope = scope
    makeViewModel(this)
    this.optionsQuery = scope.query(staffOptionsQuery)
  }
}

const StaffLayout = ({ active, children, "data-i-doc": dataIDoc }) => {
  useViewModel((deps) => new StaffLayoutViewModel(deps))

  return (
    <SecondaryNavLayout
      data-i-doc={dataIDoc}
      title="Персонал"
      items={STAFF_NAVIGATION}
      active={active}
    >
      {children}
    </SecondaryNavLayout>
  )
}

export default observer(StaffLayout)
