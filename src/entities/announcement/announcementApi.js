import axios from 'axios'

// Model-шар оголошень (спільний: /announcement і віджет на /welcome).
// Глобальний axios налаштований у src/lib/http.js (baseURL, credentials, XSRF).

export const ANNOUNCEMENT_KEYS = {
  all: ['announcements'],
  list: (filters) => ['announcements', filters],
  detail: (id) => ['announcement', id],
  options: ['announcement-options'],
}

/** Бекенд повертає {message} (і {errors} для 422). */
export function announcementErrorMessage(error, fallback) {
  const data = error?.response?.data
  if (!data) return fallback
  if (data.errors) {
    const first = Object.values(data.errors)[0]
    if (first) return Array.isArray(first) ? first[0] : first
  }
  return data.message || fallback
}

// Словники сторінки (автори для фільтра) — стабільні в межах сесії,
// staleTime: Infinity (useAnnouncementOptionsQuery), той самий принцип, що й /api/task/options.
export const fetchAnnouncementOptions = async () => {
    const response = await axios.get("/api/announcement/options");
    return response.data.data;
};

export const fetchAnnouncements = async ({page = 0, limit = 20, q, authorIds, isRead, scope} = {}) => {
    const response = await axios.get("/api/announcement", {
        params: {
            page: page + 1,
            per_page: limit,
            q: q || undefined,
            author_id: authorIds?.length ? authorIds : undefined,
            // Laravel `boolean` rule приймає true/false/0/1/"0"/"1", але НЕ рядки
            // "true"/"false" — а саме в такий рядок axios серіалізує JS-boolean
            // у query-string. Тож явно в 0/1.
            is_read: isRead === undefined ? undefined : (isRead ? 1 : 0),
            scope: scope || undefined,
        },
    });
    return response.data;
};

export const fetchAnnouncement = async (announcementId) => {
    const response = await axios.get(`/api/announcement/${announcementId}`);
    return response.data.data;
};

// axios сам виставляє Content-Type: multipart/form-data (з boundary) для FormData.
export const createAnnouncement = async ({title, details, requiresAcknowledgement, audienceType, recipientIds = [], files = [], isDraft = false}) => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("details", details);
    formData.append("requires_acknowledgement", requiresAcknowledgement ? "1" : "0");
    formData.append("audience_type", audienceType || "all");
    formData.append("is_draft", isDraft ? "1" : "0");
    if (audienceType === "selected") {
        recipientIds.forEach((id, index) => formData.append(`recipient_ids[${index}]`, id));
    }
    files.forEach((file, index) => formData.append(`attachments[${index}]`, file));

    const response = await axios.post("/api/announcement", formData);
    return response.data.data;
};

// Публікація чернетки — знімає is_draft і лише тепер іде сповіщення всім/адресатам.
export const publishAnnouncement = async (announcementId) => {
    const response = await axios.post(`/api/announcement/${announcementId}/publish`);
    return response.data.data;
};

export const updateAnnouncement = async (announcementId, {title, details, requiresAcknowledgement, audienceType, recipientIds} = {}) => {
    const payload = {
        title,
        details,
        requires_acknowledgement: requiresAcknowledgement,
        audience_type: audienceType,
        recipient_ids: audienceType === "selected" ? (recipientIds || []) : undefined,
    };
    // undefined-поля не надсилаємо — PATCH оновлює лише передані (FormRequest::sometimes).
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    const response = await axios.patch(`/api/announcement/${announcementId}`, payload);
    return response.data.data;
};

export const deleteAnnouncement = async (announcementId) => {
    await axios.delete(`/api/announcement/${announcementId}`);
};

export const attachAnnouncementFiles = async (announcementId, files = []) => {
    const formData = new FormData();
    files.forEach((file, index) => formData.append(`attachments[${index}]`, file));

    const response = await axios.post(`/api/announcement/${announcementId}/attach-file`, formData);
    return response.data.data;
};

export const deleteAnnouncementAttachment = async (attachmentId) => {
    await axios.delete(`/api/announcement/attachments/${attachmentId}`);
};

// Свідоме підтвердження прочитання (кнопка "Я прочитав") — для оголошень
// requires_acknowledgement=true, де саме відкриття картки не рахується прочитанням.
export const acknowledgeAnnouncement = async (announcementId) => {
    const response = await axios.post(`/api/announcement/${announcementId}/acknowledge`);
    return response.data.data;
};
