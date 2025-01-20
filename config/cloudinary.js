import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv'; // To load environment variables

dotenv.config(); // Load environment variables from .env file

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export default cloudinary; // Export cloudinary for use in other parts of the app
