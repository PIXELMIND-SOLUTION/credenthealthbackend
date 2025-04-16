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

//book a diagnostics


export const createDiagnosticDetails = async (req, res) => {
  try {
    // 🧪 Step 1: Upload test images
    uploadTestImages(req, res, async (testImageError) => {
      if (testImageError) {
        console.log("❌ Test image upload failed:", testImageError);
        return res.status(400).json({ message: "Test image upload failed", error: testImageError.message });
      }

      try {
        // ✅ Log incoming form data and files
        console.log("📥 req.body:", req.body);  // Log the entire form data
        console.log("📁 req.files:", req.files);  // Log uploaded files

        // Parse individual fields from the flat req.body
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
        } = req.body;

        // Parse contact persons and tests from flat fields in req.body
        const contactPersons = [];
        const tests = [];

        // Loop through the flat fields to extract contactPersons and tests
        Object.keys(req.body).forEach((key) => {
          if (key.startsWith("contactPersons")) {
            const index = key.match(/\d+/)[0]; // Extract index (e.g., '0' from 'contactPersons[0].name')
            const field = key.split(".")[1]; // Extract field name (e.g., 'name', 'designation')

            if (!contactPersons[index]) {
              contactPersons[index] = {}; // Initialize contact person object if not already created
            }
            contactPersons[index][field] = req.body[key]; // Add the field to the respective contact person object
          }

          if (key.startsWith("tests")) {
            const index = key.match(/\d+/)[0]; // Extract index (e.g., '0' from 'tests[0].test_name')
            const field = key.split(".")[1]; // Extract field name (e.g., 'test_name', 'description')

            if (!tests[index]) {
              tests[index] = {}; // Initialize test object if not already created
            }
            tests[index][field] = req.body[key]; // Add the field to the respective test object
          }
        });

        // 🧪 Attach uploaded test images to the tests
        if (req.file) {
          tests.forEach((test, index) => {
            test.image = req.file.path || null; // Attach image path if file exists
          });
        }

        console.log("Contact Persons:", contactPersons);
        console.log("Tests:", tests);

        // 🏥 Create Diagnostic center object
        const newDiagnostic = new Diagnostic({
          name,
          image,  // Assuming this is the company image or other image field
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
          contactPersons: contactPersons || [], // Ensure it's an array
          password,
          tests: tests || [], // Ensure it's an array
          testImages: req.files ? req.files.map((file) => file.path) : [], // Save test image path if present
        });

        await newDiagnostic.save();

        console.log("✅ Diagnostic center saved:", newDiagnostic);

        res.status(201).json({
          message: "Diagnostic center created successfully",
          diagnostic: newDiagnostic,
        });
      } catch (err) {
        console.error("💥 Error while processing form data:", err);
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });
  } catch (error) {
    console.error("🔥 Unexpected error:", error);
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


// Get all Tests from a Specific Diagnostic Center by diagnosticId
export const getAllTests = async (req, res) => {
    try {
        const { diagnosticId } = req.params; // Extract diagnosticId from the URL params

        // Fetch the diagnostic center by its ID
        const diagnostic = await Diagnostic.findById(diagnosticId);

        if (!diagnostic) {
            return res.status(404).json({ message: 'Diagnostic center not found' });
        }

        // Return the tests associated with this specific diagnostic center
        res.status(200).json({
            message: 'Tests retrieved successfully',
            tests: diagnostic.tests
        });
    } catch (error) {
        console.error('Error fetching tests:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};





// Update Diagnostic Center and its Tests
export const updateDiagnosticDetails = async (req, res) => {
    try {
        const { diagnosticId } = req.params;  // Get diagnosticId from the URL
        const { name, image, address, tests } = req.body;

        // Find the diagnostic center by its ID
        const diagnostic = await Diagnostic.findById(diagnosticId);
        if (!diagnostic) {
            return res.status(404).json({ message: 'Diagnostic center not found' });
        }

        // Validate tests to ensure each test has all necessary fields
        const validatedTests = tests.map(test => {
            if (!test.test_name || !test.description || !test.price) {
                throw new Error('Each test must have a name, description, and price');
            }
            // Ensure offerPrice is always provided or defaults to price
            test.offerPrice = test.offerPrice || test.price;
            return test;
        });

        // Update the diagnostic center fields
        diagnostic.name = name || diagnostic.name;
        diagnostic.image = image || diagnostic.image;
        diagnostic.address = address || diagnostic.address;
        diagnostic.tests = validatedTests || diagnostic.tests;

        // Save the updated diagnostic center to the database
        await diagnostic.save();

        // Send the response back with updated diagnostic center details
        res.status(200).json({
            message: 'Diagnostic center updated successfully',
            diagnostic
        });
    } catch (error) {
        console.error('Error updating diagnostic details:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


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
    // First handle the image upload
    uploadDoctorImage(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: 'Error uploading image', error: err.message });
      }

      // After the image is uploaded, create the doctor with the form data
      const { name, email, password, specialization, qualification, description, consultation_fee, address, category, schedule } = req.body;

      // Parse the schedule (string) if it's sent as a stringified JSON array
      const parsedSchedule = schedule ? JSON.parse(schedule) : [];

      // Get the image path (this will be the file path saved in the uploads directory)
      const image = req.file ? `/uploads/doctorimages/${req.file.filename}` : null;  // Save the image path in the DB

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
        schedule: parsedSchedule, // Save the parsed schedule (as an array of objects)
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


export const getAllDoctorAppointments = async (req, res) => {
  try {
    // Fetch all appointments from the Appointment model
    const appointments = await Appointment.find()
      .populate({
        path: 'doctor',
        select: 'name specialization image'
      })
      .select('patient_name patient_relation age gender subtotal total appointment_date status doctor');

    res.status(200).json({
      message: 'All doctor appointments fetched successfully',
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
        password, // Password field
        diagnostic, // This will be an array of diagnostic _ids sent from the frontend
      } = req.body;

      // 🔍 Parse diagnostic array from frontend if sent as stringified JSON
      const diagnosticIds = typeof diagnostic === 'string' ? JSON.parse(diagnostic) : diagnostic;

      // Check if all diagnostic _ids are valid
      const validDiagnostics = await Diagnostic.find({
        '_id': { $in: diagnosticIds },
      }).select('_id');

      // 📂 Handle uploaded files
      const imageFile = req.files?.image?.[0]?.path || '';
      const documents = req.files?.documents?.map(doc => doc.path) || [];

      // 🔄 Parse the contactPerson if sent as stringified JSON
      const parsedContactPerson = typeof contactPerson === 'string' ? JSON.parse(contactPerson) : contactPerson;

      // 🧾 Create and save the company document
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
        password,  // Store password directly
        diagnostics: validDiagnostics.map(d => d._id),  // Store the array of diagnostic _ids
        image: imageFile, // Store the uploaded image path
        documents,  // Store the uploaded document paths
        contactPerson: {
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
        },
      });

      // Save the new company to DB
      const savedCompany = await newCompany.save();

      // Respond with success message
      res.status(201).json({
        message: 'Company created successfully!',
        company: savedCompany,
      });
    } catch (error) {
      console.error('Error creating company:', error);
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





  
  

