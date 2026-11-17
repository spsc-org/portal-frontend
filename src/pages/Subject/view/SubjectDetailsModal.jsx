import { observer } from "mobx-react-lite";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Typography } from "@material-tailwind/react";

/** Пов'язані проєкти суб'єкта (поки — сирий JSON, як і в Inertia-версії). */
const SubjectDetailsModal = ({ vm }) => (
    <Dialog open={vm.detailsId != null} handler={vm.closeDetails} size="xl">
        <DialogHeader>
            <Typography variant="h5" className="dark:text-slate-200">Пов'язані проєкти</Typography>
        </DialogHeader>
        <DialogBody className="h-[32rem] relative overflow-y-auto">
            {vm.detailsQuery.isLoading && (
                <div className="bg-gray-950/20 absolute top-0 left-0 w-full h-full z-[999] flex justify-center items-center">
                    <Spinner className="h-12 w-12"/>
                </div>
            )}
            {vm.detailsQuery.data && JSON.stringify(vm.linkedProjects, null, 2)}
        </DialogBody>
        <DialogFooter>
            <Button variant="text" color="red" onClick={vm.closeDetails} className="mr-1">
                <span>Закрити</span>
            </Button>
        </DialogFooter>
    </Dialog>
);

export default observer(SubjectDetailsModal);
