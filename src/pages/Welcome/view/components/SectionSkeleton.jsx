import {Typography} from "@material-tailwind/react";

const SectionSkeleton = () => (
    <div className="min-w-0 flex-[1_1_280px] rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
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
