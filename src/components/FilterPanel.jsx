import { twMerge } from "tailwind-merge"
import { FILTER_PANEL_CLASS, FILTER_PANEL_STICKY_CLASS } from "./filterPanelStyles.js"

/** Обгортка панелі фільтрів сторінки — та сама картка, що й на /project. */
const FilterPanel = ({ sticky = false, className, children, ...props }) => (
    <div className={twMerge(sticky ? FILTER_PANEL_STICKY_CLASS : FILTER_PANEL_CLASS, className)} {...props}>
        {children}
    </div>
)

export default FilterPanel
