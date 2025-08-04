import mongoose from "mongoose";

const xraySchema = new mongoose.Schema({
  title: {
    type: String,
  },
  price: {
    type: Number,
  },
  preparation: {
    type: String,
  },
  reportTime: {
    type: String,
  },
  image: {
    type: String, // This will store the image URL (can be local or cloud-based)
  }
}, { timestamps: true });

const Xray = mongoose.model("Xray", xraySchema);
export default Xray;
