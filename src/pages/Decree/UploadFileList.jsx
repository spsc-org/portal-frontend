import React, {useRef, useState} from 'react';
import {Button, Card} from "@material-tailwind/react";
import Input from "@/Components/fields/Input.jsx";
import ImportFile from "@/Components/Modal/ImportFile.jsx";
import {format} from "date-fns";
import {useDialog} from "../../hooks/useDialog.js";
import PreviewModal from "../../Components/Modal/PreviewModal.jsx";

const DEFAULT_ACCEPT = ".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
const DEFAULT_FORMAT_TEXT = "Формати: .pdf, .doc, .docx"
const UploadFileList = ({
                            data = null,
                            attachments = [],
                            uploadAttachments,
                            setAttachments,
                            onDeleteFile,
                            errors = null,
                            accept = DEFAULT_ACCEPT,
                            formatText = DEFAULT_FORMAT_TEXT,
                            isChangeFileName = true
                        }) => {
    const [selectedFileIndex, setSelectedFileIndex] = useState(null);
    const [openImport, setOpenImport] = useState(false)
    const fileInputRef = useRef(null);

    const {
        open: openPreview,
        handleOpen: handleOpenPreview,
        handleClose: handleClosePreview,
        dialogProps: previewProps
    } = useDialog();


    const handleFileSelect = (file) => {
        if (file && selectedFileIndex !== null) {
            uploadAttachments({file, index: selectedFileIndex});
            setSelectedFileIndex(null);
            setOpenImport(false);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const addEmptyItem = () => {
        setAttachments(prev => [...prev, {file: null}]);
    };

    const removeEmptyItem = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const clearFile = (index, id) => {
        if (id) {
            onDeleteFile(id);
        }
        setAttachments(prev => prev.map((item, i) =>
            i === index ? {file: null} : item
        ));
    };

    const triggerFileSelect = (index) => {
        setSelectedFileIndex(index);
        setOpenImport(true);
        fileInputRef.current?.click();
    };

    const getNewFileName = (index, originalName) => {
        if (!data?.code || !data?.date) return originalName;
        const extension = originalName.split('.').pop();
        return `Додаток-${index + 1}_${data.code.replace('/', '-')}_${format(data?.date, "yyyy-MM-dd")}.${extension}`;
    };


    return (
        <>
            <Card className="shadow-lg dark:bg-gray-900">
                {attachments.map((attachment, index) => {
                    return (
                        <div key={index} className="p-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium dark:text-slate-400">{index + 1}.</span>
                                <Input
                                    className="flex-1"
                                    readOnly
                                    placeholder="Немає файлу"
                                    value={attachment?.file?.name || ''}
                                />
                                <Button
                                    title="Додати файл"
                                    size="sm"
                                    onClick={() => triggerFileSelect(index)}
                                >
                                    <i className="fa-regular fa-plus"></i>
                                </Button>
                                {!attachment?.file && (
                                    <Button
                                        title="Видалити елемент списку"
                                        size="sm"
                                        color="red"
                                        variant="outlined"
                                        onClick={() => removeEmptyItem(index)}
                                    >
                                        <i className="fa-regular fa-xmark"></i>
                                    </Button>
                                )}
                                {attachment?.file && (
                                    <>

                                        <Button
                                            title="Видалити файл"
                                            size="sm"
                                            color="red"
                                            onClick={() => clearFile(index, attachment?.file?.id)}
                                        >
                                            <i className="fa-regular fa-file-slash"></i>
                                        </Button>
                                        {Boolean(attachment?.file.type && attachment?.file.type.includes("image")) ?
                                            <Button
                                                title="Попередній перегляд"
                                                size="sm"
                                                variant="outlined"
                                                color="blue"
                                                onClick={() => {
                                                    handleOpenPreview({
                                                        source: URL.createObjectURL(attachment?.file)
                                                    })
                                                }}
                                            >
                                                <i className="fa-regular fa-eye"></i>
                                            </Button>
                                            : null
                                        }

                                    </>
                                )}
                            </div>
                            {
                                errors?.[`attachments.${index}`] &&
                                <p className="text-sm text-red-600 ml-9">
                                    {errors?.[`attachments.${index}`]}
                                </p>
                            }
                            {attachment?.file && !isChangeFileName && (
                                <p className="text-sm text-blue-600 ml-9">
                                    Нова назва файлу: {getNewFileName(index, attachment.file.name)}
                                </p>
                            )}
                        </div>
                    );
                })}

            </Card>
            <Button variant="text" size="sm" onClick={addEmptyItem}>
                Додати елемент
            </Button>
            {openImport && (
                <ImportFile
                    accept={accept}
                    open={openImport}
                    submitText="Додати"
                    handleSubmit={handleFileSelect}
                    formatText={formatText}
                    onClose={() => {
                        setOpenImport(false);
                        selectedFileIndex(null);
                    }}
                />
            )}
            {
                openPreview && (
                    <PreviewModal
                        open={openPreview}
                        onClose={handleClosePreview}
                        {...previewProps}
                    />
                )
            }
        </>
    );
};

export default UploadFileList;
