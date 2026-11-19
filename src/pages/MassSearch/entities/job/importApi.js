import {API_BASE_URL, http as axios} from "../../../../lib/api.js";
export const massSearchImportTemplateUrl = `${API_BASE_URL}/api/mass-search/import/template`;

export const previewMassSearchImport = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post("api/mass-search/import/preview", formData);
    return response.data.data;
};

export const commitMassSearchImport = async ({rows, fileName}) => {
    const response = await axios.post("api/mass-search/import/commit", {
        file_name: fileName,
        rows: rows.map(({row, entity_type, name_ukrainian, name_russian, name_latin, birth_date, person_identifier_codes, person_passports, organization_reg_codes, organization_tax_codes}) => ({
            row,
            entity_type,
            name_ukrainian,
            name_russian,
            name_latin,
            birth_date,
            person_identifier_codes,
            person_passports,
            organization_reg_codes,
            organization_tax_codes,
        })),
    });
    return response.data.data;
};
