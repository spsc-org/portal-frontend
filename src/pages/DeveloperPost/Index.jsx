import { observer } from "mobx-react-lite";
import { useSearchParams } from "react-router";
import { useViewModel } from "../../shared/mvvm/index.js";
import DeveloperLayout from "../../components/Developer/DeveloperLayout.jsx";
import { DeveloperPostBoardViewModel } from "./viewmodel/DeveloperPostViewModels.js";
import DeveloperPostList from "./view/DeveloperPostList.jsx";
import DeveloperPostDetailPane from "./view/DeveloperPostDetailPane.jsx";
import DeveloperPostFormModal from "./view/DeveloperPostFormModal.jsx";

const NoAccess = () => (
    <DeveloperLayout active="posts">
        <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                <i className="fa-solid fa-lock mb-2 text-xl"></i>
                <p>Немає доступу до блогу розробників.</p>
            </div>
        </div>
    </DeveloperLayout>
);

const DeveloperPostBoard = observer(({ vm }) => {
    const [, setSearchParams] = useSearchParams();
    const select = (id) => {
        vm.select(id);
        setSearchParams((params) => {
            if (id) params.set("view", id);
            else params.delete("view");
            return params;
        }, { replace: true });
    };

    if (!vm.canRead) return <NoAccess/>;

    return (
        <DeveloperLayout data-i-doc="page:developer-post" active="posts">
            <div className="flex h-full overflow-hidden bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                <DeveloperPostList vm={vm} onSelect={select}/>
                <DeveloperPostDetailPane vm={vm} onDeleted={() => select(null)}/>
                {vm.createOpen && <DeveloperPostFormModal onClose={vm.closeCreate} onCreated={select}/>}
            </div>
        </DeveloperLayout>
    );
});

/** Маршрут /developer-posts (auth; читання гейтиться developer-posts.read). */
export default function DeveloperPostPage() {
    const [searchParams] = useSearchParams();
    const vm = useViewModel((deps) => new DeveloperPostBoardViewModel({ ...deps, initialViewId: searchParams.get("view") }));
    return <DeveloperPostBoard vm={vm} />;
}
