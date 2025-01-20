// Admin Schema
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
role: {
    type: String,
    enum: ["Admin", "Teacher", "Student", "Parent"],
  },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    library: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    schoolName: {
      type: String,
    },
    address: {
      type: String,
    },
    contact: {
      type: String,
    },
    email: {
      type: String,
    },
    description: {
      type: String,
    },
    logo: {
      type: String, // URL of the logo image stored in Cloudinary
    },
    schoolImage: {
      type: String, // URL of the school image stored in Cloudinary
    },
    schoolName: {
      type: String,
    },
    studentsCount: {
      type: Number,
    },
    contactPersonName: {
      type: String,
    },
    contactPersonDesignation: {
      type: String,
    },
    contactPersonEmail: {
      type: String,
    },
    contactPersonMobileNumber: {
      type: String,
    },
    fullAddress: {
      type: String,
    },
  }, { timestamps: true });
  
  const Admin = mongoose.model('Admin', adminSchema);
  export default Admin