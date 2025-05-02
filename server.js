import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDatabase from './db/connectDatabase.js';
import bookingRoutes from './Routes/bookingRotes.js';
import adminRoutes from './Routes/AdminRoute.js';
import staffRoutes from './Routes/StaffRoute.js';
import DoctorRoute from './Routes/DoctorRoute.js'


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Serve static files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// Increase limit for JSON and URL-encoded data
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));


// ✅ CORS Configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://credenthealthadmin.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// ✅ DB Connection
connectDatabase();

// ✅ API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/doctor', DoctorRoute);


// ✅ Test Route
app.get("/", (req, res) => {
  res.json({ message: "Hello from CredenHealth" });
});

// ✅ Start Server
const port = process.env.PORT || 6000;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
