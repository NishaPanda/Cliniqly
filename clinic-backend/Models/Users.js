const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true },
  password: { 
    type: String, 
    required: true },
  role: { 
    type: String, 
    enum: ["doctor", "patient"], 
    required: true },
  specialization: { 
    type: String },  // optional for doctors
  phoneNumber: { 
    type: String },  // optional phone number for doctors
  age: { 
    type: Number },             // optional for patients
  gender: { 
    type: String }           // optional for patients
  ,
  appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }]
}, { timestamps: true });


// module.exports = mongoose.model("User", userSchema);
const User = mongoose.model("User", userSchema);
module.exports = User;