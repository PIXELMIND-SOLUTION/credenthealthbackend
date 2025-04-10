import express from 'express';
import { signupAdmin,
    loginAdmin,
    createDoctorDetails,
    getDoctorDetails,
    getDoctorById,
    updateDoctorDetails,
    createStaffProfile,
    getDoctorTestsById
 } from '../Controller/ControllerAdmin.js';

const router = express.Router();

// Route for Admin Signup
router.post('/signup', signupAdmin);

// Route for Admin Login
router.post('/login', loginAdmin);

// Route to create new doctor details
router.post('/create-doctor', createDoctorDetails);

// Route to get all doctor details
router.get('/getalldoctors', getDoctorDetails);

// Route to get doctor details by ID
router.get('/getsingle-doctor/:id', getDoctorById);
router.get('/gettest/:id', getDoctorTestsById);


// Route to update doctor details
router.put('/update-doctor/:id', updateDoctorDetails);
// Route to create a new staff profile (admin only)
router.post('/create-staff', createStaffProfile);

// Route for staff login

export default router;
