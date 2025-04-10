import express from 'express';
import { bookAppointment, getStaffBookings } from '../Controller/bookingController.js';

const router = express.Router();

// Route for staff login
router.post('/book-appointment/:staffId', bookAppointment);
router.get('/getallbookings/:staffId', getStaffBookings);


export default router;
