import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    author: {
      type: String,
    },
    ISBN: {
      type: String,
    },
    category: {
      type: String,
    },
    availableCopies: {
      type: Number,
    },
    totalCopies: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Book", bookSchema);
