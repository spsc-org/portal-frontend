import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { BasketDialogViewModel } from "../viewmodel/AdvancedSearchViewModel.js";
import { Spinner } from "@material-tailwind/react"
import IconButton from "../../../components/Buttons/IconButton.jsx"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import CloseButton from "../../../components/Buttons/CloseButton.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import {useBasket} from "../context/BasketContext.jsx";
import { twMerge } from "tailwind-merge";
import { TABLE, TD, TH, TR } from "../../../components/Table/tableStyles.js";

const BasketDialog = ({open, onClose, renderCell}) => {
    const basket = useBasket();
    const vm = useViewModel((deps) => new BasketDialogViewModel({ ...deps, basket }));
    const { items, toggleItem, clearBasket } = basket;
    const { isLoading, isExporting, displayItems } = vm;
    const handleExport = vm.export;

    if (!open) return null;

    return (
        <Modal open={open} handler={onClose} size="xl">
            <ModalHeader hideClose className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-2">
                    <i className="fa-solid fa-star text-amber-500"></i>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        Вибрані записи
                    </h4>
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-full">
                        {items.length}
                    </span>
                </div>
                <div className="flex gap-2">
                    {items.length > 0 && (
                        <>
                            <Button
                                size="sm"
                                color="green"
                                variant="filled"
                                className="flex items-center gap-2"
                                onClick={handleExport}
                                disabled={isExporting}>
                                {isExporting ? (
                                    <Spinner className="h-4 w-4" />
                                ) : (
                                    <i className="fa-solid fa-file-excel"></i>
                                )}
                                Експорт Excel
                            </Button>

                            <Button
                                size="sm"
                                color="red"
                                variant="text"
                                className="flex items-center gap-2"
                                onClick={clearBasket}>
                                <i className="fa-regular fa-trash-can"></i>
                                Очистити кошик
                            </Button>
                        </>
                    )}
                    <CloseButton onClick={onClose} />
                </div>
            </ModalHeader>

            <ModalBody className="h-[40rem] overflow-y-auto p-0">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-400 gap-4">
                        <i className="fa-regular fa-star text-4xl text-gray-300 dark:text-gray-600"></i>
                        <p className="text-sm text-gray-700 dark:text-gray-300">Список порожній</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Spinner className="h-12 w-12" />
                    </div>
                ) : (
                    <table className={twMerge(TABLE, "w-full min-w-max table-auto text-left")}>
                        <thead>
                            <tr className="sticky top-0 z-10">
                                <th className={twMerge(TH, "w-12")}>№</th>
                                <th className={twMerge(TH, "w-20")}>ID</th>
                                <th className={twMerge(TH, "w-64")}>Назва</th>
                                <th className={twMerge(TH, "w-48")}>Ідентифікатори</th>
                                <th className={twMerge(TH, "w-48")}>Указ</th>
                                <th className={TH}>Інше</th>
                                <th className={twMerge(TH, "w-32")}>Додано</th>
                                <th className={twMerge(TH, "text-right w-16")}>Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayItems.map((item, index) => (
                                <tr key={`${item.datasetId}-${item.id}`} className={twMerge(TR, "align-top")}>
                                    <td className={TD}>{index + 1}</td>
                                    <td className={twMerge(TD, "font-mono")}>
                                        <div>{item.id}</div>
                                        <div className="text-[10px] text-gray-600 dark:text-gray-500 mt-1">DS #{item.datasetId}</div>
                                    </td>

                                    {/* Використовуємо renderCell для консистентного відображення, вимикаємо хайлайтінг */}
                                    <td className={TD}>
                                        {renderCell ? renderCell('captions', { original: item }, item.captions, { search: '' }) : item.captions}
                                    </td>
                                    <td className={TD}>
                                        {renderCell ? renderCell('identifiers', { original: item }, item.identifiers, { search: '' }) : item.identifiers}
                                    </td>
                                    <td className={TD}>
                                        {renderCell ? renderCell('decree', { original: item }, item.decree, { search: '' }) : item.decree}
                                    </td>
                                    <td className={TD}>
                                        {renderCell ? renderCell('other', { original: item }, item.other, { search: '' }) : item.other}
                                    </td>

                                    <td className={twMerge(TD, "whitespace-nowrap")}>
                                        {item.addedAt ? new Date(item.addedAt).toLocaleString() : '-'}
                                    </td>
                                    <td className={twMerge(TD, "text-right")}>
                                        <IconButton
                                            size="sm"
                                            color="red"
                                            variant="text"
                                            onClick={() => toggleItem({ datasetId: item.datasetId, id: item.id })}
                                            title="Видалити"
                                        >
                                            <i className="fa-solid fa-trash-can"></i>
                                        </IconButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </ModalBody>

            <ModalFooter className="border-t pt-2">
                <Button color="secondary" onClick={onClose}>
                    Закрити
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(BasketDialog);
