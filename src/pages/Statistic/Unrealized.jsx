import { useParams } from "react-router";
import { useViewModel } from "../../shared/mvvm/index.js";
import { UnrealizedViewModel } from "./viewmodel/StatisticViewModels.js";
import UnrealizedView from "./view/UnrealizedView.jsx";

function UnrealizedContent({ year, type }) {
    const vm = useViewModel((deps) => new UnrealizedViewModel({ ...deps, year, type }));
    return <UnrealizedView vm={vm} />;
}

/** Маршрут /statistic/unrealized/:year/:type — VM перестворюється при зміні параметрів (key). */
export default function UnrealizedPage() {
    const { year, type } = useParams();
    return <UnrealizedContent key={`${year}-${type}`} year={year} type={type} />;
}
