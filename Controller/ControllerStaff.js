import Staff from "../Models/staffModel.js";
import generateToken from "../config/jwtToken.js";


// Staff login function (Authentication)
export const staffLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find staff by email
      const staff = await Staff.findOne({ email });
      if (!staff) {
        return res.status(400).json({ message: 'Staff not found' });
      }
  
      // Check if password matches (Note: You should hash the password in a real app)
      if (staff.password !== password) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Log the staff _id (staffId)
      console.log("Staff ID: ", staff._id.toString()); // Log the staffId here
  
      // Generate token (Assuming `generateToken` function is defined elsewhere)
      const token = generateToken(staff._id);
  
      // Send complete staff object along with token and staffId as string
      res.status(200).json({
        message: 'Login successful',
        token, // Token included here
        staff: staff // Send complete staff object here
      });
    } catch (error) {
      // Log the error for debugging
      console.error('Error during staff login:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  