// models/Appointment.js
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String },
    reason: { type: String },
    doctorName: { type: String },
    doctorId: { type: mongoose.Schema.Types.ObjectId, required: true }, // optional duplicate for easier querying
    date: { type: Date, required: true },
    time: { type: String }, // store time as string for simplicity
    status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled", "rejected", "no-show"], default: "pending" },
    confirmedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
