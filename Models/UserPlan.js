import mongoose from "mongoose";

const userPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    chosenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const UserPlan = mongoose.model("UserPlan", userPlanSchema);
export default UserPlan;
