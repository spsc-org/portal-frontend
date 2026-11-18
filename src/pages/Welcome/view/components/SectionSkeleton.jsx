import {Typography} from "@material-tailwind/react";

const SectionSkeleton = () => (
    <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/60 dark:border-neutral-700 dark:bg-neutral-800/70 dark:shadow-black/20 dark:ring-0">
        <div className="animate-pulse">
            <Typography as="div" variant="small" className="mb-3 h-4 w-36 rounded-full bg-gray-300 dark:bg-neutral-600">
                &nbsp;
            </Typography>
            <div className="space-y-2">
                <Typography as="div" variant="paragraph" className="h-7 w-full rounded-md bg-gray-300 dark:bg-neutral-600">
                    &nbsp;
                </Typography>
                <Typography as="div" variant="paragraph" className="h-7 w-full rounded-md bg-gray-300 dark:bg-neutral-600">
                    &nbsp;
                </Typography>
                <Typography as="div" variant="paragraph" className="h-7 w-3/4 rounded-md bg-gray-300 dark:bg-neutral-600">
                    &nbsp;
                </Typography>
                <Typography as="div" variant="paragraph" className="h-7 w-4/5 rounded-md bg-gray-300 dark:bg-neutral-600">
                    &nbsp;
                </Typography>
            </div>
        </div>
    </div>
);

export default SectionSkeleton;
