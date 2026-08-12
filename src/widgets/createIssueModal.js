export class CreateIssueModal {
    constructor(modalId = 'createIssueModal') {
        this.modalId = modalId;
        this.modal = document.getElementById(this.modalId);
        this.form = document.getElementById('createIssueForm');
        this.formErrors = document.getElementById('formErrors');
        this.submitBtn = document.getElementById('submitBtn');
        this.isLoading = false;
        this.setupEvents();
    }

    static init(modalId = 'createIssueModal') {
        return new CreateIssueModal(modalId);
    }

    setupEvents() {
        const button = document.getElementById('createIssueButton');
        if (!button || !this.modal || !this.form) return;
        button.addEventListener('click', () => {
            this.openModal();
        });
        const closeBtn = document.getElementById('closeModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        window.closeModal = () => this.closeModal();
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    openModal() {
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.formErrors.textContent = '';
        this.form.reset();
        this.modal.classList.add('hidden');
    }

    toggleLoading() {
        this.isLoading = !this.isLoading;
        if (this.isLoading) {
            this.submitBtn.textContent = 'Створення...';
            this.submitBtn.disabled = true;
        } else {
            this.submitBtn.textContent = 'Створити';
            this.submitBtn.disabled = false;
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.formErrors.textContent = '';

        const title = this.form.title.value.trim();
        const files = this.form['files[]'].files;

        const allowedTypes = [
            'image/png', 'image/jpeg',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/pdf'
        ];

        if (!title) {
            this.formErrors.textContent = "Обов'язкове поле";
            return;
        }

        for (let file of files) {
            if (!allowedTypes.includes(file.type)) {
                this.formErrors.textContent = `Невідповідний тип файлу: ${file.name}`;
                return;
            }
        }

        const trimmedTitle =  title.length > 30 ? title.slice(0, 30) + '...' : title;
        const formData = new FormData();
        formData.append('title', trimmedTitle);
        formData.append('description', title);
        Array.from(files).forEach((file, i) => {
            formData.append(`attachments[${i}]`, file);
        });

        try {
            this.toggleLoading()
            await axios.post('/api/task/issue', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrfToken"]').content,
                    'userId': document.querySelector('meta[name="userId"]').content,
                }
            });
            alert('Успішно створено');
            this.closeModal();
            this.toggleLoading()
        } catch (err) {
            this.toggleLoading()
            let msg = '';
            const errors = err?.response?.data?.errors;
            if (errors) {
                for (const [field, messages] of Object.entries(errors)) {
                    msg += `${field}: ${messages.join(', ')}. `;
                }
            }
            this.formErrors.textContent = msg || "Виникла невідома помилка. Повідомте адміністратора.";
            console.error(err);
        }
    }
}
