import Admin from '../Models/Admin.js'
import asyncHandler from 'express-async-handler'
import Student from '../Models/User.js';
import Staff from '../Models/Staff.js';
import Book from '../Models/Book.js';
import User from '../Models/User.js';
import generateRefreshToken from '../config/refreshtoken.js';
import generateToken from '../config/jwtToken.js';
import Salary from '../Models/Salary.js';
import Fees from '../Models/Fees.js';
import StaffAttendance from '../Models/StaffAttendance.js';
import Plan from '../Models/Plan.js';
import Task from '../Models/Task.js';
import Meeting from '../Models/Meeting.js';
import jwt from 'jsonwebtoken'



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
      price
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

const getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database with complete fields
    const users = await User.find({});

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // Respond with all users' details
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getAllFees = async (req, res) => {
  try {
    // Fetch all fees records from the database
    const fees = await Fees.find().populate("userId", "firstName lastName email");

    if (!fees || fees.length === 0) {
      return res.status(404).json({ message: "No fees records found" });
    }

    // Respond with all fees records
    res.status(200).json({ fees });
  } catch (error) {
    console.error("Error fetching fees records:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const addSalaryPayment = async (req, res) => {
  const { staffId } = req.params
  try {
    const { amount, paymentMethod, remarks, date } = req.body;

    // Check if staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Create a new salary record in Salary collection
    const salaryRecord = new Salary({
      staffId,
      amount,
      paymentMethod,
      remarks,
      date: date || new Date(),
    });

    await salaryRecord.save();

    // Push full salary record into staff's mySalary array
    staff.mySalary.push(salaryRecord.toObject()); // Convert Mongoose document to plain object
    await staff.save();

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

const addUserFees = async (req, res) => {
  const { userId } = req.params;
  try {
    const { amount, paymentMethod, remarks, date, planName, planPrice, expiredDate, pendingAmount, paidAmount } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a new fee record in Fees collection
    const feeRecord = new Fees({
      userId,
      amount,
      paymentMethod,
      remarks,
      date: date || new Date(),
      planName,
      planPrice,
      expiredDate,
      pendingAmount,
      paidAmount,
    });

    await feeRecord.save();

    // Push fee record into user's fees array
    user.fees.push(feeRecord.toObject()); // Convert Mongoose document to plain object
    await user.save();

    res.status(201).json({
      message: "Fee payment recorded successfully",
      fee: feeRecord,
    });
  } catch (error) {
    console.error("Error adding fee payment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateUserFees = async (req, res) => {
  const { userId, feeId } = req.params;
  try {
    const { amountPaid } = req.body;

    // Find the fee record
    const feeRecord = await Fees.findById(feeId);
    if (!feeRecord) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    // Ensure the fee record belongs to the given user
    if (feeRecord.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized access to fee record" });
    }

    // Update the paidAmount and pendingAmount
    feeRecord.paidAmount += amountPaid;
    feeRecord.pendingAmount -= amountPaid;

    // Ensure pendingAmount does not go negative
    if (feeRecord.pendingAmount <= 0) {
      feeRecord.pendingAmount = 0;
    }

    await feeRecord.save();

    // ✅ Update the user's fees[] array where _id matches the feeId
    await User.updateOne(
      { _id: userId, "fees._id": feeId },  // Find user where fees[] contains the matching _id
      { 
        $inc: { "fees.$.paidAmount": amountPaid, "fees.$.pendingAmount": -amountPaid } // Update the matching fee entry
      }
    );

    res.status(200).json({
      message: "Fee payment updated successfully in both Fees and User Fees[]",
      updatedFee: feeRecord,
    });
  } catch (error) {
    console.error("Error updating fee payment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};





// ✅ Create a new plan
const createPlan = async (req, res) => {
  try {
    const { name, price, features, duration } = req.body;

    const newPlan = new Plan({ name, price, features, duration });
    await newPlan.save();

    res.status(201).json({ message: "Plan created successfully", plan: newPlan });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update Plan's Status
const updatePlanStatus = async (req, res) => {
  const { planId } = req.params;  // Plan ID from params
  const { status } = req.body;    // Status from body

  try {
    // Find the plan by ID and update the status
    const updatedPlan = await Plan.findByIdAndUpdate(
      planId,
      { status },  // Update the status field
      { new: true } // Return the updated document
    );

    // If plan not found
    if (!updatedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.status(200).json({
      message: "Plan status updated successfully",
      plan: updatedPlan,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Get all plans
 const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find();
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get today's latest plan
const getLatestPlan = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const latestPlan = await Plan.findOne({
      createdAt: { $gte: today },
    }).sort({ createdAt: -1 });

    if (!latestPlan) {
      return res.status(404).json({ message: "No plan created today" });
    }

    res.status(200).json(latestPlan);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// ✅ Get single plan by ID
 const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update plan by ID
 const updatePlan = async (req, res) => {
  try {
    const { name, price, features } = req.body;
    const updatedPlan = await Plan.findByIdAndUpdate(
      req.params.id,
      { name, price, features },
      { new: true }
    );

    if (!updatedPlan) return res.status(404).json({ message: "Plan not found" });

    res.status(200).json({ message: "Plan updated successfully", plan: updatedPlan });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete plan by ID
 const deletePlan = async (req, res) => {
  try {
    const deletedPlan = await Plan.findByIdAndDelete(req.params.id);
    if (!deletedPlan) return res.status(404).json({ message: "Plan not found" });

    res.status(200).json({ message: "Plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllUsersPlans = async (req, res) => {
  try {
    const users = await User.find()
      .populate({
        path: "myPlans.planId", // ✅ Populate planId inside myPlans
        select: "name price",  // ✅ Select only name & price
      })
      .select("firstName lastName joiningDate myPlans");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const toggleUserPlanStatus = async (req, res) => {
  const { userId, planId } = req.params; // User ID and Plan ID from params
  const { status } = req.body; // Admin will send status in request body

  try {
    // Step 1: Find the user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Find the user's plan in myPlans array
    const userPlanIndex = user.myPlans.findIndex(plan => plan.planId?.toString() === planId.toString());

    if (userPlanIndex === -1) {
      return res.status(404).json({ message: "Plan not found for this user" });
    }

    // Get the existing plan
    let updatedPlan = { ...user.myPlans[userPlanIndex] };

    // Ensure planId remains unchanged
    updatedPlan.planId = user.myPlans[userPlanIndex].planId;

    // If the status is already the same, return early
    if (updatedPlan.status === status) {
      return res.status(200).json({ message: `Plan is already ${status}`, user, updatedPlan });
    }

    updatedPlan.status = status; // Update the status

    if (status === "active") {
      // Step 3: Fetch the plan details to get the duration
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan details not found" });
      }

      // Step 4: Convert duration to days (Assuming duration is in months)
      const durationInDays = parseInt(plan.duration) * 30; // 1 month = 30 days

      // Step 5: Set start and expiry date
      const currentDate = new Date();
      const expireDate = new Date(currentDate);
      expireDate.setDate(currentDate.getDate() + durationInDays);

      // Update plan details only if active
      updatedPlan = {
        ...updatedPlan,
        startDate: currentDate,
        expireDate: expireDate,
        remainingDays: durationInDays,
      };
    } else {
      // If status is inactive, remove startDate, expireDate, and remainingDays
      delete updatedPlan.startDate;
      delete updatedPlan.expireDate;
      delete updatedPlan.remainingDays;
    }

    // Step 6: Update the specific plan inside myPlans[]
    user.myPlans[userPlanIndex] = updatedPlan;

    // Step 7: Save the updated user data
    await user.save();

    res.status(200).json({
      message: `Plan ${status === "active" ? "activated" : "deactivated"} successfully`,
      user,
      updatedPlan: user.myPlans[userPlanIndex], // Return the updated plan
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


 const assignTaskToStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { title, description, dueDate } = req.body;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    const newTask = { title, description, dueDate, status: "pending", assignedAt: new Date() };

    staff.myTasks.push(newTask);
    await staff.save();

    return res.status(200).json({ message: "Task assigned successfully", assignedTask: newTask });
  } catch (error) {
    console.error("Error assigning task:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllStaffWithTasks = async (req, res) => {
  try {
    const staffMembers = await Staff.find({}, "firstName lastName phone myTasks");

    return res.status(200).json({ staff: staffMembers });
  } catch (error) {
    console.error("Error fetching staff with tasks:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ✅ Mark Staff Attendance (Push into myAttendance[])
const markAttendance = async (req, res) => {
  try {
    const { staffId, date, status } = req.body;

    // Check if the staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found." });
    }

    // Check if attendance already marked for the day
    const alreadyMarked = staff.myAttendance.some((att) => att.date === date);
    if (alreadyMarked) {
      return res.status(400).json({ message: "Attendance already marked for today." });
    }

    // Push attendance into myAttendance array
    staff.myAttendance.push({ date, status });

    await staff.save();
    res.status(201).json({ message: "Attendance marked successfully.", attendance: staff.myAttendance });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// ✅ Schedule Meeting for All Staff (Push into myMeetings[])
const scheduleMeeting = async (req, res) => {
  try {
    const { title, date, time, link, description } = req.body;

    // Find all staff members
    const staffMembers = await Staff.find();
    if (!staffMembers.length) {
      return res.status(404).json({ message: "No staff members found." });
    }

    // Meeting details
    const meetingDetails = { title, date, time, link, description };

    // Update each staff member's myMeetings[] array
    await Promise.all(
      staffMembers.map(async (staff) => {
        staff.myMeetings.push(meetingDetails);
        await staff.save();
      })
    );

    res.status(201).json({ message: "Meeting scheduled successfully for all staff members." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};



// ✅ Get Attendance of All Staff (For Admin)
const getAllStaffAttendances = async (req, res) => {
  try {
    const staffMembers = await Staff.find({}, "firstName lastName phone myAttendance");

    return res.status(200).json({ staff: staffMembers });
  } catch (error) {
    console.error("Error fetching staff with tasks:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ✅ Get All Scheduled Meetings (Admin)
const getAllMeetings = async (req, res) => {
  try {
    // Fetch all staff members with their meetings
    const staffMeetings = await Staff.find({}, "myMeetings");

    // Extract all meetings from each staff member
    let allMeetings = [];
    staffMeetings.forEach((staff) => {
      allMeetings = [...allMeetings, ...staff.myMeetings];
    });

    if (allMeetings.length === 0) {
      return res.status(404).json({ message: "No meetings found." });
    }

    res.status(200).json({ message: "Meetings retrieved successfully.", meetings: allMeetings });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
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
  getAllUsers,
  addSalaryPayment,
  getAllSalaries,
  addUserFees,
  getAllFees,
  createPlan,
  getAllPlans,
  getAllUsersPlans,
  toggleUserPlanStatus,
  updatePlanStatus,
  getLatestPlan,
  updateUserFees,
  assignTaskToStaff,
  getAllStaffWithTasks,
  markAttendance,
  getAllStaffAttendances,
  scheduleMeeting,
  getAllMeetings
}