import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';
import { fetchDoctorTestimonials } from '../api';
import './PublicDoctorProfile.css';
import Testimonials from '../components/Testimonials';

export default function PublicDoctorProfile() {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDoctorProfile = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_BASE}/doctors/${doctorId}`);
                setDoctor(response.data);

                const tests = await fetchDoctorTestimonials(doctorId);
                setTestimonials(tests || []);
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

    // Carousel State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(1);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [isPaused, setIsPaused] = useState(false);

    // Responsive Carousel
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setItemsPerPage(3);
            } else if (window.innerWidth >= 768) {
                setItemsPerPage(2);
            } else {
                setItemsPerPage(1);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const maxIndex = Math.max(0, testimonials.length - itemsPerPage);

    // Ensure currentIndex is valid when itemsPerPage changes
    useEffect(() => {
        if (currentIndex > maxIndex) {
            setCurrentIndex(maxIndex);
        }
    }, [itemsPerPage, maxIndex, currentIndex]);

    const nextSlide = () => {
        setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
    };

    // Auto-slide
    useEffect(() => {
        if (!isPaused && testimonials.length > itemsPerPage) {
            const interval = setInterval(() => {
                nextSlide();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [currentIndex, isPaused, testimonials.length, itemsPerPage, maxIndex]);

    // Touch handlers
    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
        setIsPaused(true);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && currentIndex < maxIndex) {
            nextSlide();
        } else if (isRightSwipe && currentIndex > 0) {
            prevSlide();
        } else if (isLeftSwipe && currentIndex === maxIndex) {
            setCurrentIndex(0); // Loop to start
        } else if (isRightSwipe && currentIndex === 0) {
            setCurrentIndex(maxIndex); // Loop to end
        }

        setTouchStart(null);
        setTouchEnd(null);
        setIsPaused(false);
    };

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

            {testimonials.length > 0 && (
                <div className="doctor-testimonials-section">
                    <h2>Patient Testimonials</h2>

                    <div
                        className="carousel-container"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {testimonials.length > itemsPerPage && (
                            <button className="carousel-arrow carousel-arrow-prev" onClick={prevSlide} aria-label="Previous slide">
                                &#8249;
                            </button>
                        )}

                        <div className="carousel-viewport">
                            <div
                                className="carousel-track"
                                style={{
                                    transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
                                }}
                            >
                                {testimonials.map((t) => (
                                    <div
                                        key={t._id}
                                        className="testimonial-card-wrapper"
                                        style={{ flex: `0 0 ${100 / itemsPerPage}%` }}
                                    >
                                        <div className="testimonial-card">
                                            <div className="testimonial-header">
                                                <span className="patient-name">{t.patientName}</span>
                                                <div className="star-rating-display">
                                                    {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                                                </div>
                                            </div>
                                            <p className="testimonial-text">"{t.feedback}"</p>
                                            <span className="testimonial-date">
                                                {new Date(t.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {testimonials.length > itemsPerPage && (
                            <button className="carousel-arrow carousel-arrow-next" onClick={nextSlide} aria-label="Next slide">
                                &#8250;
                            </button>
                        )}
                    </div>

                    {/* Dots Indicator */}
                    {testimonials.length > itemsPerPage && (
                        <div className="carousel-dots">
                            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`dot ${idx === currentIndex ? 'active' : ''}`}
                                    onClick={() => setCurrentIndex(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
