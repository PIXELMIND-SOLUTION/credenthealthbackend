import Admin from '../Models/Admin.js';
import generateToken from '../config/jwtToken.js';
import Staff from '../Models/staffModel.js';
import Doctor from '../Models/doctorModel.js';
import Diagnostic from '../Models/diagnosticModel.js';
import { uploadDocuments, uploadTestImages, uploadCompanyAssets, uploadStaffImages, uploadDoctorImage  } from '../config/multerConfig.js';
import Booking from '../Models/bookingModel.js';
import Appointment from '../Models/Appointment.js';
import Company from '../Models/companyModel.js';
import mongoose from 'mongoose';
import Category from '../Models/Category.js';
import HealthAssessment from '../Models/HealthAssessment.js';
import XLSX from 'xlsx';
import fs from 'fs';


// Admin Signup
export const signupAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Create new admin
        const newAdmin = new Admin({
            name,
            email,
            password, // Store password directly (no hashing)
        });

        // Save admin to database
        await newAdmin.save();

        // Generate JWT token
        const token = generateToken(newAdmin._id);

        res.status(201).json({
            message: 'Admin created successfully',
            token,
            admin: {
                name: newAdmin.name,
                email: newAdmin.email,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Admin Login
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if admin exists
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: 'Admin does not exist' });
        }

        // Check if password matches (no bcrypt, just direct comparison)
        if (admin.password !== password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken(admin._id);

        res.status(200).json({
            message: 'Login successful',
            token,
            admin: {
                name: admin.name,
                email: admin.email,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


// Admin Logout Controller
export const logoutAdmin = async (req, res) => {
  try {
    // Clear the JWT token cookie if it's stored in a cookie
    res.clearCookie('token', {
      httpOnly: true, // Prevents JavaScript access to the cookie
      secure: process.env.NODE_ENV === 'production', // Secure flag for production (HTTPS)
      sameSite: 'strict', // CSRF protection
    });

    // Send response indicating successful logout
    res.status(200).json({
      message: "Logout successful. Token cleared from cookies.",
    });
  } catch (error) {
    res.status(500).json({ message: "Logout failed", error });
  }
};


// Create Doctor Details
export const createDoctorDetails = async (req, res) => {
    try {
        const {
            name,
            category,  // category now instead of specialization
            contact_number,
            email,
            clinic_address,
            consultation_fee,
            available_days,
            working_hours,
            tests
        } = req.body;

        // Validate tests to ensure each test has price and offerPrice
        const validatedTests = tests.map(test => {
            if (!test.test_name || !test.description || !test.price) {
                throw new Error('Each test must have a name, description, and price');
            }
            // Ensure that offerPrice is always provided or defaults to the price
            test.offerPrice = test.offerPrice || test.price;
            return test;
        });

        // Create new doctor instance
        const newDoctor = new Doctor({
            name,
            category,  // Save category
            contact_number,
            email,
            clinic_address,
            consultation_fee,
            available_days,
            working_hours,
            tests: validatedTests  // Save tests with offerPrice
        });

        // Save doctor to MongoDB
        await newDoctor.save();

        res.status(201).json({
            message: 'Doctor details created successfully',
            doctor: newDoctor
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// Get All Doctor Details with category "Diagnostic"
export const getDoctorDetails = async (req, res) => {
    try {
        // Fetch all doctors with category "Diagnostic"
        const doctors = await Doctor.find({ category: 'Diagnostic' });

        if (doctors.length === 0) {
            return res.status(404).json({ message: 'No doctor details available in the Diagnostic category.' });
        }

        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


// Get only tests[] of a specific doctor
export const getDoctorTestsById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).select('tests');

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        if (!doctor.tests || doctor.tests.length === 0) {
            return res.status(200).json({ message: 'No tests found for this doctor', tests: [] });
        }

        res.status(200).json({
            message: 'Tests fetched successfully',
            doctor_id: doctor._id,
            total_tests: doctor.tests.length,
            tests: doctor.tests
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


// Update Doctor Details
export const updateDoctorDetails = async (req, res) => {
    try {
        const {
            name,
            category,
            contact_number,
            email,
            clinic_address,
            consultation_fee,
            available_days,
            working_hours,
            tests
        } = req.body;

        // Find doctor by ID
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        // Update doctor details
        doctor.name = name || doctor.name;
        doctor.category = category || doctor.category;
        doctor.contact_number = contact_number || doctor.contact_number;
        doctor.email = email || doctor.email;
        doctor.clinic_address = clinic_address || doctor.clinic_address;
        doctor.consultation_fee = consultation_fee || doctor.consultation_fee;
        doctor.available_days = available_days || doctor.available_days;
        doctor.working_hours = working_hours || doctor.working_hours;
        doctor.tests = tests || doctor.tests;

        // Save updated doctor details
        await doctor.save();

        res.status(200).json({
            message: 'Doctor details updated successfully',
            doctor
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


// ✅ Admin creating a new staff profile and linking it to a company
export const createStaffProfile = async (req, res) => {
  const { companyId } = req.params;

  // 🔍 Log the companyId for debugging
  console.log("👉 Received companyId:", companyId);

  // 🔒 Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    return res.status(400).json({ message: "Invalid company ID format" });
  }

  // 1. Wrap multer upload in a Promise to use with async/await
  const handleUpload = () => {
    return new Promise((resolve, reject) => {
      uploadStaffImages(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  try {
    await handleUpload(); // ⏫ Upload profileImage and idImage

    const {
      name,
      email,
      password, // ⚠️ Should be hashed in production
      contact_number,
      address,
      dob,
      gender,
      age,
    } = req.body;

    // 2. Check for existing staff with the same email
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({ message: "Staff with this email already exists" });
    }

    // 3. Extract uploaded image paths
    const profileImagePath = req.files?.profileImage?.[0]?.path || "";
    const idImagePath = req.files?.idImage?.[0]?.path || "";

    // 4. Create a new staff document in the Staff collection
    const newStaff = new Staff({
      name,
      email,
      password, // ⚠️ Remember to hash the password in production
      contact_number,
      address,
      dob,
      gender,
      age,
      role: "Staff",
      profileImage: profileImagePath,
      idImage: idImagePath,
    });

    // 5. Save the staff document to the Staff collection
    const savedStaff = await newStaff.save();

    // 6. Prepare data to push into company's `staff[]` array
    const staffMember = {
      _id: savedStaff._id,  // Link the staff member to the company using the saved staff ID
      name: savedStaff.name,
      role: "Staff",
      contact: savedStaff.contact_number,
      email: savedStaff.email,
      dob: savedStaff.dob,
      gender: savedStaff.gender,
      age: savedStaff.age,
      address: savedStaff.address,
      profileImage: savedStaff.profileImage,
      idImage: savedStaff.idImage,
      walletAmount: 0,  // Default wallet amount
    };

    // 7. Find the company and push the staff member to `staff[]`
    const updatedCompany = await Company.findByIdAndUpdate(
      companyId,
      { $push: { staff: staffMember } },
      { new: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({ message: "Company not found" });
    }

    // 8. Send back the response
    res.status(201).json({
      message: "Staff profile created and linked to company successfully",
      staff: {
        id: savedStaff._id,
        name: savedStaff.name,
        email: savedStaff.email,
        contact_number: savedStaff.contact_number,
        address: savedStaff.address,
        role: savedStaff.role,
        profileImage: savedStaff.profileImage,
        idImage: savedStaff.idImage,
      },
      company: updatedCompany,
    });

  } catch (error) {
    console.error("❌ Error creating staff profile:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



export const editStaffProfile = async (req, res) => {
  const { staffId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    return res.status(400).json({ message: "Invalid staff ID format" });
  }

  try {
    const updatedFields = req.body; // Yeh saare fields dynamically handle karega

    // 1. Update the staff document directly
    await Staff.findByIdAndUpdate(staffId, updatedFields, {
      new: true,
      runValidators: true,
    });

    // 2. Re-fetch the updated staff
    const updatedStaff = await Staff.findById(staffId);

    if (!updatedStaff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // 3. Dynamically build the $set object for Company.staff[]
    const companyUpdateFields = {};
    const allowedFields = ["name", "role", "contact_number", "email", "dob", "gender", "age", "address"];

    allowedFields.forEach((field) => {
      if (updatedFields[field] !== undefined) {
        const key = `staff.$.${field === "contact_number" ? "contact" : field}`;
        companyUpdateFields[key] = updatedFields[field];
      }
    });

    // 4. Update embedded staff inside company if any field matches
    if (Object.keys(companyUpdateFields).length > 0) {
      await Company.updateOne(
        { "staff._id": staffId },
        { $set: companyUpdateFields }
      );
    }

    res.status(200).json({
      message: "Staff profile updated successfully",
      updatedStaff,
    });

  } catch (error) {
    console.error("❌ Error updating staff:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




// 🗑️ Admin deleting a staff profile
export const deleteStaffProfile = async (req, res) => {
  const { staffId } = req.params;

  // 🔒 Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    return res.status(400).json({ message: "Invalid staff ID format" });
  }

  try {
    // 1. Delete staff from Staff collection
    const deletedStaff = await Staff.findByIdAndDelete(staffId);

    if (!deletedStaff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // 2. Remove staff from any company that has this staff linked
    await Company.updateMany(
      { "staff._id": staffId },
      { $pull: { staff: { _id: staffId } } }
    );

    res.status(200).json({
      message: "Staff deleted successfully",
      deletedStaff,
    });
  } catch (error) {
    console.error("❌ Error deleting staff:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


//book a diagnostics


// export const createDiagnosticDetails = async (req, res) => {
//   try {
//     // 🧪 Step 1: Upload test images
//     uploadTestImages(req, res, async (testImageError) => {
//       if (testImageError) {
//         console.log("❌ Test image upload failed:", testImageError);
//         return res.status(400).json({ message: "Test image upload failed", error: testImageError.message });
//       }

//       try {
//         // ✅ Log incoming form data and files
//         console.log("📥 req.body:", req.body);  // Log the entire form data
//         console.log("📁 req.files:", req.files);  // Log uploaded files

//         // Parse individual fields from the flat req.body
//         const {
//           name,
//           image,
//           address,
//           centerType,
//           email,
//           phone,
//           gstNumber,
//           centerStrength,
//           country,
//           state,
//           city,
//           pincode,
//           password,
//         } = req.body;

//         // Parse contact persons and tests from flat fields in req.body
//         const contactPersons = [];
//         const tests = [];

//         // Loop through the flat fields to extract contactPersons and tests
//         Object.keys(req.body).forEach((key) => {
//           if (key.startsWith("contactPersons")) {
//             const index = key.match(/\d+/)[0]; // Extract index (e.g., '0' from 'contactPersons[0].name')
//             const field = key.split(".")[1]; // Extract field name (e.g., 'name', 'designation')

//             if (!contactPersons[index]) {
//               contactPersons[index] = {}; // Initialize contact person object if not already created
//             }
//             contactPersons[index][field] = req.body[key]; // Add the field to the respective contact person object
//           }

//           if (key.startsWith("tests")) {
//             const index = key.match(/\d+/)[0]; // Extract index (e.g., '0' from 'tests[0].test_name')
//             const field = key.split(".")[1]; // Extract field name (e.g., 'test_name', 'description')

//             if (!tests[index]) {
//               tests[index] = {}; // Initialize test object if not already created
//             }
//             tests[index][field] = req.body[key]; // Add the field to the respective test object
//           }
//         });

//         // 🧪 Attach uploaded test images to the tests
//         if (req.file) {
//           tests.forEach((test, index) => {
//             test.image = req.file.path || null; // Attach image path if file exists
//           });
//         }

//         console.log("Contact Persons:", contactPersons);
//         console.log("Tests:", tests);

//         // 🏥 Create Diagnostic center object
//         const newDiagnostic = new Diagnostic({
//           name,
//           image,  // Assuming this is the company image or other image field
//           address,
//           centerType,
//           email,
//           phone,
//           gstNumber,
//           centerStrength,
//           country,
//           state,
//           city,
//           pincode,
//           contactPersons: contactPersons || [], // Ensure it's an array
//           password,
//           tests: tests || [], // Ensure it's an array
//           testImages: req.files ? req.files.map((file) => file.path) : [], // Save test image path if present
//         });

//         await newDiagnostic.save();

//         console.log("✅ Diagnostic center saved:", newDiagnostic);

//         res.status(201).json({
//           message: "Diagnostic center created successfully",
//           diagnostic: newDiagnostic,
//         });
//       } catch (err) {
//         console.error("💥 Error while processing form data:", err);
//         res.status(500).json({ message: "Server error", error: err.message });
//       }
//     });
//   } catch (error) {
//     console.error("🔥 Unexpected error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };




// Create Diagnostic Center function
export const createDiagnosticDetails = async (req, res) => {
  try {
    // Incoming JSON data logging
    console.log("📥 Incoming JSON data:", req.body);

    // Extract data directly from req.body
    const {
      name,
      image,
      address,
      centerType,
      email,
      phone,
      gstNumber,
      centerStrength,
      country,
      state,
      city,
      pincode,
      password,
      contactPersons,
      tests,
      packages
    } = req.body;

    // 🧪 Create the Diagnostic center object
    const newDiagnostic = new Diagnostic({
      name,
      image,
      address,
      centerType,
      email,
      phone,
      gstNumber,
      centerStrength,
      country,
      state,
      city,
      pincode,
      password,
      contactPersons: contactPersons || [],
      tests: tests || [],
      packages: packages || [],
      documents: req.files ? req.files.map((file) => file.path) : [],
    });

    // Save the new diagnostic center to the database
    await newDiagnostic.save();

    console.log("✅ Diagnostic center created successfully:", newDiagnostic);

    res.status(201).json({
      message: "Diagnostic center created successfully",
      diagnostic: newDiagnostic,
    });

  } catch (error) {
    console.error("🔥 Error while creating diagnostic center:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Assign Diagnostic and Package to Staff function
export const assignDiagnosticAndPackageToStaff = async (req, res) => {
  const { staffId, diagnosticId, packageId } = req.body;  // Staff ID, Diagnostic Center ID, Package ID from request body

  try {
    // Find the staff by ID
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Check if the diagnostic center exists
    const diagnosticCenter = await Diagnostic.findById(diagnosticId);
    if (!diagnosticCenter) {
      return res.status(404).json({ message: "Diagnostic center not found" });
    }

    // Check if the package exists
    const packageExists = await Package.findById(packageId);
    if (!packageExists) {
      return res.status(404).json({ message: "Package not found" });
    }

    // Assign the diagnostic center and package to the staff
    staff.diagnosticId = diagnosticId;
    staff.packageId = packageId;

    // Save the staff data with the updated assignment
    await staff.save();

    res.status(200).json({
      message: "Diagnostic center and package assigned successfully to staff",
      staff,
    });
  } catch (error) {
    console.error("Error assigning diagnostic center and package to staff:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const updateDiagnosticDetails = async (req, res) => {
  try {
    const { diagnosticId } = req.params;

    // ✅ Validate diagnosticId
    if (!mongoose.Types.ObjectId.isValid(diagnosticId)) {
      return res.status(400).json({ message: "Invalid Diagnostic Center ID" });
    }

    // 🧪 Upload images if sent
    uploadTestImages(req, res, async (uploadErr) => {
      if (uploadErr) {
        console.error("❌ Image upload failed:", uploadErr);
        return res.status(400).json({ message: "Image upload failed", error: uploadErr.message });
      }

      try {
        const diagnostic = await Diagnostic.findById(diagnosticId);
        if (!diagnostic) {
          return res.status(404).json({ message: "Diagnostic center not found" });
        }

        console.log("📥 req.body:", req.body);
        console.log("📁 req.files:", req.files);

        const updateData = { ...req.body };

        // Parse contactPersons and tests from flat fields
        const contactPersons = [];
        const tests = [];

        Object.keys(req.body).forEach((key) => {
          if (key.startsWith("contactPersons")) {
            const index = key.match(/\d+/)[0];
            const field = key.split(".")[1];
            if (!contactPersons[index]) contactPersons[index] = {};
            contactPersons[index][field] = req.body[key];
          }

          if (key.startsWith("tests")) {
            const index = key.match(/\d+/)[0];
            const field = key.split(".")[1];
            if (!tests[index]) tests[index] = {};
            tests[index][field] = req.body[key];
          }
        });

        if (contactPersons.length) updateData.contactPersons = contactPersons;
        if (tests.length) updateData.tests = tests;

        // 🔄 Handle new image uploads if any
        if (req.files && req.files.length > 0) {
          const imagePaths = req.files.map((file) => file.path);
          updateData.testImages = imagePaths;

          // Optionally delete old testImages from disk
          if (diagnostic.testImages && diagnostic.testImages.length > 0) {
            diagnostic.testImages.forEach((imgPath) => {
              const fullPath = path.resolve(imgPath);
              fs.unlink(fullPath, (err) => {
                if (err) console.warn("⚠️ Failed to delete old image:", fullPath);
              });
            });
          }
        }

        // 🔃 Update diagnostic with new data
        const updatedDiagnostic = await Diagnostic.findByIdAndUpdate(
          diagnosticId,
          { $set: updateData },
          { new: true }
        );

        res.status(200).json({
          message: "Diagnostic center updated successfully",
          diagnostic: updatedDiagnostic,
        });
      } catch (err) {
        console.error("💥 Error during update:", err);
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });
  } catch (error) {
    console.error("🔥 Unexpected error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const deleteDiagnosticCenter = async (req, res) => {
  const { diagnosticId } = req.params;

  // ✅ Validate diagnosticId
  if (!mongoose.Types.ObjectId.isValid(diagnosticId)) {
    return res.status(400).json({ message: "Invalid Diagnostic Center ID" });
  }

  try {
    // 🔍 Step 1: Find diagnostic center
    const diagnostic = await Diagnostic.findById(diagnosticId);

    if (!diagnostic) {
      return res.status(404).json({ message: "Diagnostic Center not found" });
    }

    // 🧹 Step 2: Delete associated test images from disk (if any)
    if (diagnostic.testImages && diagnostic.testImages.length > 0) {
      diagnostic.testImages.forEach((imgPath) => {
        const fullPath = path.resolve(imgPath);
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.warn("⚠️ Could not delete file:", fullPath);
          } else {
            console.log("🗑️ Deleted test image:", fullPath);
          }
        });
      });
    }

    // 🗑️ Step 3: Delete the diagnostic document
    await Diagnostic.findByIdAndDelete(diagnosticId);

    res.status(200).json({
      message: "Diagnostic Center deleted successfully",
      deletedId: diagnosticId,
    });
  } catch (error) {
    console.error("❌ Error deleting diagnostic center:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get all Diagnostic Centers
export const getAllDiagnostics = async (req, res) => {
    try {
        const diagnostics = await Diagnostic.find(); // Fetch all diagnostic centers

        if (diagnostics.length === 0) {
            return res.status(404).json({ message: 'No diagnostic centers found' });
        }

        res.status(200).json({
            message: 'Diagnostic centers retrieved successfully',
            diagnostics
        });
    } catch (error) {
        console.error('Error fetching diagnostic centers:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// Get a Specific Diagnostic Center by diagnosticId (Including tests)
export const getDiagnosticById = async (req, res) => {
    try {
        const diagnostic = await Diagnostic.findById(req.params.diagnosticId); // Fetch diagnostic by diagnosticId

        if (!diagnostic) {
            return res.status(404).json({ message: 'Diagnostic center not found' });
        }

        res.status(200).json({
            message: 'Diagnostic center retrieved successfully',
            diagnostic
        });
    } catch (error) {
        console.error('Error fetching diagnostic center:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// Get all Tests and Packages from a Specific Diagnostic Center by diagnosticId
export const getAllTests = async (req, res) => {
  try {
      const { diagnosticId } = req.params; // Extract diagnosticId from the URL params

      // Fetch the diagnostic center by its ID
      const diagnostic = await Diagnostic.findById(diagnosticId);

      if (!diagnostic) {
          return res.status(404).json({ message: 'Diagnostic center not found' });
      }

      // Return the tests and packages associated with this specific diagnostic center
      res.status(200).json({
          message: 'Tests and packages retrieved successfully',
          tests: diagnostic.tests, // The array of tests directly under the diagnostic center
          packages: diagnostic.packages // The array of packages associated with the diagnostic center
      });
  } catch (error) {
      console.error('Error fetching tests and packages:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};





// // Update Diagnostic Center and its Tests
// export const updateDiagnosticDetails = async (req, res) => {
//     try {
//         const { diagnosticId } = req.params;  // Get diagnosticId from the URL
//         const { name, image, address, tests } = req.body;

//         // Find the diagnostic center by its ID
//         const diagnostic = await Diagnostic.findById(diagnosticId);
//         if (!diagnostic) {
//             return res.status(404).json({ message: 'Diagnostic center not found' });
//         }

//         // Validate tests to ensure each test has all necessary fields
//         const validatedTests = tests.map(test => {
//             if (!test.test_name || !test.description || !test.price) {
//                 throw new Error('Each test must have a name, description, and price');
//             }
//             // Ensure offerPrice is always provided or defaults to price
//             test.offerPrice = test.offerPrice || test.price;
//             return test;
//         });

//         // Update the diagnostic center fields
//         diagnostic.name = name || diagnostic.name;
//         diagnostic.image = image || diagnostic.image;
//         diagnostic.address = address || diagnostic.address;
//         diagnostic.tests = validatedTests || diagnostic.tests;

//         // Save the updated diagnostic center to the database
//         await diagnostic.save();

//         // Send the response back with updated diagnostic center details
//         res.status(200).json({
//             message: 'Diagnostic center updated successfully',
//             diagnostic
//         });
//     } catch (error) {
//         console.error('Error updating diagnostic details:', error);
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };


// Delete a Diagnostic Center
export const deleteDiagnosticDetails = async (req, res) => {
    try {
        const { diagnosticId } = req.params;  // Get diagnosticId from the URL

        // Find and delete the diagnostic center by its ID
        const diagnostic = await Diagnostic.findByIdAndDelete(diagnosticId);
        if (!diagnostic) {
            return res.status(404).json({ message: 'Diagnostic center not found' });
        }

        // Send the response back confirming the deletion
        res.status(200).json({
            message: 'Diagnostic center deleted successfully',
            diagnostic
        });
    } catch (error) {
        console.error('Error deleting diagnostic details:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller to add amount to staff wallet
export const addAmountToWallet = async (req, res) => {
  try {
      const { staffId, companyId } = req.params;  // Accept companyId in the params
      const { amount, from } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than zero' });
      }

      // 1. Find the staff member by staffId
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(404).json({ message: 'Staff not found' });
      }

      // 2. Update the wallet balance in the Staff model
      staff.wallet_balance += amount;

      // Log the transaction
      staff.wallet_logs = staff.wallet_logs || [];
      staff.wallet_logs.push({
        type: 'credit',
        amount: amount,
        from: from || 'Admin',
        date: new Date(),
      });

      // Save the staff document
      await staff.save();

      // 3. Update the staff wallet balance in the company's `staff[]` array
      const updatedCompany = await Company.findOneAndUpdate(
        { _id: companyId, "staff._id": staffId },  // Find the company and staff member
        { $set: { "staff.$.wallet_balance": staff.wallet_balance } },  // Update wallet balance in the company's staff array
        { new: true }
      );

      if (!updatedCompany) {
        return res.status(404).json({ message: 'Company or staff not found in company' });
      }

      // 4. Respond with the updated wallet balance
      res.status(200).json({
        message: 'Amount credited to staff wallet successfully',
        wallet_balance: staff.wallet_balance,
      });
  } catch (error) {
      console.error('Error crediting wallet:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const createDoctor = async (req, res) => {
  try {
    // Handle the image upload
    uploadDoctorImage(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: 'Error uploading image', error: err.message });
      }

      // After the image is uploaded, create the doctor with the form data
      const { name, email, password, specialization, qualification, description, consultation_fee, address, category, schedule } = req.body;

      // Parse the schedule (string) if it's sent ass a stringified JSON array
      const parsedSchedule = schedule ? JSON.parse(schedule) : [];

      // Get the image path (this will be the file path saved in the uploads directory)
      const image = req.file ? `/uploads/doctorimages/${req.file.filename}` : null;

      // Create a new Doctor document
      const doctor = new Doctor({
        name,
        email,
        password,
        specialization,
        qualification,
        description,
        consultation_fee,
        address,
        image,
        category,
        schedule: parsedSchedule, // Save the parsed schedule (with day, date, and time slots)
      });

      // Save the doctor to the database
      await doctor.save();

      // Send response back
      res.status(201).json({ message: 'Doctor created successfully', doctor });
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// Get all doctors with filters
export const getAllDoctors = async (req, res) => {
    try {
      // Extract query parameters for filtering
      const { category, department, sortBy, consultationType, consultation_fee } = req.query;
  
      // Build the filter object
      const filter = {};
  
      if (category) {
        filter.category = category;
      }
  
      if (department) {
        filter.department = department;
      }
  
      if (consultationType) {
        filter.consultationType = consultationType;
      }
  
      if (consultation_fee) {
        filter.consultation_fee = { $lte: consultation_fee }; // assuming we want to filter by price less than or equal to the value provided
      }
  
      // Find doctors based on the filter
      const doctors = await Doctor.find(filter);
  
      // If no doctors match the filter, return a custom message
      if (doctors.length === 0) {
        return res.status(404).json({ message: 'No doctors found matching the criteria' });
      }
  
      // Sorting if a sortBy parameter is provided
      if (sortBy) {
        const [field, order] = sortBy.split(','); // assuming sortBy is passed as "field,order" (e.g. "price,asc")
        const sortOrder = order === 'desc' ? -1 : 1;
        doctors.sort((a, b) => (a[field] > b[field] ? sortOrder : -sortOrder)); // Basic in-memory sorting
      }
  
      // Return filtered and sorted doctors
      res.status(200).json(doctors);
  
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  
  // Get doctor by ID
  export const getDoctorById = async (req, res) => {
    try {
      const doctor = await Doctor.findById(req.params.id);
      if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
      res.status(200).json(doctor);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  // Update doctor
  export const updateDoctor = async (req, res) => {
    try {
      const updatedDoctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedDoctor) return res.status(404).json({ message: 'Doctor not found' });
      res.status(200).json({ message: 'Doctor updated successfully', doctor: updatedDoctor });
    } catch (error) {
      console.error('Error updating doctor:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  // Delete doctor
  export const deleteDoctor = async (req, res) => {
    try {
      const deletedDoctor = await Doctor.findByIdAndDelete(req.params.id);
      if (!deletedDoctor) return res.status(404).json({ message: 'Doctor not found' });
      res.status(200).json({ message: 'Doctor deleted successfully' });
    } catch (error) {
      console.error('Error deleting doctor:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


// Controller to get all diagnostic bookings with optional status filter
export const getAllDiagnosticBookings = async (req, res) => {
  try {
    const { status } = req.body; // Get status filter from the request body (optional)

    // 1. Find all bookings
    const bookings = await Booking.find()
      .populate('staff')  // Populate staff details
      .populate('diagnostic')  // Populate diagnostic center details
      .populate({
        path: 'diagnostic.tests',  // Populate the embedded tests
        select: 'test_name price offerPrice description image'
      });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found' });
    }

    // 2. Apply status filter if provided
    const filteredBookings = status
      ? bookings.filter((booking) => booking.status === status)
      : bookings;

    // 3. Format booking details
    const bookingDetails = filteredBookings.map((booking) => {
      return {
        bookingId: booking._id,
        patient_name: booking.patient_name,
        patient_age: booking.age,
        patient_gender: booking.gender,
        staff_name: booking.staff ? booking.staff.name : 'N/A',
        diagnostic_name: booking.diagnostic ? booking.diagnostic.name : 'N/A',
        diagnostic_image: booking.diagnostic?.image || '',
        diagnostic_address: booking.diagnostic?.address || '',
        consultation_fee: booking.consultation_fee || 0,
        tests: booking.diagnostic?.tests?.map(test => ({
          test_name: test.test_name,
          price: test.price,
          offerPrice: test.offerPrice || test.price,
          description: test.description,
          image: test.image
        })) || [],
        appointment_date: booking.appointment_date,
        gender: booking.gender,
        age: booking.age,
        subtotal: booking.subtotal,
        gst_on_tests: booking.gst_on_tests,
        gst_on_consultation: booking.gst_on_consultation,
        total: booking.total,
        status: booking.status
      };
    });

    // 4. Send response
    res.status(200).json({
      message: 'All bookings fetched successfully',
      bookings: bookingDetails
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// Controller to get a single diagnostic booking by ID
export const getSingleDiagnosticBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('staff') // Populate staff details
      .populate('diagnostic') // Populate diagnostic center details
      .populate({
        path: 'diagnostic.tests',
        select: 'test_name price offerPrice description image'
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const bookingDetails = {
      bookingId: booking._id,
      patient_name: booking.patient_name,
      patient_age: booking.age,
      patient_gender: booking.gender,
      staff_name: booking.staff ? booking.staff.name : 'N/A',
      diagnostic_name: booking.diagnostic ? booking.diagnostic.name : 'N/A',
      diagnostic_image: booking.diagnostic?.image || '',
      diagnostic_address: booking.diagnostic?.address || '',
      consultation_fee: booking.consultation_fee || 0,
      tests: booking.diagnostic?.tests?.map(test => ({
        test_name: test.test_name,
        price: test.price,
        offerPrice: test.offerPrice || test.price,
        description: test.description,
        image: test.image
      })) || [],
      appointment_date: booking.appointment_date,
      gender: booking.gender,
      age: booking.age,
      subtotal: booking.subtotal,
      gst_on_tests: booking.gst_on_tests,
      gst_on_consultation: booking.gst_on_consultation,
      total: booking.total,
      status: booking.status
    };

    res.status(200).json({
      message: 'Booking fetched successfully',
      booking: bookingDetails
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// Controller to get bookings for a specific diagnostic center
export const getBookingsByDiagnosticId = async (req, res) => {
  try {
    const { diagnosticId } = req.params;

    if (!diagnosticId) {
      return res.status(400).json({ message: 'Diagnostic ID is required' });
    }

    const { status } = req.body; // Optional status filter

    // 1. Find bookings for the specific diagnostic center
    const bookings = await Booking.find({ diagnostic: diagnosticId })
      .populate('staff')
      .populate('diagnostic')
      .populate({
        path: 'diagnostic.tests',
        select: 'test_name price offerPrice description image'
      });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for this diagnostic center' });
    }

    // 2. Apply status filter if provided
    const filteredBookings = status
      ? bookings.filter((booking) => booking.status === status)
      : bookings;

    // 3. Format data
    const bookingDetails = filteredBookings.map((booking) => ({
      bookingId: booking._id,
      patient_name: booking.patient_name,
      patient_age: booking.age,
      patient_gender: booking.gender,
      staff_name: booking.staff ? booking.staff.name : 'N/A',
      diagnostic_name: booking.diagnostic ? booking.diagnostic.name : 'N/A',
      diagnostic_image: booking.diagnostic?.image || '',
      diagnostic_address: booking.diagnostic?.address || '',
      consultation_fee: booking.consultation_fee || 0,
      tests: booking.diagnostic?.tests?.map(test => ({
        test_name: test.test_name,
        price: test.price,
        offerPrice: test.offerPrice || test.price,
        description: test.description,
        image: test.image
      })) || [],
      appointment_date: booking.appointment_date,
      gender: booking.gender,
      age: booking.age,
      subtotal: booking.subtotal,
      gst_on_tests: booking.gst_on_tests,
      gst_on_consultation: booking.gst_on_consultation,
      total: booking.total,
      status: booking.status
    }));

    res.status(200).json({
      message: 'Bookings fetched successfully',
      bookings: bookingDetails
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Controller to delete a specific booking
export const deleteBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const deletedBooking = await Booking.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({
      message: 'Booking deleted successfully',
      deletedBookingId: deletedBooking._id,
    });
  } catch (error) {
    console.error('❌ Error deleting booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




export const getAllDoctorAppointments = async (req, res) => {
  try {
    // Fetch all appointments with populated doctor and staff details
    const appointments = await Appointment.find()
      .populate({
        path: 'doctor',
        select: 'name specialization image'
      })
      .populate({
        path: 'staff',
        select: 'name' // Assuming 'name' field exists in the Staff model
      })
      .select('patient_name patient_relation age gender subtotal total appointment_date status doctor staff');

    res.status(200).json({
      message: 'All doctor appointments fetched successfully',
      appointments: appointments.map((appointment) => ({
        appointmentId: appointment._id,
        doctor_name: appointment.doctor?.name,
        doctor_specialization: appointment.doctor?.specialization,
        doctor_image: appointment.doctor?.image,
        staff_name: appointment.staff?.name, // Added staff name here
        appointment_date: appointment.appointment_date,
        status: appointment.status,
        patient_name: appointment.patient_name,
        patient_relation: appointment.patient_relation,
        age: appointment.age,
        gender: appointment.gender,
        subtotal: appointment.subtotal,
        total: appointment.total,
      })),
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const getSingleDoctorAppointment = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate({
        path: 'doctor',
        select: 'name specialization image',
      })
      .populate({
        path: 'staff',
        select: 'name',
      })
      .select(
        'patient_name patient_relation age gender subtotal total appointment_date status doctor staff'
      );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json({
      message: 'Doctor appointment fetched successfully',
      appointment: {
        appointmentId: appointment._id,
        doctor_name: appointment.doctor?.name,
        doctor_specialization: appointment.doctor?.specialization,
        doctor_image: appointment.doctor?.image,
        staff_name: appointment.staff?.name,
        appointment_date: appointment.appointment_date,
        status: appointment.status,
        patient_name: appointment.patient_name,
        patient_relation: appointment.patient_relation,
        age: appointment.age,
        gender: appointment.gender,
        subtotal: appointment.subtotal,
        total: appointment.total,
      },
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params; // Extract doctorId from the request parameters

    // Fetch appointments for the specific doctor
    const appointments = await Appointment.find({ doctor: doctorId })
      .populate({
        path: 'doctor',
        select: 'name specialization image',
      })
      .select('patient_name patient_relation age gender subtotal total appointment_date status doctor');

    // Check if no appointments found for the doctor
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found for this doctor' });
    }

    // Respond with the filtered appointment data
    res.status(200).json({
      message: `Appointments for Doctor ${appointments[0].doctor?.name} fetched successfully`,
      appointments: appointments.map((appointment) => ({
        appointmentId: appointment._id,
        doctor_name: appointment.doctor?.name,
        doctor_specialization: appointment.doctor?.specialization,
        doctor_image: appointment.doctor?.image,
        appointment_date: appointment.appointment_date,
        status: appointment.status,
        patient_name: appointment.patient_name,
        patient_relation: appointment.patient_relation,
        age: appointment.age,
        gender: appointment.gender,
        subtotal: appointment.subtotal,
        total: appointment.total,
      })),
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};





export const createCompany = (req, res) => {
  uploadCompanyAssets(req, res, async (err) => {
    if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({ message: 'File upload failed', error: err.message });
    }

    try {
      const {
        name,
        companyType,
        assignedBy,
        registrationDate,
        contractPeriod,
        renewalDate,
        insuranceBroker,
        email,
        phone,
        gstNumber,
        companyStrength,
        country,
        state,
        city,
        pincode,
        password,
        diagnostic,
        contactPerson,
      } = req.body;

      // ✅ Parse and validate diagnostic IDs
      const diagnosticIds = typeof diagnostic === 'string' ? JSON.parse(diagnostic) : diagnostic;
      const filteredDiagnosticIds = (diagnosticIds || []).filter(id => mongoose.Types.ObjectId.isValid(id));

      console.log("Received diagnostic IDs:", diagnosticIds);
      console.log("Filtered valid diagnostic IDs:", filteredDiagnosticIds);

      const validDiagnostics = await Diagnostic.find({
        '_id': { $in: filteredDiagnosticIds },
      }).select('_id');

      console.log("Valid diagnostics found:", validDiagnostics);

      // ✅ Handle uploaded files
      const imageFile = req.files?.image?.[0]?.path || '';
      const documents = req.files?.documents?.map(doc => doc.path) || [];

      // ✅ Parse and format contact persons
      const parsedContactPersons = typeof contactPerson === 'string' ? JSON.parse(contactPerson) : contactPerson;

      const formattedContactPersons = Array.isArray(parsedContactPersons)
        ? parsedContactPersons.map(person => ({
            name: person?.name,
            designation: person?.designation,
            gender: person?.gender,
            email: person?.email,
            phone: person?.phone,
            address: {
              country: person?.address?.country,
              state: person?.address?.state,
              city: person?.address?.city,
              pincode: person?.address?.pincode,
              street: person?.address?.street || 'Not Provided',
            },
          }))
        : [];

      // ✅ Create new company
      const newCompany = new Company({
        name,
        companyType,
        assignedBy,
        registrationDate,
        contractPeriod,
        renewalDate,
        insuranceBroker,
        email,
        phone,
        gstNumber,
        companyStrength,
        country,
        state,
        city,
        pincode,
        password,
        diagnostics: validDiagnostics.map(d => d._id),  // ✅ Use valid diagnostic IDs
        image: imageFile,
        documents,
        contactPerson: formattedContactPersons,
      });

      const savedCompany = await newCompany.save();

      res.status(201).json({
        message: 'Company created successfully!',
        company: savedCompany,
      });

    } catch (error) {
      console.error('Error creating company:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
};




export const updateCompany = (req, res) => {
  // Get companyId from URL params
  const { companyId } = req.params;

  // Call multer middleware manually to handle file uploads
  uploadCompanyAssets(req, res, async (err) => {
    if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({ message: 'File upload failed', error: err.message });
    }

    try {
      const {
        name,
        companyType,
        assignedBy,
        registrationDate,
        contractPeriod,
        renewalDate,
        insuranceBroker,
        email,
        phone,
        gstNumber,
        companyStrength,
        country,
        state,
        city,
        pincode,
        contactPerson,
        password,
        diagnostic,  // Array of diagnostic _ids
      } = req.body;

      // 🔍 Parse diagnostic array from frontend if sent as stringified JSON
      const diagnosticIds = typeof diagnostic === 'string' ? JSON.parse(diagnostic) : diagnostic;

      // Check if all diagnostic _ids are valid
      const validDiagnostics = diagnosticIds
        ? await Diagnostic.find({ '_id': { $in: diagnosticIds } }).select('_id')
        : [];

      // 📂 Handle uploaded files (image and documents)
      const imageFile = req.files?.image?.[0]?.path || '';
      const documents = req.files?.documents?.map(doc => doc.path) || [];

      // 🔄 Parse the contactPerson if sent as stringified JSON
      const parsedContactPerson = typeof contactPerson === 'string' ? JSON.parse(contactPerson) : contactPerson;

      // Prepare the updated company data
      const updateData = {};

      // Only include the fields that are provided in the request
      if (name) updateData.name = name;
      if (companyType) updateData.companyType = companyType;
      if (assignedBy) updateData.assignedBy = assignedBy;
      if (registrationDate) updateData.registrationDate = registrationDate;
      if (contractPeriod) updateData.contractPeriod = contractPeriod;
      if (renewalDate) updateData.renewalDate = renewalDate;
      if (insuranceBroker) updateData.insuranceBroker = insuranceBroker;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (gstNumber) updateData.gstNumber = gstNumber;
      if (companyStrength) updateData.companyStrength = companyStrength;
      if (country) updateData.country = country;
      if (state) updateData.state = state;
      if (city) updateData.city = city;
      if (pincode) updateData.pincode = pincode;
      if (password) updateData.password = password;  // Store password directly

      if (validDiagnostics.length > 0) updateData.diagnostics = validDiagnostics.map(d => d._id);  // Store the array of diagnostic _ids
      if (imageFile) updateData.image = imageFile;  // Update the uploaded image path
      if (documents.length > 0) updateData.documents = documents;  // Update the uploaded document paths

      if (parsedContactPerson) {
        updateData.contactPerson = {
          name: parsedContactPerson?.name,
          designation: parsedContactPerson?.designation,
          gender: parsedContactPerson?.gender,
          email: parsedContactPerson?.email,
          phone: parsedContactPerson?.phone,
          address: {
            country: parsedContactPerson?.address?.country,
            state: parsedContactPerson?.address?.state,
            city: parsedContactPerson?.address?.city,
            pincode: parsedContactPerson?.address?.pincode,
            street: parsedContactPerson?.address?.street || 'Not Provided',  // Default if not provided
          },
        };
      }

      // Find the company by ID and update it
      const updatedCompany = await Company.findByIdAndUpdate(companyId, updateData, { new: true });

      if (!updatedCompany) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Respond with success message and the updated company details
      res.status(200).json({
        message: 'Company updated successfully!',
        company: updatedCompany,
      });
    } catch (error) {
      console.error('Error updating company:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });
};




export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: 'Companies fetched successfully',
      companies,
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


export const getCompanyById = async (req, res) => {
  try {
    const { companyId } = req.params; // Get companyId from URL parameters

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({
      message: 'Company fetched successfully',
      company,
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


// Delete Company Controller
export const deleteCompany = async (req, res) => {
  const { companyId } = req.params; // companyId from URL params

  try {
    // Check if the company exists
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Optionally, delete related files and assets (e.g., images and documents)
    // Assuming `company.image` and `company.documents` hold paths to the files.
    if (company.image) {
      // Use fs or a package like 'fs-extra' to delete the file from the server
      const fs = require('fs');
      fs.unlinkSync(company.image);
    }

    if (company.documents && company.documents.length > 0) {
      const fs = require('fs');
      company.documents.forEach((doc) => {
        fs.unlinkSync(doc);
      });
    }

    // Delete related diagnostics if necessary (optional)
    // if (company.diagnostics) {
    //   await Diagnostic.deleteMany({ _id: { $in: company.diagnostics } });
    // }

    // Finally, delete the company
    await Company.findByIdAndDelete(companyId);

    res.status(200).json({ message: 'Company deleted successfully!' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};



export const getCompanyDiagnostics = async (req, res) => {
  try {
    const { companyId } = req.params;

    // 1. Find company by ID and only get diagnostics field
    const company = await Company.findById(companyId).select('diagnostics');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // 2. Populate diagnostic details from Diagnostic model
    const diagnosticDetails = await Diagnostic.find({
      _id: { $in: company.diagnostics },
    });

    res.status(200).json({
      message: 'Diagnostics fetched successfully',
      diagnostics: diagnosticDetails,
    });
  } catch (error) {
    console.error('Error fetching diagnostics:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};




// Fetch company and its staff by companyId
export const getCompanyWithStaff = async (req, res) => {
  const { companyId } = req.params; // Retrieve companyId from the URL params

  try {
    // Fetch company by companyId and populate staff array
    const company = await Company.findById(companyId).populate('staff');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({
      message: 'Company and staff fetched successfully',
      company,
    });
  } catch (error) {
    console.error('Error fetching company with staff:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};



// Controller to create a new category
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    // Create new category
    const category = new Category({
      name,
      description,
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating category' });
  }
};

// Controller to get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();

    if (categories.length === 0) {
      return res.status(404).json({ message: 'No categories found' });
    }

    res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};




///company controllers

// Admin Login
export const loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if company exists
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(400).json({ message: 'Company does not exist' });
    }

    // Check if password matches directly (without bcrypt)
    if (company.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(company._id);

    // Return success message with company details and JWT token
    res.status(200).json({
      message: 'Login successful',
      token,
      company: {
        id: company._id, // Add company ID here
        name: company.name,
        email: company.email,
        companyType: company.companyType,
        assignedBy: company.assignedBy,
        registrationDate: company.registrationDate,
        contractPeriod: company.contractPeriod,
        renewalDate: company.renewalDate,
        insuranceBroker: company.insuranceBroker,
        gstNumber: company.gstNumber,
        companyStrength: company.companyStrength,
        country: company.country,
        state: company.state,
        city: company.city,
        pincode: company.pincode,
        contactPerson: company.contactPerson, // Include the contact person details
        documents: company.documents, // Include documents if necessary
      },
    });
  } catch (error) {
    console.error('Error during company login:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


// Company Logout Controller
export const logoutCompany = async (req, res) => {
  try {
    // Clear the JWT token cookie if it's stored in a cookie
    res.clearCookie('company_token', {
      httpOnly: true, // Prevents JavaScript access to the cookie
      secure: process.env.NODE_ENV === 'production', // Secure flag for production (HTTPS)
      sameSite: 'strict', // CSRF protection
    });

    // Send response indicating successful logout
    res.status(200).json({
      message: "Company logout successful. Token cleared from cookies.",
    });
  } catch (error) {
    res.status(500).json({ message: "Company logout failed", error });
  }
};


// PUT controller to update status of a booking by bookingId from URL params
export const updateBookingStatusByDiagnostic = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { newStatus } = req.body;

    // Validation: Ensure newStatus is provided
    if (!newStatus) {
      return res.status(400).json({ message: "newStatus is required in request body" });
    }

    // Find the booking by bookingId and update its status
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: { status: newStatus } },
      { new: true }  // Return the updated booking
    );

    // Check if booking was found
    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: `Booking status updated to "${newStatus}"`,
      updatedBooking
    });

  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Controller to get all diagnostic bookings with status 'accepted'
export const getAcceptedDiagnosticBookings = async (req, res) => {
  try {
    // 1. Find all bookings with status "accepted"
    const bookings = await Booking.find({ status: 'accepted' }) // Only fetch bookings with status "accepted"
      .populate('staff')  // Populate staff details
      .populate('diagnostic')  // Populate diagnostic center details
      .populate({
        path: 'diagnostic.tests',  // Populate the embedded tests
        select: 'test_name price offerPrice description image'
      });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No accepted bookings found' });
    }

    // 2. Format booking details
    const bookingDetails = bookings.map((booking) => {
      return {
        bookingId: booking._id,
        patient_name: booking.patient_name,
        patient_age: booking.age,
        patient_gender: booking.gender,
        staff_name: booking.staff ? booking.staff.name : 'N/A',
        diagnostic_name: booking.diagnostic ? booking.diagnostic.name : 'N/A',
        diagnostic_image: booking.diagnostic?.image || '',
        diagnostic_address: booking.diagnostic?.address || '',
        consultation_fee: booking.consultation_fee || 0,
        tests: booking.diagnostic?.tests?.map(test => ({
          test_name: test.test_name,
          price: test.price,
          offerPrice: test.offerPrice || test.price,
          description: test.description,
          image: test.image
        })) || [],
        appointment_date: booking.appointment_date,
        gender: booking.gender,
        age: booking.age,
        subtotal: booking.subtotal,
        gst_on_tests: booking.gst_on_tests,
        gst_on_consultation: booking.gst_on_consultation,
        total: booking.total,
        status: booking.status
      };
    });

    // 3. Send response
    res.status(200).json({
      message: 'Accepted bookings fetched successfully',
      bookings: bookingDetails
    });
  } catch (error) {
    console.error('Error fetching accepted bookings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




// Controller to get all diagnostic bookings with status 'rejected'
export const getRejectedDiagnosticBookings = async (req, res) => {
  try {
    // 1. Find all bookings with status "rejected"
    const bookings = await Booking.find({ status: 'rejected' }) // Only fetch bookings with status "rejected"
      .populate('staff')  // Populate staff details
      .populate('diagnostic')  // Populate diagnostic center details
      .populate({
        path: 'diagnostic.tests',  // Populate the embedded tests
        select: 'test_name price offerPrice description image'
      });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No rejected bookings found' });
    }

    // 2. Format booking details
    const bookingDetails = bookings.map((booking) => {
      return {
        bookingId: booking._id,
        patient_name: booking.patient_name,
        patient_age: booking.age,
        patient_gender: booking.gender,
        staff_name: booking.staff ? booking.staff.name : 'N/A',
        diagnostic_name: booking.diagnostic ? booking.diagnostic.name : 'N/A',
        diagnostic_image: booking.diagnostic?.image || '',
        diagnostic_address: booking.diagnostic?.address || '',
        consultation_fee: booking.consultation_fee || 0,
        tests: booking.diagnostic?.tests?.map(test => ({
          test_name: test.test_name,
          price: test.price,
          offerPrice: test.offerPrice || test.price,
          description: test.description,
          image: test.image
        })) || [],
        appointment_date: booking.appointment_date,
        gender: booking.gender,
        age: booking.age,
        subtotal: booking.subtotal,
        gst_on_tests: booking.gst_on_tests,
        gst_on_consultation: booking.gst_on_consultation,
        total: booking.total,
        status: booking.status
      };
    });

    // 3. Send response
    res.status(200).json({
      message: 'Rejected bookings fetched successfully',
      bookings: bookingDetails
    });
  } catch (error) {
    console.error('Error fetching rejected bookings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;  // Get appointmentId from URL params
    const { newStatus } = req.body;        // Get the new status from the request body

    // Validate newStatus
    if (!newStatus) {
      return res.status(400).json({ message: "newStatus is required in the request body" });
    }

    // Find the appointment by appointmentId and update its status
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { $set: { status: newStatus } },
      { new: true }  // Return the updated appointment
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json({
      message: `Appointment status updated to "${newStatus}"`,
      updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const getAcceptedAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: "accepted" })
      .populate({
        path: 'doctor',
        select: 'name specialization image'
      })
      .select('patient_name patient_relation age gender subtotal total appointment_date status doctor');

    res.status(200).json({
      message: 'Accepted appointments fetched successfully',
      appointments: appointments.map((appointment) => ({
        appointmentId: appointment._id,
        doctor_name: appointment.doctor?.name,
        doctor_specialization: appointment.doctor?.specialization,
        doctor_image: appointment.doctor?.image,
        appointment_date: appointment.appointment_date,
        status: appointment.status,
        patient_name: appointment.patient_name,
        patient_relation: appointment.patient_relation,
        age: appointment.age,
        gender: appointment.gender,
        subtotal: appointment.subtotal,
        total: appointment.total,
      })),
    });
  } catch (error) {
    console.error('Error fetching accepted appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const getRejectedAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: "rejected" })
      .populate({
        path: 'doctor',
        select: 'name specialization image'
      })
      .select('patient_name patient_relation age gender subtotal total appointment_date status doctor');

    res.status(200).json({
      message: 'Rejected appointments fetched successfully',
      appointments: appointments.map((appointment) => ({
        appointmentId: appointment._id,
        doctor_name: appointment.doctor?.name,
        doctor_specialization: appointment.doctor?.specialization,
        doctor_image: appointment.doctor?.image,
        appointment_date: appointment.appointment_date,
        status: appointment.status,
        patient_name: appointment.patient_name,
        patient_relation: appointment.patient_relation,
        age: appointment.age,
        gender: appointment.gender,
        subtotal: appointment.subtotal,
        total: appointment.total,
      })),
    });
  } catch (error) {
    console.error('Error fetching rejected appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const getCounts = async (req, res) => {
  try {
    const bookingCount = await Booking.countDocuments();
    const appointmentCount = await Appointment.countDocuments();

    res.status(200).json({
      message: 'Counts fetched successfully',
      totalDiagnosticBookings: bookingCount,
      totalDoctorAppointments: appointmentCount
    });
  } catch (error) {
    console.error('Error fetching counts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const getCompanyStaffStats = async (req, res) => {
  const { companyId } = req.params;

  try {
    // Step 1: Find company with populated staff
    const company = await Company.findById(companyId).populate('staff');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Step 2: Get staff array
    const staffArray = company.staff || [];

    // Step 3: Count total staff
    const totalStaff = staffArray.length;

    // Step 4: Calculate total wallet balance
    const totalWalletBalance = staffArray.reduce((sum, staff) => {
      return sum + (staff.wallet_balance || 0);
    }, 0);

    // Step 5: Send response
    res.status(200).json({
      message: 'Company staff stats fetched successfully',
      totalStaff,
      totalWalletBalance,
    });
  } catch (error) {
    console.error('Error fetching company staff stats:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


// Doctor Login
export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if doctor exists
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(400).json({ message: 'Doctor does not exist' });
    }

    // Check if password matches directly (without bcrypt)
    if (doctor.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(doctor._id);

    // Return success message with doctor details and JWT token
    res.status(200).json({
      message: 'Login successful',
      token,
      doctor: {
        id: doctor._id, // Add doctor ID here
        name: doctor.name,
        email: doctor.email,
        specialty: doctor.specialty,
        contactNumber: doctor.contactNumber,
        address: doctor.address,
        registrationDate: doctor.registrationDate,
        licenseNumber: doctor.licenseNumber,
        clinicName: doctor.clinicName,
        clinicAddress: doctor.clinicAddress,
        country: doctor.country,
        state: doctor.state,
        city: doctor.city,
        pincode: doctor.pincode,
        profilePicture: doctor.profilePicture, // Include profile picture if necessary
        documents: doctor.documents, // Include documents if necessary
      },
    });
  } catch (error) {
    console.error('Error during doctor login:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


// Doctor Logout Controller
export const logoutDoctor = async (req, res) => {
  try {
    // Clear the JWT token cookie if it's stored in a cookie
    res.clearCookie('doctor_token', {
      httpOnly: true, // Prevents JavaScript access to the cookie
      secure: process.env.NODE_ENV === 'production', // Secure flag for production (HTTPS)
      sameSite: 'strict', // CSRF protection
    });

    // Send response indicating successful logout
    res.status(200).json({
      message: "Doctor logout successful. Token cleared from cookies.",
    });
  } catch (error) {
    res.status(500).json({ message: "Doctor logout failed", error });
  }
};


// Diagnostic Login
export const loginDiagnostic = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if diagnostic user exists
    const diagnostic = await Diagnostic.findOne({ email });
    if (!diagnostic) {
      return res.status(400).json({ message: 'Diagnostic does not exist' });
    }

    // Check if password matches (no bcrypt in use here)
    if (diagnostic.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(diagnostic._id);

    // Respond with success, token, and diagnostic details
    res.status(200).json({
      message: 'Login successful',
      token,
      diagnostic: {
        id: diagnostic._id,
        name: diagnostic.name,
        email: diagnostic.email,
        contactNumber: diagnostic.contactNumber,
        address: diagnostic.address,
        registrationDate: diagnostic.registrationDate,
        licenseNumber: diagnostic.licenseNumber,
        diagnosticCenterName: diagnostic.diagnosticCenterName,
        diagnosticCenterAddress: diagnostic.diagnosticCenterAddress,
        country: diagnostic.country,
        state: diagnostic.state,
        city: diagnostic.city,
        pincode: diagnostic.pincode,
        profilePicture: diagnostic.profilePicture,
        documents: diagnostic.documents,
      },
    });
  } catch (error) {
    console.error('Error during diagnostic login:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};



// Diagnostic Logout
export const logoutDiagnostic = async (req, res) => {
  try {
    res.clearCookie('diagnostic_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      message: "Diagnostic logout successful. Token cleared from cookies.",
    });
  } catch (error) {
    res.status(500).json({ message: "Diagnostic logout failed", error });
  }
};



export const importCompaniesFromExcel = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = XLSX.readFile(file.path);
    const sheet = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);

    const savedCompanies = [];

    for (const entry of data) {
      const company = new Company({
        name: entry.name || '',
        companyType: entry.companyType || '',
        assignedBy: entry.assignedBy || '',
        registrationDate: entry.registrationDate ? new Date(entry.registrationDate) : null,
        contractPeriod: entry.contractPeriod || '',
        renewalDate: entry.renewalDate ? new Date(entry.renewalDate) : null,
        insuranceBroker: entry.insuranceBroker || '',
        email: entry.email || '',
        password: entry.password || '',
        phone: entry.phone || '',
        gstNumber: entry.gstNumber || '',
        companyStrength: Number(entry.companyStrength) || 0,
        image: entry.image || '',
        country: entry.country || '',
        state: entry.state || '',
        city: entry.city || '',
        pincode: entry.pincode || '',
        contactPerson: {
          name: entry.contactPerson_name || '',
          designation: entry.contactPerson_designation || '',
          gender: entry.contactPerson_gender || '',
          email: entry.contactPerson_email || '',
          phone: entry.contactPerson_phone || '',
          address: {
            country: entry.contactPerson_country || '',
            state: entry.contactPerson_state || '',
            city: entry.contactPerson_city || '',
            pincode: entry.contactPerson_pincode || '',
            street: entry.contactPerson_street || ''
          }
        },
        diagnostics: entry.diagnostics
          ? entry.diagnostics.split(',').map(id => id.trim())
          : [],
        documents: entry.documents
          ? entry.documents.split(',').map(doc => doc.trim())
          : [],
        staff: [] // Staff bulk add ka feature alag se banega
      });

      const saved = await company.save();
      savedCompanies.push(saved);
    }

    fs.unlinkSync(file.path); // remove uploaded Excel file

    res.status(200).json({
      message: 'Companies imported successfully',
      data: savedCompanies
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to import companies' });
  }
};




export const importStaffFromExcel = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = XLSX.readFile(file.path);
    const sheet = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);

    const savedStaff = [];

    for (const entry of data) {
      try {
        const staff = new Staff({
          name: entry.name || '',
          email: entry.email || '',
          password: entry.password || '',
          role: entry.role || 'Staff', // Default to 'Staff' role
          contact_number: entry.contact_number || '',
          address: entry.address || '',
          createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
          updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
          myBookings: entry.myBookings ? entry.myBookings.split(',').map(id => id.trim()) : [],
          wallet_balance: Number(entry.wallet_balance) || 0,
          doctorAppointments: entry.doctorAppointments ? entry.doctorAppointments.split(',').map(id => mongoose.Types.ObjectId(id.trim())) : [], // Convert to ObjectId
          wallet_logs: parseJsonField(entry.wallet_logs),
          family_members: parseJsonField(entry.family_members),
          profileImage: entry.profileImage || '',
          addresses: parseJsonField(entry.addresses),
          issues: parseJsonField(entry.issues)
        });

        const saved = await staff.save();
        savedStaff.push(saved);
      } catch (error) {
        console.error('Error processing entry:', entry, error);
      }
    }

    fs.unlinkSync(file.path); // Remove the uploaded Excel file

    res.status(200).json({
      message: 'Staff imported successfully',
      data: savedStaff
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to import staff' });
  }
};

// Helper function to parse JSON fields safely
function parseJsonField(field) {
  if (!field) return [];
  
  try {
    // Assuming the field is a comma-separated string of JSON objects
    return field.split(',').map(item => {
      try {
        return JSON.parse(item.trim()); // Trim extra spaces and parse JSON
      } catch (e) {
        console.error('Invalid JSON:', item);
        return {}; // Return an empty object on invalid JSON
      }
    });
  } catch (error) {
    console.error('Error parsing field:', field, error);
    return [];
  }
}



// Controller function
export const getDashboardCounts = async (req, res) => {
  try {
    const companyCount = await Company.countDocuments();
    const diagnosticCount = await Diagnostic.countDocuments();
    const appointmentCount = await Appointment.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const staffCount = await Staff.countDocuments();
    const doctorCount = await Doctor.countDocuments(); // Doctor count

    res.status(200).json({
      success: true,
      data: {
        companies: companyCount,
        diagnostics: diagnosticCount,
        appointments: appointmentCount,
        bookings: bookingCount,
        staff: staffCount,
        doctors: doctorCount // Send doctor count in response
      },
    });
  } catch (error) {
    console.error("Error fetching counts:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching counts",
      error: error.message,
    });
  }
};



// Helper function to map age group to range (3-year intervals)
const getAgeRange = (ageGroup) => {
  const ageRanges = {
    '20-23': [20, 23],
    '23-26': [23, 26],
    '26-29': [26, 29],
    '29-32': [29, 32],
    '32-35': [32, 35],
    '35-38': [35, 38],
    '38-41': [38, 41],
    '41-44': [41, 44],
    '44-47': [44, 47],
    '47-50': [47, 50],
    '50-53': [50, 53],
    '53-56': [53, 56],
    '56-59': [56, 59],
    '59-62': [59, 62],
    '62-65': [62, 65],
    '65-68': [65, 68],
    '68-71': [68, 71],
    '71-74': [71, 74],
    '74-77': [74, 77],
    '77-80': [77, 80]
  };
  return ageRanges[ageGroup];
};

// Controller to add tests to staff based on age group and selected diagnostics
export const addTestsToStaffByAgeGroup = async (req, res) => {
  const { ageGroup, diagnostics } = req.body;

  // Validate the inputs
  if (!ageGroup || !Array.isArray(diagnostics) || diagnostics.length === 0) {
    return res.status(400).json({ message: 'Invalid input data. Age group and diagnostics are required.' });
  }

  // Get the age range based on the provided age group
  const ageRange = getAgeRange(ageGroup);
  if (!ageRange) {
    return res.status(400).json({ message: 'Invalid age group. Please provide a valid age group.' });
  }

  try {
    // Find staff members in the specified age range
    const staffMembers = await Staff.find({
      age: { $gte: ageRange[0], $lte: ageRange[1] }
    });

    if (staffMembers.length === 0) {
      return res.status(404).json({ message: 'No staff members found for the selected age group.' });
    }

    // Find the diagnostics from the database based on the provided diagnostic names
    const diagnosticNames = diagnostics.map(d => d.diagnosticName);
    const diagnosticDocs = await Diagnostic.find({
      name: { $in: diagnosticNames }
    });

    if (diagnosticDocs.length === 0) {
      return res.status(404).json({ message: 'No diagnostics found matching the provided names.' });
    }

    // Iterate through each staff member and add the selected tests to their myTest[] array
    for (const staff of staffMembers) {
      diagnostics.forEach(async (diagnostic) => {
        const matchedDiagnostic = diagnosticDocs.find(d => d.name === diagnostic.diagnosticName);

        if (matchedDiagnostic) {
          // Iterate through the selected tests
          for (const selectedTest of diagnostic.selectedTests) {
            const matchedTest = matchedDiagnostic.tests.find(test => test.test_name === selectedTest.test_name);

            if (matchedTest) {
              // Add the test to the staff's `myTest[]` array
              staff.myTest.push({
                diagnosticId: matchedDiagnostic._id,  // Diagnostic ID
                testId: matchedTest._id,  // Test ID
                test_name: matchedTest.test_name,  // Test name
                price: matchedTest.price  // Test price
              });

              // Log the updated `myTest[]` array after pushing the test
              console.log(`Test "${matchedTest.test_name}" has been added to staff ${staff.name} myTest[] array.`);
              console.log('Updated myTest[] array:', staff.myTest);
            }
          }

          // Save the updated staff member
          await staff.save();
        }
      });
    }

    // Respond with success message and the updated staff members
    res.status(200).json({
      message: 'Tests successfully added to staff members',
      staffMembers,
    });

  } catch (error) {
    console.error('Error adding tests to staff:', error);
    res.status(500).json({ message: 'Server error while adding tests to staff.' });
  }
};



export const submitSection = async (req, res) => {
  try {
    const { sectionName, questions } = req.body;

    const sectionId = new mongoose.Types.ObjectId();
    const formattedQuestions = questions.map(q => ({
      questionId: new mongoose.Types.ObjectId(),
      question: q.question,
      options: q.options
    }));

    let healthAssessment = await HealthAssessment.findOne();

    if (!healthAssessment) {
      healthAssessment = new HealthAssessment({
        sections: [{ sectionId, sectionName, questions: formattedQuestions }]
      });
    } else {
      healthAssessment.sections.push({ sectionId, sectionName, questions: formattedQuestions });
    }

    await healthAssessment.save();

    res.status(200).json({
      message: 'Section added successfully',
      data: {
        sectionId,
        questions: formattedQuestions.map(q => ({
          questionId: q.questionId,
          question: q.question,
          options: q.options
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding section', error: error.message });
  }
};



// GET method to fetch the entire health assessment
export const getAssessment = async (req, res) => {
  try {
    const healthAssessment = await HealthAssessment.findOne();

    if (!healthAssessment) {
      return res.status(404).json({ message: "No assessment found" });
    }

    res.status(200).json({ data: healthAssessment });
  } catch (error) {
    res.status(500).json({ message: "Error fetching assessment", error: error.message });
  }
};
  
  

