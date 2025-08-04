import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, },  // Adding email field (unique and required)
  password: { type: String, },  // Adding password field (required)
  specialization: { type: String },
  qualification: { type: String }, // e.g., MBBS, MD
  description: { type: String },
  consultation_fee: { type: Number },
  address: { type: String },
  image: { type: String },
  category: { type: String }, // ✅ new field for category
  role: { type: String }, // ✅ new field for category
  department: { type: String }, // ✅ new field for category
   documents: [{ type: String }], // ✅ New field for documents
  consultation_type: {
  type: String,
  enum: ['In-Person', 'Video Call', 'Chat', 'Online', 'Offline', 'Both'], // Optional validation
  required: false
},
  schedule: [
  {
    day: { type: String },
    date: { type: String }, // ✅ Add this line
    time_slots: [
      {
        time: { type: String },
        isBooked: { type: Boolean, default: false }
      }
    ]
  }
],
  onlineSlots: [
    {
      day: String,
      date: String,
      timeSlot: String,
      isBooked: { type: Boolean, default: false }
    },
  ],
  offlineSlots: [
    {
      day: String,
      date: String,
      timeSlot: String,
      isBooked: { type: Boolean, default: false }
    },
  ],

  myBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }], // Add this line
  isOnline: { type: Boolean, default: false }, // Track if doctor is online or offline
}, { timestamps: true });

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
