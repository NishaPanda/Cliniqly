const User = require("../Models/Users");
const Appointment = require("../Models/Appointment");

// Fetch all doctors
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }).select("-password");
    res.status(200).json(doctors);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Fetch a single doctor by ID
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await User.findById(id).select("-password");

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json(doctor);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Book an appointment with a doctor
exports.bookDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const patientId = req.user.id; // assuming you have auth middleware and req.user

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Create appointment
    const appointment = new Appointment({
      doctor: doctorId,
      doctorId: doctorId,
      patient: patientId,
    });

    await appointment.save();

    // Link appointment to patient document
    try {
      await User.findByIdAndUpdate(patientId, { $push: { appointments: appointment._id } });
    } catch (uErr) {
      console.error('Failed to update patient appointments', uErr);
    }

    res.status(201).json({ message: "Appointment booked successfully", appointment });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
