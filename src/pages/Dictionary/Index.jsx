import Page from "@/Components/Page.jsx";
import {Tab, TabPanel, Tabs, TabsBody, TabsHeader} from "@material-tailwind/react";
import {useState, useCallback} from "react";

import {DictionaryProvider} from './DictionaryContext';
import DictionaryIdentify from "./Components/DictionaryIdentify.jsx";
import DictionaryIdentifyV2 from "./Components/DictionaryIdentifyV2.jsx";
import VesselCallSigns from "./Components/VesselCallSigns.jsx";
import DictionaryAttributes from "./Components/DictionaryAttributes.jsx";

const TABS = [
    {disabled: false, value: "identify",    label: "Ідентифікатори",        component: <DictionaryIdentify/>},
    {disabled: false, value: "identify-v2", label: "Ідентифікатори v2",     component: <DictionaryIdentifyV2/>},
    {disabled: false, value: "subgroup",    label: "Позивні сигнали судна", component: <VesselCallSigns/>},
    {disabled: true,  value: "attributes",  label: "Атрибути",              component: <DictionaryAttributes/>},
]

const getTabFromUrl = () => {
    const param = new URLSearchParams(window.location.search).get('tab');
    return TABS.find(t => t.value === param) ? param : TABS[0].value;
};

const Index = () => {
    const [tab, setTab] = useState(getTabFromUrl);

    const handleTabChange = useCallback((value) => {
        setTab(value);
        const url = new URL(window.location);
        url.searchParams.set('tab', value);
        window.history.replaceState(null, '', url);
    }, []);

    return (
        <DictionaryProvider>
            <Page>
                <Tabs value={tab}>
                    <div data-i-doc="page:dictionary" className="bg-white dark:bg-slate-800 w-8/12 mx-auto rounded-lg shadow-lg mb-5">
                        <TabsHeader
                            className="rounded-none text-xs border-blue-gray-50 bg-transparent p-0 z-0"
                            indicatorProps={{
                                className: "bg-transparent border-b-2 border-gray-900  shadow-none rounded-none",
                            }}
                        >
                            {TABS.map(({label, disabled, value}) => (<Tab
                                key={value}
                                value={value}
                                disabled={disabled}
                                onClick={() => handleTabChange(value)}
                                className={`${tab === value ? "text-gray-900 dark:text-slate-100" : ""} text-sm p-0  dark:text-slate-400`}
                            >
                                {label}
                            </Tab>))}
                        </TabsHeader>
                    </div>
                    <TabsBody>
                        {TABS.map(({value, component}) => (
                            <TabPanel className="p-1 bg-white dark:bg-slate-800" key={value} value={value}
                                      children={component}/>))}
                    </TabsBody>
                </Tabs>
            </Page>
        </DictionaryProvider>
    );
};

export default Index;
