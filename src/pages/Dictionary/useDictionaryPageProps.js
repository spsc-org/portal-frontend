import {useQuery} from "@tanstack/react-query";
import {useAuth} from "../../context/AuthContext.jsx";
import {http} from "../../lib/api.js";

// Стабільні посилання: компоненти словника тримають countries/subjectTypes у
// залежностях useEffect/useMemo — новий [] на кожен рендер дав би цикл.
const EMPTY = [];

/**
 * Заміна Inertia `usePage().props` для сторінок словника.
 *
 * `countries` / `subjectTypes` раніше віддавав PagesController::dictionaryReact()
 * як props сторінки; для SPA — той самий набір з
 * GET /api/spa/pages/dictionary/options (SpaPageOptionsController::dictionary,
 * під тим самим правом `dictionary`). Поки запит у дорозі — порожні масиви.
 */
export function useDictionaryPageProps() {
    const {user} = useAuth();
    const {data} = useQuery({
        queryKey: ["spa-page-options", "dictionary"],
        queryFn: async () => (await http.get("api/spa/pages/dictionary/options")).data?.data ?? {},
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });

    return {
        auth: {user},
        countries: data?.countries ?? EMPTY,
        subjectTypes: data?.subjectTypes ?? EMPTY,
    };
}
