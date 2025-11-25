// src/components/DoctorPatients.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDoctorAppointments, fetchDoctors } from '../api';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import './appointment.css';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Kolkata');

export default function DoctorPatients() {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPatients, setExpandedPatients] = useState({});

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDoctorAppointments(), fetchDoctors()])
      .then(([a]) => { setAppts(a || []); })
      .catch(err => {
        console.error('Load error', err);
        alert(err?.message || 'Failed to load patients');
      })
      .finally(() => setLoading(false));
  }, []);

  // Group appointments by patientId
  function groupAppointmentsByPatient(appointments) {
    const grouped = {};
    appointments.forEach(appointment => {
      const patientId = appointment.patient || appointment.patientId;
      if (!grouped[patientId]) {
        grouped[patientId] = {
          patientId,
          patientName: appointment.patientName || 'Unknown',
          patientEmail: appointment.patientEmail,
          appointments: []
        };
      }
      grouped[patientId].appointments.push(appointment);
    });
    return Object.values(grouped);
  }

  function patientInfo(a) {
    return a.patientName || 'Unknown';
  }

  function formatAppointmentDateTime(a) {
    try {
      const timeLabel = a.time || a.slotLabel;
      if (a?.date && timeLabel) {
        return `${dayjs(a.date).format('YYYY-MM-DD')} at ${timeLabel}`;
      }
      if (a?.date && !timeLabel) {
        return dayjs(a.date).format('YYYY-MM-DD');
      }
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

  // Toggle appointments visibility for a patient
  const togglePatientExpanded = (patientId) => {
    setExpandedPatients(prev => ({
      ...prev,
      [patientId]: !prev[patientId]
    }));
  };

  if (loading) return <div className="appointments-container no-appointments">Loading patients...</div>;

  if (!appts.length)
    return (
      <div className="appointments-container no-appointments">
        <h3>No patients yet</h3>
        <p className="small">Patients will appear here when they book appointments.</p>
      </div>
    );

  const groupedPatients = groupAppointmentsByPatient(appts);

  return (
    <div className="appointments-container">
      <h2>My Patients</h2>
      {groupedPatients.map((patient, index) => {
        const isExpanded = expandedPatients[patient.patientId];

        return (
          <div
            key={patient.patientId}
            className="appointment-card patient-card"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="patient-header">
              <div className="patient-header-top">
                <div className="patient-info-section">
                  <div className="patient-doctor">{patient.patientName}</div>
                  <div className="patient-email">{patient.patientEmail}</div>
                </div>
                <button
                  className={`toggle-arrow ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => togglePatientExpanded(patient.patientId)}
                  aria-label={isExpanded ? 'Collapse appointments' : 'Expand appointments'}
                >
                  <span className="toggle-text">View All</span>
                  <span className="arrow-icon">▼</span>
                </button>
              </div>
              <div className="appointments-count">
                Total Appointments: <span>{patient.appointments.length}</span>
              </div>
            </div>

            <div className={`patient-appointments-list ${isExpanded ? 'expanded' : 'collapsed'}`}>
              {patient.appointments.map((appointment, apptIndex) => (
                <div key={appointment._id} className="appointment-item">
                  <div className="appointment-item-header">
                    <div className="appointment-date">
                      📅 {formatAppointmentDateTime(appointment)}
                    </div>
                    <div className={`appointment-status status-${appointment.status}`}>
                      {appointment.status === 'pending' ? 'Booked' :
                        appointment.status === 'confirmed' ? 'Confirmed' :
                          appointment.status === 'completed' ? 'Completed' :
                            appointment.status === 'no-show' ? 'No-show' :
                              appointment.status === 'cancelled' ? 'Cancelled' :
                                appointment.status === 'rejected' ? 'Rejected' :
                                  appointment.status}
                    </div>
                  </div>
                  <div className="appointment-booked">
                    🕒 Booked: {dayjs(appointment.createdAt).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}