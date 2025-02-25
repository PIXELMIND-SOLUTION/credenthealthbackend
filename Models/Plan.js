import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: { type: String, },
    price: { type: Number, },
    features: { type: [String], default: [] },
    status: { type: String, enum: ["active", "inactive"], default: "inactive" }, // Add status
    duration: { type: String, },

  },
  { timestamps: true }
);

export default mongoose.model("Plan", planSchema);
