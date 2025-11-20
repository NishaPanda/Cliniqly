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
      {groupedPatients.map((patient, index) => (
        <div
          key={patient.patientId}
          className="appointment-card"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="appointment-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <div className="patient-doctor">{patient.patientName}</div>
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  <strong>Appointments ({patient.appointments.length}):</strong>
                </div>
                {patient.appointments.map((appointment, apptIndex) => (
                  <div key={appointment._id} style={{
                    marginTop: '8px',
                    padding: '8px',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <div className="appointment-date">
                      {formatAppointmentDateTime(appointment)}
                    </div>
                    <div className="appointment-booked">
                      Booked: {dayjs(appointment.createdAt).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm')}
                    </div>
                    <div style={{
                      marginTop: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: appointment.status === 'rejected' ? '#c0392b' :
                        appointment.status === 'no-show' ? '#ffa500' :
                          appointment.status === 'completed' ? '#0000FF' : '#2e8b57'
                    }}>
                      Status: {appointment.status === 'pending' ? 'Booked' :
                        appointment.status === 'confirmed' ? 'Confirmed' :
                          appointment.status === 'completed' ? 'Completed' :
                            appointment.status === 'no-show' ? 'No-show' :
                              appointment.status === 'cancelled' ? 'Cancelled' :
                                appointment.status === 'rejected' ? 'Rejected' :
                                  appointment.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}


    </div>
  );
}