import express from 'express';
import { createPrescription } from '../Controller/doctorController.js';

const router = express.Router();


router.post('/createprescription/:doctorId/:appointmentId', createPrescription);












export default router;
