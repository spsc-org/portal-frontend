import {keepPreviousData, useInfiniteQuery, useQuery} from "@tanstack/react-query";
import {fetchDossierOptions, fetchProfile, fetchProfiles} from "./api.js";
import {sanctionProfileKeys} from "../../shared/lib/queryKeys.js";

export const useProfileQuery = (profileId) =>
    useQuery({
        queryKey: sanctionProfileKeys.detail(profileId),
        queryFn: () => fetchProfile(profileId),
        enabled: Boolean(profileId),
    });

// Словники сторінки з GET /api/dossier/options (заміна Inertia-пропсів) —
// стабільні в межах сесії, як useTaskOptions у модулі задач.
export const useDossierOptionsQuery = () =>
    useQuery({
        queryKey: sanctionProfileKeys.options(),
        queryFn: fetchDossierOptions,
        staleTime: Infinity,
    });

// Майстер-список зі скролом і докачуванням сторінок (без класичної пагінації — за макетом).
// Усі фільтри застосовуються сервером в обох гілках (paginate і search — search раніше
// їх ігнорував, виправлено разом із додаванням нових фільтрів).
export const useInfiniteProfilesQuery = ({
    q, subjectTypeIds, modelClassIds, needsReview, conflictOnly, uaSanctionsStatuses, uaSanctionsDaysRemainingMax,
    hasAvatar, connectionsCountMin, connectionsCountMax, matchedPasses, origins, ticketStatus, sort, direction, limit = 50,
}) =>
    useInfiniteQuery({
        queryKey: sanctionProfileKeys.list({
            q, subjectTypeIds, modelClassIds, needsReview, conflictOnly, uaSanctionsStatuses, uaSanctionsDaysRemainingMax,
            hasAvatar, connectionsCountMin, connectionsCountMax, matchedPasses, origins, ticketStatus, sort, direction, limit,
        }),
        queryFn: ({pageParam = 0}) => fetchProfiles({
            page: pageParam, limit, q, subjectTypeIds, modelClassIds, needsReview, conflictOnly, uaSanctionsStatuses,
            uaSanctionsDaysRemainingMax, hasAvatar, connectionsCountMin, connectionsCountMax, matchedPasses, origins, ticketStatus, sort, direction,
        }),
        initialPageParam: 0,
        // meta.page — 1-indexed поточна сторінка; наступний 0-indexed pageParam дорівнює їй.
        getNextPageParam: (lastPage) =>
            lastPage?.meta && lastPage.meta.page < lastPage.meta.pages ? lastPage.meta.page : undefined,
        placeholderData: keepPreviousData,
    });
