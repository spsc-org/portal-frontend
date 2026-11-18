import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { BasketDialogViewModel } from "../viewmodel/AdvancedSearchViewModel.js";
import { Typography, Spinner } from "@material-tailwind/react"
import IconButton from "../../../components/Buttons/IconButton.jsx"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import CloseButton from "../../../components/Buttons/CloseButton.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import {useBasket} from "../context/BasketContext.jsx";

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
                    <Typography variant="h5" color="blue-gray" className="dark:text-gray-200">
                        Вибрані записи
                    </Typography>
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
                        <Typography>Список порожній</Typography>
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Spinner className="h-12 w-12" />
                    </div>
                ) : (
                    <table className="w-full min-w-max table-auto text-left">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 sticky top-0 z-10">
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase bg-gray-50 dark:bg-neutral-800 w-12">№</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase bg-gray-50 dark:bg-neutral-800 w-20">ID</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase bg-gray-50 dark:bg-neutral-800 w-64">Назва</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase bg-gray-50 dark:bg-neutral-800 w-48">Ідентифікатори</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase bg-gray-50 dark:bg-neutral-800 w-48">Указ</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase bg-gray-50 dark:bg-neutral-800">Інше</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase bg-gray-50 dark:bg-neutral-800 w-32">Додано</th>
                                <th className="p-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-right bg-gray-50 dark:bg-neutral-800 w-16">Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayItems.map((item, index) => (
                                <tr key={`${item.datasetId}-${item.id}`} className="border-b border-gray-100 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600/50 align-top">
                                    <td className="p-4 text-xs text-gray-600 dark:text-gray-400">{index + 1}</td>
                                    <td className="p-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                                        <div>{item.id}</div>
                                        <div className="text-[10px] text-gray-600 dark:text-gray-500 mt-1">DS #{item.datasetId}</div>
                                    </td>

                                    {/* Використовуємо renderCell для консистентного відображення, вимикаємо хайлайтінг */}
                                    <td className="p-4 text-sm text-gray-800 dark:text-gray-200">
                                        {renderCell ? renderCell('captions', { original: item }, item.captions, { search: '' }) : item.captions}
                                    </td>
                                    <td className="p-4 text-sm text-gray-800 dark:text-gray-200">
                                        {renderCell ? renderCell('identifiers', { original: item }, item.identifiers, { search: '' }) : item.identifiers}
                                    </td>
                                    <td className="p-4 text-sm text-gray-800 dark:text-gray-200">
                                        {renderCell ? renderCell('decree', { original: item }, item.decree, { search: '' }) : item.decree}
                                    </td>
                                    <td className="p-4 text-sm text-gray-800 dark:text-gray-200">
                                        {renderCell ? renderCell('other', { original: item }, item.other, { search: '' }) : item.other}
                                    </td>

                                    <td className="p-4 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                        {item.addedAt ? new Date(item.addedAt).toLocaleString() : '-'}
                                    </td>
                                    <td className="p-4 text-right">
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
                <Button variant="gradient" color="blue" onClick={onClose}>
                    Закрити
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(BasketDialog);
