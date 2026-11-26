import {Typography} from "@material-tailwind/react";

const StatCardSkeleton = () => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="animate-pulse">
            <div className="mb-2 flex items-center justify-between">
                <Typography as="div" variant="small" className="h-3 w-24 rounded-full bg-gray-300 dark:bg-neutral-600">
                    &nbsp;
                </Typography>
                <Typography as="div" variant="small" className="h-4 w-4 rounded bg-gray-300 dark:bg-neutral-600">
                    &nbsp;
                </Typography>
            </div>
            <Typography as="div" variant="h6" className="h-7 w-16 rounded-full bg-gray-300 dark:bg-neutral-600">
                &nbsp;
            </Typography>
        </div>
    </div>
);

export default StatCardSkeleton;
