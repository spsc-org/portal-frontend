import React, { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { projectQueryClient } from "../entities/project/queryClient.js";
import CartModal from "../components/CartModal/CartModal.jsx";

// Мітка для команди на відкриття модалки — окрема (плоска) Blade-кнопка
// диспатчить `window.dispatchEvent(new CustomEvent("open-project-cart-island"))`,
// цей острівець слухає подію й вмикає своє власне React-дерево. Той самий
// підхід, що й у entities/cart/storage.js (CustomEvent замість window-глобалу) —
// не потребує жодного прямого посилання Blade↔React код-об'єкт.
export const OPEN_EVENT = "open-project-cart-island";

// Цей острівець монтується через lazy `import()` в app.jsx (див. коментар
// там) — на повільній мережі є вікно, коли Blade-кнопка вже клікабельна,
// а сам чанк острівця ще не довантажився й не встиг підписатись на OPEN_EVENT.
// Подія, диспатчена в цьому вікні, губиться безслідно (CustomEvent не буферизує
// себе для майбутніх слухачів). Blade-кнопка тому СИНХРОННО виставляє цей
// прапорець ПЕРЕД диспатчем події — острівець перевіряє його одразу при
// монтуванні (ефект нижче) і, якщо клік уже стався, відкривається одразу.
const PENDING_OPEN_FLAG = "__projectCartOpenPending";
//
// Точка монтування React-острівця "Відібрані проєкти" на легасі-сторінці
// /project (Blade, без Inertia). Монтується ОДИН раз у app.jsx поруч з
// іншими острівцями (global-modals, sidebar) — сюди підуть майбутні
// острівці цієї ж сторінки (див. коментар у app.jsx), тож
// QueryClientProvider свідомо винесений на цей рівень і використовує
// СПІЛЬНИЙ `projectQueryClient` (entities/project/queryClient.js), а не
// власний — щоб словники (entities/project) кешувались один раз на всю
// сторінку, а не окремо для кожного майбутнього острівця.
const CartModalIsland = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (window[PENDING_OPEN_FLAG]) {
            window[PENDING_OPEN_FLAG] = false;
            setIsOpen(true);
        }

        const handler = () => setIsOpen(true);
        window.addEventListener(OPEN_EVENT, handler);
        return () => window.removeEventListener(OPEN_EVENT, handler);
    }, []);

    return (
        <QueryClientProvider client={projectQueryClient}>
            <CartModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </QueryClientProvider>
    );
};

export default CartModalIsland;
