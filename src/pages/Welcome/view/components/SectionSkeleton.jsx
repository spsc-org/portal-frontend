import {Typography} from "@material-tailwind/react";

const SectionSkeleton = () => (
    <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-md shadow-slate-200/70 ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-black/20 dark:ring-0">
        <div className="animate-pulse">
            <Typography as="div" variant="small" className="mb-3 h-4 w-36 rounded-full bg-gray-300 dark:bg-slate-700">
                &nbsp;
            </Typography>
            <div className="space-y-2">
                <Typography as="div" variant="paragraph" className="h-7 w-full rounded-md bg-gray-300 dark:bg-slate-700">
                    &nbsp;
                </Typography>
                <Typography as="div" variant="paragraph" className="h-7 w-full rounded-md bg-gray-300 dark:bg-slate-700">
                    &nbsp;
                </Typography>
                <Typography as="div" variant="paragraph" className="h-7 w-3/4 rounded-md bg-gray-300 dark:bg-slate-700">
                    &nbsp;
                </Typography>
                <Typography as="div" variant="paragraph" className="h-7 w-4/5 rounded-md bg-gray-300 dark:bg-slate-700">
                    &nbsp;
                </Typography>
            </div>
        </div>
    </div>
);

export default SectionSkeleton;
