import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor',},
  
  senderId: { type: mongoose.Schema.Types.ObjectId, },  // can be staff or doctor
  receiverId: { type: mongoose.Schema.Types.ObjectId, }, 
  
  message: { type: String, default: "" },  // optional text message
  
  file: { type: String, default: null },  // file path or URL if any file is sent
  
  sender: { type: String, enum: ['staff', 'doctor'], },
  
  timestamp: { type: Date, default: Date.now },
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
