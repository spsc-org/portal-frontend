import {keepPreviousData, useInfiniteQuery} from "@tanstack/react-query";
import {fetchOrphanProjects} from "./api.js";
import {orphanProjectKeys} from "../../shared/lib/queryKeys.js";

export const useInfiniteOrphanProjectsQuery = ({q, subjectTypeIds, stateIds, limit = 50}) =>
    useInfiniteQuery({
        queryKey: orphanProjectKeys.list({q, subjectTypeIds, stateIds, limit}),
        queryFn: ({pageParam = 0}) => fetchOrphanProjects({page: pageParam, limit, q, subjectTypeIds, stateIds}),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage?.meta && lastPage.meta.page < lastPage.meta.pages ? lastPage.meta.page : undefined,
        placeholderData: keepPreviousData,
    });
