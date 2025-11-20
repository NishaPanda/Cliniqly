const express = require("express");
const router = express.Router();
const { getDoctors, getDoctorById, bookDoctor } = require("../Controller/doctController");
// const authMiddleware = require("../middleware/authMiddleware"); // protects routes

// Get all doctors
router.get("/", getDoctors);

// Get a single doctor by ID
router.get("/:id", getDoctorById);

// Book a doctor (protected route)
router.post("/book/:doctorId", bookDoctor);

module.exports = router;
