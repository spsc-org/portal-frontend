import { observer } from "mobx-react-lite";
import { useSearchParams } from "react-router";
import { useViewModel } from "../../shared/mvvm/index.js";
import { AnnouncementBoardViewModel } from "./viewmodel/AnnouncementBoardViewModel.js";
import AnnouncementList from "./view/AnnouncementList.jsx";
import AnnouncementDetailPane from "./view/AnnouncementDetailPane.jsx";
import AnnouncementFormModal from "./view/AnnouncementFormModal.jsx";

const NoAccess = () => (
    <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            <i className="fa-solid fa-lock mb-2 text-xl"></i>
            <p>Немає доступу до дошки оголошень.</p>
        </div>
    </div>
);

const AnnouncementBoard = observer(({ vm }) => {
    const [, setSearchParams] = useSearchParams();

    // Deep-link ?view={id} (як TaskPage/Dossier) — через router, без history.replaceState.
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
        <div data-i-doc="page:announcement" className="flex h-full overflow-hidden bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
            <AnnouncementList vm={vm} onSelect={select}/>
            <AnnouncementDetailPane vm={vm} onDeleted={() => select(null)}/>
            {vm.createOpen && <AnnouncementFormModal onClose={vm.closeCreate} onCreated={select}/>}
        </div>
    );
});

/** Маршрут /announcement (auth; читання гейтиться announcement.read). */
export default function AnnouncementPage() {
    const [searchParams] = useSearchParams();
    const vm = useViewModel((deps) => new AnnouncementBoardViewModel({ ...deps, initialViewId: searchParams.get("view") }));
    return <AnnouncementBoard vm={vm} />;
}
