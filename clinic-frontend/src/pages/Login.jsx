import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from '../config';
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        `${API_BASE}/auth/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data.user.role !== role) {
        setError(`You selected role "${role}" but account is "${res.data.user.role}"`);
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // ✅ Trigger storage event to update NavBar login state
      window.dispatchEvent(new Event("storage"));

      alert(`Logged in successfully as ${res.data.user.role}`);
      navigate("/");

    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <label>
          Role:
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
        </label>

        <label>
          Email:
          <input
            type="email"
            value={email}
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password:
          <input
            type="password"
            value={password}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button type="submit">Login</button>
      </form>

      <p style={{ marginTop: "15px" }}>
        Don't have an account?{" "}
        <Link to="/register" className="login-link">
          Register
        </Link>
      </p>
    </div>
  );
}
