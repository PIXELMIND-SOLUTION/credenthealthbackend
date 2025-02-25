import express from 'express'
const router = express.Router();
import {
  adminRegistration,
  adminLogin,
  adminLogout,
  addStaff,
  getAllStaff,
  addBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  getAllSalaries,
  createStaff,
  registerUser,
  addSalaryPayment,
  getAllUsers,
  addUserFees,
  getAllFees,
  createPlan,
  getAllPlans,
  getAllUsersPlans,
  toggleUserPlanStatus,
  updatePlanStatus,
  getLatestPlan,
  updateUserFees,
  assignTaskToStaff,
  getAllStaffWithTasks,
  markAttendance,
  getAllStaffAttendances,
  scheduleMeeting,
  getAllMeetings
} from '../Controller/AdminController.js'




router.post('/admin-register', adminRegistration)
router.post('/admin-login', adminLogin)
router.post('/admin-logout', adminLogout)
router.post('/add-staff', createStaff);
router.get('/staffs', getAllStaff);
router.post("/add-book", addBook);
router.get("/getbooks", getAllBooks);
router.get("/books/:id", getBookById);
router.put("/update/:id", updateBook);
router.delete("/delete/:id", deleteBook);
router.post('/add-user', registerUser);
router.get('/get-users', getAllUsers);
router.post('/add-salary/:staffId', addSalaryPayment);
router.get('/staff-salaries', getAllSalaries);
router.post("/add-fees/:userId", addUserFees);
router.get('/student-fees', getAllFees);
router.post("/create-plans", createPlan); // ✅ Create plan
router.get("/get-plans", getAllPlans); // ✅ Get all plans
router.get("/user-plans", getAllUsersPlans); // ✅ Get all plans
router.get("/letest-plan", getLatestPlan); // ✅ Get all plans
router.put("/status/:userId/:planId", toggleUserPlanStatus); // ✅ Get all plans
router.put("/update-status/:planId", updatePlanStatus); // ✅ Get all plans
router.put("/update-fee/:userId/:feeId", updateUserFees); // ✅ Get all plans
router.post("/assign-task/:staffId", assignTaskToStaff); // ✅ Get all plans
router.get("/get-tasks", getAllStaffWithTasks); // ✅ Get all plans
router.post("/mark-attendance", markAttendance); // ✅ Get all plans
router.get("/all-attendance", getAllStaffAttendances); // ✅ Get all plans
router.post("/schedule-meeting", scheduleMeeting); // ✅ Get all plans
router.get("/get-meetings", getAllMeetings); // ✅ Get all plans








































































export default router