import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDatabase from './db/connectDatabase.js';
import AdminRoutes from '../backend/Routes/AdminRoutes.js'
import StaffRoutes from '../backend/Routes/StaffRoutes.js'
import StudentRoutes from '../backend/Routes/StudentRoutes.js'

dotenv.config();

const app = express();

// CORS Configuration to allow multiple origins
app.use(cors({
    origin: ['http://localhost:3000', 'https://school-manage-zeta.vercel.app', 'https://educare-coaching.vercel.app'],  // Multiple allowed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allowed HTTP methods
    credentials: true  // Allow cookies if needed
  }));
  
  
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


// Database connection
connectDatabase();


app.use('/api/admin', AdminRoutes)
app.use('/api/staff', StaffRoutes)
app.use('/api/user', StudentRoutes)



// Default route
app.get("/", (req, res) => {
 res.json({ message: "Hello from Macbell" });
});

// Start the server
const port = process.env.PORT || 6000; // Use the PORT environment variable if available, or default to 4000

const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
