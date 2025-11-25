const User = require("../Models/Users");
const Testimonial = require("../Models/Testimonial");

exports.getAllTestimonials = async (req, res) => {
  try {
    const { doctorId } = req.query;
    let query = {};

    if (doctorId) {
      // If doctorId is provided, filter by doctor and only show top ratings (4 or 5)
      query = { doctor: doctorId, rating: { $gte: 4 } };
    }

    const testimonials = await Testimonial.find(query)
      .populate('patient', 'name email')
      .sort({ rating: -1, createdAt: -1 }) // Sort by rating first, then date
      .lean();
    res.status(200).json(testimonials);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.createTestimonial = async (req, res) => {
  try {
    const { rating, feedback, doctorId, appointmentId } = req.body;
    const patientId = req.user.id;

    if (!rating || !feedback || !doctorId) {
      return res.status(400).json({ message: "Rating, feedback and doctorId are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check if feedback already exists for this appointment
    if (appointmentId) {
      const existing = await Testimonial.findOne({ appointmentId });
      if (existing) {
        return res.status(400).json({ message: "Feedback already given for this appointment" });
      }
    }

    const testimonial = new Testimonial({
      patient: patientId,
      doctor: doctorId,
      appointmentId,
      patientName: patient.name,
      rating,
      feedback,
      verified: true
    });

    await testimonial.save();
    res.status(201).json({ message: "Testimonial created successfully", testimonial });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
