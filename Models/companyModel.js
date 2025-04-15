import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, },
    companyType: { type: String, },
    assignedBy: { type: String },
    registrationDate: { type: Date },
    contractPeriod: { type: String },
    renewalDate: { type: Date },
    insuranceBroker: { type: String },
    email: { type: String },
    password: { type: String },
    phone: { type: String },
    gstNumber: { type: String },
    companyStrength: { type: Number },
    image: { type: String }, // Store image file path or URL

    // Address
    country: { type: String },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },

    // Contact Person Details
    contactPerson: {
      name: { type: String, },
      designation: { type: String },
      gender: { type: String },
      email: { type: String },
      phone: { type: String },
      address: {
        country: { type: String },
        state: { type: String },
        city: { type: String },
        pincode: { type: String },
        street: { type: String },
      },
    },

    staff: [{
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
      name: { type: String },
      role: { type: String },
      contact: { type: String },
      email: { type: String },
      dob: { type: Date },
      gender: { type: String },
      age: { type: Number },
      address: { type: String },
      profileImage: { type: String },
      idImage: { type: String },
      wallet_balance: { type: Number, default: 0 },
    }],
    // Uploaded documents
    documents: [{ type: String }],
  },
  { timestamps: true }
);

// Export the model
const Company = mongoose.model("Company", companySchema);
export default Company;
