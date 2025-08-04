import express from 'express';
import { createPrescription,  createBlog, getAllBlogs, getSingleBlog, deleteBlog} from '../Controller/doctorController.js';
import { uploadBlogImage } from '../config/multerConfig.js';

const router = express.Router();


router.post('/createprescription/:doctorId/:appointmentId', createPrescription);
router.post('/create-blog/:doctorId', uploadBlogImage, createBlog);
router.get('/blogs', getAllBlogs);
router.get('/blogs/:blogId', getSingleBlog);
router.delete('/deleteblog/:blogId', deleteBlog);














export default router;
