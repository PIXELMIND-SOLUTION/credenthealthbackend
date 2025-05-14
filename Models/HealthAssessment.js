import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const healthAssessmentSchema = new Schema({
  sections: [
    {
      sectionId: {
        type: Types.ObjectId,
        default: () => new Types.ObjectId()
      },
      sectionName: { type: String, required: true },
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
            of: Number // Optional: map of option text to its score
          },
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const HealthAssessment = model('HealthAssessment', healthAssessmentSchema);

export default HealthAssessment;
