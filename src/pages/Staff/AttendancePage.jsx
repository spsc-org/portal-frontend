import React from "react";
import StaffLayout from "./shared/ui/StaffLayout.jsx";
import StaffAttendanceIndex from "../StaffAttendance/Index.jsx";

// Тонка сторінка-композиція: сама відвідуваність (StaffAttendance/Index.jsx)
// лишається незмінною, окремим модулем — тут лише підключення спільної
// оболонки /staff (бокове підменю). Перший пункт підменю.
const AttendancePage = () => (
    <StaffLayout active="attendance">
        <StaffAttendanceIndex/>
    </StaffLayout>
);

export default AttendancePage;
