import Admin from '../Models/Admin.js'
import asyncHandler from 'express-async-handler'
import Student from '../Models/User.js';
import Staff from '../Models/Staff.js';
import Book from '../Models/Book.js';
import generateRefreshToken from '../config/refreshtoken.js';
import generateToken from '../config/jwtToken.js';
import jwt from 'jsonwebtoken'
import crypto from 'crypto'



const adminRegistration = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if admin with the same email already exists
  const admin = await Admin.findOne({ email: email });
  if (admin) {
    return res.status(409).json({ status: "failed", message: "Email already exists" });
  }

  // Ensure all fields are filled
  if (name && email && password) {
    try {
      // Create new Admin document
      const doc = new Admin({
        name: name,
        email: email,
        password: password,
      });

      await doc.save();

      // Retrieve the saved admin without the password field
      const saved_admin = await Admin.findOne({ email: email }).select("-password");

      // Generate refresh token
      const refreshToken = generateRefreshToken(saved_admin._id);

      // Save refresh token in the database
      saved_admin.refreshToken = refreshToken;
      await saved_admin.save();

      // Set the refresh token in an HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 72 * 60 * 60 * 1000, // 3 days expiration
        sameSite: 'Strict',
      });

      // Generate access token
      const accessToken = generateToken(saved_admin._id);

      return res.status(201).json({
        message: "Registration Successful",
        data: saved_admin,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      return res.status(500).json({
        status: "failed",
        message: "Unable to register",
        error: error.message,
      });
    }
  } else {
    return res.status(400).json({ message: "Please fill all the fields" });
  }
});


const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;  // Only use email

  // Check if admin with the provided email exists
  const findAdmin = await Admin.findOne({ email });

  if (!findAdmin) {
    return res.status(401).json({ message: "Invalid Credentials" });  // Admin not found
  }

  const refreshToken = await generateRefreshToken(findAdmin._id);

  // Update the refresh token in the database
  await Admin.findByIdAndUpdate(
    findAdmin.id,
    { refreshToken },
    { new: true }
  );

  // Set the refresh token as an HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: 72 * 60 * 60 * 1000, // 3 days expiration
  });

  return res.json({
    _id: findAdmin._id,
    firstName: findAdmin.name,
    email: findAdmin.email,
    token: generateToken(findAdmin._id),
  });
});


const adminLogout = asyncHandler(async (req, res) => {
  try {
    res.clearCookie("token").status(200).json({ message: "Logout Successful" })
  } catch (error) {
    return res.status(500).json({ status: "failed", message: "Unable to logout", error: error.message });
  }
})



// Controller to add a new staff member
const addStaff = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      gender,
      dateOfBirth,
      address,
      joiningDate,
      salary,
      emergencyContact,
      profilePicture,
      qualifications,
    } = req.body;

    // Generate a random 4-digit password
    const randomPassword = Math.floor(1000 + Math.random() * 9000).toString();

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const newStaff = new Staff({
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      gender,
      dateOfBirth,
      address,
      joiningDate,
      salary,
      employeeId,
      emergencyContact,
      profilePicture,
      qualifications,
      password: hashedPassword, // Save the hashed password
    });

    const savedStaff = await newStaff.save(); // Save the staff in the database

    // Respond with only the staff details (excluding the password)
    res.status(201).json({
      message: "Staff added successfully!",
      staff: savedStaff,
    });
  } catch (error) {
    console.error("Error adding staff:", error);
    res.status(500).json({ message: "Failed to add staff" });
  }
};

// Controller to get all staff members
const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find(); // Get all staff from the database

    if (!staff || staff.length === 0) {
      return res.status(404).json({ message: 'No staff found' });
    }

    res.status(200).json({
      message: 'Staff retrieved successfully',
      staff
    });
  } catch (error) {
    console.error('Error retrieving staff:', error);
    res.status(500).json({ message: 'Failed to retrieve staff' });
  }
};


