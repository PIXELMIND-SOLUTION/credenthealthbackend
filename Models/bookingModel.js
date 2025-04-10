import mongoose from 'mongoose';

// Booking Schema
const bookingSchema = new mongoose.Schema({
  patient_name: {
    type: String,
    required: true,
  },
  category: {
    type: String, // diagnostic, etc.
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  tests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
  }],
  subtotal: {
    type: Number,
    required: true,
  },
  consultation_fee: {
    type: Number,
    required: true,
  },
  gst_on_tests: {
    type: Number,
    required: true,
  },
  gst_on_consultation: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  appointment_date: {
    type: Date,
    required: true,
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',  // Associate the staff member who processed the booking
    required: true,
  },
  status: {
    type: String,
    default: 'Pending',
  },
}, { timestamps: true });

// Create Booking model
const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
