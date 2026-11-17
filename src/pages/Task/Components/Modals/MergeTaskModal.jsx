import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { MergeTaskViewModel } from "../../viewmodel/TaskViewModels.js";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader} from "@material-tailwind/react";

// Злиття з іншою задачею: пошук донора за ID (не за назвою — свідомий
// вибір, щоб не плутати однойменні задачі). Ця задача (baseId) — базова
// (виживає), знайдена за ID — донор (видаляється, вміст переноситься
// сюди). Винесено з TaskViewPanel.jsx — самодостатня модалка,
// монтується лише поки відкрита (див. виклик у TaskViewPanel).
const MergeTaskModal = ({onClose, baseId}) => {
    const vm = useViewModel((deps) => new MergeTaskViewModel({ ...deps, baseId }));
    const mergeDonorId = vm.donorInput;
    const setMergeDonorId = vm.setDonorInput;
    const isValidMergeDonorId = vm.isValidDonor;
    const isSelfMergeAttempt = vm.isSelfMergeAttempt;
    const mergeDonorTask = vm.donorTask;
    const isMergeDonorLoading = vm.isDonorLoading;
    const isMergeDonorNotFound = vm.isDonorNotFound;
    const mergeMutation = vm.mergeCmd;
    const confirmMerge = () => vm.confirm(onClose);

    return (
        <Dialog data-i-doc="modal:task-view-panel-merge-task" open handler={onClose} size="sm">
            <DialogHeader className="text-base dark:text-slate-100">
                Злити з іншою задачею
            </DialogHeader>
            <DialogBody className="max-h-[60vh] overflow-y-auto pt-0">
                <input
                    autoFocus
                    type="number"
                    min="1"
                    value={mergeDonorId}
                    onChange={(e) => setMergeDonorId(e.target.value)}
                    placeholder="ID задачі-донора…"
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                {isSelfMergeAttempt &&
                    <p className="mt-2 text-xs text-red-500">Не можна злити задачу саму із собою</p>
                }
                {isValidMergeDonorId && isMergeDonorLoading &&
                    <p className="mt-2 text-xs text-slate-400">Пошук…</p>
                }
                {isValidMergeDonorId && !isMergeDonorLoading && isMergeDonorNotFound &&
                    <p className="mt-2 text-xs text-red-500">Задачу не знайдено</p>
                }
                {mergeDonorTask &&
                    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50/60 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800/40">
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-slate-400">#{mergeDonorTask.id}</span>
                            <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                                {mergeDonorTask.title}
                            </span>
                        </div>
                        <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                            Задачу #{mergeDonorTask.id} буде видалено; теги, учасники, проєкти,
                            обговорення, вкладення й опис перенесуться в цю задачу.
                        </p>
                    </div>
                }
            </DialogBody>
            <DialogFooter className="gap-2">
                <Button variant="text" color="blue-gray" onClick={onClose}>Скасувати</Button>
                <Button color="green" disabled={!mergeDonorTask || mergeMutation.isPending}
                        onClick={confirmMerge}>
                    {mergeMutation.isPending ? 'Зливаю…' : 'Злити'}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default observer(MergeTaskModal);
