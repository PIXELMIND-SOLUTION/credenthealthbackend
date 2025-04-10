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
}, { timestamps: true });

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
