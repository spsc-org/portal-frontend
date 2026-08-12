// UserActivityManager.js
import {ActiveUsers} from "./widgets/ActiveUsers.js";

export class UserActivityManager {
    constructor(myApp) {
        this.myApp = myApp;
        this.pingInterval = 60 * 1000; // 60 секунд
        this.afkTimeout = 15 * 60 * 1000; // 15 хвилин AFK
        this.lastActivityTime = Date.now();
        this.lastPingAt = 0;
        this.inFlightPing = false;
        this.isPageHidden = document.hidden;
        this.isBrowserOnline = navigator.onLine;
        this.hiddenAfkTimerId = null;
        this.hiddenAfkSent = false;
        this.intervalId = null;
        this.capturedItemId = null;
        this.users = [];
        this.currentUserId = Number(this.myApp.globals.userId);
        this.activeUsersComponent = new ActiveUsers([]); // початково пустий
    }

    exceptMe(users) {
        return users.filter(u => u.id !== this.currentUserId);
    }

    renderUserList(data = []) {
        this.activeUsersComponent.update(this.exceptMe(data)); // викликаємо метод оновлення
    }

    subscribeToPresenceChannel() {
        const channel = window.Echo.join('user.presence');
        channel
            // очищаємо список користувачів онлайн. api/helper/presence/ping - істинний список активності
            .here(() => {
                this.users = [];
                this.renderUserList(this.users);
            })
            .listen('.UserPresenceUpdated', (response) => {
                if (!response?.userData) return;
                this.users = response.userData;
                this.renderUserList(this.users);
            });
    }

    subscribeToNotifyChannel() {
        const channel = window.Echo.channel('notify.users')
        channel
            .listen('.notify', (e) => {
                if (!e.message) return;
                alert(e.message);
            });
    }


    async init() {
        this._bindUserActivityEvents();
        this.subscribeToPresenceChannel()
        this.subscribeToNotifyChannel();
        this.startPinging();
        await this.pingActivity(true);
    }

    _bindUserActivityEvents() {
        const events = ['keydown', 'click', 'pointerdown', 'touchstart'];
        events.forEach(event =>
            window.addEventListener(event, () => this._updateActivity())
        );

        document.addEventListener('visibilitychange', () => {
            this.isPageHidden = document.hidden;
            if (this.isPageHidden) {
                this._handleBackgroundState();
            } else {
                this._handleForegroundState();
            }
        });

        window.addEventListener('blur', () => {
            this._handleBackgroundState();
        });

        window.addEventListener('focus', () => {
            this._handleForegroundState();
        });

        window.addEventListener('online', () => {
            this.isBrowserOnline = true;
            if (this._isForeground()) {
                this._handleForegroundState();
            }
        });

        window.addEventListener('offline', () => {
            this.isBrowserOnline = false;
            this.stopPinging();
        });
    }

    _updateActivity() {
        if (!this._isForeground()) {
            return;
        }

        this.lastActivityTime = Date.now();
    }

    _isForeground() {
        return !document.hidden && document.hasFocus();
    }

    _handleBackgroundState() {
        this.isPageHidden = document.hidden;
        this.hiddenAfkSent = false;
        this.stopPinging();
        this._scheduleHiddenAfk();
    }

    _handleForegroundState() {
        this.isPageHidden = document.hidden;
        if (!this._isForeground()) {
            return;
        }

        this._clearHiddenAfkTimer();
        this.hiddenAfkSent = false;
        this._updateActivity();
        this.startPinging();
        this.pingActivity(true, 'active');
    }

    _scheduleHiddenAfk() {
        this._clearHiddenAfkTimer();

        this.hiddenAfkTimerId = setTimeout(() => {
            if (!this.isPageHidden || !navigator.onLine || !this.isBrowserOnline) {
                return;
            }

            this.hiddenAfkSent = true;
            this.pingActivity(true, 'afk');
        }, this.afkTimeout);
    }

    _clearHiddenAfkTimer() {
        if (!this.hiddenAfkTimerId) {
            return;
        }

        clearTimeout(this.hiddenAfkTimerId);
        this.hiddenAfkTimerId = null;
    }

    _isUserActive() {
        return (Date.now() - this.lastActivityTime) < this.afkTimeout;
    }

    startPinging() {
        if (this.intervalId) {
            return;
        }

        this.intervalId = setInterval(() => this.pingActivity(), this.pingInterval);
    }

    async _nativeRequest(method, url, keepalive = false) {
        const headers = {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-Token": String(this.myApp.globals.csrf),
            "userId": String(this.myApp.globals.userId),
        };

        const normalizedUrl = url.replace(/([^:]\/)\/+/g, '$1');

        const response = await fetch(normalizedUrl, {
            method,
            cache: "no-cache",
            credentials: "include",
            headers,
            keepalive,
        });

        try {
            return await response.json();
        } catch (e) {
            return {success: false, messages: {generalErrors: ['Невірна JSON-відповідь']}};
        }
    }

