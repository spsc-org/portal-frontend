import {DictionaryPageShell} from "./DictionaryLayout.jsx";
import VesselCallSigns from "./Components/VesselCallSigns.jsx";

export default function VesselCallSignsPage() {
    return (
        <DictionaryPageShell title="Позивні сигнали судна">
            <VesselCallSigns/>
        </DictionaryPageShell>
    );
}
