// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Testimonials from '../components/Testimonials';
import './Home.css';

export default function Home() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <div className="home-container">
      <div className="home-card">
        <h2>Welcome to Cliniqly</h2>
        <p className="small">
          Book doctor visits, view appointments and get receipts.
        </p>
        <div style={{marginTop: 12}}>
          {user && user.role && String(user.role).toLowerCase() === 'doctor' ? (
            <Link to="/patients"><button>My Patients</button></Link>
          ) : (
            <Link to="/doctors"><button>Find doctors</button></Link>
          )}
        </div>
      </div>

      <div className="home-card">
        <h2>Book Appointments. Save Time. Stay Healthy.</h2>
        <h5>What we offer?</h5>
        <p className="medium">
          Manage your healthcare appointments with ease. Patients can book doctors, track appointments, chat in real time, and receive instant digital receipts. Doctors can manage schedules, monitor visits, reply through the chat system, and view real-time patient feedback—ensuring smooth clinic operations, reduced waiting time, and an improved overall experience.
        </p>
      </div>

      <Testimonials />

      <footer className="home-footer">
        <p className="footer-email">
          <a href="mailto:support@cliniqly.com">support@cliniqly.com</a>
        </p>
        <p className="footer-copyright">© 2025 Cliniqly. All rights reserved.</p>
      </footer>
    </div>
  );
}
