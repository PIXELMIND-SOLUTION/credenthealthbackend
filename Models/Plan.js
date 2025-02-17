import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    features: { type: [String], required: true, default: [] },
    status: { type: String, enum: ["active", "inactive"], default: "inactive" }, // Add status
  },
  { timestamps: true }
);

export default mongoose.model("Plan", planSchema);
