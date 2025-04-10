import express from 'express';
import { getWalletBalance, staffLogin, bookAppointment, processPayment } from '../Controller/ControllerStaff.js';

const router = express.Router();

// Route for staff login
router.post('/login-staff', staffLogin);
router.get('/wallet/:staffId', getWalletBalance);
router.post('/bookappoint/:staffId/:doctorId', bookAppointment);
router.post('/process-payment/:staffId/:appointmentId', processPayment);




export default router;
