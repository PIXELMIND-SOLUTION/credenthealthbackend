import mongoose from "mongoose";
const healthAssessmentSchema = new mongoose.Schema({
  sections: [
    {
      sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      },
      sectionName: { type: String, required: true },
      questions: [
        {
          questionId: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId()
          },
          question: { type: String, required: true },
          options: [String], // List of options for the question
          submissions: [
            {
              staffId: { type: String, required: true }, // Staff ID
              selectedAnswer: { type: String, required: true }, // Answer selected by the staff
              submittedAt: { type: Date, default: Date.now } // Timestamp of submission
            }
          ]
        }
      ]
    }
  ],
  totalScore: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const HealthAssessment = mongoose.model('HealthAssessment', healthAssessmentSchema);

export default HealthAssessment;
