import { observer } from "mobx-react-lite";
import SecondaryNavLayout from "../../../components/SecondaryNav/SecondaryNavLayout.jsx";
import { filterAccessibleNavItems } from "../../../components/SecondaryNav/filterAccessibleNavItems.js";
import { useSession } from "../../../stores/storeHooks.js";
import { INTEGRATIONS_NAVIGATION } from "../shared/config/navigation.js";

const NoAccess = () => (
    <div className="flex min-h-[50vh] items-center justify-center text-slate-400 dark:text-slate-600">
        <i className="fa-solid fa-lock mr-2"></i>Немає доступу до цього розділу.
    </div>
);

/** Друге меню Інтеграцій; без права — заглушка замість сторінки. */
const IntegrationsLayout = ({ active, canRead = true, children, "data-i-doc": dataIDoc }) => {
    const { me } = useSession();
    const items = filterAccessibleNavItems(INTEGRATIONS_NAVIGATION, me?.access?.pages ?? []);

    return (
        <SecondaryNavLayout data-i-doc={canRead ? dataIDoc : undefined} title="Інтеграції" items={items} active={active}>
            {canRead ? children : <NoAccess/>}
        </SecondaryNavLayout>
    );
};

export default observer(IntegrationsLayout);
