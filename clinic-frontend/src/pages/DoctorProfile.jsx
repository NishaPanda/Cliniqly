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
           max-width: 700px;
            margin: 40px auto;
            padding: 30px 40px;
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(145deg, #ffffff, #eaf6fc);
            border-radius: 16px;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(4, 86, 193, 0.15);
            color: #004d52;
            animation: fadeIn 0.6s ease-in-out;
        }

         h2 {
          text-align: center;
          color: #0456c1;
          margin-bottom: 25px;
          font-size: 1.9rem;
          letter-spacing: 0.5px;
          text-shadow: 0 1px 2px rgba(4, 86, 193, 0.1);
        }

          .profile-field {
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1rem;
        }
           .profile-field input {
          width: 90%;
          padding: 8px 10px;
          font-size: 1rem;
          border: 1px solid #b3e5fc;
          border-radius: 6px;
          font-family: 'Poppins';
          color: #004d52;
          background: #f0fcff;
        }

        .profile-field strong {
          color: #0456c1;
          font-weight: 600;
          width: 120px;
        }

        .profile-value {
          flex: 1;
          text-align: left;
          color: #071c61ff;
          font-weight: 500;
        }
          

        .edit-input {
          width: 90%;
          padding: 8px 10px;
          font-size: 1rem;
          border: 1px solid #b3e5fc;
          border-radius: 6px;
          font-family: 'Poppins';
          color: #004d52;
          background: #f0fcff;
        }

        .profile-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 15px;
        }

        .profile-buttons button {
          flex: 1;
          max-width: 150px;
          min-width: 120px;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }

        .btn-edit {
          background-color: #26c6da;
          color: white;
        }

        .btn-save {
          background-color: #4caf50;
          color: white;
        }

        .btn-cancel {
          background-color: #f44336;
          color: white;
        }

        .btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        h3 {
          color: #26c6da;
          margin-top: 25px;
          margin-bottom: 15px;
          font-size: 1.3rem;
          border-bottom: 2px solid rgba(38, 198, 218, 0.3);
          padding-bottom: 4px;
          display: inline-block;
        }



        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media screen and (max-width: 768px) {
          .doctor-profile-container {
            padding: 24px;
            margin: 40px 15px;
          }
          h2 {
            font-size: 1.6rem;
            margin-bottom: 20px;
          }
          .profile-field {
            margin-bottom: 12px;
          }
          .profile-buttons {
            gap: 12px;
          }
          .profile-buttons button {
            padding: 9px 16px;
            font-size: 14px;
          }
        }

        @media screen and (max-width: 480px) {
          .doctor-profile-container {
            padding: 20px;
            margin: 35px 10px;
          }
          h2 {
            font-size: 1.5rem;
          }
          .profile-field {
            flex-direction: column;
            align-items: flex-start;
          }
          .profile-field strong {
            margin-bottom: 5px;
          }
          .profile-buttons {
            flex-direction: column;
            gap: 8px;
          }
          .profile-buttons button {
            max-width: none;
            width: 100%;
            min-width: auto;
            padding: 10px 16px;
            font-size: 13px;
          }

        }
      `}</style>

      <div className="doctor-profile-container">
        <h2>Doctor Profile</h2>

        <div className="profile-field">
          <strong>Name:</strong>
          {isEditing ? (
            <input
              type="text"
              name="name"
              className="edit-input"
              value={editData.name}
              onChange={handleChange}
            />
          ) : (
            <span className="profile-value">{user.name || '—'}</span>
          )}
        </div>

        <div className="profile-field">
          <strong>Email:</strong>
          {isEditing ? (
            <input
              type="email"
              name="email"
              className="edit-input"
              value={editData.email}
              onChange={handleChange}
            />
          ) : (
            <span className="profile-value">{user.email || '—'}</span>
          )}
        </div>

        <div className="profile-field">
          <strong>Role:</strong>
          <span className="profile-value">{user.role || 'Doctor'}</span>
        </div>

        <div className="profile-field">
          <strong>Phone Number:</strong>
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
            <span className="profile-value">{user.phoneNumber || '—'}</span>
          )}
        </div>

        <div className="profile-field">
          <strong>Specialization:</strong>
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
            <span className="profile-value">{user.specialization || '—'}</span>
          )}
        </div>

        <div className="profile-field">
          <strong>Clinic Name:</strong>
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
            <span className="profile-value">{user.clinicName || '—'}</span>
          )}
        </div>

        <div className="profile-field">
          <strong>Clinic Address:</strong>
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
            <span className="profile-value">{user.clinicAddress || '—'}</span>
          )}
        </div>

        <div className="profile-field">
          <strong>Doctor ID:</strong>
          {isEditing ? (
            <input
              type="number"
              name="doctorId"
              className="edit-input"
              value={editData.doctorId}
              onChange={handleChange}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              pattern="[0-9]*"
              placeholder="Enter doctor ID"
            />
          ) : (
            <span className="profile-value">{user.doctorId || '—'}</span>
          )}
        </div>

        <div className="profile-buttons">
          {!isEditing ? (
            <button className="btn btn-edit" onClick={handleEdit}>Edit</button>
          ) : (
            <>
              <button className="btn btn-save" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-cancel" onClick={handleCancel}>Cancel</button>
            </>
          )}
        </div>


      </div>
    </div>
  );
}
