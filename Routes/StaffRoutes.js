import express from 'express'
const router = express.Router();
import {
    loginStaff,
    logoutStaff,
    getStaff,
    getStaffSalary,
    getSingleStaffWithTasks,
    updateTaskStatus,
    getStaffAttendance,
    getStaffMeetings
} from '../Controller/StaffController.js'


router.post('/login-staff', loginStaff)
router.post('/logout-staff', logoutStaff)
router.get('/staff-profile/:staffId', getStaff)
router.get("/salary/:staffId", getStaffSalary);
router.get("/my-task/:staffId", getSingleStaffWithTasks);
router.get("/my-attendance/:staffId", getStaffAttendance);
router.put("/update-task/:staffId/:taskId", updateTaskStatus);
router.get("/my-meetings/:staffId", getStaffMeetings);







export default router