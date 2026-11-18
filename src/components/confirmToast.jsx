import toast from "react-hot-toast";
import Button from "./Buttons/Button.jsx"

/**
 * Підтвердження дії тостом (як в Inertia-версії указів): "Скасувати" / "Видалити".
 * onConfirm викликається лише після підтвердження; color — колір кнопки підтвердження.
 */
export function confirmToast(message, onConfirm, { confirmText = "Видалити", color = "red" } = {}) {
    toast((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}   max-w-3xl w-full pointer-events-auto flex items-center gap-x-1 flex-row`}>
                <p className="text-sm font-medium text-gray-900">{message}</p>
                <div className="flex flex-row gap-x-1 ">
                    <Button size="sm" color="white" onClick={() => toast.dismiss(t.id)}>
                        Скасувати
                    </Button>
                    <Button size="sm" color={color} onClick={() => {
                        toast.dismiss(t.id);
                        onConfirm();
                    }}>
                        {confirmText}
                    </Button>
                </div>
            </div>
        ),
        {
            duration: 10000,
            position: 'top-center',
            style: { background: 'dark:dark:bg-neutral-700', color: 'text-gray-600' },
        });
}
