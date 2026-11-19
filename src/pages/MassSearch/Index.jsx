import {useState} from "react";
import Page from "../../components/Page.jsx";
import {DictionaryProvider} from "../Dictionary/DictionaryContext.jsx";
import JobsTable from "./widgets/JobsTable/JobsTable.jsx";
import ImportMassSearchJobModal from "./features/import-job/ImportMassSearchJobModal.jsx";

// Етап 1 (2026-11-11): сторінка + двокроковий імпорт Excel-списку субʼєктів,
// збережений як "завдання" з історією. Сам пошук по консолідованому масиву
// (ds_consolidated, той самий SearchService, що й /search) — окремий,
// пізніший етап; тут лише імпорт і перегляд даних перед запуском.
const MassSearchIndex = () => {
    const [isImportOpen, setIsImportOpen] = useState(false);

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:mass-search" className="mt-2 mx-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-200">Масовий пошук</h1>
                        <button type="button" onClick={() => setIsImportOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700">
                            <i className="fa-solid fa-plus"></i>
                            Новий масовий пошук
                        </button>
                    </div>

                    <JobsTable/>

                    <ImportMassSearchJobModal
                        open={isImportOpen}
                        onClose={() => setIsImportOpen(false)}
                    />
                </div>
            </Page>
        </DictionaryProvider>
    );
};

export default MassSearchIndex;
