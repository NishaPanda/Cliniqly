import React, { useState, useEffect, useRef } from 'react';
import { fetchTestimonials, createTestimonial } from '../api';
import './testimonials.css';

export default function Testimonials() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isPatient = user && user.role && String(user.role).toLowerCase() === 'patient';

  const [testimonials, setTestimonials] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ rating: 5, feedback: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Carousel State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    loadTestimonials();
  }, []);

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

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const data = await fetchTestimonials();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.feedback.trim()) {
      setError('Please enter your feedback');
      return;
    }

    if (formData.feedback.trim().length < 10) {
      setError('Feedback must be at least 10 characters');
      return;
    }

    try {
      setSubmitting(true);
      await createTestimonial({
        rating: formData.rating,
        feedback: formData.feedback.trim()
      });
      setSuccess('Thank you! Your feedback has been submitted.');
      setFormData({ rating: 5, feedback: '' });
      setShowForm(false);
      await loadTestimonials();
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : 'empty'}`}>★</span>
    ));
  };

  const validTestimonials = testimonials.filter(t => t.rating >= 4);
  const maxIndex = Math.max(0, validTestimonials.length - itemsPerPage);

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
    if (!isPaused && validTestimonials.length > itemsPerPage) {
      const interval = setInterval(() => {
        nextSlide();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentIndex, isPaused, validTestimonials.length, itemsPerPage, maxIndex]);

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

  return (
    <div className="testimonials-container">
      <div className="testimonials-header">
        <h2>Patient Testimonials</h2>
        <p>Real feedback from our valued patients</p>
      </div>

      {isPatient && (
        <div className="testimonials-action">
          {!showForm ? (
            <button className="btn-submit-feedback" onClick={() => setShowForm(true)}>
              ✏️ Share Your Feedback
            </button>
          ) : (
            <div className="feedback-form-container">
              <form onSubmit={handleSubmit} className="feedback-form">
                <h3>Share Your Experience</h3>

                {error && <div className="form-error">{error}</div>}
                {success && <div className="form-success">{success}</div>}

                <div className="form-group">
                  <label htmlFor="rating">Rating *</label>
                  <div className="rating-selector">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${formData.rating >= star ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, rating: star })}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <p className="rating-text">{formData.rating} out of 5 stars</p>
                </div>

                <div className="form-group">
                  <label htmlFor="feedback">Your Feedback *</label>
                  <textarea
                    id="feedback"
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    placeholder="Share your experience with our clinic and doctors..."
                    rows="4"
                  />
                  <p className="char-count">{formData.feedback.length} characters</p>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowForm(false);
                      setError('');
                      setFormData({ rating: 5, feedback: '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="loading-message">Loading testimonials...</p>
      ) : validTestimonials.length === 0 ? (
        <p className="no-testimonials">No testimonials yet. Be the first to share!</p>
      ) : (
        <div
          className="carousel-container"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {validTestimonials.length > itemsPerPage && (
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
              {validTestimonials.map((testimonial) => (
                <div
                  key={testimonial._id}
                  className="testimonial-card-wrapper"
                  style={{ flex: `0 0 ${100 / itemsPerPage}%` }}
                >
                  <div className="testimonial-card">
                    <div className="testimonial-rating">
                      {renderStars(testimonial.rating)}
                    </div>
                    <p className="testimonial-feedback">{testimonial.feedback}</p>
                    <div className="testimonial-author">
                      <p className="author-name">{testimonial.patientName}</p>
                      {testimonial.createdAt && (
                        <p className="author-date">
                          {new Date(testimonial.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {validTestimonials.length > itemsPerPage && (
            <button className="carousel-arrow carousel-arrow-next" onClick={nextSlide} aria-label="Next slide">
              &#8250;
            </button>
          )}
        </div>
      )}

      {/* Dots Indicator */}
      {!loading && validTestimonials.length > itemsPerPage && (
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
  );
}
