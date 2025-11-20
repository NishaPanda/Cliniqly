const User = require("../Models/Users");
const Testimonial = require("../Models/Testimonial");

exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find()
      .populate('patient', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(testimonials);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.createTestimonial = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const patientId = req.user.id;

    if (!rating || !feedback) {
      return res.status(400).json({ message: "Rating and feedback are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const testimonial = new Testimonial({
      patient: patientId,
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
