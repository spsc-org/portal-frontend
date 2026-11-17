import { useCallback, useLayoutEffect, useRef, useState } from "react";

const MARGIN = 4;
const CLOSED_PLACEMENT = { side: "right", shiftTop: 0 };

// Позиція плаваючої панелі (контекстне меню) у точці (x, y), зсунута так, щоб не вилазила
// за межі вікна — як легасі TableManager.#showContextMenu(). Вимір — до відмальовки (layout effect).
export const useViewportClamp = (ref, x, y) => {
    const [position, setPosition] = useState({ left: x, top: y, measured: false });

    useLayoutEffect(() => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setPosition({
            left: Math.max(MARGIN, Math.min(x, window.innerWidth - rect.width - MARGIN)),
            top: Math.max(MARGIN, Math.min(y, window.innerHeight - rect.height - MARGIN)),
            measured: true,
        });
    }, [ref, x, y]);

    return position;
};

// Підменю: праворуч від батьківського пункту, а якщо не вміщається — ліворуч; знизу — зсув угору.
export const useSubmenuPlacement = (ref, open) => {
    const [placement, setPlacement] = useState(CLOSED_PLACEMENT);

    useLayoutEffect(() => {
        if (!open) return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setPlacement({
            side: rect.right > window.innerWidth - MARGIN ? "left" : "right",
            shiftTop: rect.bottom > window.innerHeight - MARGIN ? window.innerHeight - MARGIN - rect.bottom : 0,
        });
        // Лише на відкриття: після зсуву rect інший, повторний вимір дав би "стрибок"
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // reset — на закриття (з обробника події): наступне відкриття міряє панель без старого зсуву
    const reset = useCallback(() => setPlacement(CLOSED_PLACEMENT), []);
    return [placement, reset];
};

// ViewModel підменю: відкрите на hover батьківського пункту + розміщення в межах вікна
export const useSubmenuViewModel = () => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const [placement, resetPlacement] = useSubmenuPlacement(ref, open);

    return {
        open,
        ref,
        placement,
        onEnter: useCallback(() => setOpen(true), []),
        onLeave: useCallback(() => {
            setOpen(false);
            resetPlacement();
        }, [resetPlacement]),
    };
};
