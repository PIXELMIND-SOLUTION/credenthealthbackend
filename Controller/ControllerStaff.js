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
        subtotal,
        total,
        appointment_date,
        appointment_time,
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
          doctor_details: doctor,           // full doctor object
          staff_details: staff,             // full staff object
          patient_name: newAppointment.patient_name,
          patient_relation: newAppointment.patient_relation,
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
        select: 'patient_name patient_relation age gender subtotal total appointment_date appointment_time status payment_status schedule', // Fields to return from the appointment
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
      ? staff.doctorAppointments.filter((appointment) => appointment.appointmentId?.status === status)
      : staff.doctorAppointments;

    // Safeguard: Check for null or undefined doctor or appointmentId before mapping
    const appointments = filteredAppointments.map((appointment) => {
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
        subtotal: appointment.appointmentId.subtotal,
        total: appointment.appointmentId.total,
        payment_status: appointment.appointmentId.payment_status,
        schedule: appointment.appointmentId.schedule,
      };
    }).filter(Boolean); // Filter out null entries if any invalid appointment is found

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









  
  

  
  
  
  