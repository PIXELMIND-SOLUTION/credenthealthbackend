import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, },  // Adding email field (unique and required)
  password: { type: String, },  // Adding password field (required)
  specialization: { type: String },
  qualification: { type: String }, // e.g., MBBS, MD
  description: { type: String },
  consultation_fee: { type: Number },
  address: { type: String },
  image: { type: String },
  category: { type: String }, // ✅ new field for category
schedule: [
    {
      day: { type: String },  // e.g., Monday, Tuesday
      date: { type: String },  // e.g., 28-04-2025
      time_slots: [
        { time: { type: String } },  // e.g., 09:00 AM, 09:30 AM
      ],
    },
  ], // New field for schedule with time slots
}, { timestamps: true });

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
