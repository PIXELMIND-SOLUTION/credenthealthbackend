import asyncHandler from 'express-async-handler'
import Student from '../Models/User.js';
import Staff from '../Models/Staff.js';
import jwt from 'jsonwebtoken'
import generateRefreshToken from '../config/refreshtoken.js';
import generateToken from '../config/jwtToken.js';


const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "your_default_secret_key";

// Staff login without bcrypt
const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the staff by email
    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Verify password directly (insecure if passwords are stored in plain text)
    if (password !== staff.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: staff._id, email: staff.email }, JWT_SECRET_KEY, {
      expiresIn: "1d", // Token expiration time
    });

    // Respond with token and basic staff info
    res.status(200).json({
      message: "Login successful",
      token,
      staff: {
        id: staff._id,
        fullName: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        position: staff.position,
        department: staff.department,
      },
    });
  } catch (error) {
    console.error("Error during staff login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


  const logoutStaff = async (req, res) => {
    try {
      // Clear the "token" cookie from the client
      res
        .clearCookie("token", {
          httpOnly: true, // Ensure cookie cannot be accessed via JavaScript
          secure: true, // Send only over HTTPS
          sameSite: "strict", // Prevent CSRF
        })
        .status(200)
        .json({ message: "Logout Successful" });
    } catch (error) {
      console.error("Error during logout:", error);
      res
        .status(500)
        .json({ status: "failed", message: "Unable to logout", error: error.message });
    }
  };
  
// Get salary payment history
const getSalaryPayments = async (req, res) => {
    try {
      const { staffId } = req.query;
  
      // Check if staffId is provided
      if (!staffId) {
        return res.status(400).json({ message: 'Staff ID is required' });
      }
  
      // Fetch salary payments for the specific staff
      const salaryRecords = await Salary.find({ staffId }).populate('staffId', 'firstName lastName position department');
  
      if (!salaryRecords || salaryRecords.length === 0) {
        return res.status(404).json({ message: 'No salary payments found for this staff member' });
      }
  
      res.status(200).json({
        message: 'Salary payments fetched successfully',
        salaryRecords,
      });
    } catch (error) {
      console.error('Error fetching salary payments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

// Get staff details
const getStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    // Check if staffId is provided
    if (!staffId) {
      return res.status(400).json({ message: 'Staff ID is required' });
    }

    // Fetch the staff details
    const staffDetails = await Staff.findById(staffId).select('-password');

    // Check if the staff member exists
    if (!staffDetails) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.status(200).json({
      message: 'Staff details fetched successfully',
      staffDetails,
    });
  } catch (error) {
    console.error('Error fetching staff details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

  

export  { loginStaff, logoutStaff, getSalaryPayments, getStaff }