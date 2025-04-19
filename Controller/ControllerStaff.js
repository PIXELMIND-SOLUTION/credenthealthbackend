import Staff from "../Models/staffModel.js";
import generateToken from "../config/jwtToken.js";
import Appointment from "../Models/Appointment.js";
import Doctor from "../Models/doctorModel.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { uploadSupportFile } from "../config/multerConfig.js";
import Booking from "../Models/bookingModel.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




// Staff login function (Authentication)
export const staffLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find staff by email
      const staff = await Staff.findOne({ email });
      if (!staff) {
        return res.status(400).json({ message: 'Staff not found' });
      }
  
      // Check if password matches (Note: You should hash the password in a real app)
      if (staff.password !== password) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Log the staff _id (staffId)
      console.log("Staff ID: ", staff._id.toString()); // Log the staffId here
  
      // Generate token (Assuming `generateToken` function is defined elsewhere)
      const token = generateToken(staff._id);
  
      // Send complete staff object along with token and staffId as string
      res.status(200).json({
        message: 'Login successful',
        token, // Token included here
        staff: staff // Send complete staff object here
      });
    } catch (error) {
      // Log the error for debugging
      console.error('Error during staff login:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


  export const getWalletBalance = async (req, res) => {
    try {
      const { staffId } = req.params;
  
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(400).json({ message: 'Staff not found' });
      }
  
      // Check if wallet_logs exists
      const history = (staff.wallet_logs || [])
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(txn => ({
          type: txn.type,
          amount: txn.amount,
          description: txn.type === 'credit'
            ? `Received from ${txn.from}`
            : `Paid to ${txn.to}`,
          time_ago: getTimeAgo(txn.date),
          date: txn.date,
        }));
  
      res.status(200).json({
        message: 'Wallet balance and history fetched successfully',
        wallet_balance: staff.wallet_balance,
        transaction_history: history,
      });
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
  
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHr < 24) return `${diffHr} hours ago`;
    return `${diffDay} days ago`;
  }
  


  export const bookAppointment = async (req, res) => {
    try {
      const { doctorId, staffId, name, appointment_date, appointment_time, patient_name, patient_relation } = req.body;
  
      console.log('Received Appointment Data:', req.body);  // Log the received data
  
      // 1. Find doctor by doctorId
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(400).json({ message: 'Doctor not found' });
      }
  
      // 2. Find staff by staffId or name
      let staff;
      if (staffId) {
        // If staffId is provided, find staff by staffId
        staff = await Staff.findById(staffId);
      }
  
      // If no staff found by staffId, try finding staff by name
      if (!staff && name) {
        staff = await Staff.findOne({ name: name });
      }
  
      if (!staff) {
        return res.status(400).json({ message: 'Staff not found' });
      }
  
      // 3. Check if the doctor is available on the given date (you can extend this check with available hours or days logic)
      const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}:00`);
  
      // 4. Create the appointment
      const subtotal = doctor.consultation_fee || 0;  // Assuming consultation fee is the base charge
      const total = subtotal;  // Currently, the total is the same as the subtotal (can be updated to include tests, taxes, etc.)
  
      const newAppointment = new Appointment({
        doctor: doctor._id,
        staff: staff._id,
        appointment_date: appointmentDateTime,
        status: 'Pending',  // Initial status of the appointment
        patient_name: patient_name || staff.name,  // Use staff's name as default if no family member is specified
        patient_relation: patient_relation || 'Self',  // Default relation to 'Self' if not provided
        subtotal,
        total
      });
  
      // Save the appointment to the database
      await newAppointment.save();
  
      // Ensure the doctorAppointments array exists in the staff document
      if (!staff.doctorAppointments) {
        staff.doctorAppointments = [];
      }
  
      // Add the appointment to the staff's `doctorAppointments[]` field
      staff.doctorAppointments.push({
        appointmentId: newAppointment._id,
        doctor: doctor._id,
        appointment_date: appointmentDateTime,
        status: newAppointment.status,
        patient_name: newAppointment.patient_name,
        patient_relation: newAppointment.patient_relation,
        subtotal,
        total
      });
  
      // Save updated staff details
      await staff.save();
  
      // Ensure the appointments array exists in the doctor document
      if (!doctor.appointments) {
        doctor.appointments = [];
      }
  
      // Add the appointment to the doctor's record (optional, depending on your use case)
      doctor.appointments.push({
        appointmentId: newAppointment._id,
        staff: staff._id,
        appointment_date: appointmentDateTime,
        status: newAppointment.status,
        patient_name: newAppointment.patient_name,
        patient_relation: newAppointment.patient_relation,
      });
      await doctor.save();
  
      // 7. Respond with the appointment details including appointmentId, subtotal, and total
      res.status(201).json({
        message: 'Appointment booked successfully',
        appointment: {
          appointmentId: newAppointment._id,  // Include appointmentId in the response
          doctor_name: doctor.name,
          doctor_specialization: doctor.specialization,
          appointment_date: appointmentDateTime,
          patient_name: newAppointment.patient_name,
          patient_relation: newAppointment.patient_relation,
          status: newAppointment.status,
          subtotal,  // Subtotal (consultation fee)
          total       // Total (currently the same as subtotal)
        },
      });
    } catch (error) {
      console.error('Error booking appointment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  

  
 // Controller to process payment for an appointment
export const processPayment = async (req, res) => {
  try {
    const { staffId, appointmentId } = req.params;

    // 1. Find staff
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(400).json({ message: 'Staff member not found' });

    // 2. Find appointment and populate doctor
    const appointment = await Appointment.findById(appointmentId).populate('doctor');
    if (!appointment) return res.status(400).json({ message: 'Appointment not found' });


    console.log('Doctor info:', appointment.doctor);

    // 3. Get payment details
    const subtotal = appointment.subtotal || 0;
    const total = appointment.total || subtotal;

    // 4. Check wallet
    if (staff.wallet_balance < total) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // 5. Deduct from wallet
    staff.wallet_balance -= total;

    // 6. Push wallet log
    const paymentTransaction = {
      type: 'debit',
      amount: total,
      from: 'Staff Wallet',
      to: appointment.doctor?.name || 'Doctor',  // now this will work ✅
      date: new Date(),
    };

    staff.wallet_logs.push(paymentTransaction);

    // 7. Update appointment status
    appointment.status = 'Confirmed';

    await staff.save();
    await appointment.save();

    // 8. Send response
    res.status(200).json({
      message: 'Payment successful and appointment confirmed',
      appointment: {
        doctor_name: appointment.doctor.name,
        doctor_specialization: appointment.doctor.specialization,
        appointment_date: appointment.appointment_date,
        patient_name: appointment.patient_name,
        patient_relation: appointment.patient_relation,
        status: appointment.status,
        subtotal,
        total,
        wallet_balance: staff.wallet_balance,
      },
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};





  export const createFamilyMember = async (req, res) => {
    try {
      const { staffId } = req.params;
      const {
        fullName,
        mobileNumber,
        age,
        gender,
        DOB,
        height,
        weight,
        eyeSight,
        BMI,
        BP,
        sugar,
        relation,
      } = req.body;
  
      // Find the staff member by their ID
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(404).json({ message: 'Staff not found' });
      }
  
      // Ensure the family_members array is initialized if not present
      if (!staff.family_members) {
        staff.family_members = []; // Initialize the array if it's undefined
      }
  
      // Create a new family member object
      const newFamilyMember = {
        fullName,
        mobileNumber,
        age,
        gender,
        DOB,
        height,
        weight,
        eyeSight,
        BMI,
        BP,
        sugar,
        relation,
      };
  
      // Add the new family member to the staff's family_members array
      staff.family_members.push(newFamilyMember);
  
      // Save the staff document with the new family member
      await staff.save();
  
      // Return success message, newly added family member, and complete staff details
      res.status(200).json({
        message: 'Family member added successfully',
        family_member: newFamilyMember,
        staff: {
          name: staff.name,
          email: staff.email,
          contact_number: staff.contact_number,
          address: staff.address,
          role: staff.role,
          wallet_balance: staff.wallet_balance,
          family_members: staff.family_members,
          doctorAppointments: staff.doctorAppointments,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error adding family member:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }; 

  

  export const getAllFamilyMembers = async (req, res) => {
    try {
      const { staffId } = req.params;
  
      // Find the staff member by their ID
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(404).json({ message: 'Staff not found' });
      }
  
      // Return all family members associated with the staff member
      res.status(200).json({
        message: 'All family members fetched successfully',
        family_members: staff.family_members,
      });
    } catch (error) {
      console.error('Error fetching family members:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  


  export const getFamilyMember = async (req, res) => {
    try {
      const { staffId, familyMemberId } = req.params;
  
      // Find the staff member
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(404).json({ message: 'Staff not found' });
      }
  
      // Find the specific family member by familyMemberId
      const familyMember = staff.family_members.id(familyMemberId);
      if (!familyMember) {
        return res.status(404).json({ message: 'Family member not found' });
      }
  
      res.status(200).json({
        message: 'Family member fetched successfully',
        family_member: familyMember,
      });
    } catch (error) {
      console.error('Error fetching family member:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


  export const updateFamilyMember = async (req, res) => {
    try {
      const { staffId, familyMemberId } = req.params;
      const {
        fullName,
        mobileNumber,
        age,
        gender,
        DOB,
        height,
        weight,
        eyeSight,
        BMI,
        BP,
        sugar,
        relation,
      } = req.body;
  
      // Find the staff member
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(404).json({ message: 'Staff not found' });
      }
  
      // Find the specific family member
      const familyMember = staff.family_members.id(familyMemberId);
      if (!familyMember) {
        return res.status(404).json({ message: 'Family member not found' });
      }
  
      // Update the family member details
      familyMember.fullName = fullName || familyMember.fullName;
      familyMember.mobileNumber = mobileNumber || familyMember.mobileNumber;
      familyMember.age = age || familyMember.age;
      familyMember.gender = gender || familyMember.gender;
      familyMember.DOB = DOB || familyMember.DOB;
      familyMember.height = height || familyMember.height;
      familyMember.weight = weight || familyMember.weight;
      familyMember.eyeSight = eyeSight || familyMember.eyeSight;
      familyMember.BMI = BMI || familyMember.BMI;
      familyMember.BP = BP || familyMember.BP;
      familyMember.sugar = sugar || familyMember.sugar;
      familyMember.relation = relation || familyMember.relation;
  
      // Save the updated staff document
      await staff.save();
  
      res.status(200).json({
        message: 'Family member updated successfully',
        family_member: familyMember,
      });
    } catch (error) {
      console.error('Error updating family member:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  

  export const removeFamilyMember = async (req, res) => {
    try {
      const { staffId, familyMemberId } = req.params;
  
      // Find the staff member
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(404).json({ message: 'Staff not found' });
      }
  
      // Find the specific family member and remove it
      const familyMember = staff.family_members.id(familyMemberId);
      if (!familyMember) {
        return res.status(404).json({ message: 'Family member not found' });
      }
  
      // Remove the family member from the array
      familyMember.remove();
  
      // Save the updated staff document
      await staff.save();
  
      res.status(200).json({
        message: 'Family member removed successfully',
      });
    } catch (error) {
      console.error('Error removing family member:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  




// Define the staff profile directory
const staffProfileDir = path.join(__dirname, '..', 'uploads', 'staffprofile');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(staffProfileDir, { recursive: true });
    cb(null, staffProfileDir);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('profileImage');

// Controller
export const uploadProfileImage = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Error uploading file', error: err.message });
    }

    try {
      const { staffId } = req.params;
      const staff = await Staff.findById(staffId);

      if (!staff) {
        return res.status(404).json({ message: 'Staff not found' });
      }

      // Delete old image if exists
      if (staff.profileImage) {
        const oldFilePath = path.join(staffProfileDir, staff.profileImage);
        fs.promises.unlink(oldFilePath).catch((err) => {
          console.error('Error deleting old image:', err);
        });
      }

      // Update and save new image
      staff.profileImage = req.file.filename;
      await staff.save();

      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/staffprofile/${req.file.filename}`;

      res.status(200).json({
        message: 'Profile image uploaded successfully',
        staff: {
          name: staff.name,
          email: staff.email,
          contact_number: staff.contact_number,
          address: staff.address,
          role: staff.role,
          profileImage: imageUrl,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
};



export const updateProfileImage = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Error uploading file', error: err.message });
    }

    try {
      const { staffId } = req.params;
      const staff = await Staff.findById(staffId);

      if (!staff) {
        return res.status(404).json({ message: 'Staff not found' });
      }

      // If a new file is uploaded
      if (req.file) {
        // Delete old image if exists
        if (staff.profileImage) {
          const oldFilePath = path.join(staffProfileDir, staff.profileImage);
          fs.promises.unlink(oldFilePath).catch((err) => {
            console.error('Error deleting old image:', err);
          });
        }

        // Update with new image
        staff.profileImage = req.file.filename;
      }

      // Save staff (whether image was updated or not)
      await staff.save();

      const imageUrl = staff.profileImage
        ? `${req.protocol}://${req.get('host')}/uploads/staffprofile/${staff.profileImage}`
        : null;

      res.status(200).json({
        message: req.file ? 'Profile image updated successfully' : 'No image uploaded, existing image retained',
        staff: {
          name: staff.name,
          email: staff.email,
          contact_number: staff.contact_number,
          address: staff.address,
          role: staff.role,
          profileImage: imageUrl,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error updating profile image:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
};



export const getMyProfile = async (req, res) => {
  try {
    const { staffId } = req.params;

    // Find the staff by ID
    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Generate full profile image URL if exists
    const profileImageUrl = staff.profileImage
      ? `${req.protocol}://${req.get('host')}/uploads/staffprofile/${staff.profileImage}`
      : null;

    // Return full staff details
    res.status(200).json({
      message: 'Staff fetched successfully',
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        contact_number: staff.contact_number,
        address: staff.address,
        role: staff.role,
        profileImage: profileImageUrl,
        wallet_balance: staff.wallet_balance,
        family_members: staff.family_members,
        doctorAppointments: staff.doctorAppointments,
        myBookings: staff.myBookings,
        wallet_logs: staff.wallet_logs,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




export const createStaffAddress = async (req, res) => {
  try {
    const { staffId } = req.params;
    const {
      street,
      city,
      state,
      country,
      postalCode,
      addressType, // e.g. 'Home', 'Office'
    } = req.body;

    // Find staff
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Initialize addresses array if undefined
    if (!staff.addresses) {
      staff.addresses = [];
    }

    // Create new address object
    const newAddress = {
      street,
      city,
      state,
      country,
      postalCode,
      addressType,
    };

    // Push into addresses array
    staff.addresses.push(newAddress);
    await staff.save();

    res.status(200).json({
      message: 'Address added successfully',
      address: newAddress,
      addresses: staff.addresses,
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const getStaffAddresses = async (req, res) => {
  try {
    const { staffId } = req.params;

    // Find the staff by ID
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.status(200).json({
      message: 'Addresses fetched successfully',
      addresses: staff.addresses || [],
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const removeStaffAddress = async (req, res) => {
  try {
    const { staffId, addressId } = req.params;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    const addressObjectId = new mongoose.Types.ObjectId(addressId);

    const addressIndex = staff.addresses.findIndex(
      (addr) => addr._id.toString() === addressObjectId.toString()
    );

    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const removed = staff.addresses.splice(addressIndex, 1);
    await staff.save();

    res.status(200).json({
      message: 'Address removed successfully',
      removedAddress: removed[0],
      remainingAddresses: staff.addresses,
    });
  } catch (error) {
    console.error('Error removing address:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




export const submitIssue = (req, res) => {
  uploadSupportFile(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }

    try {
      const { staffId } = req.params;
      const { reason, description } = req.body;

      const staff = await Staff.findById(staffId);
      if (!staff) return res.status(404).json({ message: 'Staff not found' });

      // Initialize issues array if it's undefined or null
      if (!staff.issues) {
        staff.issues = [];
      }

      const newIssue = {
        reason,
        description,
        file: req.file ? req.file.filename : null,
        status: 'Processing',
        createdAt: new Date(),
      };

      // Push new issue to issues array
      staff.issues.push(newIssue);
      await staff.save();

      res.status(200).json({
        message: 'Issue submitted successfully',
        issue: newIssue,
      });
    } catch (error) {
      console.error('Submit issue error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
};


// 📤 Admin updates issue
export const updateIssueStatus = async (req, res) => {
  try {
    const { staffId, issueId } = req.params;
    const { response, status } = req.body;

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const issue = staff.issues.id(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    issue.response = response || '';
    issue.status = status || 'Processing';
    issue.updatedAt = new Date();

    await staff.save();

    res.status(200).json({
      message: 'Issue updated successfully',
      updatedIssue: issue,
    });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 📄 Get all issues of a staff
export const getStaffIssues = async (req, res) => {
  try {
    const { staffId } = req.params;
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    res.status(200).json({
      message: 'Issues fetched successfully',
      issues: staff.issues || [],
    });
  } catch (error) {
    console.error('Fetch issues error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const getDoctorAppointmentsForStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { status } = req.body; // Get the status filter from the request body, if any


    // Find staff by ID and populate doctorAppointments and related doctor details
    const staff = await Staff.findById(staffId)
      .populate({
        path: 'doctorAppointments.appointmentId', // Populate the appointment details
        select: 'patient_name patient_relation age gender subtotal total appointment_date status', // Fields to return from the appointment
      })
      .populate({
        path: 'doctorAppointments.doctor', // Populate the doctor details inside each appointment
        select: 'name specialization image', // Select the doctor name, specialization, and image
      });

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }


        // Filter by status if it is provided in the request body
        const filteredAppointments = status
        ? staff.doctorAppointments.filter((appointment) => appointment.status === status)
        : staff.doctorAppointments;
  

    // Returning the staff and their doctor appointments along with doctor details
    res.status(200).json({
      message: 'Doctor appointments fetched successfully',
      appointments: filteredAppointments.map((appointment) => ({
        appointmentId: appointment.appointmentId._id,
        doctor_name: appointment.doctor.name,
        doctor_specialization: appointment.doctor.specialization,
        doctor_image: appointment.doctor.image,
        appointment_date: appointment.appointment_date,
        status: appointment.status,
        patient_name: appointment.patient_name,
        patient_relation: appointment.patient_relation,
        subtotal: appointment.subtotal,
        total: appointment.total,
      })),
    });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Controller to get details of bookings for a staff member with optional status filter
export const getAllDiagnosticBookingForStaff = async (req, res) => {
  try {
    const { staffId } = req.params;  // Get staffId from URL params
    const { status } = req.body;  // Get status filter from the request body, if any

    // 1. Find the staff details using staffId
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(400).json({ message: 'Staff not found' });
    }

    // 2. Find all bookings associated with the staff member
    const bookings = await Booking.find({ 'staff': staffId })
      .populate('staff')  // Populate staff details
      .populate('diagnostic')  // Populate diagnostic center details
      .populate({
        path: 'diagnostic.tests',  // Populate the embedded tests within the diagnostic center
        select: 'test_name price offerPrice description image' // Select relevant fields
      });

    if (!bookings || bookings.length === 0) {
      return res.status(400).json({ message: 'No bookings found for this staff member' });
    }

    // 3. Apply status filter if provided
    const filteredBookings = status
      ? bookings.filter((booking) => booking.status === status)
      : bookings;

    // 4. Prepare the response data for each booking with safety checks
    const bookingDetails = filteredBookings.map((booking) => {
      return {
        bookingId: booking._id,
        patient_name: booking.patient_name,
        patient_age: booking.age,
        patient_gender: booking.gender,
        staff_name: booking.staff ? booking.staff.name : 'N/A', // Safety check for staff name
        diagnostic_name: booking.diagnostic ? booking.diagnostic.name : 'N/A', // Safety check for diagnostic name
        diagnostic_image: booking.diagnostic ? booking.diagnostic.image : '', // Safety check for diagnostic image
        diagnostic_address: booking.diagnostic ? booking.diagnostic.address : '', // Safety check for diagnostic address
        consultation_fee: booking.consultation_fee || 0,
        tests: booking.diagnostic && booking.diagnostic.tests
          ? booking.diagnostic.tests.map(test => ({
              test_name: test.test_name,
              price: test.price,
              offerPrice: test.offerPrice || test.price,
              description: test.description,
              image: test.image
            }))
          : [],  // Ensure tests are populated correctly
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

    // 5. Send response with filtered bookings
    res.status(200).json({
      message: 'Bookings fetched successfully',
      bookings: bookingDetails
    });
  } catch (error) {
    console.error('Error fetching bookings for staff:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const getStaffTestPackageById = async (req, res) => {
  const { staffId } = req.params;

  try {
    const staffMember = await Staff.findById(staffId)
      .populate({
        path: 'myTest.diagnosticId',
        model: 'Diagnostic',
        select: 'name address centerType email phone tests'
      })
      .lean();

    if (!staffMember) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    const expandedTests = staffMember.myTest.map((testItem) => {
      const diagnostic = testItem.diagnosticId;
      const matchedTest = diagnostic?.tests?.find(
        (t) => t._id.toString() === testItem.testId.toString()
      );

      return {
        _id: testItem._id,
        testId: testItem.testId,
        test_name: testItem.test_name,
        price: testItem.price,
        diagnosticCenter: {
          name: diagnostic?.name || '',
          address: diagnostic?.address || '',
          email: diagnostic?.email || '',
          phone: diagnostic?.phone || '',
          centerType: diagnostic?.centerType || '',
        },
        testDetails: matchedTest || {},
      };
    });

    res.status(200).json({
      message: '✅ Test packages fetched successfully.',
      myTest: expandedTests
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ message: 'Server error while fetching test packages.' });
  }
};







  
  

  
  
  
  