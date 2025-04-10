import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: { type: String },
  specialization: { type: String },
  qualification: { type: String }, // e.g., MBBS, MD
  description: { type: String },
  consultation_fee: { type: Number },
  address: { type: String },
  image: { type: String },
  category: { type: String } // ✅ new field for category
}, { timestamps: true });

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
