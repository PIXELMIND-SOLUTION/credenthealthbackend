import Staff from "../Models/staffModel.js";
import generateToken from "../config/jwtToken.js";
import Appointment from "../Models/Appointment.js";
import Doctor from "../Models/doctorModel.js";


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


  // Controller to get the wallet balance of a staff member
  export const getWalletBalance = async (req, res) => {
    try {
      const { staffId } = req.params;  // Get staffId from URL params
  
      // Find the staff member by their staffId
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(400).json({ message: 'Staff not found' });
      }
  
      // Respond with the current wallet balance
      res.status(200).json({
        message: 'Wallet balance fetched successfully',
        wallet_balance: staff.wallet_balance,  // Send back the wallet balance
      });
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };



  export const bookAppointment = async (req, res) => {
    try {
      const { staffId, doctorId } = req.params;  // Get staffId and doctorId from URL params
      const { appointment_date, appointment_time, patient_name, patient_relation } = req.body;  // Get the appointment date, time, and patient details
  
      // 1. Find staff by staffId
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(400).json({ message: 'Staff member not found' });
      }
  
      // 2. Find doctor by doctorId
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(400).json({ message: 'Doctor not found' });
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
  
      // 7. Respond with the appointment details including appointmentId, subtotal and total
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
      const { staffId, appointmentId } = req.params; // Get staffId and appointmentId from URL params
  
      // 1. Find staff by staffId
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(400).json({ message: 'Staff member not found' });
      }
  
      // 2. Find appointment by appointmentId
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(400).json({ message: 'Appointment not found' });
      }
  
      // 3. Get subtotal (consultation fee) and total (same as subtotal for now)
      const subtotal = appointment.subtotal || 0;  // Assuming the subtotal is the consultation fee
      const total = appointment.total || subtotal;  // Use the total (or subtotal if total is not defined)
  
      // 4. Check if the staff has enough wallet balance
      if (staff.wallet_balance < total) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
  
      // 5. Deduct the amount from the staff's wallet
      staff.wallet_balance -= total;
  
      // 6. Update the appointment status to 'Confirmed'
      appointment.status = 'Confirmed';
  
      // Save the updated staff wallet balance and appointment status
      await staff.save();
      await appointment.save();
  
      // 7. Respond with the payment success message and updated details
      res.status(200).json({
        message: 'Payment successful and appointment confirmed',
        appointment: {
          doctor_name: appointment.doctor.name,
          doctor_specialization: appointment.doctor.specialization,
          appointment_date: appointment.appointment_date,
          patient_name: appointment.patient_name,
          patient_relation: appointment.patient_relation,
          status: appointment.status,
          subtotal,  // Subtotal (consultation fee)
          total,     // Total (same as subtotal)
          wallet_balance: staff.wallet_balance, // Updated wallet balance
        },
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  
  
  