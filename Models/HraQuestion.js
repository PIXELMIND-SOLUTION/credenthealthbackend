import mongoose from 'mongoose';

const hraQuestionSchema = new mongoose.Schema(
  {
    // Category that the question belongs to
    hraCategoryId: {
      type: mongoose.Schema.Types.ObjectId,  // Reference to the HRA category
      ref: 'Hra',  // Assuming you have a model for HraCategory
    },
    
    // The question being asked
    question: {
      type: String,
    },

     // The question being asked
    hraCategoryName: {
      type: String,
    },

     options: [
      {
        text: { type: String, },
        point: { type: Number, }
      }
    ],
    // The option selected by the user (this will be stored in user answers)
    selectedOption: {
      type: String,  // The option that user selects
      validate: {
        validator: function(value) {
          // Ensure selectedOption is one of the available options
          return this.options.includes(value);
        },
        message: 'Invalid option selected'
      }
    }
  },
  { timestamps: true }
);

const HraQuestion = mongoose.model('HraQuestion', hraQuestionSchema);

export default HraQuestion;
