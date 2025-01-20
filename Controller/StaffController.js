import asyncHandler from 'express-async-handler'
import Student from '../Models/User.js';
import Staff from '../Models/Staff.js';
import generateRefreshToken from '../config/refreshtoken.js';
import generateToken from '../config/jwtToken.js';


// Staff login
const loginStaff = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
  
      // Find the staff by email
      const staff = await Staff.findOne({ email });
      if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
      }
  
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, staff.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
  
      // Generate JWT token
      const token = jwt.sign({ id: staff._id, email: staff.email }, JWT_SECRET, {
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
  

export  { loginStaff, logoutStaff, getSalaryPayments }