import mongoose from "mongoose";

const FeesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
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
  planName: {
    type: String,
  },
  planPrice: {
    type: Number,
  },
  expiredDate: {
    type: Date,
  },
  pendingAmount: {
    type: Number,
  },
  paidAmount: {
    type: Number,
  },
});

const Fees = mongoose.model("Fees", FeesSchema);
export default Fees;
