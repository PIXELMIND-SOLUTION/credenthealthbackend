import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    date: {
      type: String,
    },
    time: {
      type: String,
    },
    link: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields automatically
);

const Meeting = mongoose.model("Meeting", meetingSchema);
export default Meeting;
