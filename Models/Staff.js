import mongoose from 'mongoose';

const { Schema } = mongoose;

const staffSchema = new Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, unique: true },
  phone: { type: String },
  position: { type: String },
  department: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  dateOfBirth: { type: Date },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
  },
  joiningDate: { type: Date },
  salary: { type: Number },
  employeeId: { type: String, unique: true },
  emergencyContact: {
    name: { type: String },
    relation: { type: String },
    phone: { type: String },
  },
  profilePicture: { type: String },
  qualifications: { type: [String] },
  createdAt: { type: Date, default: Date.now },
});

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
