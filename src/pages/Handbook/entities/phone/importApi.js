import axios from "axios";

export const phoneImportTemplateUrl = "/api/phone/import/template";

export const previewPhoneImport = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post("/api/phone/import/preview", formData);
    return response.data.data;
};

export const commitPhoneImport = async ({rows}) => {
    const response = await axios.post("/api/phone/import/commit", {
        rows: rows.map(({name, department, note, phones}) => ({name, department, note, phones})),
    });
    return response.data.data;
};