    _resolveStatus(statusOverride = null) {
        if (statusOverride === 'active' || statusOverride === 'afk') {
            return statusOverride;
        }

        if (this.hiddenAfkSent) {
            return 'afk';
        }

        if (!this._isForeground()) {
            return 'afk';
        }

        return this._isUserActive() ? 'active' : 'afk';
    }

    async pingActivity(force = false, statusOverride = null, keepalive = false) {
        if (!this.isBrowserOnline || !navigator.onLine) {
            return;
        }

        if (!force && this.inFlightPing) {
            return;
        }

        const now = Date.now();
        if (!force && this.lastPingAt > 0 && (now - this.lastPingAt) < 10_000) {
            return;
        }

        this.inFlightPing = true;
        this.lastPingAt = now;
        const url = `/api/helper/presence/ping`;
        const status = this._resolveStatus(statusOverride);

        try {
            const response = await this._nativeRequest("GET", `${url}?status=${status}`, keepalive);
            if (Array.isArray(response?.userData)) {
                this.users = response.userData;
                this.renderUserList(this.users);
            }
            console.log(`[UserActivityManager] Ping відправлено зі статусом ${status}`);
        } catch (error) {
            console.error('[UserActivityManager] Помилка при ping:', error);
        } finally {
            this.inFlightPing = false;
        }
    }

    stopPinging() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    setCapturedItem(itemId) {
        this.capturedItemId = itemId;
    }

    releaseCapturedItem() {
        this.capturedItemId = null;
    }

    collectUserActivityList(res) {
        let content = '<div class="flex flex-col gap-2">';
        displayedUsers?.forEach((user, index) => {
            const isActive = user?.isActive;
            const userInitials = user?.initials || '';
            const userName = user?.name || '';
            const userPage = user?.current_page || '';

            const badgeColor = isActive ? 'bg-green-500' : 'bg-red-500';
            const badgeClass = `w-[6px] h-[6px] rounded-full ${badgeColor}`;

            content += `
        <div class="flex items-center gap-3 text-xs">
            <div class="relative inline-block">
                <span class="${badgeClass} absolute right-0 top-0 z-10 block rounded-full ring-2 ring-white"></span>
                <div class="relative rounded-full p-0 w-[22px] h-[22px] text-center shadow-3xl border dark:border-gray-600 bg-neutral-200 dark:bg-gray-600">
                    <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform dark:text-gray-50 text-xs">
                        ${userInitials}
                    </span>
                </div>
            </div>
            <div>
                <div class="text-xs leading-none text-gray-800 dark:text-gray-200 font-semibold">
                    ${userName}
                </div>
                <div class="font-normal text-xs leading-none text-gray-800 dark:text-gray-200">
                    Сторінка: ${userPage}
                </div>
            </div>
        </div>
    `;
        });

        // Додати кнопку "Показати всіх", якщо користувачів більше 3
        if (users?.length > 3) {
            content += `
                <button type="button"
                        class="mt-2 text-blue-500 text-xs hover:underline"
                        onclick="toggleShowAll()">
                    ${showAll ? "Приховати" : "Показати всіх"}
                </button>
            `;
        }

        if (users?.length > 3) {
            content += `
                <button type="button"
                        class="mt-2 text-blue-500 text-xs hover:underline"
                        onclick="toggleShowAll()">
                    ${showAll ? "Приховати" : "Показати всіх"}
                </button>
            `;
        }

        content += '</div>';
        return content;
    }

    handleActivityResponse(res) {
        if (!this.myApp.globals.permissions["general"]["showActivity"]) {
            return;
        }

        const activeUsersEl = document.querySelector('div#activeUsers');
        const mainTable = this.myApp.globals.el['mainTable'];

        if (!activeUsersEl || !mainTable) return;

        // Очищаем предыдущие индикаторы
        this.clearCapturedItems();

        let content = "";
        let capturedItemsData = [];

        if (res.length > 0) {
            for (let i = 0; i < res.length; i++) {
                const activity = res[i];
                const userName = this.myApp.globals.voc["_user"][activity.u];
                const userInitials = this.getUserInitials(activity.u); // НОВЫЙ КОД!
                const userPath = activity.p;
                const userCapturedItemId = activity.i;

                const classText = activity.t === 1
                    ? "bg-green-100 text-gray-600"
                    : "bg-gray-50 text-gray-400";


                const badgeColor = classText ? 'bg-green-500' : 'bg-red-500';
                const badgeClass = `w-[6px] h-[6px] rounded-full ${badgeColor}`;

                content += `
                    <div class="flex items-center gap-3 text-xs">
                        <div class="relative inline-block">
                            <span class="${badgeClass} absolute right-0 top-0 z-10 block rounded-full ring-2 ring-white"></span>
                            <div class="relative rounded-full p-0 w-[22px] h-[22px] text-center shadow-3xl border dark:border-gray-600 bg-neutral-200 dark:bg-gray-600">
                                <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-gray-800 dark:text-gray-50 text-xs">
                                    ${userInitials}
                                </span>
                            </div>
                        </div>
                        <div>
                            <div class="text-xs leading-none text-gray-800 dark:text-gray-200 font-semibold">
                                ${userName}
                            </div>
                            <div class="font-normal text-xs leading-none text-gray-800 dark:text-gray-200">
                                Сторінка: ${userPath}
                            </div>
                        </div>
                    </div>
                `;


                // Собираем данные о захваченных элементах
                // if (userPath === "project" && userCapturedItemId !== null) {
                //     (capturedItemsData[userCapturedItemId] ||= []).push(userName);
                // }
            }
        }

        activeUsersEl.innerHTML = content;
    }

