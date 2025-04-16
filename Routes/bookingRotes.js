import express from 'express';
import { bookAppointment, getStaffBookings, getBookingDetails, processPayment, removeTestFromBooking } from '../Controller/bookingController.js';

const router = express.Router();

// Route for staff login
router.post('/book-appointment', bookAppointment);
router.get('/getallbookings/:bookingId/:staffId', getBookingDetails);
router.post('/payment/:bookingId/:staffId', processPayment);
router.patch('/remvoe-test/:staffId', removeTestFromBooking);




export default router;
