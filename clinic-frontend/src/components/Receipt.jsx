// src/components/Receipt.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAppointmentById, fetchDoctors } from '../api';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import './receipt.css';

// Configure dayjs with required plugins and set default timezone to IST
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Kolkata');

export default function Receipt() {
  const { id } = useParams();
  const [appt, setAppt] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchAppointmentById(id), fetchDoctors()])
      .then(([appointment, docs]) => {
        setAppt(appointment);
        setDoctors(docs || []);
      })
      .catch(err => {
        console.error('Receipt load error', err);
        setError(err?.message || 'Failed to load receipt');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="receipt-card">Loading receipt...</div>;
  if (error) return <div className="receipt-card">Error: {error}</div>;
  if (!appt) return <div className="receipt-card">Appointment not found.</div>;

  // Resolve doctor info if available
  const doctorFromList = doctors.find(d =>
    String(d._id) === String(appt.doctorId) || String(d._id) === String(appt.doctor?._id)
  );
  const doctor =
    doctorFromList ||
    (appt.doctor && appt.doctor.name ? appt.doctor : null) ||
    { name: appt.doctorName || 'Unknown', specialization: '' };

  // Helper: format time value (accepts "HH:mm" or "h:mm A" or other time strings)
  const formatTimeToAmPm = (timeStr) => {
    if (!timeStr) return null;
    // If it's already in "h:mm A" form, return normalized (e.g. "9:30 AM")
    const try12 = dayjs(timeStr, 'h:mm A', true);
    if (try12.isValid()) return try12.format('h:mm A');

    // Try 24-hour "HH:mm"
    const try24 = dayjs(timeStr, 'HH:mm', true);
    if (try24.isValid()) return try24.format('h:mm A');

    // As a last resort, try parsing with flexible parsing and format to h:mm A in IST
    const flex = dayjs(timeStr);
    if (flex.isValid()) return flex.tz('Asia/Kolkata').format('h:mm A');

    return timeStr; // return as-is if we can't parse
  };

  // Build the combined date+time display so it matches the Booking form slots (AM/PM)
  function buildDateTimeDisplay(appointment) {
    if (!appointment) return '—';
    try {
      // normalize date-only string
      let dateOnlyStr = null;
      const parsedDate = dayjs(appointment.date);
      if (appointment.date && parsedDate.isValid()) {
        dateOnlyStr = parsedDate.format('YYYY-MM-DD');
      } else if (appointment.date) {
        dateOnlyStr = String(appointment.date).split('T')[0];
      }

      // determine time to use: prefer explicit appointment.time, else derive from appointment.date if it contains a time
      let timeToUse = null;
      if (appointment.time) {
        // normalize various possible formats into HH:mm
        if (/^\d{1,2}:\d{2}$/.test(appointment.time)) {
          timeToUse = appointment.time;
        } else {
          const p = dayjs(appointment.time, ['h:mm A', 'hh:mm A', 'H:mm', 'HH:mm'], true);
          if (p.isValid()) timeToUse = p.format('HH:mm');
        }
      } else if (parsedDate.isValid() && (parsedDate.hour() !== 0 || parsedDate.minute() !== 0)) {
        timeToUse = parsedDate.format('HH:mm');
      }

      // if we have both date and time, format using timezone-aware parse
      if (dateOnlyStr && timeToUse) {
        const candidate = dayjs.tz(`${dateOnlyStr} ${timeToUse}`, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata');
        if (candidate.isValid()) return candidate.format('YYYY-MM-DD [at] h:mm A');

        // fallback: try formatting with the time label
        const timeLabel = formatTimeToAmPm(timeToUse);
        if (timeLabel) return `${dateOnlyStr} at ${timeLabel}`;
      }

      // prefer ISO/datetime fields if present
      const isoCandidate = appointment.dateTime || appointment.datetime || appointment.scheduledAt || appointment.timestamp;
      if (isoCandidate) {
        const d = dayjs(isoCandidate);
        if (d.isValid()) return d.tz('Asia/Kolkata').format('YYYY-MM-DD [at] h:mm A');
      }

      // date-only
      if (dateOnlyStr) return dateOnlyStr;

      // time-only
      if (timeToUse) {
        const tLabel = formatTimeToAmPm(timeToUse);
        if (tLabel) return tLabel;
      }
    } catch (err) {
      console.error('Error formatting appointment datetime:', err);
    }
    return '—';
  }

  const dateTimeDisplay = buildDateTimeDisplay(appt);

  const patientObj = appt.patientDetails || appt.patient || {};
  const emailDisplay = appt.patientEmail || patientObj.email || '—';
  const reasonDisplay = appt.reason || appt.notes || '—';
  const doctorSpecial = (doctor.specialization || doctor.specialty) || appt.doctor?.specialization || appt.doctor?.specialty || '—';

  return (
    <div className="receipt-card printable">
      <h3>Appointment Receipt</h3>
      <div className="receipt-body">
        <div><strong>Patient:</strong> {appt.patientName || patientObj.name || '—'}</div>
        <div><strong>Email:</strong> {emailDisplay}</div>
        <div><strong>Doctor:</strong> {doctor.name} ({doctorSpecial})</div>
        <div><strong>Date & Time:</strong> {dateTimeDisplay}</div>
        <div><strong>Reason:</strong> {reasonDisplay}</div>
        <div><strong>Booking ID:</strong> {appt._id}</div>
        <div className="small">
          Printed: {dayjs().tz('Asia/Kolkata').format('YYYY-MM-DD h:mm A')}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => window.print()}>Print Receipt</button>
      </div>
    </div>
  );
}
