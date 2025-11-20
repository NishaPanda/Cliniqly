// routes/doctorRoutes.js
const express = require("express");
const router = express.Router();
const { getMyAppointments, bookAppointment, getDoctors, getAppointmentById, getAppointmentsForDoctor, cancelAppointment, acceptAppointment, rejectAppointment, updateAppointmentStatus } = require("../Controller/appointmentController");
const authMiddleware = require("../Middelware/authMiddleware"); // ensures req.user exists

// Get all doctors
router.get("/doctors", getDoctors);

// Get appointments for logged-in patient (root) - matches frontend fetchAppointments()
router.get("/", authMiddleware, getMyAppointments);

// Book appointment (patient must be logged in)
router.post("/doctors/book/:doctorId", authMiddleware, bookAppointment);

// Get my appointments (patient)
router.get("/appointments/me", authMiddleware, getMyAppointments);

// Get appointment by id
// Get appointments for logged-in doctor
router.get("/doctor/list", authMiddleware, getAppointmentsForDoctor);

// Accept/reject (doctor actions)
router.post('/:id/accept', authMiddleware, acceptAppointment);
router.post('/:id/reject', authMiddleware, rejectAppointment);

// Update status (doctor actions)
router.put('/:id/status', authMiddleware, updateAppointmentStatus);

// Cancel appointment (DELETE)
router.delete("/:id", authMiddleware, cancelAppointment);

// Get appointment by id (param route should be last to avoid shadowing other routes)
router.get("/:id", authMiddleware, getAppointmentById);

module.exports = router;
