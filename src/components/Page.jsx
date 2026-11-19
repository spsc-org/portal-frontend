import React, {Fragment, useEffect} from 'react';
import {useQuery} from "@tanstack/react-query";
import {useDictionaryContext} from "../pages/Dictionary/DictionaryContext.jsx";
import {http as axios} from "../lib/api.js";
import BackToTop from "./BackToTop.jsx";

const Page = ({children}) => {
    const {state = {}, setDictionary} = useDictionaryContext();
    const {data: dictionary} = useQuery({
        queryKey: ['dictionary'],
        queryFn: async () => {
            const response = await axios.get(`api/voc_user`);
            return response?.data
        },
        refetchOnWindowFocus: false,
        retry: false,
    })
    useEffect(() => {
        if (dictionary) {
            setDictionary(dictionary);
        }
    }, [dictionary]);



    return (
        <Fragment>
            {children}
            <BackToTop/>
        </Fragment>
    );
};

export default Page;
