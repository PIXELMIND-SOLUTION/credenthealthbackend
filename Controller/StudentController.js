import asyncHandler from 'express-async-handler'
import User from '../Models/User.js';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';


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

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
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





export  {
  loginUser,
  logoutUser
};
