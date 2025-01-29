import express from 'express'
const router = express.Router();

import {  
    loginUser,
    logoutUser,
    getUser,
    getUserFees
} from '../Controller/StudentController.js'


router.post('/login-user', loginUser)
router.post('/logout-user', logoutUser)
router.get("/get-user/:userId", getUser);
router.get("/fees/:userId", getUserFees);





















export default router