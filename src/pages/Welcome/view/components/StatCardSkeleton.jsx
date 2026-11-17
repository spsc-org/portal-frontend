import {Typography} from "@material-tailwind/react";

const StatCardSkeleton = () => (
    <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-md shadow-slate-200/70 ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-black/20 dark:ring-0">
        <div className="animate-pulse">
            <div className="mb-2 flex items-center justify-between">
                <Typography as="div" variant="small" className="h-3 w-24 rounded-full bg-gray-300 dark:bg-slate-700">
                    &nbsp;
                </Typography>
                <Typography as="div" variant="small" className="h-4 w-4 rounded bg-gray-300 dark:bg-slate-700">
                    &nbsp;
                </Typography>
            </div>
            <Typography as="div" variant="h6" className="h-7 w-16 rounded-full bg-gray-300 dark:bg-slate-700">
                &nbsp;
            </Typography>
        </div>
    </div>
);

export default StatCardSkeleton;
