import { useSearchParams } from "react-router";
import { observer } from "mobx-react-lite";
import { Tab, TabPanel, Tabs, TabsBody, TabsHeader } from "@material-tailwind/react";
import Page from "../../components/Page.jsx";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import { DictionaryPageViewModel } from "./viewmodel/DictionaryViewModels.js";
import DictionaryIdentify from "./view/DictionaryIdentify.jsx";
import DictionaryIdentifyV2 from "./view/DictionaryIdentifyV2.jsx";
import VesselCallSigns from "./view/VesselCallSigns.jsx";

const TABS = [
    { disabled: false, value: "identify", label: "Ідентифікатори", Component: DictionaryIdentify },
    { disabled: false, value: "identify-v2", label: "Ідентифікатори v2", Component: DictionaryIdentifyV2 },
    { disabled: false, value: "subgroup", label: "Позивні сигнали судна", Component: VesselCallSigns },
    // "Атрибути" — заглушка, вкладка вимкнена (як в Inertia-версії).
    { disabled: true, value: "attributes", label: "Атрибути", Component: () => <div/> },
];

/** Маршрут /dictionary (pageAccess). Словники countries/subjectTypes — /api/spa/pages/dictionary/options. */
const DictionaryPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const vm = useViewModel((deps) => new DictionaryPageViewModel({ ...deps, initialTab: searchParams.get("tab") }));
    // Назва — активна вкладка, breadcrumb — "Словники" (кнопки дає вкладка через PageHeader)
    const activeTab = TABS.find((tab) => tab.value === vm.tab);
    usePageTitle(activeTab?.label ?? "Словники", { breadcrumbs: activeTab ? [{ label: "Словники", href: "/dictionary" }] : null, documentTitle: "Словники" });

    const handleTabChange = (value) => {
        vm.setTab(value);
        setSearchParams((params) => {
            params.set("tab", value);
            return params;
        }, { replace: true });
    };

    return (
        <Page>
            <Tabs value={vm.tab}>
                <div data-i-doc="page:dictionary" className="bg-white dark:bg-slate-800 w-8/12 mx-auto rounded-lg shadow-lg mb-5">
                    <TabsHeader
                        className="rounded-none text-xs border-blue-gray-50 bg-transparent p-0 z-0"
                        indicatorProps={{
                            className: "bg-transparent border-b-2 border-gray-900  shadow-none rounded-none",
                        }}
                    >
                        {TABS.map(({ label, disabled, value }) => (
                            <Tab
                                key={value}
                                value={value}
                                disabled={disabled}
                                onClick={() => handleTabChange(value)}
                                className={`${vm.tab === value ? "text-gray-900 dark:text-slate-100" : ""} text-sm p-0  dark:text-slate-400`}
                            >
                                {label}
                            </Tab>
                        ))}
                    </TabsHeader>
                </div>
                <TabsBody>
                    {TABS.map(({ value, Component }) => (
                        <TabPanel className="p-1 bg-white dark:bg-slate-800" key={value} value={value}>
                            <Component page={vm}/>
                        </TabPanel>
                    ))}
                </TabsBody>
            </Tabs>
        </Page>
    );
};

export default observer(DictionaryPage);
