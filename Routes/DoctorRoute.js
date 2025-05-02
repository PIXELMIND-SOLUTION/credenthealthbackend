import express from 'express';
import { createPrescription,  createBlog} from '../Controller/doctorController.js';

const router = express.Router();


router.post('/createprescription/:doctorId/:appointmentId', createPrescription);
router.post('/create-blog/:doctorId', createBlog);













export default router;
