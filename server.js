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
import DoctorRoute from './Routes/DoctorRoute.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ CORS Configuration
const allowedOrigins = ['http://localhost:3000', 'https://credenthealthadmin.vercel.app', 'https://credenthealthadmin-j1y3.vercel.app'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// ✅ Handle preflight requests explicitly (optional but safe)
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}));

// ✅ Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// ✅ Body Parsers
// Increase the size limit
app.use(express.json({ limit: '50mb' })); // You can adjust the size to 50mb or more as needed
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Cookie Parser
app.use(cookieParser());

// ✅ Connect to MongoDB
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
