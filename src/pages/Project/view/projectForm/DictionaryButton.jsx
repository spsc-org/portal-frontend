import { useVM } from "../../../../shared/mvvm/index.js";
import { TOOL_BUTTON } from "./formStyles.js";

/** Кнопка "Словник" біля поля форми — відкриває модалку поповнення словника (vm.vocabularyModal). */
const DictionaryButton = ({ kind, title }) => {
    const { vocabularyModal } = useVM();
    return (
        <button type="button" title={title} className={TOOL_BUTTON} onClick={() => vocabularyModal.open(kind)} data-testid={`dictionary-add-${kind}`}>
            <i className="fa-duotone fa-book-font pointer-events-none" />
        </button>
    );
};

export default DictionaryButton;
