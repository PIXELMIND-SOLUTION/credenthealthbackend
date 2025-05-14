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
import PDFDocument from 'pdfkit';
import Diagnostic from "../Models/diagnosticModel.js";
import HealthAssessment from "../Models/HealthAssessment.js";

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
    const {
      doctorId,
      staffId,
      patient_name,
      patient_relation,
      appointment_date,
      appointment_time,
      age,
      gender,
      visit,
    } = req.body;

    console.log('Received Appointment Data:', req.body);

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(400).json({ message: 'Doctor not found' });
    }

    let staff;
    if (staffId) {
      staff = await Staff.findById(staffId);
    }

    if (!staff && req.body.name) {
      staff = await Staff.findOne({ name: req.body.name });
    }

    if (!staff) {
      return res.status(400).json({ message: 'Staff not found' });
    }

    const subtotal = doctor.consultation_fee || 0;
    const total = subtotal;

    const newAppointment = new Appointment({
      doctor: doctor._id,
      staff: staff._id,
      status: 'Pending',
      patient_name: patient_name || staff.name,
      patient_relation: patient_relation || 'Self',
      appointment_date,
      appointment_time,
      age,
      gender,
      visit: visit || 'Direct',
      subtotal,
      total,
    });

    await newAppointment.save();

    if (!staff.doctorAppointments) {
      staff.doctorAppointments = [];
    }

    staff.doctorAppointments.push({
      appointmentId: newAppointment._id,
      doctor: doctor._id,
      status: newAppointment.status,
      patient_name: newAppointment.patient_name,
      patient_relation: newAppointment.patient_relation,
      subtotal,
      total,
    });

    await staff.save();

    if (!doctor.appointments) {
      doctor.appointments = [];
    }

    doctor.appointments.push({
      appointmentId: newAppointment._id,
      staff: staff._id,
      status: newAppointment.status,
      patient_name: newAppointment.patient_name,
      patient_relation: newAppointment.patient_relation,
    });

    await doctor.save();

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: {
        appointmentId: newAppointment._id,
        doctor_details: doctor,
        staff_details: staff,
        patient_name: newAppointment.patient_name,
        patient_relation: newAppointment.patient_relation,
        age: newAppointment.age,
        gender: newAppointment.gender,
        visit: newAppointment.visit,
        status: newAppointment.status,
        subtotal,
        total,
        appointment_date: newAppointment.appointment_date,
        appointment_time: newAppointment.appointment_time,
      },
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

  
  
  


  export const getAppointment = async (req, res) => {
    try {
      const { staffId, appointmentId } = req.params;
  
      if (!staffId) {
        return res.status(400).json({ message: 'Staff ID is required' });
      }
  
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(404).json({ message: 'Staff not found' });
      }
  
      if (!appointmentId) {
        return res.status(400).json({ message: 'Appointment ID is required' });
      }
  
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
  
      if (appointment.staff.toString() !== staff._id.toString()) {
        return res.status(403).json({ message: 'This appointment does not belong to the specified staff' });
      }
  
      const doctor = await Doctor.findById(appointment.doctor);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
  
      res.status(200).json({
        message: 'Appointment details retrieved successfully',
        appointment: {
          appointmentId: appointment._id,
          doctor_details: doctor,  // sending full doctor object
          staff_name: staff.name,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          patient_name: appointment.patient_name,
          patient_relation: appointment.patient_relation,
          status: appointment.status,
          subtotal: appointment.subtotal,
          total: appointment.total
        },
      });
    } catch (error) {
      console.error('Error retrieving appointment:', error);
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

    // Check if the family member exists
    const exists = staff.family_members.some(member => member._id.toString() === familyMemberId);
    if (!exists) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    // Remove the family member using filter
    staff.family_members = staff.family_members.filter(
      member => member._id.toString() !== familyMemberId
    );

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
        select:
          'patient_name patient_relation age gender visit subtotal total appointment_date appointment_time status payment_status schedule',
      })
      .populate({
        path: 'doctorAppointments.doctor', // Populate the doctor details inside each appointment
        select: 'name specialization image',
      });

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Filter by status if it is provided in the request body
    const filteredAppointments = status
      ? staff.doctorAppointments.filter(
          (appointment) => appointment.appointmentId?.status === status
        )
      : staff.doctorAppointments;

    // Safeguard: Check for null or undefined doctor or appointmentId before mapping
    const appointments = filteredAppointments
      .map((appointment) => {
        if (!appointment.appointmentId || !appointment.doctor) {
          return null; // Skip invalid entries
        }

        return {
          appointmentId: appointment.appointmentId._id,
          doctor_name: appointment.doctor.name,
          doctor_specialization: appointment.doctor.specialization,
          doctor_image: appointment.doctor.image,
          appointment_date: appointment.appointmentId.appointment_date,
          appointment_time: appointment.appointmentId.appointment_time,
          status: appointment.appointmentId.status,
          patient_name: appointment.appointmentId.patient_name,
          patient_relation: appointment.appointmentId.patient_relation,
          age: appointment.appointmentId.age,
          gender: appointment.appointmentId.gender,
          visit: appointment.appointmentId.visit,
          subtotal: appointment.appointmentId.subtotal,
          total: appointment.appointmentId.total,
          payment_status: appointment.appointmentId.payment_status,
          schedule: appointment.appointmentId.schedule,
        };
      })
      .filter(Boolean); // Filter out null entries if any invalid appointment is found

    // Returning the staff details and their doctor appointments along with doctor details and schedule
    res.status(200).json({
      message: 'Doctor appointments fetched successfully',
      staff: {
        staffId: staff._id,
        name: staff.name,
        email: staff.email,
        contact_number: staff.contact_number,
        profileImage: staff.profileImage,
        role: staff.role,
        wallet_balance: staff.wallet_balance,
        address: staff.address,
        myBookings: staff.myBookings,
      },
      appointments: appointments, // Only include valid appointments
    });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const getAllDiagnosticBookingForStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { status } = req.body;

    // 1. Find the staff
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(400).json({ message: 'Staff not found' });
    }

    // 2. Get all diagnostic bookings for the staff
    const bookings = await Booking.find({ staff: staffId })
      .populate('staff')
      .populate('diagnostic')
      .populate({
        path: 'diagnostic.tests',
        select: 'test_name price offerPrice description image'
      });

    if (!bookings || bookings.length === 0) {
      return res.status(400).json({ message: 'No bookings found for this staff member' });
    }

    // 3. Filter bookings by status if provided
    const filteredBookings = status
      ? bookings.filter((booking) => booking.status === status)
      : bookings;

    // 4. Map and format the booking details
    const bookingDetails = filteredBookings.map((booking) => {
      // Format appointment_date to "YYYY-MM-DD" if it's a Date object
      const formattedDate = booking.appointment_date
        ? new Date(booking.appointment_date).toISOString().split('T')[0]
        : '';

      return {
        bookingId: booking._id,
        patient_name: booking.patient_name,
        patient_age: booking.age,
        patient_gender: booking.gender,
        staff_name: booking.staff ? booking.staff.name : 'N/A',
        diagnostic_name: booking.diagnostic ? booking.diagnostic.name : 'N/A',
        diagnostic_image: booking.diagnostic ? booking.diagnostic.image : '',
        diagnostic_address: booking.diagnostic ? booking.diagnostic.address : '',
        consultation_fee: booking.consultation_fee || 0,
        tests: booking.diagnostic?.tests?.map(test => ({
          test_name: test.test_name,
          price: test.price,
          offerPrice: test.offerPrice || test.price,
          description: test.description,
          image: test.image
        })) || [],
        appointment_date: formattedDate,
        gender: booking.gender,
        age: booking.age,
        subtotal: booking.subtotal,
        gst_on_tests: booking.gst_on_tests,
        gst_on_consultation: booking.gst_on_consultation,
        total: booking.total,
        status: booking.status
      };
    });

    // 5. Return the response
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



