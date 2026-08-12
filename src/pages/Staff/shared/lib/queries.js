import {useQuery} from "@tanstack/react-query";
import axios from "axios";

/**
 * @typedef {Object} StaffOptions
 * @property {Object[]} absence_types
 * @property {Object[]} statuses
 * @property {number[]} working_days
 * @property {Object[]} users
 * @property {Object} report_types
 */

// Спільні довідники для ВСЬОГО простору /staff (не лише відвідуваності) —
// за домовленістю з користувачем: "усі сторінки цього розділу споріднені,
// немає сенсу окремого options" на кожну підсторінку. Один ендпоінт,
// staleTime: Infinity (як /api/task/options, /api/announcement/options) —
// React Query дедуплікує запит між StaffLayout і будь-якою підсторінкою за
// тим самим queryKey, реального повторного мережевого запиту не буде.
//
// Наразі повертає (StaffAttendanceController::options()): absence_types,
// statuses, working_days, users, report_types. Список users — спільний для
// Контрактів/Відповідальних (у них теж "який співробітник"); коли в цих
// підсторінках з'явиться реальний вміст, нові довідники додаються СЮДИ Ж,
// у той самий payload, а не в окремий ендпоінт.
export const useStaffOptions = () =>
    useQuery({
        queryKey: ["staff-options"],
        queryFn: async () => {
            const response = await axios.get("/staff/options");
            return response.data;
        },
        staleTime: Infinity,
    });
