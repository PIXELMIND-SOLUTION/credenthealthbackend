import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', },
  amount: { type: Number, },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque'], },
  date: { type: Date, default: Date.now }, // Default to the current date
  remarks: { type: String },
});

const Salary = mongoose.model('Salary', salarySchema);

export default  Salary;
