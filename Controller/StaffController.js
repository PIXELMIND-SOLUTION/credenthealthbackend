import asyncHandler from 'express-async-handler'
import Student from '../Models/User.js';
import Staff from '../Models/Staff.js';
import jwt from 'jsonwebtoken'
import generateRefreshToken from '../config/refreshtoken.js';
import generateToken from '../config/jwtToken.js';
import Salary from '../Models/Salary.js';


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

const getStaffSalary = async (req, res) => {
  const { staffId } = req.params; // Extract staffId from request parameters

  try {
    // Fetch all salary records for the given staffId
    const salaryRecords = await Salary.find({ staffId }).populate("staffId", "name email");

    if (!salaryRecords || salaryRecords.length === 0) {
      return res.status(404).json({ message: "No salary records found for this staff member" });
    }

    // Respond with the staff's salary records
    res.status(200).json({ salaryRecords });
  } catch (error) {
    console.error("Error fetching staff salary records:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSingleStaffWithTasks = async (req, res) => {
  try {
    const { staffId } = req.params;

    const staff = await Staff.findById(staffId, "myTasks");

    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    return res.status(200).json({ staff });
  } catch (error) {
    console.error("Error fetching staff with tasks:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { staffId, taskId } = req.params;
    const { status } = req.body;

    // Valid statuses (Modify if needed)
    const validStatuses = ["pending", "in-progress", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Find staff and update the task status
    const staff = await Staff.findOneAndUpdate(
      { _id: staffId, "myTasks._id": taskId },
      { $set: { "myTasks.$.status": status } },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({ message: "Staff member or task not found" });
    }

    return res.status(200).json({ message: "Task status updated successfully", staff });
  } catch (error) {
    console.error("Error updating task status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get Attendance of a Specific Staff
const getStaffAttendance = async (req, res) => {
  try {
    const { staffId } = req.params;

    // Check if staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found." });
    }

    res.status(200).json({ staffId, attendanceRecords: staff.myAttendance });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// ✅ Get Single Staff's Meetings
const getStaffMeetings = async (req, res) => {
  try {
    const { staffId } = req.params;

    // Find the staff member
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found." });
    }

    res.status(200).json({ message: "Meetings retrieved successfully.", myMeetings: staff.myMeetings });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};







export {
  loginStaff,
  logoutStaff,
  getSalaryPayments,
  getStaff,
  getStaffSalary,
  getSingleStaffWithTasks,
  updateTaskStatus,
  getStaffAttendance,
  getStaffMeetings
}