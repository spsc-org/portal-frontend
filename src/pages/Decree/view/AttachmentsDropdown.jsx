import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { FileDownloadViewModel } from "../../../entities/file/FileDownloadViewModel.js";
import { DecreeFilesViewModel } from "../viewmodel/DecreeViewModels.js";
import { Popover, PopoverContent, PopoverHandler, Spinner } from "@material-tailwind/react"
import Button from "../../../components/Buttons/Button.jsx"
/** Файли указу в рядку таблиці: запит лише після відкриття поповера. */
const AttachmentsDropdown = ({id, count = 0}) => {
    const vm = useViewModel((deps) => new DecreeFilesViewModel({ ...deps, decreeId: id, lazy: true }));
    const downloads = useViewModel((deps) => new FileDownloadViewModel(deps));
    const openMenu = vm.open;
    const setOpenMenu = vm.setOpen;
    const decreePending = vm.isPending;
    const decreeFile = vm.decreeFile;
    const files = vm.attachmentFiles;
    const isDownloading = (fileId) => downloads.isPending(fileId);
    const handleDownload = (path, fileId) => {
        if (path) downloads.download({ id: fileId, fileUrl: path });
    };

    return (
        <Popover open={openMenu} placement="bottom-end" handler={setOpenMenu}>
            <PopoverHandler>
                <Button
                    disabled={count === 0}
                    size="sm"
                    variant="filled"
                    className="flex items-center gap-1 capitalize tracking-normal p-2">
                    {count} {" "}
                    <i className={`fa-regular text-xs fa-chevron-down transition-transform ${openMenu ? "rotate-180" : ""}`}></i>
                </Button>
            </PopoverHandler>
            <PopoverContent className="p-2 w-90 min-h-[8rem]">
                <div className="w-full flex flex-col gap-2">
                    {
                        decreePending ?
                            <Spinner className="h-12 w-12"/>
                            :
                            <div className="flex flex-col justify-center w-full">
                                <span className="text-sm font-medium">Указ:</span>
                                {
                                    decreeFile ?
                                        <div className="flex items-center gap-2">
                                        <span color="blue-gray" className="text-xs flex-1">
                                            {decreeFile?.name}
                                        </span>
                                            <Button size="sm" disabled={isDownloading(decreeFile?.id)}
                                                    onClick={() => handleDownload(decreeFile?.path, decreeFile?.id)}>
                                                {isDownloading(decreeFile?.id) ?
                                                    <Spinner className="h-4 w-4"/>
                                                    :
                                                    <i className="fa-regular fa-download"></i>
                                                }
                                            </Button>
                                        </div>
                                        : <span className="text-xs text-center">Файл відсутній</span>

                                }

                                <span className="text-sm font-medium">Додатки:</span>
                                {files.length ? files.map(({name, path, id}) => (
                                        <div key={id} className="flex items-center gap-2 mb-1">
                            <span color="blue-gray" className="text-xs flex-1">
                                {name}
                            </span>
                                            <Button size="sm" disabled={isDownloading(id)}
                                                    onClick={() => handleDownload(path, id)}>
                                                {isDownloading(id) ?
                                                    <Spinner className="h-4 w-4"/>
                                                    :
                                                    <i className="fa-regular fa-download"></i>
                                                }
                                            </Button>
                                        </div>
                                    ))
                                    : <span className="text-xs text-center">Додатки відсутні</span>
                                }
                            </div>
                    }

                </div>
            </PopoverContent>
        </Popover>
    );
};

export default observer(AttachmentsDropdown);
