import React, {useEffect, useState} from "react";
import {Spinner, Tab, TabPanel, Tabs, TabsBody, TabsHeader} from "@material-tailwind/react";
import toast from "react-hot-toast";
import ConfirmModal from "../../../../Components/Modal/ConfirmModal.jsx";
import {useProfileQuery, useDossierOptionsQuery} from "../../entities/dossier/queries.js";
import {pluralConnections, profileTitle} from "../../entities/dossier/model.js";
import SubjectAvatar from "../../entities/dossier/ui/SubjectAvatar.jsx";
import {summarizeReviewReasons, isProfileRelation, groupConnectionsBySource} from "../../entities/dossierConnection/model.js";
import {
    useConnectionMutations
} from "../../features/manage-connection/useConnectionMutations.js";
import AddConnectionModal from "../../features/manage-connection/AddConnectionModal.jsx";
import {useProfileMutations} from "../../features/manage-profile/useProfileMutations.js";
import DuplicatesPanel from "../../features/search-duplicates/DuplicatesPanel.jsx";
import ConnectionCard from "./ConnectionCard.jsx";
import ConnectionCardGroup from "./ConnectionCardGroup.jsx";
import ConnectionListItem from "./ConnectionListItem.jsx";
import ConnectionListItemGroup from "./ConnectionListItemGroup.jsx";
import SearchIndexToggle from "../../shared/ui/SearchIndexToggle.jsx";
import AvatarUploadControl from "./AvatarUploadControl.jsx";
import EditProfileModal from "./EditProfileModal.jsx";
import NoteBlock from "../../shared/ui/NoteBlock.jsx";
import RelatedProfilesSection from "./RelatedProfilesSection.jsx";
import {identifierLabel, sourceLabel} from "../../shared/config/identifiers.js";
import SectionLabel from "../../shared/ui/SectionLabel.jsx";
import ModeratorBlock from "../../shared/ui/ModeratorBlock.jsx";
import TicketsBlock from "../../shared/ui/TicketsBlock.jsx";
import ReferenceChip from "../../shared/ui/ReferenceChip.jsx";
import SanctionsStatusBadge from "../../shared/ui/SanctionsStatusBadge.jsx";
import TicketsButton from "../TicketsModal/TicketsButton.jsx";
import {ENTITY_PROFILE} from "../../entities/dossierTicket/model.js";
import DossierAuditModal from "./DossierAuditModal.jsx";

const metaChip = "text-[11px] font-medium font-mono text-slate-600 bg-slate-100 px-[9px] py-1 rounded-[7px] dark:bg-slate-800 dark:text-slate-300";

// Ключ localStorage per-профіль — при зміні досьє (інший profileId) вибір звʼязку
// природно "скидається", бо ключ інший; персиста жодного ручного reset-ефекту не треба.
const connectionStorageKey = (profileId) => `dossier-lastConnection-${profileId}`;

