export class ActiveUsers {
    constructor(users) {
        this.users = users;
        this.showAll = document.cookie.split('; ').find(row => row.startsWith('showAllUsers='))?.split('=')[1] === 'true';
        this.container = document.getElementById("activeUsers");
        this.render();
    }

    update(newUsers = []) {

        // Оновлюємо список і рендеримо
        this.users = newUsers;
        this.render();
    }

    toggleShowAll() {
        this.showAll = !this.showAll;
        document.cookie = `showAllUsers=${this.showAll}; path=/; max-age=31536000; samesite=Strict`;

        this.render();
    }

    render() {
        // Повторний lookup: React-сайдбар може ховати/показувати вузол через CSS,
        // а при першому конструкторі контейнер інколи ще не змонтований.
        this.container = document.getElementById("activeUsers");
        if (!this.container) return;
        if (this.container.innerHTML) {
            this.container.innerHTML = null;
        }
        const usersForRender = this.users?.length ? this.users : [];
        const displayedUsers = this.showAll ? usersForRender : usersForRender.slice(0, 3);

        const listWrapper = document.createElement("div");
        listWrapper.className = "flex flex-col gap-1.5";
        this.container.appendChild(listWrapper);


        const renderedIds = new Set();

        displayedUsers.forEach(user => {
            const existingRow = listWrapper.querySelector(`[data-id="${user.id}"]`);
            if (!existingRow) {
                const userRow = this.createUserRow(user);
                userRow.classList.add("user-item");
                userRow.setAttribute("data-id", user.id);
                listWrapper.appendChild(userRow);

                // Анімація входу (виконується асинхронно)
                requestAnimationFrame(() => {
                    userRow.classList.add("enter");
                });
            } else if (existingRow) {
                const newUserRow = this.createUserRow(user);
                newUserRow.classList.add("user-item");
                newUserRow.setAttribute("data-id", user.id);
                existingRow.replaceWith(newUserRow);
            }
            renderedIds.add(user.id);
        });

        // Кнопка "Показати всіх"
        this.renderUsersCounter(usersForRender.length);
        this.renderToggleButton();
    }

    renderUsersCounter(total = 0) {
        const counter = document.createElement("div");
        counter.className = "mb-2 inline-flex items-center rounded-md border border-slate-300/70 bg-white/80 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300";
        counter.textContent = `Онлайн: ${total}`;
        this.container.prepend(counter);
    }

    renderToggleButton() {
        // Видаляємо стару кнопку
        const existing = this.container.querySelector("button.toggle-users");
        if (existing) existing.remove();

        const total = this.users?.length ? this.users.length : 0;
        if (total > 3) {
            const button = document.createElement("button");
            button.className = "toggle-users mt-2 inline-flex w-fit items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700";
            button.textContent = this.showAll ? "Приховати" : "Показати всіх";
            button.onclick = () => this.toggleShowAll();
            this.container.appendChild(button);
        }
    }

    createUserRow(user) {
        const userRow = document.createElement("div");
        userRow.className = "flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white/85 px-2 py-1.5 text-xs shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/45";

        const badgeWrapper = document.createElement("div");
        badgeWrapper.className = "relative h-7 w-7 shrink-0";

        const avatar = document.createElement("div");
        avatar.className = "relative h-7 w-7 rounded-full border border-slate-300 bg-slate-200 text-center dark:border-slate-600 dark:bg-slate-700";

        const span = document.createElement("span");
        span.className = "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-700 dark:text-slate-100";
        span.textContent = user.initials || "";

        avatar.appendChild(span);

        const badgeDot = document.createElement("span");
        badgeDot.className = `absolute right-0 top-0 h-2.5 w-2.5 rounded-full border border-white dark:border-slate-900 ${user.isActive ? 'bg-emerald-500' : 'bg-amber-500'}`;
        badgeWrapper.appendChild(avatar);
        badgeWrapper.appendChild(badgeDot);

        const infoWrapper = document.createElement("div");
        infoWrapper.className = "min-w-0";

        const name = document.createElement("div");
        name.className = "truncate text-xs font-semibold text-slate-800 dark:text-slate-200";
        name.textContent = user.name;

        const page = document.createElement("div");
        page.className = "truncate text-[11px] text-slate-500 dark:text-slate-400";
        page.textContent = user.current_page;

        const status = document.createElement("span");
        status.className = `ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${user.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`;
        status.textContent = user.isActive ? "Активний" : "Неактивний";

        infoWrapper.appendChild(name);
        infoWrapper.appendChild(page);

        userRow.appendChild(badgeWrapper);
        userRow.appendChild(infoWrapper);
        userRow.appendChild(status);

        return userRow;
    }
}
