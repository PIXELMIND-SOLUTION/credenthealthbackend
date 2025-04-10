import express from 'express';
import { staffLogin } from '../Controller/ControllerStaff.js';

const router = express.Router();

// Route for staff login
router.post('/login-staff', staffLogin);

export default router;
