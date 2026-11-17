import { useViewModel } from "../../shared/mvvm/index.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import { StatisticFormViewModel } from "./viewmodel/StatisticViewModels.js";
import StatisticFormView from "./view/StatisticFormView.jsx";

/** Маршрут /statistic (pageAccess + Gate statistic.read). */
export default function StatisticPage() {
    const vm = useViewModel((deps) => new StatisticFormViewModel(deps));
    usePageTitle("Статистика");
    return <StatisticFormView vm={vm} />;
}
