import { observer } from "mobx-react-lite";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton, HeaderIconButton } from "../../../layouts/app/HeaderButtons.jsx";

/** Назва й кнопки /project у глобальному Header (як тулбар resources/views/project-v2.blade.php). */
const ProjectToolbar = ({ vm }) => (
    <PageHeader
        title="Проєкти"
        actions={
            <>
                {vm.canCreate && (
                    <>
                        <HeaderButton icon="fa-solid fa-plus" onClick={vm.createProject} title="Додати (Ins)" testId="project-add-button">
                            Додати
                        </HeaderButton>
                        <HeaderIconButton icon="fa-regular fa-file-import" to="/project/upload/v2" title="Імпорт проєктів" />
                    </>
                )}
                <HeaderIconButton
                    icon="fa-solid fa-cart-shopping"
                    title="Кошик"
                    onClick={vm.openCart}
                    testId="project-cart-button"
                    badge={vm.cart.ids.length}
                    badgeTestId="project-cart-counter"
                />
                <HeaderIconButton icon="fa-regular fa-filter" title="Фільтр за поданням" onClick={vm.openProposalFilter} />
                <HeaderIconButton icon="fa-solid fa-list-check" title="Правила обґрунтувань" onClick={vm.openReasonRules} />
                <HeaderIconButton icon="fa-solid fa-gear" title="Налаштування" onClick={vm.openSettings} />
                <HeaderIconButton icon="fa-solid fa-file-export" title="Експорт проєктів" onClick={vm.exportProjects} />
            </>
        }
    />
);

export default observer(ProjectToolbar);
