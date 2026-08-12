import {Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Typography} from "@material-tailwind/react";
import React from "react";
import {useQuery} from "@tanstack/react-query";
import LoadingButton from "../../Components/Buttons/LoadingButton.jsx";
import {usePage} from "@inertiajs/react";

const SubjectDetailsModal = ({open = false, selectedId: id, onClose}) => {

    const {auth} = usePage().props

    const {data, isLoading} = useQuery({
        queryKey: ['subject', id],
        queryFn: async () => {
            const response = await axios.get(`/api/subject/${id}`, {
                headers: {"userId": auth?.user?.id}
            });
            return response.data;
        },
        enabled: open
    })


    return (
        <Dialog open={open} handler={onClose} size="xl">
            <DialogHeader>
                <Typography variant="h5" className="dark:text-slate-200">
                    Пов'язані проєкти
                </Typography>
            </DialogHeader>
            <DialogBody  className="h-[32rem] relative overflow-y-auto">
                {
                    isLoading && <div
                        className="bg-gray-950/20 absolute top-0 left-0 w-full h-full z-[999] flex justify-center items-center">
                        <Spinner className="h-12 w-12"/>
                    </div>
                }

                {
                    data && JSON.stringify(data?.linkedProjects, {}, 2)
                }


            </DialogBody>
            <DialogFooter>
                <Button
                    variant="text"
                    color="red"
                    onClick={onClose}
                    className="mr-1"
                >
                    <span>Закрити</span>
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default SubjectDetailsModal;
