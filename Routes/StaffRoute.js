import express from 'express';
import { getWalletBalance, 
    staffLogin, 
    bookAppointment, 
    processPayment,
    createFamilyMember,
    getFamilyMember,
    getAllFamilyMembers,
    updateFamilyMember,
    removeFamilyMember,
    uploadProfileImage,
    updateProfileImage,
    getMyProfile,
    createStaffAddress,
    getStaffAddresses,
    removeStaffAddress,
    submitIssue,
  updateIssueStatus,
  getStaffIssues,
  getDoctorAppointmentsForStaff,
  getAllDiagnosticBookingForStaff,
  getStaffTestPackageById,
  getAppointment

 } from '../Controller/ControllerStaff.js';

const router = express.Router();

// Route for staff login
router.post('/login-staff', staffLogin);
router.get('/wallet/:staffId', getWalletBalance);
router.post('/bookappoint', bookAppointment);
router.get('/getappoint/:staffId/:appointmentId', getAppointment);
router.post('/process-payment/:staffId/:appointmentId', processPayment);

// Routes for family members
router.post('/create-family/:staffId', createFamilyMember);
router.get('/get-singlefamilymem/:staffId/:familyMemberId', getFamilyMember);
router.get('/getallfamily/:staffId', getAllFamilyMembers);
router.put('/updatefamily/:staffId/:familyMemberId', updateFamilyMember);
router.delete('/removefamily/:staffId/:familyMemberId', removeFamilyMember);
router.post('/uploadProfileImage/:staffId', uploadProfileImage);
router.put('/updateProfileImage/:staffId', updateProfileImage);  // update existing
router.get('/getprofile/:staffId', getMyProfile);  // update existing

// Route for creating a new address for a staff member
router.post('/create-address/:staffId', createStaffAddress);

// Route for fetching all addresses for a staff member
router.get('/getaddresses/:staffId', getStaffAddresses);

// Route for removing an address by addressId for a staff member
router.delete('/remove-address/:staffId/:addressId', removeStaffAddress);


// 📥 Staff submits a new support issue (with file upload)
router.post('/submitissue/:staffId', submitIssue);

// 📄 Get all issues for a specific staff
router.get('/getissues/:staffId', getStaffIssues);

// 📤 Admin updates an issue's status or response
router.put('/updateissue/:staffId/:issueId', updateIssueStatus);

router.get('/getdoctorappointment/:staffId', getDoctorAppointmentsForStaff);  // update existing
router.get('/getalldiagbookings/:staffId', getAllDiagnosticBookingForStaff);  // update existing
router.get('/stafftestpackages/:staffId', getStaffTestPackageById);












export default router;
