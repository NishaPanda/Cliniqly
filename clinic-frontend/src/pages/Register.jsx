import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from '../config';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const data = {
      name,
      email,
      password,
      role,
      specialization: role === "doctor" ? specialization : undefined,
      phoneNumber: role === "doctor" ? phoneNumber : undefined,
      clinicName: role === "doctor" ? clinicName : undefined,
      clinicAddress: role === "doctor" ? clinicAddress : undefined,
      doctorId: role === "doctor" ? doctorId : undefined,
      age: role === "patient" ? age : undefined,
      gender: role === "patient" ? gender : undefined
    };

    try {
      const res = await axios.post(`${API_BASE}/auth/register`, data, {
        headers: { "Content-Type": "application/json" }
      });

      alert(`Registered successfully as ${res.data.user.role}`);
      // Auto-login if token and user are returned
      if (res.data && res.data.token && res.data.user) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        // trigger storage event so NavBar updates
        window.dispatchEvent(new Event('storage'));
        navigate("/");
      } else {
        // Fallback: redirect to login
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister} className="register-form">
        <label>
          Role:
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
        </label>

        <label>
          Name:
          <input type="text" value={name} placeholder="Enter your name" onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Email:
          <input type="email" value={email} placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label>
          Password:
          <input type="password" value={password} placeholder="Enter your password" onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {role === "doctor" && (
          <>
            <label>
              Specialization:
              <input type="text" value={specialization} placeholder="Enter your specialization" onChange={(e) => setSpecialization(e.target.value)} required />
            </label>

            <label>
              Phone Number (Optional):
              <input
                type="number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                pattern="[0-9]*"
                placeholder="Enter phone number"
              />
            </label>

            <label>
              Clinic Name:
              <input type="text" value={clinicName} placeholder="Enter your clinic name" onChange={(e) => setClinicName(e.target.value)} required />
            </label>

            <label>
              Clinic Address:
              <input type="text" value={clinicAddress} placeholder="Enter your clinic address" onChange={(e) => setClinicAddress(e.target.value)} required />
            </label>

            <label>
              Doctor ID:
              <input
                type="number"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                pattern="[0-9]*"
                required
                placeholder="Enter doctor ID"
              />
            </label>
          </>
        )}

        {role === "patient" && (
          <div className="register-row">
            <label>
              Age:
              <input type="number" value={age} placeholder="Enter your age" onChange={(e) => setAge(e.target.value)} required />
            </label>
            <label>
              Gender:
              <select value={gender} onChange={(e) => setGender(e.target.value)} required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
        )}

        {error && <p className="register-error">{error}</p>}

        <button type="submit">Register</button>
      </form>

      <p style={{ marginTop: "15px" }}>
        Already have an account? <Link to="/login" className="register-link">Login</Link>
      </p>
    </div>
  );
}
