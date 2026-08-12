import React, {useState} from "react";
import {usePage} from "@inertiajs/react";
import AnnouncementList from "./widgets/AnnouncementList/AnnouncementList.jsx";
import AnnouncementDetailPane from "./widgets/AnnouncementDetailPane/AnnouncementDetailPane.jsx";
import CreateAnnouncementModal from "./features/create-announcement/CreateAnnouncementModal.jsx";
import {canCreateAnnouncement, canReadAnnouncements} from "./shared/lib/permissions.js";

// Дошка оголошень (master-detail, за зразком архітектури /dossier та /task):
// список зліва, картка справа, deep-link через ?view={id} (як TaskPage/Dossier Index).
const Index = () => {
    const {auth} = usePage().props;
    const [activeId, setActiveId] = useState(() => {
        const view = new URLSearchParams(window.location.search).get("view");
        return view ? Number(view) : null;
    });
    const [openCreate, setOpenCreate] = useState(false);

    const handleSelect = (id) => {
        setActiveId(id);
        const url = new URL(window.location.href);
        if (id) {
            url.searchParams.set("view", id);
        } else {
            url.searchParams.delete("view");
        }
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    };

    if (!canReadAnnouncements(auth)) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    <i className="fa-solid fa-lock mb-2 text-xl"></i>
                    <p>Немає доступу до дошки оголошень.</p>
                </div>
            </div>
        );
    }

    return (
        <div data-i-doc="page:announcement" className="flex h-screen overflow-hidden bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
            <AnnouncementList
                activeId={activeId}
                onSelect={handleSelect}
                canCreate={canCreateAnnouncement(auth)}
                onOpenCreate={() => setOpenCreate(true)}
            />
            <AnnouncementDetailPane
                announcementId={activeId}
                onDeleted={() => handleSelect(null)}
            />
            {openCreate &&
                <CreateAnnouncementModal
                    open={openCreate}
                    onClose={() => setOpenCreate(false)}
                    onCreated={(id) => handleSelect(id)}
                />
            }
        </div>
    );
};

export default Index;
