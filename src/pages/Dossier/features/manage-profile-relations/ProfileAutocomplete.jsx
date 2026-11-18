import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { ProfileAutocompleteViewModel } from "../../viewmodel/DossierViewModels.js";
import {useEffect, useMemo, useState} from "react";
import {debounce} from "lodash";

import {profileTitle} from "../../entities/dossier/model.js";

// Пошук профілю за іменем (FULLTEXT, переюз GET /sanctions/profiles?q=) для
// вибору "іншого" профілю при додаванні profile-to-profile звʼязку.
const ProfileAutocomplete = ({selected, onSelect, excludeId}) => {
    const vm = useViewModel((deps) => new ProfileAutocompleteViewModel(deps));
    const term = vm.term;
    const setTerm = vm.setTerm;
    const [isOpen, setIsOpen] = useState(false);

    const debouncedSetTerm = useMemo(() => debounce(setTerm, 300), [setTerm]);
    useEffect(() => () => debouncedSetTerm.cancel(), [debouncedSetTerm]);

    const { data, isFetching } = vm.query;

    const candidates = (data?.data ?? []).filter((profile) => profile.id !== excludeId);

    if (selected) {
        return (
            <div className="flex items-center gap-2 h-10 px-3 border border-gray-300 rounded-lg text-[13px] text-gray-900 dark:border-gray-600 dark:bg-neutral-800 dark:text-gray-200">
                <span className="flex-1 truncate">{profileTitle(selected)}</span>
                <button
                    type="button"
                    onClick={() => onSelect(null)}
                    className="text-gray-600 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>
        );
    }

    return (
        <div data-i-doc="component:sanction-profiles-profile-autocomplete" className="relative">
            <input
                type="text"
                placeholder="Пошук профілю за іменем…"
                onInput={(e) => {
                    debouncedSetTerm(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-200"
            />
            {isOpen && term.length >= 2 && (
                <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-neutral-800 dark:border-neutral-700">
                    {isFetching && (
                        <div className="px-3 py-2 text-[12px] text-gray-600">Пошук…</div>
                    )}
                    {!isFetching && candidates.length === 0 && (
                        <div className="px-3 py-2 text-[12px] text-gray-600">Нічого не знайдено.</div>
                    )}
                    {candidates.map((profile) => (
                        <button
                            key={profile.id}
                            type="button"
                            onMouseDown={() => {
                                onSelect(profile);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-[13px] text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-neutral-700"
                        >
                            {profileTitle(profile)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default observer(ProfileAutocomplete);
