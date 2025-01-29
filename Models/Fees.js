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
});

const Fees = mongoose.model("Fees", FeesSchema);
export default Fees;
