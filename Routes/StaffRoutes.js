import express from 'express'
const router = express.Router();
import {
    loginStaff,
    logoutStaff,
    getStaff
} from '../Controller/StaffController.js'


router.post('/login-staff', loginStaff)
router.post('/logout-staff', logoutStaff)
router.get('/staff-profile/:staffId', getStaff)




export default router