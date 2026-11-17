import { useEffect } from "react";
import toast from "react-hot-toast";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/storeHooks.js";

/**
 * Монтується один раз у app.jsx (поруч з CreateIssueGlobalModal, у
 * #global-modals — присутній і на Inertia-, і на legacy Blade-сторінках).
 * Нічого не рендерить сам — лише тримає клас `.i-doc-visible` на <body> в
 * синхроні з cookie `showIDocLabels` (UiStore). Сама
 * візуалізація (кольорові смужки над [data-i-doc]-елементами) — чистий
 * CSS (resources/css/app.css), вмикається/вимикається цим класом.
 * Вимкнено — компонент не робить нічого, окрім підписки на ui.showIDocLabels (cookie).
 *
 * Клік по смужці — єдина інтерактивна частина, тому єдина, де потрібен
 * JS: пряме додавання своїх кнопок/обробників у 96 позначених місцях
 * суперечило б задуму "дизайн і поведінка в одному місці", тож клік
 * ловиться одним делегованим слухачем на document (лише поки showIDocLabels
 * увімкнено) — перевіряє, чи клік влучив саме в зону смужки (перші
 * --i-doc-label-height пікселів найближчого [data-i-doc]-предка), а не в
 * контент під нею.
 */
const IDocVisibility = () => {
    const { ui } = useStores();
    const visible = ui.showIDocLabels;

    useEffect(() => {
        document.body.classList.toggle("i-doc-visible", visible);
    }, [visible]);

    useEffect(() => {
        if (!visible) return;

        const labelHeight = parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--i-doc-label-height")
        ) || 15;

        const handleClick = (event) => {
            const target = event.target.closest("[data-i-doc]");
            if (!target) return;

            // ::before малюється в content-box, тобто зсунутий від краю
            // border-box на padding-top/border-top елемента — без цього
            // клік по видимій смужці на будь-якому елементі з відступом
            // (напр. p-3) не влучав у розраховану зону.
            const rect = target.getBoundingClientRect();
            const style = getComputedStyle(target);
            const insetTop = (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.paddingTop) || 0);
            const insetLeft = (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.paddingLeft) || 0);
            const insetRight = (parseFloat(style.borderRightWidth) || 0) + (parseFloat(style.paddingRight) || 0);
            const labelTop = rect.top + insetTop;

            const withinLabelStrip = event.clientY >= labelTop
                && event.clientY - labelTop <= labelHeight
                && event.clientX >= rect.left + insetLeft
                && event.clientX <= rect.right - insetRight;
            if (!withinLabelStrip) return;

            event.preventDefault();
            event.stopPropagation();

            const tag = target.getAttribute("data-i-doc");
            navigator.clipboard.writeText(tag)
                .then(() => toast.success(`Скопійовано: ${tag}`))
                .catch(() => toast.error("Не вдалося скопіювати в буфер"));
        };

        // capture-фаза — щоб перехопити клік раніше за обробники самого
        // елемента (напр. кнопку) і не спричинити її дію заразом з копіюванням.
        document.addEventListener("click", handleClick, true);
        return () => document.removeEventListener("click", handleClick, true);
    }, [visible]);

    return null;
};

export default observer(IDocVisibility);
