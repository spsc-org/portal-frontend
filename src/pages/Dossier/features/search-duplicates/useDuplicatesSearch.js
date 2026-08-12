import {useMutation} from "@tanstack/react-query";
import {findDuplicates} from "../../entities/dossier/api.js";

export const useDuplicatesSearch = () =>
    useMutation({
        mutationFn: ({modelClass, modelId}) => findDuplicates({modelClass, modelId}),
    });