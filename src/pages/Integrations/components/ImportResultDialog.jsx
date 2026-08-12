import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Typography,
} from "@material-tailwind/react";
import axios from "axios";

const ImportResultDialog = ({ open, onClose, result }) => {
    if (!result) return null;

    const { success, message, details } = result;
    const downloadUrl = details?.download_url;


    const displayDetails = { ...details };
    delete displayDetails.download_url;

    const handleDownload = async () => {
        if (!downloadUrl) return;

        try {
            const response = await axios.get(downloadUrl, {
                responseType: 'blob',
            });


            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;


            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'export.sql';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (fileNameMatch && fileNameMatch.length === 2)
                    fileName = fileNameMatch[1];
            } else {

                 const urlParts = downloadUrl.split('/');
                 const possibleName = urlParts[urlParts.length - 1];
                 if(possibleName) fileName = possibleName;
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();


            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Не вдалося завантажити файл. Спробуйте пізніше.");
        }
    };

    return (
        <Dialog open={open} handler={onClose} size="xl">
            <DialogHeader>
                <Typography variant="h5" color={success ? "green" : "red"}>
                    {success ? "Результат операції" : "Помилка"}
                </Typography>
            </DialogHeader>
            <DialogBody divider className="flex flex-col gap-4">
                <Typography variant="h6">{message}</Typography>

                {downloadUrl && (
                    <div className="flex justify-center my-4">
                        <Button color="blue" className="flex items-center gap-2" onClick={handleDownload}>
                            <i className="fa-solid fa-download"></i>
                            Скачати файл
                        </Button>
                    </div>
                )}

                {displayDetails && Object.keys(displayDetails).length > 0 && (
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md max-h-96 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap break-all">
                            {JSON.stringify(displayDetails, null, 2)}
                        </pre>
                    </div>
                )}
            </DialogBody>
            <DialogFooter>
                <Button
                    variant="filled"
                    color="green"
                    onClick={onClose}
                >
                    Ок
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default ImportResultDialog;
