import mongoose from 'mongoose';

const hraSchema = new mongoose.Schema({
  hraName: {
    type: String,
  },
  hraImage: {
    type: String,
  },
}, { timestamps: true });

const Hra = mongoose.model('Hra', hraSchema);
export default Hra;
