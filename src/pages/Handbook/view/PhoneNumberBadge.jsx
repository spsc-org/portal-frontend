import {Tooltip} from "@material-tailwind/react";
import {format} from "date-fns";
import {detectPhoneType, PHONE_TYPES} from "../shared/lib/detectPhoneType.js";

// Вивід/стилістика конкретного типу — навмисно тут, поруч із розміткою (не в
// detectPhoneType.js, це чиста функція розпізнавання, без UI-знання).
const TYPE_STYLES = {
    [PHONE_TYPES.INTERNAL]: {icon: "fa-solid fa-building", className: "text-blue-600 dark:text-blue-400"},
    [PHONE_TYPES.MOBILE]: {icon: "fa-solid fa-mobile-screen-button", className: "text-emerald-600 dark:text-emerald-400"},
    [PHONE_TYPES.OTHER]: {icon: "fa-solid fa-phone", className: "text-gray-600 dark:text-gray-500"},
};
// Один номер телефону + іконка типу (внутрішній/мобільний/інший, за
// detectPhoneType.js) — інкапсулює вивід, щоб пізніше кастомізувати
// презентацію конкретного типу в одному місці. Примітка НЕ виводиться в
// тексті (пряма вимога користувача) — лише у власному тултипі САМЕ цього
// номера (не всього списку номерів запису). Якщо номер хоч раз підтверджено
// (PhoneEntryNumberConfirmation) — маленька зелена галочка одразу в списку
// (не шеврон — той асоціюється з розгортанням/напрямом, а не підтвердженням),
// деталі (скільки й хто востаннє) — у тому самому тултипі.
const PhoneNumberBadge = ({phone, note, confirmationsCount = 0, latestConfirmation}) => {
    const style = TYPE_STYLES[detectPhoneType(phone)];
    const isConfirmed = confirmationsCount > 0;

    let tooltipContent = note ? `${phone} (${note})` : phone;
    if (isConfirmed) {
        tooltipContent += latestConfirmation
            ? ` — підтверджень: ${confirmationsCount}, востаннє: ${latestConfirmation.user?.name || "—"}, ${format(new Date(latestConfirmation.created_at), "yyyy-MM-dd HH:mm")}`
            : ` — підтверджень: ${confirmationsCount}`;
    }

    return (
        <Tooltip data-i-doc="component:handbook-phone-number-badge" content={tooltipContent}>
            <span className={`inline-flex items-center gap-1 whitespace-nowrap font-mono ${style.className}`}>
                <i className={`${style.icon} text-[9px]`}></i>{phone}
                {isConfirmed &&
                    <i className="fa-solid fa-circle-check text-[9px] text-green-500 dark:text-green-400"></i>
                }
            </span>
        </Tooltip>
    );
};

export default PhoneNumberBadge;
