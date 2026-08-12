import React from "react";
import toast from "react-hot-toast";

// Чип внутрішнього референсу (Досьє #id, ДРС drs_id тощо) — іконка + дрібний підпис
// + значення табличними цифрами, один вигляд для всіх таких ідентифікаторів.
// copyValue — сире значення для копіювання в буфер (без "#"), той самий патерн, що й
// copyProfileId у ProfilesMasterList.jsx. Клікабельним чип стає лише коли є що копіювати
// (не для "—", коли значення відсутнє).
const ReferenceChip = ({icon, label, value, copyValue}) => {
    const isCopyable = copyValue !== null && copyValue !== undefined;

    const handleCopy = (event) => {
        if (!isCopyable) return;
        event.stopPropagation();
        navigator.clipboard.writeText(String(copyValue));
        toast.success(`Скопійовано: ${copyValue}`);
    };

    return (
        <span
            role={isCopyable ? "button" : undefined}
            tabIndex={isCopyable ? 0 : undefined}
            title={isCopyable ? `Скопіювати: ${copyValue}` : undefined}
            onClick={handleCopy}
            onKeyDown={(e) => {
                if (isCopyable && (e.key === "Enter" || e.key === " ")) handleCopy(e);
            }}
            className={`inline-flex items-center gap-[6px] text-[11.5px] font-semibold font-mono text-blue-700 bg-blue-50 px-[10px] py-[5px] rounded-[7px] dark:bg-blue-900/40 dark:text-blue-300 ${
                isCopyable ? "cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/70" : ""
            }`}
        >
            {Boolean(icon) && <i className={`${icon} text-[10px] opacity-60`}></i>}
            <span className="text-[9.5px] font-bold uppercase tracking-wide opacity-60">{label}</span>
            <span className="tabular-nums">{value}</span>
        </span>
    );
};

export default ReferenceChip;
