import StaffLayout from "./shared/ui/StaffLayout.jsx"
import StaffAttendanceIndex from "../StaffAttendance/Index.jsx"

// Відвідуваність (StaffAttendance) — окремий модуль; тут лише оболонка /staff.
const AttendancePage = () => (
  <StaffLayout active="attendance">
    <StaffAttendanceIndex />
  </StaffLayout>
)

export default AttendancePage
