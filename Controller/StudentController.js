import asyncHandler from 'express-async-handler'
import User from '../Models/User.js';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
import Fees from '../Models/Fees.js';
import Plan from '../Models/Plan.js';
import UserPlan from '../Models/UserPlan.js';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "your_default_secret_key";

dotenv.config()

// User login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the password matches (without bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



const logoutUser = (req, res) => {
  try {
    res.clearCookie('token'); // If token is stored in cookies
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error logging out user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a user by userId
const getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Ensure userId is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User fetched successfully",
      user
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUserFees = async (req, res) => {
  const { userId } = req.params; // Extract userId from request parameters

  try {
    // Fetch all fees records for the given userId
    const fees = await Fees.find({ userId }).populate("fees");

    if (!fees || fees.length === 0) {
      return res.status(404).json({ message: "No fees records found for this student" });
    }

    // Respond with the user's fees records
    res.status(200).json({ fees });
  } catch (error) {
    console.error("Error fetching student fees:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

 const choosePlan = async (req, res) => {
  try {
    const { userId, planId } = req.body;

    // ✅ Check if the plan exists
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // ✅ Save in UserPlan Model
    const newUserPlan = new UserPlan({ userId, planId });
    await newUserPlan.save();

    // ✅ Save plan in User's myPlan[] array
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.myPlan.push(planId); // 🔥 User ke `myPlan[]` me save karega
    await user.save();

    res.status(201).json({ message: "Plan chosen successfully", userPlan: newUserPlan });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Get plans for a specific user
const getUserPlans = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate("myPlan");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.myPlan);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




export  {
  loginUser,
  logoutUser,
  getUser,
  getUserFees,
  choosePlan,
  getUserPlans
};
