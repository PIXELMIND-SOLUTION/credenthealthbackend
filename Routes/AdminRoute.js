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
    deleteDoctor,
    getAllDiagnosticBookings,
    getAllDoctorAppointments,
    createCompany,
    getCompanies,
    getCompanyWithStaff,
    createCategory,
    getAllCategories,
    logoutAdmin
 } from '../Controller/ControllerAdmin.js';

const router = express.Router();

// Route for Admin Signup
router.post('/signup', signupAdmin);

// Route for Admin Login
router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);


// Route to create new doctor details

// Route to get all doctor details
router.get('/getalldoctors', getDoctorDetails);

// Route to get doctor details by ID
router.get('/getsingle-doctor/:id', getDoctorById);
router.get('/gettest/:id', getDoctorTestsById);


// Route to update doctor details
router.put('/update-doctor/:id', updateDoctorDetails);
// Route to create a new staff profile (admin only)
router.post('/create-staff/:companyId', createStaffProfile);
router.post('/addamount/:staffId/:companyId', addAmountToWallet);



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
router.get('/alldiagnosticsbookings', getAllDiagnosticBookings);
router.get('/alldoctorbookings', getAllDoctorAppointments);


router.post('/create-company', createCompany);
router.get('/companies', getCompanies);
router.get('/companystaffs/:companyId', getCompanyWithStaff);


// Route to create a new category
router.post('/create-category', createCategory);

// Route to get all categories
router.get('/getallcategory', getAllCategories);







// Route for staff login

export default router;
