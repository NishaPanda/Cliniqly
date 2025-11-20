// src/components/DoctorList.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';
import Chat from './Chat';
import './doctor.css';

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatModal, setChatModal] = useState({ isOpen: false, doctorId: null, doctorName: '' });

  const fetchDoctors = async () => {
    try {
      // Fetch doctors
      const response = await axios.get(`${API_BASE}/doctors`);
      let doctorsData = response.data;

      // If logged in, fetch unread counts for each doctor
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const chatRes = await axios.get(`${API_BASE}/chat/participants`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const participants = chatRes.data.participants || [];

          doctorsData = doctorsData.map(doc => {
            const participant = participants.find(p => p._id === doc._id);
            return participant ? { ...doc, unreadCount: participant.unreadCount } : doc;
          });
        } catch (chatErr) {
          console.error("Error fetching chat info", chatErr);
        }
      }

      setDoctors(doctorsData);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleOpenChat = (doctorId, doctorName) => {
    if (localStorage.getItem('token')) {
      setChatModal({ isOpen: true, doctorId, doctorName });
    } else {
      // Redirect to login if not authenticated
      window.location.href = '/login';
    }
  };

  const handleCloseChat = () => {
    setChatModal({ isOpen: false, doctorId: null, doctorName: '' });
    fetchDoctors();
  };

  if (loading) return <div className="">Loading doctors...</div>;

  return (
    <div className="doctor-container">
      <h2>Doctors</h2>
      {doctors.map(d => (
        <div key={d._id} className="doctor-card">
          <div className="doctor-info">
            <div>
              <div className="doctor-name">{d.name}</div>
              <div className="doctor-specialty">{d.specialization || d.specialty}</div>
              {d.phoneNumber && <div className="doctor-phone">📞 {d.phoneNumber}</div>}
            </div>
            <div className="button-group">
              {/* Open Chat Modal */}
              <button className="chat-btn" onClick={() => handleOpenChat(d._id, d.name)}>
                Chat
                {d.unreadCount > 0 && <span className="unread-count-badge">{d.unreadCount}</span>}
              </button>
              {/* Navigate to Booking Page */}
              <Link to={localStorage.getItem('token') ? `/book/${d._id}` : '/login'}><button>Book</button></Link>
            </div>
          </div>
        </div>
      ))}

      {/* Chat Modal */}
      <Chat
        isOpen={chatModal.isOpen}
        onClose={handleCloseChat}
        otherUserId={chatModal.doctorId}
        otherUserName={chatModal.doctorName}
      />
    </div>
  );
}
