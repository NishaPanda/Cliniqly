import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

export default function PatientProfile() {
  const [storedUser, setStoredUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
  });
  const [name, setName] = useState(storedUser.name || '');
  const [email, setEmail] = useState(storedUser.email || '');
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        const res = await axios.get(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = res.data;
        if (user && mounted) {
          setStoredUser(user);
          setName(user.name || '');
          setEmail(user.email || '');
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (err) {
        // If fetch fails (not logged in or backend not ready), fall back to localStorage
        console.warn('fetchProfile (axios) failed — falling back to localStorage', err.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const payload = { name, email };
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const res = await axios.put(`${API_BASE}/users/me`, payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const updatedUser = res.data && res.data.user ? res.data.user : res.data;
      setStoredUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-profile-updated'));
      setMessage('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error('updateProfile (axios) failed', err);
      const msg = err.response?.data?.message || err.message || 'Update failed';
      setMessage(msg);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <style>
        {`
          .profile-container {
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

          p {
            text-align: center;
            margin-top: 25px;
            font-size: 0.95rem;
            color: #26c6da;
            opacity: 0.9;
          }
          .profile-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 15px;
        }

        .profile-actions button {
          flex: 1;
          max-width: 150px;
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
        .btn-update {
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

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @media screen and (max-width: 480px) {
            .profile-container {
              padding: 20px;
              margin: 40px 10px;
            }
            h2{
              font-size: 1.5rem;
            }
            .profile-actions {
              flex-direction: column;
            }
            .profile-actions button {
              max-width: none;
              width: 100%;
            }
            
            .profile-field {
              flex-direction: column;
              align-items: flex-start;
            }
            .profile-field strong {
              margin-bottom: 5px;
            }
          }
        `}
      </style>

      <div className="profile-container">
        <h2>Patient Profile</h2>

        <div className="profile-field">
          <strong>Name:</strong>
          {editing ? (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          ) : (
            <span className="profile-value">{name || '—'}</span>
          )}
        </div>

        <div className="profile-field">
          <strong>Email:</strong>
          {editing ? (
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          ) : (
            <span className="profile-value">{email || '—'}</span>
          )}
        </div>

        <div className="profile-field">
          <strong>Role:</strong>
          <span className="profile-value">{storedUser.role || 'Patient'}</span>
        </div>

        <div className="profile-actions" style={{ textAlign: 'center', marginTop: 20 }}>
          {editing ? (
            <>
              <button className="btn btn-update" onClick={handleUpdate}>Update</button>
              <button className='btn btn-cancel' onClick={() => { 
                setEditing(false); 
                setName(storedUser.name || ''); 
                setEmail(storedUser.email || ''); 
              }}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-edit" onClick={() => setEditing(true)}>Edit</button>
          )}
        </div>

        <div 
          className="profile-message" 
          style={{ textAlign: 'center', color: '#26c6da', marginTop: 18, fontSize: '1rem', minHeight: 24 }}
        >
          {message}
        </div>
      </div>
    </div>
  );
}
