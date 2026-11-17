import { Fragment } from "react";
import { observer } from "mobx-react-lite";
import { Card, IconButton, Switch } from "@material-tailwind/react";
import PermissionValueToggle from "./PermissionValueToggle.jsx";

/** Значення прав модуля (рядок "дія → false/individual/true"). */
export const PermissionActions = ({ actions, values, disabled, onChange }) => (
    <Card className={`${disabled ? "pointer-events-none opacity-25" : ""} w-full overflow-hidden border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900 p-2 shadow-none transition`}>
        <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5">
            {Object.entries(actions || {}).map(([key, options]) => (
                <Fragment key={key}>
                    <p className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300" title={key}>{key}</p>
                    <PermissionValueToggle options={options} value={values?.[key]} onChange={(value) => onChange(key, value)}/>
                </Fragment>
            ))}
        </div>
    </Card>
);

/** Сітка модулів для форми користувача (vm — UserFormViewModel). */
const PermissionsGrid = ({ vm, className = "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }) => (
    <div className={className}>
        {vm.schemaEntries.map(([category, actions]) => {
            const selfLock = vm.isSelfAdminLock(category);
            return (
                <div key={category} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/30">
                    <div className="flex justify-center pb-2">
                        <Switch
                            color="green"
                            disabled={selfLock && vm.adminLocked}
                            onChange={() => vm.togglePage(category)}
                            checked={vm.isPageActive(category)}
                            label={<span className="font-bold dark:text-gray-200">{category}</span>}
                        />
                        {selfLock && (
                            <IconButton
                                disabled={!vm.adminLocked}
                                variant="text"
                                size="sm"
                                title="Розблокувати редагування"
                                className="ml-1 dark:text-gray-200"
                                onClick={vm.askUnlockAdmin}
                            >
                                <i className="far fa-unlock"></i>
                            </IconButton>
                        )}
                    </div>
                    <PermissionActions
                        actions={actions}
                        values={vm.permissions[category]}
                        disabled={vm.isSectionDisabled(category)}
                        onChange={(action, value) => vm.setPermission(category, action, value)}
                    />
                </div>
            );
        })}
    </div>
);

export default observer(PermissionsGrid);
