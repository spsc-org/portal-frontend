import {DictionaryPageShell} from "./DictionaryLayout.jsx";
import DictionaryIdentify from "./Components/DictionaryIdentify.jsx";

export default function IdentifyPage() {
    return (
        <DictionaryPageShell title="Ідентифікатори">
            <DictionaryIdentify/>
        </DictionaryPageShell>
    );
}
