// Portal UI kit — вкладки MT Tabs у модалках: підкреслення primary, неактивні — ink-muted.
//   <TabsHeader {...KIT_TABS_HEADER}> <Tab className={KIT_TAB} activeClassName={KIT_TAB_ACTIVE}> <TabPanel className={KIT_TAB_PANEL}>
export const KIT_TABS_HEADER = {
    className: "rounded-none border-b border-gray-200 bg-transparent p-0 dark:border-neutral-700",
    indicatorProps: { className: "rounded-none border-b-2 border-blue-600 bg-transparent shadow-none dark:border-blue-400" },
};
export const KIT_TAB = "py-2 text-sm text-gray-600 dark:text-gray-400";
export const KIT_TAB_ACTIVE = "font-semibold !text-blue-600 dark:!text-blue-400";
export const KIT_TAB_PANEL = "px-0 pb-0 pt-4 text-gray-700 dark:text-gray-300";
