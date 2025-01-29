import express from 'express'
const router = express.Router();
import {
    loginStaff,
    logoutStaff,
    getStaff,
    getStaffSalary
} from '../Controller/StaffController.js'


router.post('/login-staff', loginStaff)
router.post('/logout-staff', logoutStaff)
router.get('/staff-profile/:staffId', getStaff)
router.get("/salary/:staffId", getStaffSalary);




export default router