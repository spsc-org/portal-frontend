// Завантаження + обрізання + збереження аватара на сторінці профілю
// (гібридна Blade-сторінка, тому vanilla JS + Cropper.js)
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

const uploadBtn = document.getElementById("avatarUploadBtn");
const deleteBtn = document.getElementById("avatarDeleteBtn");
const fileInput = document.getElementById("avatarFileInput");
const preview = document.getElementById("avatarPreview");
const modal = document.getElementById("avatarCropModal");
const cropImage = document.getElementById("avatarCropImage");
const cancelBtn = document.getElementById("avatarCropCancel");
const saveBtn = document.getElementById("avatarCropSave");
const errorBox = document.getElementById("avatarError");

if (uploadBtn && fileInput && modal) {
    let cropper = null;
    let objectUrl = null;

    const csrfToken = document.querySelector('meta[name="csrfToken"]')?.content || "";

    const showError = (message) => {
        if (!errorBox) return;
        errorBox.textContent = message;
        errorBox.classList.remove("hidden");
        setTimeout(() => errorBox.classList.add("hidden"), 5000);
    };

    const closeModal = () => {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
        }
        fileInput.value = "";
    };

    uploadBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        objectUrl = URL.createObjectURL(file);
        cropImage.src = objectUrl;
        modal.classList.remove("hidden");
        modal.classList.add("flex");
        // Ініціалізуємо кропер після того, як зображення потрапило в DOM
        cropImage.onload = () => {
            if (cropper) cropper.destroy();
            cropper = new Cropper(cropImage, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 1,
                dragMode: "move",
                background: false,
            });
        };
    });

    cancelBtn?.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    saveBtn?.addEventListener("click", () => {
        if (!cropper) return;
        saveBtn.disabled = true;
        cropper.getCroppedCanvas({width: 512, height: 512, imageSmoothingQuality: "high"})
            .toBlob(async (blob) => {
                try {
                    const formData = new FormData();
                    formData.append("avatar", blob, "avatar.jpg");
                    const response = await fetch("/profile/avatar", {
                        method: "POST",
                        headers: {"X-CSRF-TOKEN": csrfToken},
                        body: formData,
                    });
                    const payload = await response.json();
                    if (!response.ok || !payload.success) {
                        throw new Error(payload.message || "Помилка завантаження");
                    }
                    // Оновлюємо прев'ю без перезавантаження (cache-bust параметром)
                    preview.innerHTML = `<img src="/files?path=${payload.data.avatar}&t=${Date.now()}" alt="Аватар" class="h-full w-full object-cover">`;
                    deleteBtn?.classList.remove("hidden");
                    closeModal();
                } catch (error) {
                    showError(error.message || "Не вдалося зберегти аватар");
                } finally {
                    saveBtn.disabled = false;
                }
            }, "image/jpeg", 0.9);
    });

    deleteBtn?.addEventListener("click", async () => {
        if (!confirm("Видалити аватар?")) return;
        try {
            const response = await fetch("/profile/avatar", {
                method: "DELETE",
                headers: {"X-CSRF-TOKEN": csrfToken},
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error("Помилка видалення");
            }
            const initials = preview.dataset.initials || "?";
            preview.innerHTML = `<span>${initials}</span>`;
            deleteBtn.classList.add("hidden");
        } catch (error) {
            showError(error.message || "Не вдалося видалити аватар");
        }
    });
}
