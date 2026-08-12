import EditLayout from "../layouts/EditLayout.jsx";
import React from "react";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {usePage} from "@inertiajs/react";
import {DictionaryProvider} from "../../Dictionary/DictionaryContext.jsx";
import Page from "../../../Components/Page.jsx";


const Edit = () => {
    const {id, auth} = usePage().props;

    const {data: vocabulary} = useQuery({
        queryKey: ['vocabulary', id],
        queryFn: async () => {
            const response = await axios.get(`/api/voc_project`, {
                headers: {"userId": auth?.user?.id}
            });
            return response.data;
        },
        placeholderData: keepPreviousData,
    });

    const {data = {data: null}, isFetching,} = useQuery({
        queryKey: ['project-edit', id],
        queryFn: async () => {
            const response = await axios.get(`/api/project/new/${id}`, {
                method: "get",
                headers: {"userId": auth?.user?.id}
            });
            return response.data;
        },
        placeholderData: keepPreviousData,
    });

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:project-edit" className="p-4">
                    <EditLayout project={data?.data} vocabulary={vocabulary}/>
                </div>
            </Page>
        </DictionaryProvider>
    );
};

export default Edit;