// Права панель деталей профілю (за макетом): хедер з чипами id/subject_type_id/drs_id,
// банер needs_review, панель кандидатів-дублікатів, картки підключень.
const ProfileDetailPane = ({profileId, canManage, canDeleteProfile, canReadAudit, currentUserId, onProfileDeleted, onSelectProfile}) => {
    const {data: profile, isFetching, isError} = useProfileQuery(profileId);
    const {data: options} = useDossierOptionsQuery();

    // Збережене (URL ?view= або localStorage) досьє могло бути видалене з того часу —
    // самозагоєння: скидаємо вибір замість зависання на помилці завантаження.
    useEffect(() => {
        if (isError) {
            onProfileDeleted?.();
        }
    }, [isError, onProfileDeleted]);
    const {linkMutation, confirmMutation, unconfirmMutation, unlinkMutation, voidMutation, updateNoteMutation: updateConnectionNoteMutation} = useConnectionMutations(profileId);
    const {deleteProfileMutation, uploadAvatarMutation, deleteAvatarMutation, updateCaptionMutation, updateNoteMutation, refreshStatusMutation} = useProfileMutations(profileId);
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [isAddConnectionOpen, setIsAddConnectionOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [unlinkTarget, setUnlinkTarget] = useState(null);
    const [voidTarget, setVoidTarget] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAvatarDeleteConfirm, setShowAvatarDeleteConfirm] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [activeTab, setActiveTab] = useState("connections");
    const [selectedConnectionId, setSelectedConnectionId] = useState(null);

    // Досьє змінилось — відновлюємо востаннє обраний звʼязок САМЕ ДЛЯ ЦЬОГО досьє
    // (ключ localStorage прив'язаний до profileId, тож чуже значення сюди не потрапить).
    // Якщо нічого не збережено — за замовчуванням перший звʼязок за порядком (не
    // profile-relation); ефект перезапускається, коли профіль довантажиться (profile
    // ще може бути undefined на момент зміни profileId).
    useEffect(() => {
        if (!profileId) {
            setSelectedConnectionId(null);
            return;
        }

        const stored = localStorage.getItem(connectionStorageKey(profileId));
        if (stored) {
            setSelectedConnectionId(Number(stored));
            return;
        }

        const firstConnection = (profile?.connections ?? []).find((c) => !isProfileRelation(c));
        setSelectedConnectionId(firstConnection ? firstConnection.id : null);
    }, [profileId, profile]);

    const selectConnection = (id) => {
        setSelectedConnectionId(id);
        if (!profileId) return;
        if (id) {
            localStorage.setItem(connectionStorageKey(profileId), String(id));
        } else {
            localStorage.removeItem(connectionStorageKey(profileId));
        }
    };

    // Той самий патерн, що й handleCopyLink у TaskViewPanel.jsx.
    const handleCopyLink = () => {
        const url = `${window.location.origin}${window.location.pathname}?view=${profileId}`;
        navigator.clipboard?.writeText(url)
            .then(() => toast.success("Посилання скопійовано"))
            .catch(() => toast.error("Не вдалося скопіювати посилання"));
    };

    // Назва й примітка редагуються разом (одна модалка, EditProfileModal) — чекаємо на
    // ОБИДВА PATCH перед закриттям, щоб помилка одного не закрила форму передчасно
    // (успіх кожної мутації вже сам оновлює кеш деталей профілю, окремий toast тут не
    // потрібен — жодна з двох мутацій його й раніше не показувала).
    const handleSaveProfile = ({caption, note}) => {
        const captionChanged = caption !== (profile?.view_caption ?? "");
        const noteChanged = note !== (profile?.note ?? "");

        if (!captionChanged && !noteChanged) {
            setIsEditProfileOpen(false);
            return;
        }

        const tasks = [];
        if (captionChanged) {
            tasks.push(new Promise((resolve, reject) => updateCaptionMutation.mutate(caption, {onSuccess: resolve, onError: reject})));
        }
        if (noteChanged) {
            tasks.push(new Promise((resolve, reject) => updateNoteMutation.mutate(note, {onSuccess: resolve, onError: reject})));
        }

        Promise.all(tasks)
            .then(() => setIsEditProfileOpen(false))
            .catch(() => {}); // помилка вже показана toast-ом усередині відповідної мутації
    };

    if (!profileId) {
        return (
            <main
                className="flex-auto min-w-0 flex flex-col items-center justify-center gap-3.5 text-gray-400 bg-gray-100 dark:bg-gray-900">
                <i className="fa-solid fa-hand-pointer text-[34px] text-slate-300 dark:text-slate-600"></i>
                <div className="text-sm font-semibold">Оберіть профіль зі списку зліва</div>
            </main>
        );
    }

    if (isFetching && !profile) {
        return (
            <main className="flex-auto min-w-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Spinner className="h-10 w-10"/>
            </main>
        );
    }

    const connections = profile?.connections ?? [];
    const relations = connections.filter(isProfileRelation);
    const dedupConnections = connections.filter((c) => !isProfileRelation(c));
    const reviewConnections = dedupConnections.filter((connection) => connection.needs_review);
    const conflictConnections = reviewConnections.filter((connection) => connection.review_reason === "conflict");
    const otherReviewConnections = reviewConnections.filter((connection) => connection.review_reason !== "conflict");
    const selectedConnection = dedupConnections.find((c) => c.id === selectedConnectionId) ?? null;
    const isPending = confirmMutation.isPending || unconfirmMutation.isPending || unlinkMutation.isPending || voidMutation.isPending;

    // Реєстр звʼязків групує рядки за самим ДЖЕРЕЛОМ (model_class+model_id) — той самий
    // проєкт/дія, збіглися по кількох критеріях одночасно (drs_id І tax_id тощо), інакше
    // список показує по кілька майже ідентичних рядків на одне й те саме джерело.
    const connectionGroups = groupConnectionsBySource(dedupConnections);
    const selectedGroup = connectionGroups.find((group) => group.some((c) => c.id === selectedConnectionId)) ?? [];

    return (
        <main data-i-doc="view:sanction-profiles-detail-pane" className="flex-auto min-w-0 flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900">
            {/* Картка профілю — завжди вгорі (не прокручується разом з контентом нижче) */}
            <div className="flex-none w-full max-w-[1240px] mx-auto px-3 pt-[26px]">
                <SectionLabel>Картка досьє</SectionLabel>
                <div
                    className="bg-white border border-gray-200 rounded-[14px] shadow-sm px-6 py-[22px] dark:bg-gray-900 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                        <div className="flex-none w-[54px] h-[54px]">
                            <SubjectAvatar
                                subjectTypeId={profile?.subject_type_id}
                                avatarUrl={profile?.avatar_url}
                                caption={profileTitle(profile)}
                                size="lg"
                            />
                        </div>
                        <div className="flex-auto min-w-0">
                            <span className="inline-flex items-center gap-2 text-[21px] font-bold text-gray-900 dark:text-gray-100">
                                {profileTitle(profile)}
                                {profile?.view_caption_edited && (
                                    <i
                                        className="fa-solid fa-circle-check text-[13px] text-green-500 dark:text-green-400"
                                        title="Назву відредаговано вручну (не згенерована з ДРС)"
                                    ></i>
                                )}
                                <button
                                    type="button"
                                    onClick={handleCopyLink}
                                    title="Скопіювати посилання на цю картку"
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                                >
                                    <i className="fa-regular fa-link text-[13px]"></i>
                                </button>
                            </span>
                            <div className="flex flex-wrap items-center gap-[7px] mt-[11px]">
                                <ReferenceChip icon="fa-solid fa-folder" label="Досьє" value={`#${profile?.id ?? "—"}`} copyValue={profile?.id}/>
                                <ReferenceChip icon="fa-solid fa-landmark" label="ДРС" value={`#${profile?.drs_id ?? "—"}`} copyValue={profile?.drs_id}/>
                                <SanctionsStatusBadge
                                    status={profile?.ua_sanctions_status}
                                    daysRemaining={profile?.ua_sanctions_days_remaining}
                                />
                            </div>
                            {(Object.keys(profile?.identity_data ?? {}).length > 0 || profile?.source_files?.length > 0) && (
                                <div className="grid grid-cols-2 gap-x-5 mt-[9px]">
                                    <div>
                                        {Object.keys(profile?.identity_data ?? {}).length > 0 && (
                                            <>
                                                <div className="text-[9.5px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">
                                                    Ідентифікатори
                                                </div>
                                                <div className="flex flex-wrap gap-[7px]">
                                                    {Object.entries(profile.identity_data).map(([key, entry]) => (
                                                        <span key={key} className={metaChip}>
                                                            {identifierLabel(key)}: {entry?.value ?? "—"}
                                                            <span className="text-slate-400 dark:text-slate-500 font-normal">
                                                                {" "}· {(entry?.sources ?? []).map(sourceLabel).join(", ") || "—"}
                                                            </span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div>
                                        {profile?.source_files?.length > 0 && (
                                            <>
                                                <div className="text-[9.5px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">
                                                    Файли
                                                </div>
                                                <div className="flex flex-wrap gap-[7px]">
                                                    {profile.source_files.map((file, index) => (
                                                        <a
                                                            key={`${file.project_id}-${index}`}
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title={`Проєкт #${file.project_id}`}
                                                            className={`${metaChip} inline-flex items-center gap-[6px] hover:bg-slate-200 dark:hover:bg-slate-700`}
                                                        >
                                                            <i className={`fa-solid ${file.is_image ? "fa-image" : "fa-file"}`}></i>
                                                            {file.original_name ?? `файл (проєкт #${file.project_id})`}
                                                        </a>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            <SearchIndexToggle value={profile?.search_index}/>
                            {/* Лише перегляд — редагування перенесено в "Дії з профілем"
                                (EditProfileModal, разом із назвою, 2026-08-05). */}
                            <NoteBlock value={profile?.note} canEdit={false}/>
                        </div>
                        <div className="flex-none flex flex-col items-end gap-2">
                            <span
                                className="inline-flex items-center gap-[7px] text-[13px] font-semibold text-blue-700 bg-blue-50 px-[13px] py-[7px] rounded-full dark:bg-blue-900/40 dark:text-blue-300">
                                <i className="fa-solid fa-link text-xs"></i>
                                {connections.length} {pluralConnections(connections.length)}
                            </span>
                            <div className="flex items-center gap-2">
                                {canReadAudit && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAuditModal(true)}
                                        title="Історія змін досьє"
                                        className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-full border border-purple-200 bg-white text-purple-700 cursor-pointer transition hover:bg-purple-50 dark:bg-gray-800 dark:border-purple-800 dark:text-purple-300"
                                    >
                                        <i className="fa-regular fa-clock-rotate-left text-[13px]"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-start gap-3 mt-4">
                        <TicketsBlock className="flex-auto min-w-[260px]">
                            <TicketsButton
                                entityType={ENTITY_PROFILE}
                                entityId={profileId}
                                entityLabel={`Досьє #${profileId}`}
                                canManage={canManage}
                            />
                        </TicketsBlock>

                        <ModeratorBlock canManage={canManage} label="Дії з профілем" className="flex-auto min-w-[260px]">
                            <button
                                type="button"
                                onClick={() => setIsAddConnectionOpen(true)}
                                title="Прикріпити до цього досьє відомий проєкт чи ДРС-сутність"
                                className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-full border border-blue-300 bg-white text-blue-700 cursor-pointer transition hover:bg-blue-50 dark:bg-gray-800 dark:border-blue-700 dark:text-blue-300"
                            >
                                <i className="fa-solid fa-link text-[12px]"></i>
                            </button>
                            <AvatarUploadControl
                                profile={profile}
                                isUploading={uploadAvatarMutation.isPending}
                                isDeleting={deleteAvatarMutation.isPending}
                                onUpload={(file) => uploadAvatarMutation.mutate(file)}
                                onRequestDelete={() => setShowAvatarDeleteConfirm(true)}
                            />
                            <button
                                type="button"
                                onClick={() => setIsEditProfileOpen(true)}
                                title="Редагувати назву й примітку"
                                className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-full border border-blue-300 bg-white text-blue-700 cursor-pointer transition hover:bg-blue-50 dark:bg-gray-800 dark:border-blue-700 dark:text-blue-300"
                            >
                                <i className="fa-solid fa-pencil text-[12px]"></i>
                            </button>
                            <button
                                type="button"
                                onClick={() => refreshStatusMutation.mutate()}
                                disabled={refreshStatusMutation.isPending}
                                className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-full border border-blue-300 bg-white text-blue-700 cursor-pointer transition hover:bg-blue-50 disabled:opacity-50 dark:bg-gray-800 dark:border-blue-700 dark:text-blue-300"
                                title="Оновити стан підсанкційності — примусово перерахувати"
                            >
                                <i className={`fa-solid fa-rotate text-[12px] ${refreshStatusMutation.isPending ? "fa-spin" : ""}`}></i>
                            </button>
                            {canDeleteProfile && (
                                <button
                                    type="button"
                                    disabled
                                    title="Видалити профіль — тимчасово заблоковано: легасі-логіка видалення визнана небезпечною, потребує перегляду"
                                    className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-full border border-red-200 bg-white text-red-300 cursor-not-allowed opacity-60 dark:bg-gray-800 dark:border-red-900 dark:text-red-700"
                                >
                                    <i className="fa-solid fa-trash text-[12px]"></i>
                                </button>
                            )}
                        </ModeratorBlock>
                    </div>

                    {conflictConnections.length > 0 && (
                        <div
                            className="flex items-center gap-2.5 mt-4 px-3.5 py-[11px] bg-red-50 border border-red-200 rounded-[10px] text-[12.5px] text-red-800 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300">
                            <i className="fa-solid fa-code-compare text-red-600"></i>
                            Конфлікт джерел ({conflictConnections.length} {pluralConnections(conflictConnections.length)}):
                            цей субʼєкт одночасно збігається і з іншим досьє за іншим критерієм.
                            Перевірте обидва звʼязки — підтвердіть правильний, вилучіть помилковий.
                        </div>
                    )}
                    {otherReviewConnections.length > 0 && (
                        <div
                            className="flex items-center gap-2.5 mt-4 px-3.5 py-[11px] bg-orange-50 border border-orange-200 rounded-[10px] text-[12.5px] text-orange-800 dark:bg-orange-900/40 dark:border-orange-800 dark:text-orange-300">
                            <i className="fa-solid fa-triangle-exclamation text-orange-600"></i>
                            match_hash джерела розійшовся ({otherReviewConnections.length} {pluralConnections(otherReviewConnections.length)} needs_review —{" "}
                            {summarizeReviewReasons(otherReviewConnections)}).
                            Підтвердіть (confirm) або перенесіть/вилучіть зв'язок.
                        </div>
                    )}
                </div>
            </div>

            {/* Контент нижче картки — самостійна прокрутка, картка вгорі лишається на місці */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="max-w-[1240px] mx-auto px-3 pb-[60px]">
                {showDuplicates && (
                    <DuplicatesPanel onClose={() => setShowDuplicates(false)} canLink={canManage}/>
                )}

                <Tabs value={activeTab}>
                    <TabsHeader
                        className="rounded-none border-b border-gray-200 !bg-transparent p-0 mt-[22px] dark:border-gray-700"
                        indicatorProps={{
                            className: "bg-transparent border-b-2 border-blue-600 shadow-none rounded-none",
                        }}
                    >
                        {}
                        <Tab data-i-doc="tab:sanction-profiles-connections"
                            value="connections"
                            onClick={() => setActiveTab("connections")}
                            className={`flex-none w-auto px-1 py-2.5 text-[13px] ${
                                activeTab === "connections" ? "text-blue-700 font-semibold dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <i className="fa-solid fa-link text-xs"></i>
                                Зв'язки
                                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    {connectionGroups.length}
                                </span>
                            </span>
                        </Tab>
                        {}
                        <Tab data-i-doc="tab:sanction-profiles-relations"
                            value="relations"
                            onClick={() => setActiveTab("relations")}
                            className={`flex-none w-auto px-1 py-2.5 text-[13px] ${
                                activeTab === "relations" ? "text-blue-700 font-semibold dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <i className="fa-solid fa-people-arrows text-xs"></i>
                                Пов'язані профілі
                                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    {relations.length}
                                </span>
                            </span>
                        </Tab>
                    </TabsHeader>

                    <TabsBody>
                        <TabPanel value="connections" className="p-0 pt-[15px]">
                            {!dedupConnections.length ? (
                                <div className="py-6 text-center text-sm text-gray-400">Джерела ще не привʼязані.</div>
                            ) : (
                                <div className="flex items-start gap-4">
                                    {/* Реєстр звʼязків — короткий перелік, клік відкриває картку праворуч.
                                        50%/50% з Карткою звʼязку (calc враховує gap-4 між ними).
                                        sticky top-0 — лишається на місці, коли гортаєш довгу картку
                                        звʼязку праворуч (сама stick-точка — верх зони прокрутки під
                                        карткою досьє, бо саме ця зона тут scroll-контейнер). */}
                                    <div className="flex-none w-[calc(50%-8px)] sticky top-0 bg-gray-100 dark:bg-gray-900">
                                        <SectionLabel>Реєстр звʼязків</SectionLabel>
                                        <div className="flex flex-col gap-1.5 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
                                            {connectionGroups.map((group) => (
                                                group.length > 1 ? (
                                                    <ConnectionListItemGroup
                                                        key={group[0].id}
                                                        connections={group}
                                                        isActive={group.some((c) => c.id === selectedConnectionId)}
                                                        onClick={() => selectConnection(group[0].id)}
                                                    />
                                                ) : (
                                                    <ConnectionListItem
                                                        key={group[0].id}
                                                        connection={group[0]}
                                                        isActive={group[0].id === selectedConnectionId}
                                                        onClick={() => selectConnection(group[0].id)}
                                                    />
                                                )
                                            ))}
                                        </div>
                                    </div>

                                    {/* Картка звʼязку — деталі обраного зліва; та сама ширина (50%) */}
                                    <div className="flex-none w-[calc(50%-8px)]">
                                        <SectionLabel>Картка звʼязку</SectionLabel>
                                        {selectedGroup.length > 1 ? (
                                            <ConnectionCardGroup
                                                connections={selectedGroup}
                                                canManage={canManage}
                                                currentUserId={currentUserId}
                                                onConfirm={(id) => confirmMutation.mutate(id)}
                                                onUnconfirm={(id) => unconfirmMutation.mutate(id)}
                                                onVoid={setVoidTarget}
                                                onUpdateNote={(connectionId, note) => updateConnectionNoteMutation.mutate({connectionId, note})}
                                                isNotePending={updateConnectionNoteMutation.isPending}
                                                onUnlink={setUnlinkTarget}
                                                isPending={isPending}
                                            />
                                        ) : selectedConnection ? (
                                            <ConnectionCard
                                                connection={selectedConnection}
                                                canManage={canManage}
                                                currentUserId={currentUserId}
                                                onConfirm={(id) => confirmMutation.mutate(id)}
                                                onUnconfirm={(id) => unconfirmMutation.mutate(id)}
                                                onVoid={setVoidTarget}
                                                onUpdateNote={(connectionId, note) => updateConnectionNoteMutation.mutate({connectionId, note})}
                                                isNotePending={updateConnectionNoteMutation.isPending}
                                                onUnlink={setUnlinkTarget}
                                                isPending={isPending}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl dark:border-gray-700">
                                                <i className="fa-solid fa-hand-pointer text-2xl text-slate-300 dark:text-slate-600"></i>
                                                <div className="text-sm font-medium">Оберіть звʼязок зі списку зліва</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </TabPanel>
                        <TabPanel value="relations" className="p-0 pt-[15px]">
                            <RelatedProfilesSection
                                profileId={profileId}
                                relations={relations}
                                canManage={canManage}
                                onSelectProfile={onSelectProfile}
                            />
                        </TabPanel>
                    </TabsBody>
                </Tabs>
                </div>
            </div>

            <ConfirmModal
                open={Boolean(unlinkTarget)}
                onClose={() => setUnlinkTarget(null)}
                onConfirm={() =>
                    unlinkMutation.mutate(
                        {connectionId: unlinkTarget.id},
                        {onSuccess: () => setUnlinkTarget(null)},
                    )
                }
                title="Вилучити зв'язок"
                message={`Прибрати джерело «${unlinkTarget?.source_caption ?? `#${unlinkTarget?.model_id}`}» зі складу цього профілю?`}
                isLoading={unlinkMutation.isPending}
            />

            <ConfirmModal
                open={Boolean(voidTarget)}
                onClose={() => setVoidTarget(null)}
                onConfirm={() =>
                    voidMutation.mutate(
                        {connectionId: voidTarget.id},
                        {onSuccess: () => setVoidTarget(null)},
                    )
                }
                title="Позначити звʼязок нікчемним"
                message={`Звʼязок із «${voidTarget?.source_caption ?? `#${voidTarget?.model_id}`}» лишиться в реєстрі, але буде позначений як нікчемний (помилковий). Продовжити?`}
                isLoading={voidMutation.isPending}
            />

            <ConfirmModal
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() =>
                    deleteProfileMutation.mutate(undefined, {
                        onSuccess: () => {
                            setShowDeleteConfirm(false);
                            onProfileDeleted?.();
                        },
                    })
                }
                title="Видалити профіль"
                message="Профіль і всі його зв'язки буде видалено. Дію неможливо скасувати."
                isLoading={deleteProfileMutation.isPending}
            />

            <ConfirmModal
                open={showAvatarDeleteConfirm}
                onClose={() => setShowAvatarDeleteConfirm(false)}
                onConfirm={() =>
                    deleteAvatarMutation.mutate(undefined, {
                        onSuccess: () => setShowAvatarDeleteConfirm(false),
                    })
                }
                title="Видалити фото профілю"
                message="Поточне фото профілю буде видалено. Дію неможливо скасувати."
                isLoading={deleteAvatarMutation.isPending}
            />

            {isAddConnectionOpen && (
                <AddConnectionModal
                    open={isAddConnectionOpen}
                    isPending={linkMutation.isPending}
                    onClose={() => setIsAddConnectionOpen(false)}
                    onConfirm={({modelClass, modelId}) =>
                        linkMutation.mutate(
                            {modelClass, modelId},
                            {onSuccess: () => setIsAddConnectionOpen(false)}
                        )
                    }
                />
            )}

            {isEditProfileOpen && (
                <EditProfileModal
                    open={isEditProfileOpen}
                    profile={profile}
                    isPending={updateCaptionMutation.isPending || updateNoteMutation.isPending}
                    onClose={() => setIsEditProfileOpen(false)}
                    onConfirm={handleSaveProfile}
                />
            )}

            {showAuditModal && (
                <DossierAuditModal
                    profileId={profileId}
                    users={options?.users}
                    onClose={() => setShowAuditModal(false)}
                />
            )}
        </main>
    );
};

export default ProfileDetailPane;
