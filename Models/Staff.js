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
  password: { type: String, }, // Password field
  dateOfBirth: { type: Date },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active", // Default value is "active"
  },
  joiningDate: { type: Date },
  mySalary: [
    {
      _id: mongoose.Schema.Types.ObjectId, // Unique ID for each salary record
      amount: {
        type: Number,
      },
      paymentMethod: {
        type: String,
        enum: ["Cash", "Bank Transfer", "Cheque", "Card", "UPI"],
      },
      remarks: {
        type: String,
        default: "",
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  salary: { type: Number },
  employeeId: { type: String, unique: true },
  emergencyContact: {
    name: { type: String },
    relation: { type: String },
    phone: { type: String },
  },
  myTasks: [
    {
      title: { type: String, required: true },
      description: { type: String, required: true },
      dueDate: { type: Date, required: true },
      status: { type: String, default: "pending" },
      assignedAt: { type: Date, default: Date.now },
    },
  ],
  myAttendance: [
    {
      date: { type: String, },
      status: { type: String, enum: ["Present", "Absent"], },
    },
  ],
  myMeetings: [
    {
      title: { type: String, },
      date: { type: String, },
      time: { type: String, },
      link: { type: String, },
      description: { type: String },
    },
  ],
  profilePicture: { type: String },
  qualifications: { type: [String] },
  createdAt: { type: Date, default: Date.now },
});

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
