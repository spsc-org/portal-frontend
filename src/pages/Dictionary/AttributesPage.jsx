import {DictionaryPageShell} from "./DictionaryLayout.jsx";
import DictionaryAttributes from "./Components/DictionaryAttributes.jsx";

export default function AttributesPage() {
    return (
        <DictionaryPageShell title="Атрибути">
            <DictionaryAttributes/>
        </DictionaryPageShell>
    );
}
