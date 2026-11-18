import MultiSelect from "../../../components/fields/MultiSelect.jsx";

/**
 * Вибір аудиторії оголошення: усім користувачам або обраному списку —
 * спільний для CreateAnnouncementModal і інлайн-редагування в AnnouncementDetailPane.
 */
const AudiencePicker = ({audienceType, onAudienceTypeChange, recipients, onRecipientsChange, users}) => (
    <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Кому видно</label>
        <div className="flex gap-2">
            <button type="button" onClick={() => onAudienceTypeChange("all")}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ${audienceType === "all"
                        ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-400 dark:hover:bg-neutral-700"}`}>
                <i className="fa-solid fa-users mr-1.5"></i>
                Усім користувачам
            </button>
            <button type="button" onClick={() => onAudienceTypeChange("selected")}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ${audienceType === "selected"
                        ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-400 dark:hover:bg-neutral-700"}`}>
                <i className="fa-solid fa-user-check mr-1.5"></i>
                Обраним користувачам
            </button>
        </div>
        {audienceType === "selected" &&
            <div className="mt-2">
                <MultiSelect
                    size="xs"
                    placeholder="Оберіть користувачів…"
                    options={users}
                    value={recipients}
                    onChange={(selected) => onRecipientsChange(selected || [])}
                />
            </div>
        }
    </div>
);

export default AudiencePicker;
