import {http as axios} from "../../lib/api.js";
import {serializeParams} from "../../lib/utils.js";

export const fetchIdentifiers = async ({userId, ...filters}) => {
    const params = {
        ...filters,
        belongCountryId: filters.belongCountryId?.map(o => o.value),
        subjectTypeId: filters.subjectTypeId?.map(o => o.value),
        group: filters.group?.map(o => o.value),
    }
    const searchParams = serializeParams(params);
    const response = await axios.get(`api/dictionary/identifier`, {
        params: searchParams,
        headers: {'Content-Type': 'application/json', 'userId': userId},
    })

    return response?.data;
}

export const transformIdentifyResponse = (identifies = [], dictionary = {countries: [], subjectTypes: []}) => {
    return identifies.map(idn => {
        const mapped = {
            id: idn?.id,
            updatedAt: idn?.updatedAt,
            deletedAt: idn?.deletedAt,
            createdAt: idn?.createdAt,
            code: idn?.code,
            description_en: idn?.description_en,
            description_uk: idn?.description_uk,
            group: idn?.group,
            name_en: idn?.name_en,
            name_uk: idn?.name_uk,
            name_doc: idn?.name_doc,
            comment: idn?.comment,
            pattern: idn?.pattern,
            updatedUserId: idn?.updatedUserId,
            version: idn?.version,
            belongCountryId: dictionary?.countries?.find(c => c.id === idn?.belongCountryId),
            subjectTypeId: dictionary?.subjectTypes.find(t => t.id === idn?.subjectTypeId),
            projectsCount: idn?.projectsCount
        }
        return idn?.hasOwnProperty("isUpdated") ? {...mapped, isUpdated: idn?.isUpdated} : mapped
    })
}

export const GROUPS = [
    {
        id: 'tax', caption: 'tax'
    },
    {
        id: 'reg', caption: 'reg'
    },
    {
        id: 'doc', caption: 'doc'
    },

]


export const deleteIdentifyMutation = async ({id, userId}) => {
    const response = await axios.delete(`api/dictionary/identifier/${id}`, {
        headers: {'userId': userId},
    })
    return response?.data;
}

export const restoreIdentifyMutation = async ({id, userId}) => {
    const response = await axios.post(`api/dictionary/identifier/${id}/restore`, undefined, {
        headers: {'userId': userId},
    })
    return response?.data;
}

export const rollbackVersion = async ({versionId, identifierId, userId}) => {
    const response = await axios.post(`api/dictionary/identifier/${identifierId}/set-version?versionId=${versionId}`, undefined, {
        headers: {'userId': userId},
    })
    return response?.data;
}

// =============================================================================
// V2 API (пласка структура, без версій)
// =============================================================================

export const fetchIdentifiersV2 = async ({userId, ...filters}) => {
    const params = {
        ...filters,
        belongCountryId: filters.belongCountryId?.map(o => o.value),
        subjectTypeId: filters.subjectTypeId?.map(o => o.value),
        group: filters.group?.map(o => o.value),
    }
    const searchParams = serializeParams(params);
    const response = await axios.get(`api/dictionary/identifier-v2`, {
        params: searchParams,
        headers: {'Content-Type': 'application/json', 'userId': userId},
    })
    return response?.data;
}

export const transformIdentifyV2Response = (identifies = [], {countries = [], subjectTypes = []} = {}) => {
    return identifies.map(idn => ({
        id: idn?.id,
        updatedAt: idn?.updatedAt,
        deletedAt: idn?.deletedAt,
        createdAt: idn?.createdAt,
        code: idn?.code,
        description_en: idn?.description_en,
        description_uk: idn?.description_uk,
        group: idn?.group,
        name_en: idn?.name_en,
        name_uk: idn?.name_uk,
        name_doc: idn?.name_doc,
        comment: idn?.comment,
        pattern: idn?.pattern,
        updatedUserId: idn?.updatedUserId,
        belongCountryId: countries?.find(c => c.id === idn?.belongCountryId),
        subjectTypeId: subjectTypes?.find(t => t.id === idn?.subjectTypeId),
    }))
}

export const deleteIdentifyV2Mutation = async ({id, userId}) => {
    const response = await axios.delete(`api/dictionary/identifier-v2/${id}`, {
        headers: {'userId': userId},
    })
    return response?.data;
}

export const restoreIdentifyV2Mutation = async ({id, userId}) => {
    const response = await axios.post(`api/dictionary/identifier-v2/${id}/restore`, undefined, {
        headers: {'userId': userId},
    })
    return response?.data;
}

export const fetchVesselCallSigns = async ({userId, ...filters}) => {
    const params = {
        ...filters,
        belongCountryId: filters.belongCountryId?.map(o => o.value),
    };
    const searchParams = serializeParams(params);
    const response = await axios.get('api/dictionary/vessel-call-signs', {
        params: searchParams,
        headers: {'Content-Type': 'application/json', 'userId': userId},
    });
    return response?.data;
}
