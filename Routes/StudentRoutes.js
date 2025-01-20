import express from 'express'
const router = express.Router();

import {  
    loginUser,
    logoutUser
} from '../Controller/StudentController.js'


router.post('/login-user', loginUser)
router.post('/logout-user', logoutUser)



















export default router