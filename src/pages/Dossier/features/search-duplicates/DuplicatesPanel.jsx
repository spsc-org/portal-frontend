import React, {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {Spinner} from "@material-tailwind/react";
import {MODEL_CLASS_OPTIONS} from "../../shared/config/sourceTypes.js";
import {subjectType} from "../../shared/config/subjectTypes.js";
import {useDuplicatesSearch} from "./useDuplicatesSearch.js";
import {linkConnection} from "../../entities/dossierConnection/api.js";
import {profileTitle} from "../../entities/dossier/model.js";
import {criteriaChipClasses, criteriaList} from "../../entities/dossierConnection/model.js";
import {sanctionProfileKeys} from "../../shared/lib/queryKeys.js";

const scoreColorClasses = (score) => {
    if (score >= 0.95) return "text-green-600 dark:text-green-400";
    if (score >= 0.7) return "text-blue-600 dark:text-blue-400";
    return "text-gray-400";
};

// Inline-панель "Кандидати-дублікати" (за макетом): форма джерела-драфта →
// POST /sanctions/profiles/duplicates → ранжовані кандидати; "Прив'язати" → POST connection.
const DuplicatesPanel = ({onClose, canLink}) => {
    const [modelClass, setModelClass] = useState(String(MODEL_CLASS_OPTIONS[0].id));
    const [modelId, setModelId] = useState("");
    // Заморожене джерело останнього пошуку: "Прив'язати" використовує саме його,
    // щоб редагування полів після пошуку не прив'язало інше джерело.
    const [searchedSource, setSearchedSource] = useState(null);
    const duplicatesSearch = useDuplicatesSearch();
    const queryClient = useQueryClient();

    const linkMutation = useMutation({
        mutationFn: ({profileId}) =>
            linkConnection(profileId, {modelClass: searchedSource.modelClass, modelId: searchedSource.modelId}),
        onSuccess: (_, {profileId}) => {
            toast.success("Джерело прив'язано до профілю-кандидата");
            queryClient.invalidateQueries({queryKey: ["sanction-profiles"]});
            queryClient.invalidateQueries({queryKey: sanctionProfileKeys.detail(profileId)});
        },
        onError: () => toast.error("Не вдалося прив'язати джерело"),
    });

    const handleSearch = () => {
        if (!modelId) return;
        const source = {modelClass: Number(modelClass), modelId: Number(modelId)};
        setSearchedSource(source);
        duplicatesSearch.mutate(source);
    };

    const candidates = duplicatesSearch.data ?? [];

    return (
        <div data-i-doc="component:sanction-profiles-duplicates-panel" className="mt-4 bg-white border border-indigo-200 rounded-[14px] shadow-sm overflow-hidden dark:bg-gray-900 dark:border-indigo-800">
            <div className="flex items-center gap-2.5 px-5 py-[15px] bg-indigo-50 border-b border-indigo-100 dark:bg-indigo-900/60 dark:border-indigo-900">
                <i className="fa-solid fa-clone text-indigo-700 dark:text-indigo-300"></i>
                <div className="flex-1">
                    <div className="text-[13.5px] font-bold text-indigo-800 dark:text-indigo-200">Кандидати-дублікати</div>
                    <div className="text-[11px] font-mono text-indigo-500 mt-px">
                        POST /sanctions/profiles/duplicates · DuplicateFinder::find
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="border-none bg-transparent text-indigo-500 text-xs font-semibold cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                    Сховати
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                <select
                    value={modelClass}
                    onChange={(e) => setModelClass(e.target.value)}
                    className="h-9 px-2.5 border border-gray-300 rounded-lg bg-white text-[12.5px] text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                >
                    {MODEL_CLASS_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>{option.caption}</option>
                    ))}
                </select>
                <input
                    type="number"
                    min={1}
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    placeholder="model_id драфта…"
                    className="h-9 w-40 px-3 border border-gray-300 rounded-lg text-[12.5px] text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                />
                <button
                    type="button"
                    disabled={!modelId || duplicatesSearch.isPending}
                    onClick={handleSearch}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 border-none rounded-lg bg-indigo-600 text-white text-[12.5px] font-semibold cursor-pointer transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <i className="fa-solid fa-magnifying-glass text-[11px]"></i>Знайти
                </button>
            </div>

            {duplicatesSearch.isPending && (
                <div className="flex justify-center py-6"><Spinner className="h-7 w-7"/></div>
            )}
            {duplicatesSearch.isSuccess && candidates.length === 0 && (
                <div className="px-5 py-4 text-[12.5px] text-gray-400">Ймовірних дублікатів не знайдено.</div>
            )}

            {candidates.map((candidate) => {
                const profile = candidate.profile;
                const type = subjectType(profile?.subject_type_id);
                const criteria = criteriaList(candidate.matched_criteria);
                return (
                    <div key={candidate.profile_id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
                        <div className={`flex-none w-10 h-10 rounded-full flex items-center justify-center text-[15px] ${type.avatarClasses}`}>
                            <i className={type.icon}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">
                                {profile ? profileTitle(profile) : `Профіль #${candidate.profile_id}`}
                            </div>
                            {criteria.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {criteria.map((key) => (
                                        <span key={key} className={`text-[10.5px] font-semibold px-2 py-[3px] rounded-md ${criteriaChipClasses(key)}`}>
                                            {key}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex-none text-right">
                            <div className={`text-base font-bold ${scoreColorClasses(candidate.score ?? 0)}`}>
                                {(candidate.score ?? 0).toFixed(2)}
                            </div>
                            <div className="text-[10px] text-gray-400">score</div>
                        </div>
                        {canLink && (
                            <button
                                type="button"
                                disabled={linkMutation.isPending}
                                onClick={() => linkMutation.mutate({profileId: candidate.profile_id})}
                                className="flex-none inline-flex items-center gap-1.5 h-[34px] px-3.5 border-none rounded-[9px] bg-blue-600 text-white text-[12.5px] font-semibold cursor-pointer transition hover:brightness-95 disabled:opacity-50"
                            >
                                <i className="fa-solid fa-link text-[11px]"></i>Прив'язати
                            </button>
                        )}
                    </div>
                );
            })}

            <div className="px-5 py-[11px] text-[11px] text-slate-400 bg-slate-50 dark:bg-gray-800/60">
                <i className="fa-solid fa-circle-info mr-1.5"></i>
                «Прив'язати» → POST connection (origin=manual, confirmed_by=Auth::id()). Точний drs_id-збіг
                score=1.00, решта — релевантність FULLTEXT.
            </div>
        </div>
    );
};

export default DuplicatesPanel;
