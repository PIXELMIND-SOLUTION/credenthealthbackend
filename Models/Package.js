import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  price: {
    type: Number,
  },
  doctorInfo: {
    type: String
  },
  totalTestsIncluded: {
    type: Number,
  },
  description: {
    type: String
  },
  precautions: {
    type: String // ✅ newly added field
  },
  includedTests: [
    {
      name: {
        type: String,
      },
      subTestCount: {
        type: Number,
      },
      subTests: {
        type: [String],
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Package = mongoose.model('Package', packageSchema);
export default Package;
