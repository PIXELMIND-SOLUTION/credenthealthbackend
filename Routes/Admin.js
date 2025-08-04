import mongoose from 'mongoose';

// Define the Admin Schema
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true, // Email should be unique for each admin
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'], // Role can be either admin or superadmin
    default: 'admin', // Default role is admin
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Create Admin model
const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
