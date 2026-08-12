import {useQuery} from "@tanstack/react-query";

export const useDictionary = (endpoint) => {
    return useQuery({
        queryKey: ['dictionary', endpoint],
        queryFn: async () => {
            const response = await axios.get(`api/${endpoint}`);
            const data = response.data;
            const {location, ...rest} = data;
            return {location: Object.values(location), ...rest}
        },
    })
}
