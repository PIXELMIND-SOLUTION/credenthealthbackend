import mongoose from 'mongoose';

// Define the schema for diagnostic tests
const testSchema = new mongoose.Schema({
  test_name: { type: String },
  description: { type: String },
  price: { type: Number },
  offerPrice: { type: Number, default: function() { return this.price; } },  // Default offerPrice is the same as price
  image: { type: String },  // URL or path to the test image (optional)
});

// Define the schema for diagnostic center
const diagnosticSchema = new mongoose.Schema({
  name: { type: String },
  image: { type: String },  // Image URL or path
  address: { type: String },

  // Additional fields for the diagnostic center
  centerType: { type: String },
  email: { type: String },
  phone: { type: String },
  gstNumber: { type: String },
  centerStrength: { type: Number },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  pincode: { type: String },

  // Contact person(s) array
  contactPersons: [
    {
      name: { type: String },
      designation: { type: String },
      gender: { type: String },
      contactEmail: { type: String },
      contactNumber: { type: String },
    }
  ],

  // Docs & password
  documents: [{ type: String }],
  password: { type: String },

  // Tests offered by center
  tests: [testSchema],
}, { timestamps: true });

const Diagnostic = mongoose.model('Diagnostic', diagnosticSchema);
export default Diagnostic;
