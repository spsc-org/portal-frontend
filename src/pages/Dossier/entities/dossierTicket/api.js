import axios from "axios";

// Ізольований від entities/orphanProject, entities/dossier тощо — власний ендпоінт
// /api/dossier/tickets (routes/api/dossier-ticket.php), не переюзає жоден із них.
export const fetchTickets = async (entityType, entityId) => {
    const response = await axios.get("/api/dossier/tickets", {
        params: {entity_type: entityType, entity_id: entityId},
    });
    return response.data.data;
};

export const fetchAllTickets = async ({state, entityType, authorIds, page = 1, perPage = 50} = {}) => {
    const response = await axios.get("/api/dossier/tickets/all", {
        params: {
            state: state?.length ? state : undefined,
            entity_type: entityType || undefined,
            created_by: authorIds?.length ? authorIds : undefined,
            page,
            per_page: perPage,
        },
    });
    return response.data;
};

// Словники для панелі фільтрів дашборду (стани/типи сутностей/автори) — за принципом
// GET /api/dossier/options.
export const fetchTicketOptions = async () => {
    const response = await axios.get("/api/dossier/tickets/options");
    return response.data.data;
};

// Контроль перед створенням: чого саме стосуватиметься тікет (id вручну вписані через
// кому в полі — легко помилитись) — повертає {type,id,found,label} на кожен link.
export const previewLinks = async (links) => {
    const response = await axios.post("/api/dossier/tickets/preview-links", {links});
    return response.data.data;
};

// links: [{type: "profile"|"connection", id}] — один тікет може стосуватись кількох
// сутностей одразу (напр. конфлікт між двома досьє + звʼязком).
export const createTicket = async ({links, text, payload}) => {
    const response = await axios.post("/api/dossier/tickets", {links, text, payload: payload ?? undefined});
    return response.data.data;
};

export const resolveTicket = async (ticketId, resolutionNote) => {
    const response = await axios.patch(`/api/dossier/tickets/${ticketId}/resolve`, {
        resolution_note: resolutionNote || undefined,
    });
    return response.data.data;
};

// Дописує привʼязку до ВЖЕ ІСНУЮЧОГО тікета — без окремої кнопки "зберегти",
// кожне додавання шле запит одразу.
export const addTicketLink = async (ticketId, link) => {
    const response = await axios.post(`/api/dossier/tickets/${ticketId}/links`, {links: [link]});
    return response.data.data;
};

export const removeTicketLink = async (ticketId, link) => {
    const response = await axios.delete(`/api/dossier/tickets/${ticketId}/links`, {
        data: {entity_type: link.type, entity_id: link.id},
    });
    return response.data.data;
};
