import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { MyResponsibilitiesViewModel } from "../viewmodel/ResponsibleViewModels.js";
import {Chip, Spinner} from "@material-tailwind/react";

// "Мої відповідальності" — єдине, що бачить користувач БЕЗ повного доступу
// (staff-responsible.read === 'individual', не true): повний реєстр
// (Функції/Користувачі/Призначення) йому недоступний, тож "своє" не
// зводиться до фільтра там, а лишається окремим простим блоком тут.
const MyResponsibilities = () => {
    const vm = useViewModel((deps) => new MyResponsibilitiesViewModel(deps));
    const assignments = vm.assignments;
    const isLoading = vm.query.isLoading;

    return (
        <div data-i-doc="widget:staff-responsible-my"
             className="rounded-2xl border border-gray-300 bg-white p-4 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/60 dark:border-neutral-700 dark:bg-neutral-800/70 dark:shadow-black/20 dark:ring-0">
            <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-gray-100">Мої відповідальності</h3>

            {isLoading && <Spinner className="h-4 w-4"/>}

            {!isLoading && assignments.length === 0 &&
                <p className="text-xs text-gray-600 dark:text-gray-500">Ви поки ні за що не відповідаєте</p>
            }

            {!isLoading && assignments.length > 0 &&
                <div className="flex flex-wrap gap-1">
                    {assignments.map((a) => (
                        <Chip key={a.id} size="sm" value={a.function?.name || "—"} variant="ghost" color="blue"
                              className="rounded-full text-[10px] py-0.5 px-2"/>
                    ))}
                </div>
            }
        </div>
    );
};

export default observer(MyResponsibilities);
