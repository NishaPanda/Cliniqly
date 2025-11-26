// src/components/MyAppointments.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAppointments, fetchDoctors, fetchDoctorAppointments } from '../api';
import { cancelAppointment } from '../api';
import { acceptAppointment, rejectAppointment, updateAppointmentStatus, createTestimonial } from '../api';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import './appointment.css';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Kolkata');

export default function MyAppointments() {
  const [appts, setAppts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [processing, setProcessing] = useState({});
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const navigate = useNavigate();
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  function openFeedbackModal(appt) {
    setSelectedAppointment(appt);
    setRating(0);
    setFeedbackText('');
    setFeedbackModalOpen(true);
  }

  async function submitFeedback() {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!feedbackText.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    try {
      await createTestimonial({
        doctorId: selectedAppointment.doctorId,
        appointmentId: selectedAppointment._id,
        rating,
        feedback: feedbackText
      });
      toast.success('Thank you for your feedback!');
      setFeedbackModalOpen(false);

      // Reload appointments to update the hasFeedback flag
      if (user.role === 'doctor') {
        const newAppts = await fetchDoctorAppointments();
        setAppts(newAppts || []);
      } else {
        const newAppts = await fetchAppointments();
        setAppts(newAppts || []);
      }
    } catch (err) {
      console.error('Feedback error', err);
      toast.error('Failed to submit feedback: ' + (err.message || 'Unknown error'));
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    if (user.role === 'doctor') {
      Promise.all([fetchDoctorAppointments(), fetchDoctors()])
        .then(([a, d]) => { setAppts(a || []); setDoctors(d || []); })
        .catch(err => {
          console.error('Load error (doctor)', err);
          toast.error(err?.message || 'Failed to load appointments');
        })
        .finally(() => setLoading(false));
    } else {
      Promise.all([fetchAppointments(), fetchDoctors()])
        .then(([a, d]) => { setAppts(a || []); setDoctors(d || []); })
        .catch(err => {
          console.error('Load error (patient)', err);
          toast.error(err?.message || 'Failed to load appointments');
        })
        .finally(() => setLoading(false));
    }
  }, [user.role]);

  function doctorName(id) {
    const d = doctors.find(x => String(x._id) === String(id));
    return d ? `${d.name} (${d.specialization || d.specialty || ''})` : 'Unknown doctor';
  }

  function patientInfo(a) {
    return a.patientName || 'Unknown';
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'pending':
        return 'Booked';
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'no-show':
        return 'No-show';
      case 'cancelled':
      case 'rejected':
        return 'Cancelled';
      default:
        return status;
    }
  }

  function isAppointmentPast(a) {
    try {
      const now = dayjs().tz('Asia/Kolkata');

      // Try to construct appointment date-time similar to formatAppointmentDateTime
      let apptDateTime = null;

      // 1) If we have date and time/slot info
      if (a.date) {
        const timeStr = a.time || a.slotLabel || a.timeLabel;
        if (timeStr) {
          // Try different time formats
          const timeFormats = ['HH:mm', 'h:mm A', 'hh:mm A'];
          for (const format of timeFormats) {
            const parsed = dayjs(`${a.date} ${timeStr}`, `YYYY-MM-DD ${format}`);
            if (parsed.isValid()) {
              apptDateTime = parsed;
              break;
            }
          }
        }

        // If no time, assume end of day
        if (!apptDateTime) {
          apptDateTime = dayjs(`${a.date} 23:59`, 'YYYY-MM-DD HH:mm');
        }
      }

      // 2) Fallback to ISO datetime fields
      if (!apptDateTime) {
        const isoCandidate = a.dateTime || a.datetime || a.scheduledAt || a.timestamp;
        if (isoCandidate) {
          const parsed = dayjs(isoCandidate);
          if (parsed.isValid()) {
            apptDateTime = parsed;
          }
        }
      }

      if (apptDateTime && apptDateTime.isValid()) {
        return apptDateTime.isBefore(now);
      }

      return false;
    } catch (err) {
      console.error('isAppointmentPast error', err);
      return false;
    }
  }

  async function handleStatusUpdate(a, newStatus) {
    setProcessing(prev => ({ ...prev, [`${newStatus}_${a._id}`]: true }));
    try {
      await updateAppointmentStatus(a._id, newStatus);
      const newAppts = await fetchDoctorAppointments();
      setAppts(newAppts);
    } catch (err) {
      console.error('Status update error', err);
      toast.error('Status update failed: ' + (err.message || 'Unknown error'));
    } finally {
      setProcessing(prev => ({ ...prev, [`${newStatus}_${a._id}`]: false }));
    }
  }

  // FORMAT helper: prefer explicit label fields, then format 'HH:mm' → 'hh:mm A' with leading zero
  function formatTimeLabel(a) {
    // 1) prefer server-provided human label (if you later add storing it)
    let label = a.timeLabel || a.slotLabel;
    if (label) {
      if (/^\d{1,2}:\d{2}$/.test(label)) {
        return dayjs(label, 'HH:mm').format('hh:mm A');
      }
      return label;
    }

    // 2) if time stored as "HH:mm" (24-hour), convert to 'hh:mm A' with leading zero
    if (a.time && /^\d{1,2}:\d{2}$/.test(a.time)) {
      const t24 = dayjs(a.time, 'HH:mm', true);
      if (t24.isValid()) return t24.format('hh:mm A'); // NOTE: 'hh' -> leading zero (09:30 AM)
      const t12 = dayjs(a.time, 'h:mm A', true);
      if (t12.isValid()) return t12.format('hh:mm A');
    }

    // 3) if appointment holds combined ISO or datetime
    const isoCandidate = a.dateTime || a.datetime || a.scheduledAt || a.timestamp;
    if (isoCandidate) {
      const parsed = dayjs(isoCandidate);
      if (parsed.isValid()) return parsed.tz('Asia/Kolkata').format('hh:mm A');
    }

    // 4) If no explicit time field but `date` includes a time component, derive it
    if (a.date) {
      try {
        const parsedDate = dayjs(a.date);
        if (parsedDate.isValid() && (parsedDate.hour() !== 0 || parsedDate.minute() !== 0)) {
          return parsedDate.tz('Asia/Kolkata').format('hh:mm A');
        }
      } catch (err) {
        // ignore
      }
    }

    // 4) fallback: if date present and no time, do not print a time (avoid 12:00 AM)
    return null;
  }

  // Compose combined display "YYYY-MM-DD at hh:mm A" or just date/time parts
  function formatAppointmentDateTime(a) {
    try {
      const timeLabel = formatTimeLabel(a);
      if (a?.date && timeLabel) {
        // Use date as-is (assumed YYYY-MM-DD) and the visible timeLabel
        return `${dayjs(a.date).format('YYYY-MM-DD')} at ${timeLabel}`;
      }
      if (a?.date && !timeLabel) {
        // Only date present, show date only
        return dayjs(a.date).format('YYYY-MM-DD');
      }
      if (!a?.date && timeLabel) {
        return timeLabel;
      }
      // fallback: if ISO present
      const isoCandidate = a.dateTime || a.datetime || a.scheduledAt || a.timestamp;
      if (isoCandidate) {
        const parsed = dayjs(isoCandidate);
        if (parsed.isValid()) return parsed.tz('Asia/Kolkata').format('YYYY-MM-DD [at] hh:mm A');
      }
    } catch (err) {
      console.error('formatAppointmentDateTime error', err);
    }
    return '—';
  }


  const groupedAppointments = useMemo(() => {
    if (user.role === 'doctor') return [];
    const groups = {};
    appts.forEach(a => {
      const dId = a.doctorId;
      if (!groups[dId]) {
        groups[dId] = {
          doctorId: dId,
          doctorName: doctorName(dId),
          appointments: []
        };
      }
      groups[dId].appointments.push(a);
    });
    return Object.values(groups);
  }, [appts, doctors, user.role]);

  const renderCard = (a, index, isGroupedView = false) => (
    <div
      key={a._id}
      className="appointment-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="appointment-info">
        <div>
          {user.role === 'doctor' ? (
            <div className="patient-doctor">{patientInfo(a)} — Booked with {doctorName(a.doctorId)}</div>
          ) : (
            <div className="patient-doctor">
              {isGroupedView ? a.patientName : `${a.patientName} — ${doctorName(a.doctorId)}`}
            </div>
          )}

          <div className="appointment-date">
            {formatAppointmentDateTime(a)}
          </div>

          <div className="appointment-booked">
            Booked: {dayjs(a.createdAt).tz('Asia/Kolkata').format('YYYY-MM-DD hh:mm A')}
          </div>
        </div>

        <div className="appointment-actions-wrapper">
          {user.role !== 'doctor' && a.status !== 'rejected' && a.status !== 'cancelled' && a.status !== 'no-show' && (
            <>
              <Link to={`/receipt/${a._id}`}><button style={{ marginLeft: 8 }}>Receipt</button></Link>
              {a.status === 'completed' && !isGroupedView && (
                <button
                  className={`btn-feedback ${a.hasFeedback ? 'hidden-feedback' : ''}`}
                  style={{ marginLeft: 8 }}
                  onClick={() => openFeedbackModal(a)}
                >
                  ★ Give Feedback
                </button>
              )}
            </>
          )}
          {/* doctor status management buttons */}
          {user.role === 'doctor' && a.status === 'pending' && (
            <>
              <button
                style={{ marginLeft: 8 }}
                disabled={processing[`accept_${a._id}`]}
                onClick={async () => {
                  setProcessing(prev => ({ ...prev, [`accept_${a._id}`]: true }));
                  try {
                    await acceptAppointment(a._id);
                    const newAppts = await fetchDoctorAppointments();
                    setAppts(newAppts);
                  } catch (err) {
                    console.error('Accept error', err);
                    toast.error('Accept failed: ' + (err.message || 'Unknown error'));
                  } finally {
                    setProcessing(prev => ({ ...prev, [`accept_${a._id}`]: false }));
                  }
                }}
              >Accept</button>

              <button
                style={{ marginLeft: 8 }}
                disabled={processing[`reject_${a._id}`]}
                onClick={async () => {
                  if (!confirm('Reject this appointment?')) return;
                  setProcessing(prev => ({ ...prev, [`reject_${a._id}`]: true }));
                  try {
                    await rejectAppointment(a._id);
                    const newAppts = await fetchDoctorAppointments();
                    setAppts(newAppts);
                  } catch (err) {
                    console.error('Reject error', err);
                    toast.error('Reject failed: ' + (err.message || 'Unknown error'));
                  } finally {
                    setProcessing(prev => ({ ...prev, [`reject_${a._id}`]: false }));
                  }
                }}
              >Reject</button>
            </>
          )}

          {user.role === 'doctor' && a.status === 'confirmed' && (
            <>
              {isAppointmentPast(a) && (
                <button
                  style={{ marginLeft: 8 }}
                  disabled={processing[`completed_${a._id}`]}
                  onClick={() => handleStatusUpdate(a, 'completed')}
                >
                  {processing[`completed_${a._id}`] ? 'Completing...' : 'Mark Completed'}
                </button>
              )}
              {isAppointmentPast(a) && (
                <button
                  style={{ marginLeft: 8 }}
                  disabled={processing[`no-show_${a._id}`]}
                  onClick={() => handleStatusUpdate(a, 'no-show')}
                >
                  {processing[`no-show_${a._id}`] ? 'Updating...' : 'Mark No-show'}
                </button>
              )}
            </>
          )}

          {user.role !== 'doctor' && a.status === 'pending' && (
            <button
              style={{ marginLeft: 8 }}
              disabled={processing[a._id]}
              onClick={async () => {
                if (!confirm('Cancel this appointment?')) return;
                setProcessing(prev => ({ ...prev, [a._id]: true }));
                try {
                  await cancelAppointment(a._id);
                  const newAppts = await fetchAppointments();
                  setAppts(newAppts);
                } catch (err) {
                  console.error('Cancel error', err);
                  toast.error('Cancel failed: ' + (err.message || 'Unknown error'));
                } finally {
                  setProcessing(prev => ({ ...prev, [a._id]: false }));
                }
              }}
            >
              {processing[a._id] ? 'Cancelling...' : 'Cancel'}
            </button>
          )}

          {a.status !== 'cancelled' && a.status !== 'pending' && (
            <span
              style={{
                marginLeft: 8,
                color: a.status === 'rejected' ? '#c0392b' : a.status === 'no-show' ? '#ffa500' : a.status === 'completed' ? '#0000FF' : '#2e8b57',
                fontWeight: 600
              }}
            >
              {getStatusLabel(a.status)}
            </span>
          )}
        </div>
      </div>
    </div>
  );


  if (loading) return <div className="loading-text">Loading appointments...</div>;

  if (!appts.length)
    return (
      <div className="appointments-container no-appointments">
        <h3>No appointments yet</h3>
        <p className="small">Book one from Doctors page.</p>
      </div>
    );

  return (
    <div className="appointments-container">
      <h2>My Appointments</h2>
      {user.role === 'doctor' ? (
        appts.map((a, index) => renderCard(a, index, false))
      ) : (
        groupedAppointments.map((group) => {
          // Check if patient has already given feedback for this doctor
          const hasGivenFeedback = group.appointments.some(a => a.hasFeedback);

          // Find the latest completed appointment to attach feedback to (only if not given yet)
          let feedbackAppt = null;
          if (!hasGivenFeedback) {
            feedbackAppt = group.appointments
              .filter(a => a.status === 'completed')
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          }

          return (
            <div key={group.doctorId} className="doctor-appointment-group">
              <div className="doctor-group-header">
                <h3 className="doctor-group-name">{group.doctorName}</h3>
                {feedbackAppt && (
                  <button
                    className="btn-feedback"
                    onClick={() => openFeedbackModal(feedbackAppt)}
                  >
                    ★ Give Feedback
                  </button>
                )}
              </div>
              <div className="doctor-group-list">
                {group.appointments.map((a, index) => renderCard(a, index, true))}
              </div>
            </div>
          );
        })
      )}
      {feedbackModalOpen && (
        <div className="feedback-modal-overlay" onClick={() => setFeedbackModalOpen(false)}>
          <div className="feedback-modal" onClick={e => e.stopPropagation()}>
            <button className="feedback-modal-close" onClick={() => setFeedbackModalOpen(false)}>×</button>
            <h3>Rate your experience</h3>
            <p className="subtitle">How was your appointment with {selectedAppointment ? doctorName(selectedAppointment.doctorId) : 'the doctor'}?</p>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  className={star <= rating ? 'active' : ''}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
            <textarea
              placeholder="Share your experience with this doctor..."
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
            />
            <div className="feedback-modal-actions">
              <button className="cancel-btn" onClick={() => setFeedbackModalOpen(false)}>Cancel</button>
              <button className="submit-btn" onClick={submitFeedback}>Submit Feedback</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
