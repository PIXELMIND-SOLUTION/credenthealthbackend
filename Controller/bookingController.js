import Booking from '../Models/bookingModel.js';
import Doctor from '../Models/doctorModel.js';
import Staff from '../Models/staffModel.js';

// Controller to handle booking an appointment
export const bookAppointment = async (req, res) => {
    try {
      const { patient_name, category, doctor_id, tests, appointment_date } = req.body;
      const { staffId } = req.params; // Get staffId from URL params
  
      // Find doctor details
      const doctor = await Doctor.findById(doctor_id);
      if (!doctor) {
        return res.status(400).json({ message: 'Doctor not found' });
      }
  
      // Find staff details using staffId
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(400).json({ message: 'Staff not found' });
      }
  
      // Get doctor's available tests
      const doctorTests = doctor.tests;
  
      // Validate selected tests and calculate subtotal using offerPrice if available
      let subtotal = 0;
      const testDetails = [];
  
      for (let testId of tests) {
        const selectedTest = doctorTests.find(test => test._id.toString() === testId);
        if (!selectedTest) {
          return res.status(400).json({ message: `Test with id ${testId} is not valid for this doctor` });
        }
  
        testDetails.push(selectedTest);
  
        // Use offerPrice if available, else fallback to price
        const testPrice = selectedTest.offerPrice || selectedTest.price;
        subtotal += testPrice;
      }
  
      // Doctor's consultation fee
      const consultationFee = doctor.consultation_fee;
  
      // GST calculation (18%)
      const gstOnTests = (subtotal * 18) / 100;
      const gstOnConsultation = (consultationFee * 18) / 100;
  
      // Total amount
      const totalForTests = subtotal + gstOnTests;
      const total = totalForTests + consultationFee + gstOnConsultation;
  
      // Create booking
      const newBooking = new Booking({
        patient_name,
        category,
        doctor: doctor._id,
        tests: testDetails.map(test => test._id),
        subtotal,
        consultation_fee: consultationFee,
        gst_on_tests: gstOnTests,
        gst_on_consultation: gstOnConsultation,
        total,
        appointment_date,
        staff: staff._id
      });
  
      await newBooking.save();
  
      // Add booking to staff's record
      staff.myBookings.push(newBooking._id);
      await staff.save();
  
      // Respond with booking details
      res.status(201).json({
        message: 'Appointment booked successfully',
        booking: {
          patient_name,
          category,
          staff_name: staff.name,
          doctor: doctor.name,
          doctor_specialization: doctor.category,
          clinic_address: doctor.clinic_address,
          consultation_fee: consultationFee,
          tests: testDetails.map(test => ({
            test_name: test.test_name,
            description: test.description,
            price: test.price,
            offerPrice: test.offerPrice || test.price
          })),
          appointment_date,
          subtotal,
          gst_on_tests: gstOnTests,
          gst_on_consultation: gstOnConsultation,
          total,
          status: newBooking.status
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };

  
  // Get all bookings created by a specific staff member
export const getStaffBookings = async (req, res) => {
    try {
      const { staffId } = req.params;
  
      // Find staff and populate their bookings
      const staff = await Staff.findById(staffId)
        .populate({
          path: 'myBookings',
          populate: [
            { path: 'doctor', select: 'name category clinic_address' },
            { path: 'tests' }
          ]
        });
  
      if (!staff) {
        return res.status(404).json({ message: 'Staff not found' });
      }
  
      // If no bookings yet
      if (!staff.myBookings || staff.myBookings.length === 0) {
        return res.status(200).json({ message: 'No bookings found for this staff member', bookings: [] });
      }
  
      res.status(200).json({
        message: 'Bookings fetched successfully',
        staff_name: staff.name,
        total_bookings: staff.myBookings.length,
        bookings: staff.myBookings.map(booking => ({
          patient_name: booking.patient_name,
          category: booking.category,
          doctor: {
            name: booking.doctor.name,
            specialization: booking.doctor.category,
            clinic_address: booking.doctor.clinic_address
          },
          tests: booking.tests.map(test => ({
            test_name: test.test_name,
            price: test.price,
            offerPrice: test.offerPrice || test.price
          })),
          consultation_fee: booking.consultation_fee,
          appointment_date: booking.appointment_date,
          subtotal: booking.subtotal,
          gst_on_tests: booking.gst_on_tests,
          gst_on_consultation: booking.gst_on_consultation,
          total: booking.total,
          status: booking.status
        }))
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };
  
