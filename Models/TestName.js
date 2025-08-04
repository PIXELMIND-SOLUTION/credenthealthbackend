import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
  },
  },
  { timestamps: true }
);

const TestName = mongoose.model("TestName", testSchema);

export default TestName;
