import Doctor from '../Models/doctorModel.js';

// Create Doctor Details
export const createDoctorDetails = async (req, res) => {
  try {
    const {
      name,
      category,  // category now instead of specialization
      contact_number,
      email,
      clinic_address,
      consultation_fee,
      available_days,
      working_hours,
      tests
    } = req.body;

    // Create new doctor instance
    const newDoctor = new Doctor({
      name,
      category,  // Save category
      contact_number,
      email,
      clinic_address,
      consultation_fee,
      available_days,
      working_hours,
      tests
    });

    // Save doctor to MongoDB
    await newDoctor.save();

    res.status(201).json({
      message: 'Doctor details created successfully',
      doctor: newDoctor
    });
  } catch (error) {
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
