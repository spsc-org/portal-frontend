import { observer } from "mobx-react-lite";
import { useSearchParams } from "react-router";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { ViewModelProvider } from "../../shared/mvvm/ViewModelContext.jsx";
import { ProjectListPageViewModel } from "./viewmodel/ProjectListViewModels.js";
import ProjectListPage from "./widgets/ProjectListPage/ui/ProjectListPage.jsx";
import ProjectToolbar from "./view/ProjectToolbar.jsx";
import ProjectListDialogs from "./view/ProjectListDialogs.jsx";
import CartModal from "./components/CartModal/CartModal.jsx";
import ProjectFormModal from "./view/ProjectFormModal.jsx";
import TicketModal from "./view/TicketModal.jsx";
import ProjectSettingsDialogs from "./view/ProjectSettingsDialogs.jsx";
import ProjectCard, { ProjectCardDock } from "./view/ProjectCard.jsx";
import ConsolidatedResultsModal from "./view/ConsolidatedResultsModal.jsx";
import VocabularyModal from "./view/VocabularyModal.jsx";

/**
 * Маршрут /project — список проєктів (нова версія, колишній /project/v2:
 * resources/views/project-v2.blade.php + ReactPages/Project острівці).
 * Deep link ?fId=… / ?fDecree=…&fAction=… читається один раз при створенні VM.
 */
function ProjectListRoute() {
    const [searchParams] = useSearchParams();
    const vm = useViewModel((deps) => new ProjectListPageViewModel({ ...deps, search: searchParams.toString() }));

    return (
        <ViewModelProvider value={vm}>
            <div className="px-2 py-1.5" data-i-doc="page:project-list-v2">
                <ProjectToolbar vm={vm} />
                <div id="project-list" data-i-doc="widget:project-list">
                    <ProjectListPage vm={vm} />
                </div>
            </div>
            <ProjectCard />
            <ProjectCardDock />
            <ProjectListDialogs vm={vm} />
            <CartModal />
            <ProjectFormModal />
            <ConsolidatedResultsModal />
            <VocabularyModal />
            <TicketModal />
            <ProjectSettingsDialogs />
        </ViewModelProvider>
    );
}

export default observer(ProjectListRoute);
