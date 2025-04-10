import mongoose from 'mongoose';

// Define the schema for the diagnostic tests
const testSchema = new mongoose.Schema({
  test_name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  offerPrice: { type: Number, required: true, default: function() { return this.price; } },  // Default offerPrice is the same as price
  image: { type: String },  // URL or path to the test image (optional)
});

// Define the schema for diagnostic center
const diagnosticSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },  // Image URL or path
  address: { type: String, required: true },
  tests: [testSchema],  // Array of tests that the diagnostic center offers
}, { timestamps: true });

const Diagnostic = mongoose.model('Diagnostic', diagnosticSchema);

export default Diagnostic;
