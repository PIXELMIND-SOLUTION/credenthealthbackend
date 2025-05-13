import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    appointment_date: {
      type: String, // e.g., "2025-04-28"
    },
    appointment_time: {
      type: String, // e.g., "10:30 AM"
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    patient_name: {
      type: String,
    },
    patient_relation: {
      type: String,
      default: 'Self',
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    visit: {
      type: String, // e.g., "First Visit", "Follow-up"
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    payment_status: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
