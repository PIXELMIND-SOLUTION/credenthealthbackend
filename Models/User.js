import mongoose from 'mongoose';

// Student Schema
const userSchema = new mongoose.Schema({
  name: { type: String },
  dob: { type: Date },
  address: { type: String },
  type: {
    type: String,
  },
fees: [{
    feesType: String,
    invoiceNumber: String,
    status: String,
    amount: Number,
    paidAmount: Number,
    paymentMethod: String,
    paidDate: Date,
    pendingPayment: Number,
  }],
    role: { type: String, default: 'User' },

    firstName: { type: String, },
    lastName: { type: String, },
    email: { type: String, unique: true, },
    phone: { type: String },
    password: { type: String,  }, // Automatically generated
    dateOfBirth: { type: Date }, // New field
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
    }, // New field
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active", // Default value is "active"
    },
    fees: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      amount: {
        type: Number,
      },
      paymentMethod: {
        type: String,
        enum: ["Cash", "Bank Transfer", "Cheque", "UPI"],
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
    joiningDate: { type: Date }, // New field
    createdAt: { type: Date, default: Date.now },
  refreshToken: {
    type: String,
  },
  myPlan: [{ type: mongoose.Schema.Types.ObjectId, ref: "Plan" }], // 🔥 User ke plan store karne ke liye


}, { timestamps: true });

const User = mongoose.model('Users', userSchema);
export default User 