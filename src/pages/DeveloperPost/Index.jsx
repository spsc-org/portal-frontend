import React, {useState} from "react";
import {usePage} from "@inertiajs/react";
import DeveloperLayout from "../../Components/Developer/DeveloperLayout.jsx";
import DeveloperPostList from "./widgets/DeveloperPostList/DeveloperPostList.jsx";
import DeveloperPostDetailPane from "./widgets/DeveloperPostDetailPane/DeveloperPostDetailPane.jsx";
import CreateDeveloperPostModal from "./features/create-developer-post/CreateDeveloperPostModal.jsx";
import {canCreateDeveloperPost, canReadDeveloperPosts} from "./shared/lib/permissions.js";

// Блог розробників / реєстр версій (master-detail, за зразком архітектури
// /task та /announcement): список зліва, картка справа, deep-link через
// ?view={id}. Згруповано в сайдбарі з /developer-debug під спільним пунктом
// "Розробка" (DeveloperLayout — secondary-nav цього простору).
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

    if (!canReadDeveloperPosts(auth)) {
        return (
            <DeveloperLayout active="posts">
                <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                        <i className="fa-solid fa-lock mb-2 text-xl"></i>
                        <p>Немає доступу до блогу розробників.</p>
                    </div>
                </div>
            </DeveloperLayout>
        );
    }

    return (
        <DeveloperLayout data-i-doc="page:developer-post" active="posts">
            <div className="flex h-full overflow-hidden bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                <DeveloperPostList
                    activeId={activeId}
                    onSelect={handleSelect}
                    canCreate={canCreateDeveloperPost(auth)}
                    onOpenCreate={() => setOpenCreate(true)}
                />
                <DeveloperPostDetailPane
                    postId={activeId}
                    onDeleted={() => handleSelect(null)}
                />
                {openCreate &&
                    <CreateDeveloperPostModal
                        open={openCreate}
                        onClose={() => setOpenCreate(false)}
                        onCreated={(id) => handleSelect(id)}
                    />
                }
            </div>
        </DeveloperLayout>
    );
};

export default Index;
