import express from 'express';
import { signupAdmin,
    loginAdmin,
    getDoctorDetails,
    updateDoctorDetails,
    createStaffProfile,
    getDoctorTestsById,
    createDiagnosticDetails, 
    updateDiagnosticDetails, 
    deleteDiagnosticDetails,
    getAllDiagnostics,
    getDiagnosticById,
    getAllTests,
    addAmountToWallet,
    createDoctor,
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor
 } from '../Controller/ControllerAdmin.js';

const router = express.Router();

// Route for Admin Signup
router.post('/signup', signupAdmin);

// Route for Admin Login
router.post('/login', loginAdmin);

// Route to create new doctor details

// Route to get all doctor details
router.get('/getalldoctors', getDoctorDetails);

// Route to get doctor details by ID
router.get('/getsingle-doctor/:id', getDoctorById);
router.get('/gettest/:id', getDoctorTestsById);


// Route to update doctor details
router.put('/update-doctor/:id', updateDoctorDetails);
// Route to create a new staff profile (admin only)
router.post('/create-staff', createStaffProfile);
router.post('/addamount/:staffId', addAmountToWallet);



// Route to create a new diagnostic center along with tests
router.post('/create-diagnostic', createDiagnosticDetails);
router.get('/alldiagnostics', getAllDiagnostics);
router.get('/get-single/:diagnosticId', getDiagnosticById);
router.get('/alltest/:diagnosticId', getAllTests);



// Route to update an existing diagnostic center by its ID
router.put('/update-diagnostic/:diagnosticId', updateDiagnosticDetails);

// Route to delete a diagnostic center by its ID
router.delete('/delete-diagnostic/:diagnosticId', deleteDiagnosticDetails);

// Create
router.post('/create-doctor', createDoctor);

// Read
router.get('/getdoctors', getAllDoctors);
router.get('/single-doctor/:id', getDoctorById);

// Update
router.put('/update-doctor/:id', updateDoctor);

// Delete
router.delete('/remvoe-doctors/:id', deleteDoctor);


// Route for staff login

export default router;
