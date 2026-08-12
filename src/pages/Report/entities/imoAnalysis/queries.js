import {useMutation} from "@tanstack/react-query";
import {fetchImoLookupChunked} from "./api.js";

export const useImoLookupMutation = () =>
    useMutation({
        mutationFn: ({imos, onProgress}) => fetchImoLookupChunked(imos, onProgress),
    });