const pdfsDirectory = path.join(process.cwd(), 'pdfs');

// Ensure PDF directory exists
if (!fs.existsSync(pdfsDirectory)) {
  fs.mkdirSync(pdfsDirectory);
}


// Ensure PDF directory exists
if (!fs.existsSync(pdfsDirectory)) {
  fs.mkdirSync(pdfsDirectory, { recursive: true });
}

// PDF Generator
const generateStaffPrescriptionPDF = (staff, doctor, filePath) => {
  try {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text(`Staff: ${staff.name}`, { underline: true });
    doc.fontSize(16).text(`Doctor: ${doctor.name}`, { underline: true });
    doc.moveDown();

    if (staff.prescription?.length) {
      doc.fontSize(16).text('Prescriptions:', { underline: true });
      staff.prescription.forEach((pres, index) => {
        doc.moveDown(0.5);
        doc.text(`${index + 1}. ${pres.medicineName || 'Medicine'} - ${pres.dosage || ''}`);
        doc.text(`   Instructions: ${pres.instructions || 'N/A'}`);
        doc.text(`   Date: ${pres.createdAt ? new Date(pres.createdAt).toLocaleDateString() : 'N/A'}`);
      });
    } else {
      doc.text('No prescriptions available.');
    }

    doc.end();
    console.log(`✅ PDF generated for staffId: ${staff._id}`);
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
  }
};

