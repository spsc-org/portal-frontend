import { Typography } from "@material-tailwind/react";

const AttendanceLegend = ({ absenceTypes }) => (
    <div className="mt-4 flex flex-wrap gap-4 px-2">
        {absenceTypes.filter(type => type.value !== 'home_based').map(type => (
            <div key={type.value} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: type.color }}></span>
                <Typography className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{type.caption}</Typography>
            </div>
        ))}
    </div>
);

export default AttendanceLegend;
