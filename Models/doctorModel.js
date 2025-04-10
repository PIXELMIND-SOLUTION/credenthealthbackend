import mongoose from 'mongoose';

// Doctor Schema
const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  category: {  // Changed from specialization to category
    type: String,
  },
  contact_number: {
    type: String,
  },
  email: {
    type: String,
  },
  clinic_address: {
    street: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    postal_code: {
      type: String,
    },
    country: {
      type: String,
    }
  },
  consultation_fee: {
    type: Number,
  },
  available_days: [String],
  working_hours: {
    morning: String,
    evening: String
  },
  tests: [
    {
      test_name: {
        type: String,
      },
      description: {
        type: String,
      },
      price: {
        type: Number,
      },
      offerPrice: {
        type: Number,
      }
    }
  ]
});

// Create Doctor model
const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
