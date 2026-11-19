import {useQuery} from "@tanstack/react-query";
import {fetchMassSearchOptions} from "./api.js";

export const useMassSearchOptionsQuery = () =>
    useQuery({
        queryKey: ["mass-search-options"],
        queryFn: fetchMassSearchOptions,
        staleTime: Infinity,
    });
