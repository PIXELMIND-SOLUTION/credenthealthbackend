import express from 'express'
const router = express.Router();
import {
    loginStaff,
    logoutStaff 
} from '../Controller/StaffController.js'


router.post('/login-staff', loginStaff)
router.post('/logout-staff', logoutStaff)



export default router