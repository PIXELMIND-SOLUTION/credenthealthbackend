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
      type: String,  // Date and time of the appointment
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    patient_name: {
      type: String,
      required: true,
    },
    patient_relation: {
      type: String,
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
    // New schedule field to store appointment day, date, and time slots
    schedule: [
      {
        day: { type: String },  // e.g., Monday, Tuesday
        date: { type: String }, // e.g., 28-04-2025
        time_slots: [
          { time: { type: String } },  // e.g., 09:00 AM, 09:30 AM
        ],
      },
    ],
  },
  { timestamps: true }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
