import { useQuery } from "@tanstack/react-query";
import { fetchProjectOptions } from "./api.js";

// only — масив ключів словника (напр. ["term","proposal","restriction"]);
// однаковий набір ключів у межах сесії кешується під одним ключем запиту,
// щоб різні острівці, яким треба той самий набір словників, не дублювали запит.
export const useProjectOptionsQuery = (only, userId) =>
    useQuery({
        queryKey: ["project-options", ...only.slice().sort()],
        queryFn: () => fetchProjectOptions(only, userId),
        staleTime: Infinity,
        enabled: Boolean(userId) && only.length > 0,
    });
