import { observer } from "mobx-react-lite";
import { useSearchParams } from "react-router";
import { Tab, TabPanel, Tabs, TabsBody, TabsHeader } from "@material-tailwind/react";
import Page from "../../../components/Page.jsx";
import { useVM } from "../../../shared/mvvm/viewModelHooks.js";
import AuditTable from "./AuditTable.jsx";

const AuditView = () => {
    const vm = useVM();
    const [, setSearchParams] = useSearchParams();

    // Вкладка синхронізується з ?tab= (замість history.replaceState у Inertia-версії).
    const changeTab = (value) => {
        vm.setTab(value);
        setSearchParams((params) => {
            params.set("tab", value);
            return params;
        }, { replace: true });
    };

    return (
        <Page>
            <Tabs value={vm.tab}>
                <div data-i-doc="page:audit" className="bg-white dark:bg-slate-800 w-8/12 mx-auto rounded-lg shadow-lg mb-5">
                    <TabsHeader
                        className="rounded-none text-xs border-blue-gray-50 bg-transparent p-0 z-0"
                        indicatorProps={{ className: "bg-transparent border-b-2 border-gray-900 shadow-none rounded-none" }}
                    >
                        {vm.tabs.map(({ value, label }) => (
                            <Tab
                                key={value}
                                value={value}
                                onClick={() => changeTab(value)}
                                className={`${vm.tab === value ? "text-gray-900 dark:text-slate-100" : ""} text-sm p-0 dark:text-slate-400`}
                            >
                                {label}
                            </Tab>
                        ))}
                    </TabsHeader>
                </div>
                <TabsBody>
                    {vm.tabs.map(({ value }) => (
                        <TabPanel key={value} value={value} className="p-1 bg-white dark:bg-slate-800">
                            <AuditTable vm={vm.tables[value]}/>
                        </TabPanel>
                    ))}
                </TabsBody>
            </Tabs>
        </Page>
    );
};

export default observer(AuditView);
