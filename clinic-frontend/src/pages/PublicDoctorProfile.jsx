import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';
import './PublicDoctorProfile.css';

export default function PublicDoctorProfile() {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDoctorProfile = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_BASE}/doctors/${doctorId}`);
                setDoctor(response.data);
            } catch (err) {
                console.error('Error fetching doctor profile:', err);
                setError('Failed to load doctor profile');
            } finally {
                setLoading(false);
            }
        };

        if (doctorId) {
            fetchDoctorProfile();
        }
    }, [doctorId]);

    if (loading) {
        return (
            <div className="public-doctor-profile-container">
                <div className="loading-state">Loading doctor profile...</div>
            </div>
        );
    }

    if (error || !doctor) {
        return (
            <div className="public-doctor-profile-container">
                <div className="error-state">
                    <h2>Doctor Not Found</h2>
                    <p>{error || 'The doctor profile you are looking for does not exist.'}</p>
                    <button onClick={() => navigate('/doctors')}>Back to Doctors</button>
                </div>
            </div>
        );
    }

    return (
        <div className="public-doctor-profile-container">
            <div className="profile-header">
                <button className="back-button" onClick={() => navigate('/doctors')}>
                    ← Back to Doctors
                </button>
                <h1>Doctor Profile</h1>
            </div>

            <div className="doctor-profile-card">
                <div className="doctor-avatar">
                    {doctor.name.charAt(0).toUpperCase()}
                </div>

                <div className="doctor-details">
                    <h2 className="doctor-name">{doctor.name}</h2>

                    {doctor.specialization && (
                        <div className="detail-row">
                            <span className="detail-label">Specialization:</span>
                            <span className="detail-value">{doctor.specialization}</span>
                        </div>
                    )}

                    {doctor.doctorId && (
                        <div className="detail-row">
                            <span className="detail-label">Doctor ID:</span>
                            <span className="detail-value">{doctor.doctorId}</span>
                        </div>
                    )}

                    {doctor.phoneNumber && (
                        <div className="detail-row">
                            <span className="detail-label">Phone:</span>
                            <span className="detail-value">
                                <a href={`tel:${doctor.phoneNumber}`} className="phone-link">
                                    📞 {doctor.phoneNumber}
                                </a>
                            </span>
                        </div>
                    )}

                    {doctor.email && (
                        <div className="detail-row">
                            <span className="detail-label">Email:</span>
                            <span className="detail-value">
                                <a href={`mailto:${doctor.email}`} className="email-link">
                                    ✉️ {doctor.email}
                                </a>
                            </span>
                        </div>
                    )}

                    {doctor.clinicName && (
                        <div className="detail-row">
                            <span className="detail-label">Clinic:</span>
                            <span className="detail-value">{doctor.clinicName}</span>
                        </div>
                    )}

                    {doctor.clinicAddress && (
                        <div className="detail-row">
                            <span className="detail-label">Address:</span>
                            <span className="detail-value">{doctor.clinicAddress}</span>
                        </div>
                    )}
                </div>

                <div className="action-buttons">
                    <Link to={localStorage.getItem('token') ? `/book/${doctor._id}` : '/login'}>
                        <button className="book-button">Book Appointment</button>
                    </Link>
                    <button
                        className="back-to-list-button"
                        onClick={() => navigate('/doctors')}
                    >
                        View All Doctors
                    </button>
                </div>
            </div>
        </div>
    );
}
