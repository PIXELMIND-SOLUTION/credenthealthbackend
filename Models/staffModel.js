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
  profileImage: {
    type: String, // Store the filename of the uploaded image
    default: null,
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
    },
  ],
  wallet_balance: {
    type: Number,
    default: 0,
  },

  wallet_logs: [
    {
      type: {
        type: String,
        enum: ['credit', 'debit'],
      },
      amount: {
        type: Number,
      },
      from: String,
      to: String,
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  doctorAppointments: [
    {
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
    },
  ],

  // Moved `family_members` here as a direct field of Staff
  family_members: [
    {
      fullName: { type: String },
      mobileNumber: { type: String },
      age: { type: Number },
      gender: { type: String, enum: ['Male', 'Female', 'Other'] },
      DOB: { type: Date },
      height: { type: Number }, // in cm
      weight: { type: Number }, // in kg
      eyeSight: { type: String },
      BMI: { type: Number },
      BP: { type: String }, // BP as string (e.g., 120/80)
      sugar: { type: String }, // e.g., Normal, High, Low
      relation: { type: String }, // e.g., Mother, Father, etc.
    },
  ],

  addresses: [
  {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postalCode: { type: String },
    addressType: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' }
  }
],

issues: [
  {
    reason: { type: String, },
    description: { type: String, },
    file: { type: String }, // File name (if file is uploaded)
    status: { type: String, default: 'Processing' }, // Default status is "Processing"
    response: { type: String, default: '' }, // Admin's response to the issue
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }
],

}, { timestamps: true });

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
