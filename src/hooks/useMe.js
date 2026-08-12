import { useEffect, useSyncExternalStore } from 'react';
import { apiFetch } from '../lib/api.js';

/**
 * Спільний (на всю сторінку) кеш GET /api/me — bootstrap поточного
 * користувача (профіль для сайдбару + settings.ui.* для інтерфейсу).
 *
 * Це САМЕ модульний singleton, а не React Context/react-query: сторінка
 * складається з ДЕКІЛЬКОХ незалежних React-дерев (глобальні острівці типу
 * NotificationBell, змонтовані напряму в Blade-сайдбар, + окреме дерево
 * Inertia-сторінки) — Context між ними не проростає. Singleton-модуль,
 * навпаки, один на весь бандл: усі споживачі (де б їх не змонтували)
 * імпортують той самий об'єкт стану й той самий запит.
 *
 * loadMe() викликається одразу при імпорті модуля (див. виклик унизу файлу)
 * — тобто /api/me летить одним з перших запитів на кожній сторінці, а не в
 * момент, коли якийсь компонент про нього згадає.
 *
 * AuthContext (src/context/AuthContext.jsx) сам НЕ фетчить /api/me — він
 * лише споживач цього самого стору (useMe() + setMe() після login/logout),
 * щоб не було двох паралельних запитів на той самий ендпоінт.
 */

let state = { data: null, loading: true, error: null };
let inFlight = null;
const listeners = new Set();

function setState(patch) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
}

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    return state;
}

export function loadMe() {
    if (inFlight) {
        return inFlight;
    }

    inFlight = apiFetch('/api/me')
        .then((payload) => {
            setState({ data: payload?.data ?? null, loading: false, error: null });
            return state.data;
        })
        .catch((error) => {
            setState({ data: null, loading: false, error });
            inFlight = null; // дати шанс повторити запит (reloadMe), а не застрягти в помилці назавжди
            throw error;
        });

    return inFlight;
}

/** Форсований перезапит (напр. кнопка "Спробувати ще раз" при помилці). */
export function reloadMe() {
    inFlight = null;
    setState({ loading: true, error: null });
    return loadMe();
}

/**
 * Пряме встановлення кешу без мережевого запиту — після login/register/logout
 * (AuthContext вже має відповідь бекенду й не повинен ще раз бити /api/me),
 * і при 401 з будь-якого запиту (скидання сесії).
 */
export function setMe(data) {
    inFlight = null;
    setState({ data, loading: false, error: null });
}

/**
 * Точково оновити кеш settings.ui.* одразу після успішного PATCH, щоб усі
 * споживачі на сторінці (напр. майбутній індикатор теми в сайдбарі)
 * побачили нове значення без повторного фетчу. Не викликає мережевий запит.
 */
export function patchUiSettings(patch) {
    if (!state.data) {
        return;
    }

    setState({
        data: {
            ...state.data,
            settings: {
                ...state.data.settings,
                ui: { ...state.data.settings?.ui, ...patch },
            },
        },
    });
}

/**
 * Хук-підписка на спільний кеш /api/me.
 * useSyncExternalStore (не useState+useEffect) — знімок гарантовано
 * синхронний із зовнішнім store навіть якщо fetch резолвиться в проміжку
 * між рендером і монтуванням ефекту підписки.
 */
export function useMe() {
    useEffect(() => {
        loadMe();
    }, []);

    return useSyncExternalStore(subscribe, getSnapshot);
}

loadMe();
