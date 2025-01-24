import asyncHandler from 'express-async-handler'
import User from '../Models/User.js';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';

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




export  {
  loginUser,
  logoutUser,
  getUser
};
