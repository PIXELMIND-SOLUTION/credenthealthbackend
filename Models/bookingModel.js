import mongoose from 'mongoose';

// Booking Schema
const bookingSchema = new mongoose.Schema({
  patient_name: {
    type: String,
  },
  category: {
    type: String, // diagnostic, etc.
  },
  diagnostic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diagnostic',  // Reference to the Diagnostic model
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
  tests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
  }],
  subtotal: {
    type: Number,
  },
  consultation_fee: {
    type: Number,
  },
  gst_on_tests: {
    type: Number,
  },
  gst_on_consultation: {
    type: Number,
  },
  total: {
    type: Number,
  },
  appointment_date: {
    type: Date,
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
  },
  gender: {  // Added gender field without required validation
    type: String, // You can make it 'String' or 'Enum' based on the gender options you'd like to allow
  },
  age: {  // Added age field without required validation
    type: Number,
  },
  status: {
    type: String,
    default: 'Pending',
  },
}, { timestamps: true });

// Create Booking model
const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
