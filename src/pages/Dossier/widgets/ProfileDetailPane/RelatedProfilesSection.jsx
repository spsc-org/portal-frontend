import React, {useState} from "react";
import ConfirmModal from "../../../../Components/Modal/ConfirmModal.jsx";
import {subjectType} from "../../shared/config/subjectTypes.js";
import {profileTitle} from "../../entities/dossier/model.js";
import {useProfileRelationMutations} from "../../features/manage-profile-relations/useProfileRelationMutations.js";
import AddRelationModal from "../../features/manage-profile-relations/AddRelationModal.jsx";

// Секція "Пов'язані профілі" (profile↔profile, напр. родинні звʼязки) —
// окремо від секції "Зв'язки" (profile↔джерело). Показує related_profile,
// connection_type, note; додавання — кнопкою-тригером, що відкриває
// AddRelationModal (i-doc:modal:sanction-profiles-add-relation).
const RelatedProfilesSection = ({profileId, relations, canManage, onSelectProfile}) => {
    const {linkMutation, unlinkMutation} = useProfileRelationMutations(profileId);
    const [unlinkTarget, setUnlinkTarget] = useState(null);
    const [showAddRelation, setShowAddRelation] = useState(false);

    return (
        <span data-i-doc="component:sanction-profiles-related-profiles-section" style={{display: "contents"}}>
            <div className="bg-white border border-gray-200 rounded-[14px] shadow-sm overflow-hidden dark:bg-gray-900 dark:border-gray-700">
                {relations.length === 0 && (
                    <div className="py-6 text-center text-sm text-gray-400">Пов'язаних профілів ще немає.</div>
                )}

                {relations.map((connection) => {
                    const related = connection.related_profile;
                    const type = related ? subjectType(related.subject_type_id) : subjectType(null);

                    return (
                        <div
                            key={connection.id}
                            className="flex items-start gap-3.5 px-5 py-3.5 border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                        >
                            <div className={`flex-none w-9 h-9 rounded-full flex items-center justify-center text-[13px] ${type.avatarClasses}`}>
                                <i className={type.icon}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <button
                                    type="button"
                                    onClick={() => related && onSelectProfile?.(related.id)}
                                    className="text-[14px] font-semibold text-blue-700 hover:underline dark:text-blue-400 text-left"
                                >
                                    {related ? profileTitle(related) : `Профіль #${connection.model_id}`}
                                </button>
                                <div className="flex items-center gap-[7px] flex-wrap mt-1.5">
                                    <span className="text-[10.5px] font-semibold px-2 py-[3px] rounded-md bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                                        {connection.connection_type?.caption ?? "звʼязок"}
                                    </span>
                                </div>
                                {connection.note && (
                                    <div className="text-[12px] text-gray-500 mt-1.5 dark:text-gray-400">{connection.note}</div>
                                )}
                            </div>
                            {canManage && (
                                <button
                                    type="button"
                                    disabled={unlinkMutation.isPending}
                                    onClick={() => setUnlinkTarget(connection)}
                                    className="flex-none inline-flex items-center gap-1.5 h-[30px] px-3 border border-red-200 rounded-[9px] bg-white text-[11.5px] font-semibold text-red-600 cursor-pointer transition hover:brightness-95 disabled:opacity-50 dark:bg-gray-800 dark:border-red-800 dark:text-red-400"
                                >
                                    <i className="fa-solid fa-link-slash text-[10px]"></i>Прибрати
                                </button>
                            )}
                        </div>
                    );
                })}

                {canManage && (
                    <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={() => setShowAddRelation(true)}
                            className="inline-flex items-center gap-1.5 h-[34px] px-3.5 border border-blue-200 rounded-[9px] bg-blue-50 text-[12.5px] font-semibold text-blue-700 cursor-pointer transition hover:brightness-[.97] dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300"
                        >
                            <i className="fa-solid fa-plus text-xs"></i>Додати пов'язаний профіль
                        </button>
                    </div>
                )}
            </div>

            {canManage && (
                <AddRelationModal
                    open={showAddRelation}
                    excludeId={profileId}
                    linkMutation={linkMutation}
                    onClose={() => setShowAddRelation(false)}
                />
            )}

            <ConfirmModal
                open={Boolean(unlinkTarget)}
                onClose={() => setUnlinkTarget(null)}
                onConfirm={() =>
                    unlinkMutation.mutate(
                        {connectionId: unlinkTarget.id, relatedProfileId: unlinkTarget.related_profile?.id},
                        {onSuccess: () => setUnlinkTarget(null)}
                    )
                }
                title="Прибрати звʼязок між профілями"
                message={`Прибрати звʼязок із «${unlinkTarget?.related_profile ? profileTitle(unlinkTarget.related_profile) : `#${unlinkTarget?.model_id}`}»?`}
                isLoading={unlinkMutation.isPending}
            />
        </span>
    );
};

export default RelatedProfilesSection;
