import StaffLayout from "./shared/ui/StaffLayout.jsx"
import ComingSoonPlaceholder from "../../components/SecondaryNav/ComingSoonPlaceholder.jsx"
import { usePageTitle } from "../../shared/hooks/usePageTitle.js"

const ContractsPage = () => {
  usePageTitle("Контракти")
  return (
  <StaffLayout data-i-doc="page:staff-contracts" active="contracts">
    <ComingSoonPlaceholder
      icon="fa-solid fa-file-contract"
      title="Контракти"
      description="Тут будуть записи про контракти працівників: строки дії, умови, історія продовжень."
    />
  </StaffLayout>
  )
}

export default ContractsPage
