import Admin from '../Models/Admin.js';
import generateToken from '../config/jwtToken.js';
import Staff from '../Models/staffModel.js';
import Doctor from '../Models/doctorModel.js';
import Diagnostic from '../Models/diagnosticModel.js';


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


// Admin creating a new staff profile
export const createStaffProfile = async (req, res) => {
    try {
        const { name, email, password, contact_number, address } = req.body;

        // Check if the staff already exists
        const existingStaff = await Staff.findOne({ email });
        if (existingStaff) {
            return res.status(400).json({ message: 'Staff with this email already exists' });
        }

        // Create new staff profile
        const newStaff = new Staff({
            name,
            email,
            password, // In a real app, hash the password
            contact_number,
            address,
            role: 'Staff', // Default role as 'Staff'
        });

        await newStaff.save();

        // Generate a token for the staff
        const token = generateToken(newStaff._id);

        // Send all staff data in the response, including staffId
        res.status(201).json({
            message: 'Staff profile created successfully',
            token,
            staff: {
                id: newStaff._id.toString(), // Include the staff ID as a string
                name: newStaff.name,
                email: newStaff.email,
                contact_number: newStaff.contact_number,
                address: newStaff.address,
                role: newStaff.role
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


//book a diagnostics

// Create new Diagnostic Center and its Tests
export const createDiagnosticDetails = async (req, res) => {
    try {
        const {
            name,
            image,  // Image for the diagnostic center
            address,
            tests  // Array of tests
        } = req.body;

        // Validate tests to ensure each test has all necessary fields
        const validatedTests = tests.map(test => {
            if (!test.test_name || !test.description || !test.price) {
                throw new Error('Each test must have a name, description, and price');
            }
            // Ensure offerPrice is always provided or defaults to price
            test.offerPrice = test.offerPrice || test.price;
            return test;
        });

        // Create a new diagnostic center with the provided details
        const newDiagnostic = new Diagnostic({
            name,
            image,
            address,
            tests: validatedTests
        });

        // Save the diagnostic center to the database
        await newDiagnostic.save();

        // Send the response back
        res.status(201).json({
            message: 'Diagnostic center created successfully',
            diagnostic: newDiagnostic
        });
    } catch (error) {
        console.error('Error creating diagnostic details:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
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
    const { staffId } = req.params;  // Get staffId from URL params
    const { amount } = req.body;     // Amount to be added to the wallet
    
    // Validate that the amount is a positive number
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount to be added must be greater than zero' });
    }

    // Find the staff member by their staffId
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(400).json({ message: 'Staff not found' });
    }

    // Add the amount to the staff wallet
    staff.wallet_balance += amount;

    // Save the updated staff data
    await staff.save();

    // Respond with the updated wallet balance
    res.status(200).json({
      message: 'Amount successfully added to wallet',
      wallet_balance: staff.wallet_balance,  // Send back the updated wallet balance
    });
  } catch (error) {
    console.error('Error adding amount to wallet:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Create Doctor
export const createDoctor = async (req, res) => {
    try {
      const doctor = new Doctor(req.body);
      await doctor.save();
      res.status(201).json({ message: 'Doctor created successfully', doctor });
    } catch (error) {
      console.error('Error creating doctor:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

// Get all doctors
export const getAllDoctors = async (req, res) => {
    try {
      const { category } = req.query;
      const filter = category ? { category } : {};
      const doctors = await Doctor.find(filter);
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
  
  

