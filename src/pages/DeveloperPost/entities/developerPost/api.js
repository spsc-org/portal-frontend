import axios from "axios";

// Словники сторінки (автори/теги/статуси + підказка наступної версії) —
// стабільні в межах сесії, staleTime: Infinity (useDeveloperPostOptionsQuery),
// той самий принцип, що й /api/task/options.
export const fetchDeveloperPostOptions = async () => {
    const response = await axios.get("/api/developer-post/options");
    return response.data.data;
};

export const fetchDeveloperPosts = async ({page = 1, limit = 20, q, authorIds, tags, statuses, isRead, scope} = {}) => {
    const response = await axios.get("/api/developer-post", {
        params: {
            page,
            per_page: limit,
            q: q || undefined,
            author_id: authorIds?.length ? authorIds : undefined,
            tag: tags?.length ? tags : undefined,
            status: statuses?.length ? statuses : undefined,
            // Laravel `boolean` rule приймає true/false/0/1/"0"/"1", але НЕ рядки
            // "true"/"false" — а саме в такий рядок axios серіалізує JS-boolean.
            is_read: isRead === undefined ? undefined : (isRead ? 1 : 0),
            scope: scope || undefined,
        },
    });
    return response.data;
};

export const fetchDeveloperPost = async (postId) => {
    const response = await axios.get(`/api/developer-post/${postId}`);
    return response.data.data;
};

// Чернетка-шелл одразу при відкритті модалки створення (Task.isDraft-
// еквівалент) — щоб вкладення (зображення для вставки в текст) могли йти на
// реальний post-id із самого початку, тим самим attach-file, що й редагування.
export const createDeveloperPostDraft = async () => {
    const response = await axios.post("/api/developer-post/draft");
    return response.data.data;
};

// "Справжнє" створення поста з чернетки-шелла.
export const finalizeDeveloperPostDraft = async (draftId, {title, body, version, tags = [], status, notify = false, publishAt} = {}) => {
    const payload = {title, body: body || "", version: version || null, tags, status, notify: notify ? 1 : 0};
    if (publishAt) payload.publish_at = publishAt;

    const response = await axios.patch(`/api/developer-post/${draftId}/finalize`, payload);
    return response.data.data;
};

// Скасування чернетки-шелла (закрили модалку створення, не дозаповнивши).
export const discardDeveloperPostDraft = async (draftId) => {
    await axios.delete(`/api/developer-post/${draftId}/draft`);
};

export const updateDeveloperPost = async (postId, {title, body, version, tags, status, notify, publishAt} = {}) => {
    const payload = {title, body, version, tags, status, notify: notify === undefined ? undefined : (notify ? 1 : 0), publish_at: publishAt};
    // undefined-поля не надсилаємо — PATCH оновлює лише передані (FormRequest::sometimes).
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    const response = await axios.patch(`/api/developer-post/${postId}`, payload);
    return response.data.data;
};

// Явна публікація чернетки/запланованого поста поза Artisan-планувальником.
export const publishDeveloperPost = async (postId) => {
    const response = await axios.post(`/api/developer-post/${postId}/publish`);
    return response.data.data;
};

export const deleteDeveloperPost = async (postId) => {
    await axios.delete(`/api/developer-post/${postId}`);
};

export const attachDeveloperPostFiles = async (postId, files = []) => {
    const formData = new FormData();
    files.forEach((file, index) => formData.append(`attachments[${index}]`, file));

    const response = await axios.post(`/api/developer-post/${postId}/attach-file`, formData);
    return response.data.data;
};

export const deleteDeveloperPostAttachment = async (attachmentId) => {
    await axios.delete(`/api/developer-post/attachments/${attachmentId}`);
};
