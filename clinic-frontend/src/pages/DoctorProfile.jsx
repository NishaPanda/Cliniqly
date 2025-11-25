import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

export default function DoctorProfile() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Fetch latest profile
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = res.data;
        if (mounted && profile) {
          setUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        }
      } catch (err) {
        console.error(err);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const handleEdit = () => {
    setEditData({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      specialization: user.specialization || '',
      clinicName: user.clinicName || '',
      clinicAddress: user.clinicAddress || '',
      doctorId: user.doctorId || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE}/users/me`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // API may return updated user directly or wrapped in { user: ... }
      const updatedUser = res.data && res.data.user ? res.data.user : res.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // notify other components (NavBar) to refresh their view
      try { window.dispatchEvent(new Event('user-profile-updated')); } catch (e) { /* noop */ }
      setIsEditing(false);
    } catch (err) {
      console.error('Update failed', err);
      alert('Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <style>{`
        .doctor-profile-container {
           max-width: 800px;
            margin: 40px auto;
            padding: 40px;
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(145deg, #ffffff, #eaf6fc);
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(4, 86, 193, 0.15);
            color: #004d52;
            animation: fadeIn 0.6s ease-in-out;
            position: relative;
            overflow: hidden;
        }

        .doctor-profile-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #0456c1, #26c6da);
        }

         h2 {
          text-align: center;
          color: #0456c1;
          margin-bottom: 40px;
          font-size: 2.2rem;
          letter-spacing: -0.5px;
          text-shadow: 0 1px 2px rgba(4, 86, 193, 0.1);
          font-weight: 700;
          position: relative;
          padding-bottom: 15px;
        }

        h2::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 4px;
            background: rgba(4, 86, 193, 0.2);
            border-radius: 2px;
        }

          .profile-field {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        @media (min-width: 768px) {
            .profile-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
            }
            .profile-field {
                margin-bottom: 0;
            }
            .profile-field.full-width {
                grid-column: span 2;
            }
        }

           .profile-field input {
          width: 100%;
          padding: 12px 16px;
          font-size: 1rem;
          border: 2px solid #b3e5fc;
          border-radius: 8px;
          font-family: 'Poppins';
          color: #004d52;
          background: #ffffff;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .profile-field input:focus {
            outline: none;
            border-color: #0456c1;
            box-shadow: 0 0 0 4px rgba(4, 86, 193, 0.1);
        }

        .profile-field strong {
          color: #0456c1;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .profile-value {
          color: #071c61;
          font-weight: 500;
          font-size: 1.1rem;
          padding: 12px 16px;
          background-color: rgba(255, 255, 255, 0.6);
          border-radius: 8px;
          border: 1px solid rgba(4, 86, 193, 0.1);
        }
          

        .edit-input {
          width: 100%;
          padding: 12px 16px;
          font-size: 1rem;
          border: 2px solid #b3e5fc;
          border-radius: 8px;
          font-family: 'Poppins';
          color: #004d52;
          background: #ffffff;
          box-sizing: border-box;
        }

        .profile-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid rgba(4, 86, 193, 0.1);
        }

        .btn {
          padding: 14px 32px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-width: 140px;
        }

        .btn-edit {
          background: linear-gradient(135deg, #0456c1, #26c6da);
          color: white;
          box-shadow: 0 4px 12px rgba(4, 86, 193, 0.2);
        }

        .btn-edit:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(4, 86, 193, 0.3);
          filter: brightness(1.05);
        }

        .btn-save {
          background-color: #4caf50;
          color: white;
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
        }

        .btn-save:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);
          background-color: #43a047;
        }

        .btn-cancel {
          background-color: #f44336;
          color: white;
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.2);
        }

        .btn-cancel:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(244, 67, 54, 0.3);
          background-color: #d32f2f;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media screen and (max-width: 768px) {
          .doctor-profile-container {
            padding: 24px;
            margin: 20px;
          }
          h2 {
            font-size: 1.8rem;
            margin-bottom: 30px;
          }
          .profile-buttons {
            flex-direction: column;
            gap: 12px;
          }
          .btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="doctor-profile-container">
        <h2>Doctor Profile</h2>

        <div className="profile-grid">
          <div className="profile-field">
            <strong>Name</strong>
            {isEditing ? (
              <input
                type="text"
                name="name"
                className="edit-input"
                value={editData.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />
            ) : (
              <div className="profile-value">{user.name || '—'}</div>
            )}
          </div>

          <div className="profile-field">
            <strong>Email</strong>
            {isEditing ? (
              <input
                type="email"
                name="email"
                className="edit-input"
                value={editData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            ) : (
              <div className="profile-value">{user.email || '—'}</div>
            )}
          </div>

          <div className="profile-field">
            <strong>Role</strong>
            <div className="profile-value">{user.role || 'Doctor'}</div>
          </div>

          <div className="profile-field">
            <strong>Phone Number</strong>
            {isEditing ? (
              <input
                type="number"
                name="phoneNumber"
                className="edit-input"
                value={editData.phoneNumber}
                onChange={handleChange}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                pattern="[0-9]*"
                placeholder="Enter phone number"
              />
            ) : (
              <div className="profile-value">{user.phoneNumber || '—'}</div>
            )}
          </div>

          <div className="profile-field">
            <strong>Specialization</strong>
            {isEditing ? (
              <input
                type="text"
                name="specialization"
                className="edit-input"
                value={editData.specialization}
                onChange={handleChange}
                placeholder="Enter specialization"
              />
            ) : (
              <div className="profile-value">{user.specialization || '—'}</div>
            )}
          </div>

          <div className="profile-field">
            <strong>Doctor ID</strong>
            <div className="profile-value">{user.doctorId || '—'}</div>
          </div>

          <div className="profile-field full-width">
            <strong>Clinic Name</strong>
            {isEditing ? (
              <input
                type="text"
                name="clinicName"
                className="edit-input"
                value={editData.clinicName}
                onChange={handleChange}
                placeholder="Enter clinic name"
              />
            ) : (
              <div className="profile-value">{user.clinicName || '—'}</div>
            )}
          </div>

          <div className="profile-field full-width">
            <strong>Clinic Address</strong>
            {isEditing ? (
              <input
                type="text"
                name="clinicAddress"
                className="edit-input"
                value={editData.clinicAddress}
                onChange={handleChange}
                placeholder="Enter clinic address"
              />
            ) : (
              <div className="profile-value">{user.clinicAddress || '—'}</div>
            )}
          </div>
        </div>

        <div className="profile-buttons">
          {!isEditing ? (
            <button className="btn btn-edit" onClick={handleEdit}>Edit Profile</button>
          ) : (
            <>
              <button className="btn btn-save" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn btn-cancel" onClick={handleCancel}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
