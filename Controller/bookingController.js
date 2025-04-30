import Booking from '../Models/bookingModel.js';
import Doctor from '../Models/doctorModel.js';
import Staff from '../Models/staffModel.js';
import Diagnostic from '../Models/diagnosticModel.js';

// export const bookAppointment = async (req, res) => {
//   try {
//     const {
//       patient_name,
//       diagnosticId,
//       tests,
//       appointment_date,
//       appointment_time,
//       gender,
//       age,
//       staffId, // staffId could be a name in the frontend
//       name, // If staff name is provided instead of staffId
//     } = req.body;

//     // 1. Find diagnostic center details
//     const diagnostic = await Diagnostic.findById(diagnosticId);
//     if (!diagnostic) {
//       return res.status(400).json({ message: 'Diagnostic center not found' });
//     }

//     // 2. Find staff details (either by staffId or by name)
//     let staff;

//     if (staffId) {
//       staff = await Staff.findById(staffId);  // Find staff by staffId (ObjectId)
//     }

//     // If staffId is not provided, find staff by name (if name is provided)
//     if (!staff && name) {
//       staff = await Staff.findOne({ name: name });  // Find staff by name
//     }

//     if (!staff) {
//       return res.status(400).json({ message: 'Staff not found' });
//     }

//     // 3. Get diagnostic center's available tests
//     const diagnosticTests = diagnostic.tests;

//     // 4. Validate selected tests and calculate subtotal using offerPrice if available
//     let subtotal = 0;
//     const testDetails = [];

//     for (let testId of tests) {
//       const selectedTest = diagnosticTests.find(test => test._id.toString() === testId);
//       if (!selectedTest) {
//         return res.status(400).json({ message: `Test with id ${testId} is not valid for this diagnostic center` });
//       }

//       testDetails.push(selectedTest);

//       // Use offerPrice if available, else fallback to price
//       const testPrice = selectedTest.offerPrice || selectedTest.price;
//       subtotal += testPrice;
//     }

//     // Assuming consultation fee is part of diagnostic center's service (if applicable)
//     const consultationFee = diagnostic.consultation_fee || 0;  // Default to 0 if no consultation fee

//     // 5. GST calculation (18%)
//     const gstOnTests = (subtotal * 18) / 100;
//     const gstOnConsultation = (consultationFee * 18) / 100;

//     // 6. Total amount
//     const totalForTests = subtotal + gstOnTests;
//     const total = totalForTests + consultationFee + gstOnConsultation;

//     // 7. Create the booking and save it
//     const newBooking = new Booking({
//       patient_name,
//       diagnostic: diagnostic._id,
//       tests: testDetails.map(test => test._id),
//       subtotal,
//       consultation_fee: consultationFee,
//       gst_on_tests: gstOnTests,
//       gst_on_consultation: gstOnConsultation,
//       total,
//       appointment_date,
//       staff: staff._id,  // Save staff reference (staffId)
//       gender,  // Save gender
//       age      // Save age
//     });

//     await newBooking.save();

//     // 8. Add booking to staff's record
//     staff.myBookings.push(newBooking._id);
//     await staff.save();

//     // 9. Respond with booking details and bookingId for payment
//     res.status(201).json({
//       message: 'Appointment booked successfully',
//       bookingId: newBooking._id,  // Provide the booking ID in the response
//       total, // Send the total amount to be paid
//       booking: {
//         patient_name,
//         staff_name: staff.name, // Include staff name
//         diagnostic_name: diagnostic.name,
//         diagnostic_image: diagnostic.image,
//         diagnostic_address: diagnostic.address,
//         consultation_fee: consultationFee,
//         tests: testDetails.map(test => ({
//           testId: test._id, // ✅ Added testId
//           test_name: test.test_name,
//           description: test.description,
//           price: test.price,
//           offerPrice: test.offerPrice || test.price,
//           image: test.image // Include test image as well
//         })),
//         appointment_date,
//         gender, // Include gender in the response
//         age,    // Include age in the response
//         subtotal,
//         gst_on_tests: gstOnTests,
//         gst_on_consultation: gstOnConsultation,
//         total,
//         status: newBooking.status
//       }
//     });
//   } catch (error) {
//     console.error('Error during appointment booking:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

