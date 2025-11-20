const User = require("../Models/Users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password, role, specialization, phoneNumber, clinicName, clinicAddress, doctorId, age, gender } = req.body;

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check if doctorId already exists (for doctors only)
    if (role === "doctor" && doctorId) {
      const existingDoctor = await User.findOne({ doctorId });
      if (existingDoctor) {
        return res.status(400).json({ message: "Doctor ID already exists. Please use a unique Doctor ID." });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user instance
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      specialization: role === "doctor" ? specialization : undefined,
      phoneNumber: role === "doctor" ? phoneNumber : undefined,
      clinicName: role === "doctor" ? clinicName : undefined,
      clinicAddress: role === "doctor" ? clinicAddress : undefined,
      doctorId: role === "doctor" ? doctorId : undefined,
      age: role === "patient" ? age : undefined,
      gender: role === "patient" ? gender : undefined
    });

    // Save user
    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
        specialization: user.specialization,
        phoneNumber: user.phoneNumber,
        clinicName: user.clinicName,
        clinicAddress: user.clinicAddress,
        doctorId: user.doctorId,
        age: user.age,
        gender: user.gender
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        phoneNumber: user.phoneNumber,
        clinicName: user.clinicName,
        clinicAddress: user.clinicAddress,
        doctorId: user.doctorId,
        age: user.age,
        gender: user.gender
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
    console.log(err);
  }
};
