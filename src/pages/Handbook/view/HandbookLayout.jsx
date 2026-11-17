import { observer } from "mobx-react-lite";
import SecondaryNavLayout from "../../../components/SecondaryNav/SecondaryNavLayout.jsx";
import { filterAccessibleNavItems } from "../../../components/SecondaryNav/filterAccessibleNavItems.js";
import { useSession } from "../../../stores/storeHooks.js";
import { HANDBOOK_NAVIGATION } from "../shared/config/navigation.js";

/** Друге меню Довідників; пункти без доступу (me.access.pages) не рендеряться. */
const HandbookLayout = ({ active, children, "data-i-doc": dataIDoc }) => {
    const { me } = useSession();
    const items = filterAccessibleNavItems(HANDBOOK_NAVIGATION, me?.access?.pages ?? []);

    return (
        <SecondaryNavLayout data-i-doc={dataIDoc} title="Довідники" items={items} active={active}>
            {children}
        </SecondaryNavLayout>
    );
};

export default observer(HandbookLayout);
