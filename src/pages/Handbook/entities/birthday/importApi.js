import axios from "axios";

export const birthdayImportTemplateUrl = "/api/birthday/import/template";

export const previewBirthdayImport = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post("/api/birthday/import/preview", formData);
    return response.data.data;
};

export const commitBirthdayImport = async ({rows}) => {
    const response = await axios.post("/api/birthday/import/commit", {
        rows: rows.map(({name, date_of_birth, note}) => ({name, date_of_birth, note})),
    });
    return response.data.data;
};
