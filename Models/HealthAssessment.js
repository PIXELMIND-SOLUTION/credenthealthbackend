import mongoose from 'mongoose';

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
          options: [String],
          selectedAnswer: { type: String, default: null }, // staff fills later
          points: { type: Number, default: 0 }             // staff fills later
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
