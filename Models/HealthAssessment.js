import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const healthAssessmentSchema = new Schema({
  questions: [
    {
      questionId: {
        type: Types.ObjectId,
        default: () => new Types.ObjectId()
      },
      question: { type: String, required: true },
      options: [String], // List of options for the question
      points: {
        type: Map,
        of: Number // Map option text to its score
      },
      submissions: [
        {
          staffId: { type: String, required: true },
          selectedAnswer: { type: String, required: true },
          submittedAt: { type: Date, default: Date.now }
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

const HealthAssessment = model('HealthAssessment', healthAssessmentSchema);

export default HealthAssessment;
