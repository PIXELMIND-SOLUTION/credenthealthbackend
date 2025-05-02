import Doctor from '../Models/doctorModel.js';
import Staff from '../Models/staffModel.js';
import Appointment from '../Models/Appointment.js';
import Blog from '../Models/Blog.js';

export const createDoctor = async (req, res) => {
  try {
    const {
      name,
      specialization,
      qualification,
      description,
      consultation_fee,
      address,
      category,
    } = req.body;

    let imagePath = null;

    if (req.file) {
      // This is the relative path to access image via URL
      imagePath = `/uploads/doctorimages/${req.file.filename}`;
    }

    const newDoctor = new Doctor({
      name,
      specialization,
      qualification,
      description,
      consultation_fee,
      address,
      category,
      image: imagePath,
    });

    await newDoctor.save();

    res.status(201).json({
      message: 'Doctor created successfully',
      doctor: newDoctor,
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get All Doctor Details
export const getDoctorDetails = async (req, res) => {
  try {
    const doctors = await Doctor.find(); // Fetch all doctor details
    if (doctors.length === 0) {
      return res.status(404).json({ message: 'No doctor details available.' });
    }
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get Doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id); // Fetch doctor by ID
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update Doctor Details
export const updateDoctorDetails = async (req, res) => {
  try {
    const {
      name,
      category,
      contact_number,
      email,
      clinic_address,
      consultation_fee,
      available_days,
      working_hours,
      tests
    } = req.body;

    // Find doctor by ID
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    // Update doctor details
    doctor.name = name || doctor.name;
    doctor.category = category || doctor.category;
    doctor.contact_number = contact_number || doctor.contact_number;
    doctor.email = email || doctor.email;
    doctor.clinic_address = clinic_address || doctor.clinic_address;
    doctor.consultation_fee = consultation_fee || doctor.consultation_fee;
    doctor.available_days = available_days || doctor.available_days;
    doctor.working_hours = working_hours || doctor.working_hours;
    doctor.tests = tests || doctor.tests;

    // Save updated doctor details
    await doctor.save();

    res.status(200).json({
      message: 'Doctor details updated successfully',
      doctor
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};




export const createPrescription = async (req, res) => {
  try {
    const { doctorId, appointmentId } = req.params;
    const { prescriptionDetails } = req.body;

    if (!doctorId || !appointmentId || !prescriptionDetails) {
      return res.status(400).json({ message: 'doctorId, appointmentId, and prescriptionDetails are required' });
    }

    // Step 1: Find Appointment
    const appointment = await Appointment.findById(appointmentId).populate('staff');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Step 3: Add prescription to staff
    appointment.staff.prescription.push({
      ...prescriptionDetails,
      createdAt: new Date()
    });
    await appointment.staff.save();

    res.status(200).json({
      message: 'Prescription added successfully',
      prescription: appointment.staff.prescription,
    });

  } catch (error) {
    console.error('❌ Error creating prescription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const createBlog = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { title, description, image } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const blog = new Blog({
      title,
      description,
      image,
      doctor: doctorId,
    });

    await blog.save();

    // Push blog ID into doctor's myBlogs[] array
    doctor.myBlogs.push(blog._id);
    await doctor.save();

    // Populate doctor info in blog response
    await blog.populate('doctor');

    res.status(201).json({
      message: 'Blog created successfully',
      blog: {
        id: blog._id,
        title: blog.title,
        description: blog.description,
        image: blog.image,
        createdAt: blog.createdAt,
        doctor: {
          id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
          qualification: doctor.qualification,
          image: doctor.image,
          email: doctor.email,
          mobile: doctor.mobile,
        },
      },
    });

  } catch (error) {
    console.error('❌ Error creating blog:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const getAllBlogs = async (req, res) => {
  try {
    // Fetch all blogs and populate doctor info
    const blogs = await Blog.find().populate('doctor');

    if (!blogs.length) {
      return res.status(404).json({ message: 'No blogs found' });
    }

    // Send raw blogs directly without formatting
    res.status(200).json({
      message: 'Blogs retrieved successfully',
      blogs, // directly sending the original documents
    });

  } catch (error) {
    console.error('❌ Error retrieving blogs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




export const getSingleBlog = async (req, res) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findById(blogId).populate('doctor');
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Format creation date to human-readable format
    const formattedBlog = {
      id: blog._id,
      title: blog.title,
      description: blog.description,
      image: blog.image,
      createdAt: new Date(blog.createdAt).toLocaleDateString(), // Human-readable format
      doctor: {
        id: blog.doctor._id,
        name: blog.doctor.name,
        specialization: blog.doctor.specialization,
        qualification: blog.doctor.qualification,
        image: blog.doctor.image,
        email: blog.doctor.email,
        mobile: blog.doctor.mobile,
      },
    };

    res.status(200).json({
      message: 'Blog retrieved successfully',
      blog: formattedBlog,
    });
    
  } catch (error) {
    console.error('❌ Error retrieving blog:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