export const bookAppointment = async (req, res) => {
  try {
    const {
      patient_name,
      diagnosticId,
      tests,
      appointment_date,
      appointment_time,
      gender,
      age,
      staffId,
      name,
      packageId // ✅ Added packageId
    } = req.body;

    // 1. Find diagnostic
    const diagnostic = await Diagnostic.findById(diagnosticId);
    if (!diagnostic) {
      return res.status(400).json({ message: 'Diagnostic center not found' });
    }

    // 2. Find staff by ID or name
    let staff;
    if (staffId) {
      staff = await Staff.findById(staffId);
    }
    if (!staff && name) {
      staff = await Staff.findOne({ name });
    }
    if (!staff) {
      return res.status(400).json({ message: 'Staff not found' });
    }

    let testDetails = [];
    let subtotal = 0;
    let packageUsed = null;
    let packageName = null; // Variable to store the package name

    // 3. Handle package booking
    if (packageId) {
      const selectedPackage = diagnostic.packages.id(packageId);
      if (!selectedPackage) {
        return res.status(400).json({ message: 'Invalid packageId for this diagnostic center' });
      }

      // Save tests from the package
      testDetails = selectedPackage.tests;
      subtotal = selectedPackage.offerPrice || selectedPackage.price || 0;
      packageUsed = selectedPackage._id;
      packageName = selectedPackage.packageName; // Get the package name
    }

    // 4. Handle test-based booking
    else if (Array.isArray(tests) && tests.length > 0) {
      const diagnosticTests = diagnostic.tests;

      for (let testId of tests) {
        const selectedTest = diagnosticTests.find(test => test._id.toString() === testId);
        if (!selectedTest) {
          return res.status(400).json({ message: `Test with id ${testId} is not valid for this diagnostic center` });
        }

        testDetails.push(selectedTest);
        const testPrice = selectedTest.offerPrice || selectedTest.price;
        subtotal += testPrice;
      }
    } else {
      return res.status(400).json({ message: 'Either tests[] or packageId is required' });
    }

    // 5. Fees and tax calculations
    const consultationFee = diagnostic.consultation_fee || 0;
    const gstOnTests = (subtotal * 18) / 100;
    const gstOnConsultation = (consultationFee * 18) / 100;
    const total = subtotal + gstOnTests + consultationFee + gstOnConsultation;

    // 6. Save booking
    const newBooking = new Booking({
      patient_name,
      diagnostic: diagnostic._id,
      tests: testDetails.map(test => test._id),
      packageId: packageUsed, // ✅ Save packageId if used
      subtotal,
      consultation_fee: consultationFee,
      gst_on_tests: gstOnTests,
      gst_on_consultation: gstOnConsultation,
      total,
      appointment_date,
      appointment_time,
      staff: staff._id,
      gender,
      age
    });

    await newBooking.save();

    // 7. Update staff's bookings
    staff.myBookings.push(newBooking._id);
    await staff.save();

    // 8. Respond
    res.status(201).json({
      message: 'Appointment booked successfully',
      bookingId: newBooking._id,
      total,
      booking: {
        patient_name,
        staff_name: staff.name,
        diagnostic_name: diagnostic.name,
        diagnostic_image: diagnostic.image,
        diagnostic_address: diagnostic.address,
        consultation_fee: consultationFee,
        packageId: packageUsed, // ✅ Save packageId if used
        packageName: packageName, // Include packageName in the response
        tests: testDetails.map(test => ({
          testId: test._id,
          test_name: test.test_name,
          description: test.description,
          price: test.price,
          offerPrice: test.offerPrice || test.price,
          image: test.image
        })),
        appointment_date,
        appointment_time,
        gender,
        age,
        subtotal,
        gst_on_tests: gstOnTests,
        gst_on_consultation: gstOnConsultation,
        total,
        status: newBooking.status
      }
    });
  } catch (error) {
    console.error('Error during appointment booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




 // Controller to handle payment for the booking and deduct from staff wallet
export const processPayment = async (req, res) => {
  try {
    const { bookingId, staffId } = req.params; // Get bookingId and staffId from URL params

    // 1. Find the booking and populate diagnostic + staff
    const booking = await Booking.findById(bookingId)
      .populate('diagnostic')
      .populate('staff');

    if (!booking) {
      return res.status(400).json({ message: 'Booking not found' });
    }

    // 2. Find the staff details using staffId
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(400).json({ message: 'Staff not found' });
    }

    // 3. Check if the staff has enough balance
    if (staff.wallet_balance < booking.total) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // 🪵 Log the diagnostic for confirmation
    console.log('Diagnostic Info:', booking.diagnostic);

    // 4. Deduct the amount from the wallet
    staff.wallet_balance -= booking.total;

    // 5. Add transaction to wallet_logs
    const transaction = {
      type: 'debit',
      amount: booking.total,
      from: 'Staff Wallet',
      to: booking.diagnostic?.name || 'Diagnostic Center',
      date: new Date(),
    };
    staff.wallet_logs.push(transaction);

    await staff.save();

    // 6. Update booking status
    booking.status = 'Paid';
    await booking.save();

    // 7. Send response
    res.status(200).json({
      message: 'Payment successful',
      bookingId: booking._id,
      staff_name: staff.name,
      diagnostic_name: booking.diagnostic?.name || 'Diagnostic Center',
      total_paid: booking.total,
      status: booking.status,
      wallet_balance: staff.wallet_balance,
    });

  } catch (error) {
    console.error('Error during payment processing:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




  
export const getBookingDetails = async (req, res) => {
  try {
    const { bookingId, staffId } = req.params;  // Get bookingId and staffId from URL params

    // 1. Find the booking details and populate necessary fields
    const booking = await Booking.findById(bookingId)
      .populate('staff')             // Populate staff details
      .populate('diagnostic')        // Populate diagnostic center details
      .populate({
        path: 'diagnostic.tests',    // Populate the embedded tests within the diagnostic center
        select: 'test_name price offerPrice description image' // Select relevant fields
      })
      .populate({
        path: 'diagnostic.packages', // Populate the embedded packages
        select: 'packageName price offerPrice tests', // Include relevant fields from packages
        populate: {
          path: 'tests',  // Populate tests inside the package
          select: 'test_name description image price offerPrice' // Include necessary fields from tests inside packages
        }
      });

    if (!booking) {
      return res.status(400).json({ message: 'Booking not found' });
    }

    // 2. Find the staff details using staffId
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(400).json({ message: 'Staff not found' });
    }

    // 3. Check if the staff is associated with the booking
    if (booking.staff._id.toString() !== staff._id.toString()) {
      return res.status(403).json({ message: 'Staff does not have access to this booking' });
    }

    // 4. Prepare the response data
    const bookingDetails = {
      bookingId: booking._id,
      patient_name: booking.patient_name,
      staff_name: booking.staff.name,
      diagnostic_name: booking.diagnostic.name,
      diagnostic_image: booking.diagnostic.image,
      diagnostic_address: booking.diagnostic.address,
      consultation_fee: booking.consultation_fee,
      tests: booking.diagnostic.tests.map(test => ({
        test_name: test.test_name,
        price: test.price,
        offerPrice: test.offerPrice || test.price,
        description: test.description,
        image: test.image
      })),
      packages: booking.diagnostic.packages.map(pkg => ({
        packageName: pkg.packageName,
        price: pkg.price,
        offerPrice: pkg.offerPrice || pkg.price,
        tests: pkg.tests.map(test => ({
          test_name: test.test_name,
          price: test.price,
          offerPrice: test.offerPrice || test.price,
          description: test.description,
          image: test.image
        }))
      })),
      appointment_date: booking.appointment_date,
      gender: booking.gender,
      age: booking.age,
      subtotal: booking.subtotal,
      gst_on_tests: booking.gst_on_tests,
      gst_on_consultation: booking.gst_on_consultation,
      total: booking.total,
      status: booking.status
    };

    // 5. Send response with booking details
    res.status(200).json({
      message: 'Booking details fetched successfully',
      booking: bookingDetails
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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


  export const removeTestFromBooking = async (req, res) => {
    try {
      const { staffId } = req.params;
      const { bookingId, testId, packageId } = req.body;  // Added packageId for removal
  
      // 1. Find booking and populate only diagnostic and staff
      const booking = await Booking.findById(bookingId)
        .populate('diagnostic')
        .populate('staff');
  
      if (!booking) {
        return res.status(400).json({ message: 'Booking not found' });
      }
  
      if (!booking.staff || booking.staff._id.toString() !== staffId) {
        return res.status(403).json({ message: 'Staff does not have access to this booking' });
      }
  
      const diagnostic = booking.diagnostic;
      const diagnosticTests = diagnostic.tests;
  
      // 2. Handle package removal if packageId is provided
      if (packageId) {
        const selectedPackage = diagnostic.packages.id(packageId);
        if (!selectedPackage) {
          return res.status(400).json({ message: 'Invalid packageId for this diagnostic center' });
        }
  
        // Remove the package from the booking
        booking.tests = booking.tests.filter(testId => !selectedPackage.tests.some(test => test._id.toString() === testId.toString()));
  
        // Recalculate the subtotal, GST, and total after removing the package tests
        let subtotal = 0;
        for (let testId of booking.tests) {
          const test = diagnosticTests.find(test => test._id.toString() === testId.toString());
          if (test) {
            const price = test.offerPrice || test.price;
            subtotal += price || 0;
          }
        }
  
        const gst_on_tests = (subtotal * 18) / 100;
        const consultation_fee = diagnostic.consultation_fee || 0;
        const gst_on_consultation = (consultation_fee * 18) / 100;
        const total = subtotal + gst_on_tests + consultation_fee + gst_on_consultation;
  
        // Save updated booking with removed package tests
        booking.subtotal = subtotal;
        booking.gst_on_tests = gst_on_tests;
        booking.consultation_fee = consultation_fee;
        booking.gst_on_consultation = gst_on_consultation;
        booking.total = total;
  
        await booking.save();
  
        // Send response with updated booking
        return res.status(200).json({
          message: 'Package removed and booking updated successfully',
          bookingId: booking._id,
          booking: {
            patient_name: booking.patient_name,
            staff_name: booking.staff.name,
            diagnostic_name: diagnostic.name,
            diagnostic_image: diagnostic.image,
            diagnostic_address: diagnostic.address,
            consultation_fee,
            tests: booking.tests.map(testId => {
              const test = diagnosticTests.find(test => test._id.toString() === testId.toString());
              return {
                testId: test._id,
                test_name: test.test_name,
                description: test.description,
                price: test.price,
                offerPrice: test.offerPrice || test.price,
                image: test.image
              };
            }),
            appointment_date: booking.appointment_date,
            gender: booking.gender,
            age: booking.age,
            subtotal,
            gst_on_tests,
            gst_on_consultation,
            total,
            status: booking.status
          }
        });
      }
  
      // 3. Handle individual test removal if no packageId is provided
      if (testId) {
        // Filter out the removed test
        const updatedTestIds = booking.tests.filter(id => id.toString() !== testId);
  
        if (updatedTestIds.length === booking.tests.length) {
          return res.status(400).json({ message: 'Test not found in the booking' });
        }
  
        // Get the full test details from Diagnostic.tests using updated IDs
        const updatedTestDetails = diagnosticTests.filter(test =>
          updatedTestIds.some(id => id.toString() === test._id.toString())
        );
  
        // Recalculate subtotal
        let subtotal = 0;
        for (let test of updatedTestDetails) {
          const price = test.offerPrice || test.price;
          subtotal += price || 0;
        }
  
        const gst_on_tests = (subtotal * 18) / 100;
        const consultation_fee = diagnostic.consultation_fee || 0;
        const gst_on_consultation = (consultation_fee * 18) / 100;
        const total = subtotal + gst_on_tests + consultation_fee + gst_on_consultation;
  
        // Save updated booking
        booking.tests = updatedTestIds;
        booking.subtotal = subtotal;
        booking.gst_on_tests = gst_on_tests;
        booking.consultation_fee = consultation_fee;
        booking.gst_on_consultation = gst_on_consultation;
        booking.total = total;
  
        await booking.save();
  
        // Send response
        res.status(200).json({
          message: 'Test removed and booking updated successfully',
          bookingId: booking._id,
          booking: {
            patient_name: booking.patient_name,
            staff_name: booking.staff.name,
            diagnostic_name: diagnostic.name,
            diagnostic_image: diagnostic.image,
            diagnostic_address: diagnostic.address,
            consultation_fee,
            tests: updatedTestDetails.map(test => ({
              testId: test._id,
              test_name: test.test_name,
              description: test.description,
              price: test.price,
              offerPrice: test.offerPrice || test.price,
              image: test.image
            })),
            appointment_date: booking.appointment_date,
            gender: booking.gender,
            age: booking.age,
            subtotal,
            gst_on_tests,
            gst_on_consultation,
            total,
            status: booking.status
          }
        });
      }
  
      // If no testId or packageId is provided in the request, return an error
      return res.status(400).json({ message: 'Either testId or packageId is required' });
  
    } catch (error) {
      console.error('Error removing test from booking:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  





  
  
  
  
  