// Main controller
export const getPrescription = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { status } = req.body;

    console.log(`🔍 Fetching appointments for staffId: ${staffId}`);

    const appointments = await Appointment.find({ staff: staffId })
      .populate('staff')
      .populate('doctor'); // populate doctor info

    if (!appointments.length) {
      return res.status(404).json({ message: 'No appointments found for this staff member' });
    }

    const filteredAppointments = status
      ? appointments.filter(app => app.status === status)
      : appointments;

    const appointmentDetails = filteredAppointments.map(app => {
      const prescriptionPdfFileName = `prescription-${app._id}.pdf`;
      const prescriptionPdfFilePath = path.join(pdfsDirectory, prescriptionPdfFileName);
      const prescriptionPdfUrl = `/pdfs/${prescriptionPdfFileName}`;

      const hasPrescription = app.staff?.prescription?.length > 0;

      if (hasPrescription) {
        generateStaffPrescriptionPDF(app.staff, app.doctor, prescriptionPdfFilePath);
      }

      return {
        appointmentId: app._id,
        appointment_date: app.appointment_date,
        appointment_time: app.appointment_time,
        patient_name: app.patient_name,
        patient_relation: app.patient_relation,
        status: app.status,
        total: app.total,
        payment_status: app.payment_status,
        staff: {
          id: app.staff?._id,
          name: app.staff?.name,
          email: app.staff?.email,
          mobile: app.staff?.mobile,
        },
        doctor: {
          id: app.doctor?._id,
          name: app.doctor?.name,
          specialization: app.doctor?.specialization,
          qualification: app.doctor?.qualification,
          consultation_fee: app.doctor?.consultation_fee,
          image: app.doctor?.image,
          email: app.doctor?.email,
          mobile: app.doctor?.mobile,
        },
        prescriptionPdfUrl: hasPrescription ? prescriptionPdfUrl : null,
      };
    });

    res.status(200).json({
      message: 'Appointments and prescriptions fetched successfully',
      appointments: appointmentDetails,
    });

  } catch (error) {
    console.error('❌ Error fetching prescriptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




export const addDiagnosticTestsToStaff = async (req, res) => {
  const { staffId, diagnosticId, packageId } = req.body;

  // Find staff
  const staff = await Staff.findById(staffId);
  if (!staff) return res.status(404).json({ message: "Staff not found" });

  // Find diagnostic and package
  const diagnostic = await Diagnostic.findById(diagnosticId);
  if (!diagnostic) return res.status(404).json({ message: "Diagnostic not found" });

  const selectedPackage = diagnostic.packages.id(packageId);
  if (!selectedPackage) return res.status(404).json({ message: "Package not found" });

  // Map tests
  const tests = selectedPackage.tests.map(test => ({
    testId: test._id,
    testName: test.test_name,
    description: test.description,
    image: test.image
  }));

  // Push into myPackage
  staff.myPackage.push({
    diagnosticId,
    packageId,
    packageName: selectedPackage.packageName,
    price: selectedPackage.price,
    offerPrice: selectedPackage.offerPrice,
    tests
  });

  await staff.save();

  res.status(200).json({ message: "Package added to staff successfully", staff });
};



export const getStaffPackages = async (req, res) => {
  try {
    const { staffId } = req.params;

    if (!staffId) {
      return res.status(400).json({ message: "staffId is required in params." });
    }

    // Staff find karo aur myPackage aur myTest fetch karo
    const staff = await Staff.findById(staffId)
      .select("name myPackage myTest")  // Fetch both myPackage and myTest
      .populate('myTest')  // Populate myTest array (if it's a reference to another collection)

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    return res.status(200).json({
      message: "Staff packages and tests fetched successfully",
      data: staff
    });

  } catch (error) {
    console.error("Error fetching staff packages and tests:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};



export const submitAnswer = async (req, res) => {
  try {
    const { staffId } = req.params;
    const answers = req.body.answers;

    console.log("Received request to submit answers");
    console.log("Staff ID:", staffId);
    console.log("Answers payload:", JSON.stringify(answers, null, 2));

    if (!Array.isArray(answers) || answers.length === 0) {
      console.log("Invalid input: answers not provided or not an array");
      return res.status(400).json({ message: "Invalid input. Answers must be provided in an array." });
    }

    const sectionIds = answers.map(answer => answer.sectionId);
    console.log("Looking for sections in HealthAssessment with IDs:", sectionIds);

    const healthAssessment = await HealthAssessment.findOne({
      "sections.sectionId": { $in: sectionIds }
    });

    if (!healthAssessment) {
      console.log("No health assessment found containing the provided section IDs.");
      return res.status(404).json({ message: "Assessment or sections not found" });
    }

    let totalPoints = 0;

    for (const { sectionId, questionId, selectedAnswer } of answers) {
      console.log(`Processing answer for Section: ${sectionId}, Question: ${questionId}`);
      console.log("Selected Answer:", selectedAnswer);

      const section = healthAssessment.sections.find(s => s.sectionId.toString() === sectionId);
      if (!section) {
        console.log(`Section with ID ${sectionId} not found in assessment.`);
        return res.status(404).json({ message: `Section with ID ${sectionId} not found` });
      }

      const question = section.questions.find(q => q.questionId.toString() === questionId);
      if (!question) {
        console.log(`Question with ID ${questionId} not found in section ${sectionId}`);
        return res.status(404).json({ message: `Question with ID ${questionId} not found` });
      }

      console.log("Question Points:", question.points);

      // Check if points is a Map and convert to object if necessary
      const pointsObject = question.points instanceof Map ? Object.fromEntries(question.points) : question.points;

      // Trim both selectedAnswer and the options to avoid extra spaces or formatting issues
      const cleanedSelectedAnswer = selectedAnswer.trim();
      const cleanedOptions = Object.keys(pointsObject).map(option => option.trim());

      console.log("Cleaned Selected Answer:", cleanedSelectedAnswer);
      console.log("Cleaned Options:", cleanedOptions);

      // Check if the selected answer is in the options
      let points = 0;
      if (cleanedOptions.includes(cleanedSelectedAnswer)) {
        points = pointsObject[cleanedSelectedAnswer];
        console.log(`Points for answer "${cleanedSelectedAnswer}":`, points);
      } else {
        console.log(`Selected answer "${cleanedSelectedAnswer}" not found in options.`);
      }

      totalPoints += points;

      // Push submission
      const submission = {
        staffId,
        selectedAnswer,
        submittedAt: Date.now()
      };

      console.log("Adding submission:", submission);
      if (!question.submissions) {
        question.submissions = [];
      }
      question.submissions.push(submission);
    }

    console.log("Total Points Accumulated:", totalPoints);
    await healthAssessment.save();
    console.log("Health assessment saved successfully");

    // Risk category determination
    let riskCategory = "Above 65 – Low Risk";
    if (totalPoints < 50) {
      riskCategory = "Below 50 – High Risk";
    } else if (totalPoints < 65) {
      riskCategory = "Below 65 – Medium Risk";
    }

    console.log("Final Risk Category:", riskCategory);

    const responsePayload = {
      message: "Answers submitted successfully",
      totalPoints,
      riskCategory,
      data: answers.map(answer => ({
        staffId,
        sectionId: answer.sectionId,
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer
      }))
    };

    console.log("Response Payload:", JSON.stringify(responsePayload, null, 2));
    res.status(200).json(responsePayload);

  } catch (error) {
    console.error("Error occurred during answer submission:", error);
    res.status(500).json({ message: "Error submitting answers", error: error.message });
  }
};



// Controller to add or update staff's steps
export const addOrUpdateStaffSteps = async (req, res) => {
  try {
    const { staffId } = req.params; // Get staffId from the request parameters
    const { steps } = req.body; // Get steps from the request body

    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0)); // Normalize today's date
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }); // Get day name

    // Find the staff record by staffId
    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Check if steps are already recorded for today
    const todaySteps = staff.steps.find(
      (step) => new Date(step.date).getTime() === today.getTime()
    );

    if (todaySteps) {
      // Update today's steps count
      todaySteps.stepsCount += steps;
    } else {
      // If no steps recorded for today, add new record with date and day
      staff.steps.push({
        date: today,
        day: dayOfWeek,
        stepsCount: steps,
      });
    }

    await staff.save(); // Save updated staff data with steps
    res.status(200).json({ message: 'Steps recorded successfully', steps: staff.steps });
  } catch (error) {
    console.error('Error recording staff steps:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const getStaffStepsHistory = async (req, res) => {
  try {
    const { staffId } = req.params;

    // Find the staff record by staffId
    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Format steps data and calculate total steps
    let totalSteps = 0;
    const stepsSummary = staff.steps.map(step => {
      const formattedDate = new Date(step.date).toLocaleDateString('en-GB'); // e.g. 07/05/2025
      totalSteps += step.stepsCount;

      return {
        date: formattedDate,
        day: step.day,
        stepsCount: step.stepsCount,
      };
    });

    res.status(200).json({
      staffId: staff._id,
      name: staff.name,
      stepsSummary,
      totalSteps,
    });
  } catch (error) {
    console.error('Error fetching staff steps:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};













  
  

  
  
  
  