    clearCapturedItems() {
        const capturedElements = this.myApp.globals.el['mainTable']
            ?.querySelectorAll('div.captured-item');
        if (capturedElements) {
            capturedElements.forEach(element => element.innerHTML = '');
        }
    }

    formatDateTime(dateStr) {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";
        const pad = n => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}.${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    displayCapturedItems(capturedItemsData = []) {
        const currentPath = this.myApp.globals.path;
        if (currentPath !== "project") return;
        const capturedRowDivs = this.myApp.globals.el['mainTable']
            ?.querySelectorAll(`tr div.captured-item`) || [];
        capturedRowDivs.forEach(item => {
            if (item) {
                item.innerHTML = '';
            }
        });

        capturedItemsData.forEach((item) => {
            const capturedRowDiv = this.myApp.globals.el['mainTable']
                ?.querySelector(`tr[id="${item?.project_id}"] div.captured-item`);
            if (capturedRowDiv) {
                const lastActiveAt = this.formatDateTime(item?.last_active_at);
                const startedAt = this.formatDateTime(item?.started_at);

                capturedRowDiv.innerHTML = `
                <div title="Відкрито: ${startedAt}; Активність: ${lastActiveAt}" class="shadow-sm mb-1 dark:bg-yellow-900 bg-yellow-300 rounded-sm p-0.5 dark:text-white  flex flex-col space-1">
                    <span>Редагує</span>
                    <span class="space-x-1" title="${item?.user_id}"><i class="fa fa-user-pen" title=""></i> ${item?.user_name}</span>
                </div>
                `;
            }
        });
    }

    handleAlertsPanel(alertsPanelData) {
        const popupAlertsPanel = document.getElementById('popup-alerts-panel-body');
        if (!popupAlertsPanel) return;

        if (alertsPanelData != null) {
            // console.log(alertsPanelData);
            if (popupAlertsPanel.classList.contains('hidden-panel')) {
                popupAlertsPanel.classList.add('show-panel');

                const alertsContent = document.createElement('div');
                alertsContent.innerHTML = `
                    <div class="flex text-sm flex-col font-medium items-start gap-2">
                        <div class="text-sm text-gray-500 dark:text-slate-300 font-medium">На редагуванні у: ${alertsPanelData.locked_by_name}</div>
                        <div class="text-xs text-gray-500 dark:text-slate-300">Час відкриття картки: ${new Date(alertsPanelData.started_at).toLocaleTimeString()}</div>
                    </div>
                `;
                document.getElementById('popup-alerts-panel-content').appendChild(alertsContent);
            }
        } else {
            if (popupAlertsPanel.classList.contains('show-panel')) {
                popupAlertsPanel.classList.toggle('show-panel');
                document.getElementById('popup-alerts-panel-content').innerHTML = null;
            }
        }
    }

    getUserInitials(userId) {
        // console.log('getUserInitials called for userId:', userId);
        // console.log('Available voc.user:', this.myApp.globals.voc["user"]);
        // console.log('Available voc._user:', this.myApp.globals.voc["_user"]);

        // Сначала пробуем найти пользователя в массиве users
        const users = this.myApp.globals.voc["user"];
        if (Array.isArray(users)) {
            const user = users.find(u => u.id === parseInt(userId));
            // console.log('Found user object:', user);
            if (user && user.initials) {
                // console.log(`Using user.initials for ${userId}:`, user.initials);
                return user.initials;
            }
        }

        // Fallback: используем имя пользователя из _user
        const userName = this.myApp.globals.voc["_user"][userId];
        // console.log(`Fallback userName for ${userId}:`, userName);

        if (userName) {
            const words = userName.split(' ');
            let initials;
            if (words.length >= 2) {
                initials = (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
            } else {
                initials = userName.substring(0, 2).toUpperCase();
            }
            // console.log(`Generated initials:`, initials);
            return initials;
        }

        // console.log('No initials found, returning ??');
        return "??";
    }

    destroy() {
        this.stopPinging();
        // Очищаем слушатели событий если нужно
    }
}
