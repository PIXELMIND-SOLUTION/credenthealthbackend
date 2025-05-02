import mongoose from 'mongoose';

// Blog schema definition
const blogSchema = new mongoose.Schema({
  title: { type: String, },
  description: { type: String, },
  image: { type: String },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the Blog model and export it
const Blog = mongoose.model('Blog', blogSchema);

// Export the Blog model as default
export default Blog;