// Add a new book
 const addBook = async (req, res) => {
  try {
    const { title, author, ISBN, category, availableCopies, price, totalCopies } = req.body;


    if (availableCopies > totalCopies) {
      return res
        .status(400)
        .json({ message: "Available copies cannot exceed total copies" });
    }

    const existingBook = await Book.findOne({ ISBN });
    if (existingBook) {
      return res
        .status(400)
        .json({ message: "A book with the same ISBN already exists" });
    }

    const newBook = new Book({
      title,
      author,
      ISBN,
      category,
      availableCopies: availableCopies || totalCopies,
      totalCopies,
    });

    await newBook.save();
    res.status(201).json({ message: "Book added successfully", book: newBook });
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all books
 const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json({ message: "Books retrieved successfully", books });
  } catch (error) {
    console.error("Error retrieving books:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get book by ID
 const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({ message: "Book retrieved successfully", book });
  } catch (error) {
    console.error("Error retrieving book:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a book
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, ISBN, category, availableCopies, totalCopies } = req.body;

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (availableCopies > totalCopies) {
      return res
        .status(400)
        .json({ message: "Available copies cannot exceed total copies" });
    }

    book.title = title || book.title;
    book.author = author || book.author;
    book.ISBN = ISBN || book.ISBN;
    book.category = category || book.category;
    book.availableCopies = availableCopies || book.availableCopies;
    book.totalCopies = totalCopies || book.totalCopies;

    await book.save();
    res.status(200).json({ message: "Book updated successfully", book });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a book
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    await book.remove();
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Generate a 4-digit random password
const generatePassword = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "your_default_secret_key";


// Create a new staff member
const createStaff = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      gender,
      dateOfBirth,
      address,
      joiningDate,
      salary,
      employeeId,
      emergencyContact,
      profilePicture,
      qualifications,
    } = req.body;


    // Check if staff member with the given email or ID already exists
    const existingStaff = await Staff.findOne({
      $or: [{ email }, { employeeId }],
    });


    // Generate a 4-digit random password
    const password = generatePassword();

    // Create a new staff record
    const newStaff = new Staff({
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      gender,
      dateOfBirth,
      address,
      joiningDate,
      salary,
      employeeId,
      emergencyContact,
      profilePicture,
      qualifications,
      password, // Store the generated password
    });

    await newStaff.save();

    // Generate a JWT token for the staff member
    const token = jwt.sign(
      { id: newStaff._id, email: newStaff.email },
      JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    // Send the response
    res.status(201).json({
      message: "Staff member created successfully",
      staff: {
        id: newStaff._id,
        fullName: `${newStaff.firstName} ${newStaff.lastName}`,
        email: newStaff.email,
        staffId: newStaff.employeeId,
        department: newStaff.department,
        position: newStaff.position,
        password, // Include the generated password
      },
      token,
    });
  } catch (error) {
    console.error("Error creating staff member:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      joiningDate,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate a 4-digit password
    const password = generatePassword();

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password, // Store the generated password
      dateOfBirth,
      address,
      joiningDate,
    });

    await newUser.save();

    // Generate a JWT token
    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    // Respond with user details and token
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        fullName: `${newUser.firstName} ${newUser.lastName}`,
        email: newUser.email,
        phone: newUser.phone,
        dateOfBirth: newUser.dateOfBirth,
        address: newUser.address,
        joiningDate: newUser.joiningDate,
        password, // Include the generated password in the response
      },
      token,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add salary payment
const addSalaryPayment = async (req, res) => {
  try {
    const { staffId, amount, paymentMethod, remarks } = req.body;


    // Check if staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Create a new salary record
    const salaryRecord = new Salary({
      staffId,
      amount,
      paymentMethod,
      remarks,
    });

    await salaryRecord.save();

    res.status(201).json({
      message: 'Salary payment recorded successfully',
      salary: salaryRecord,
    });
  } catch (error) {
    console.error('Error adding salary payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all salary records
const getAllSalaries = async (req, res) => {
  try {
    // Fetch all salary records and populate staff details
    const salaries = await Salary.find().populate(
      'staffId',
      'firstName lastName position department email'
    );

    if (!salaries || salaries.length === 0) {
      return res.status(404).json({ message: 'No salary records found' });
    }

    res.status(200).json({
      message: 'All salary records fetched successfully',
      salaries,
    });
  } catch (error) {
    console.error('Error fetching salary records:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export {
  adminRegistration,
  adminLogin,
  adminLogout,
  addStaff,
  getAllStaff,
  addBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  createStaff,
  registerUser,
  addSalaryPayment,
  getAllSalaries
}