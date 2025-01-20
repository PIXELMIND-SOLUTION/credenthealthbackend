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
} from '../Controller/AdminController.js'




router.post('/admin-register', adminRegistration)
router.post('/admin-login', adminLogin)
router.post('/admin-logout', adminLogout)
router.post('/add-staff', createStaff);
router.get('/staffs', getAllStaff);
router.post("/add", addBook);
router.get("/", getAllBooks);
router.get("/:id", getBookById);
router.put("/update/:id", updateBook);
router.delete("/delete/:id", deleteBook);
router.get('/admin/salaries', getAllSalaries);
router.post('/add-user', registerUser);
router.post('/add-salary', addSalaryPayment);



























































export default router