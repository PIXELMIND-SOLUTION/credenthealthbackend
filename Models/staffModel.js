import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['Admin', 'Staff'],
    default: 'Staff',
  },
  contact_number: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  myBookings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    }
  ],
  wallet_balance: { 
    type: Number, 
    default: 0  // Initial wallet balance is 0
  },
  doctorAppointments: [{
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    appointment_date: {
      type: Date,
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
    },
    subtotal: {
      type: Number,
    },
    total: {
      type: Number,
    },
  }],
}, { timestamps: true });

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
