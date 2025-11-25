// src/components/BookingForm.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import "./booking.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // IST = UTC+5:30

function utcNowMs() {
  const now = new Date();
  return now.getTime() + now.getTimezoneOffset() * 60000;
}

function nowIstDate() {
  return new Date(utcNowMs() + IST_OFFSET_MS);
}

function toDateInputValueFromIst(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toTimeInputValueFromIst(dateObj) {
  const h = String(dateObj.getHours()).padStart(2, "0");
  const m = String(dateObj.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function roundUpToNextInterval(dateObj, interval = 15) {
  const d = new Date(dateObj.getTime());
  const mins = d.getMinutes();
  const remainder = mins % interval;
  if (remainder !== 0) d.setMinutes(mins + (interval - remainder));
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

function generateTimeSlotsIst(startHour = 9, endHour = 20, interval = 15) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      const hh24 = h;
      const hh12 = ((hh24 + 11) % 12) + 1;
      const ampm = hh24 < 12 ? "AM" : "PM";
      const label = `${String(hh12).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )} ${ampm}`;
      const value = `${String(hh24).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )}`;
      slots.push({ label, value });
    }
  }
  return slots;
}

function validateDateTimeIst(dateStr, timeStr) {
  if (!dateStr || !timeStr) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const selectedUtcMs = Date.UTC(y, m - 1, d, hh, mm, 0) - IST_OFFSET_MS;
  return selectedUtcMs >= utcNowMs();
}

export default function BookingForm() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorName, setSelectedDoctorName] = useState("");
  const [form, setForm] = useState({
    patientName: "",
    patientEmail: "",
    doctorId: doctorId || "",
    date: "",
    time: "",
    reason: "",
  });
  const [loading, setLoading] = useState(true);

  const WORK_START_HOUR = 9;
  const WORK_END_HOUR = 20;
  const SLOT_INTERVAL = 15;
  const timeSlots = useMemo(
    () => generateTimeSlotsIst(WORK_START_HOUR, WORK_END_HOUR, SLOT_INTERVAL),
    []
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token) {
      alert("Please login first to book an appointment");
      navigate("/login");
      return;
    }

    const fetchDoctors = async () => {
      try {
        const res = await axios.get(`${API_BASE}/doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctors(res.data);
        if (doctorId) {
          const doc = res.data.find((d) => d._id === doctorId);
          if (doc) {
            setSelectedDoctorName(
              `${doc.name} — ${doc.specialization || doc.specialty || ""}`
            );
            setForm((prev) => ({ ...prev, doctorId }));
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        alert(
          "Failed to fetch doctors: " +
          (err.response?.data?.message || err.message)
        );
        setLoading(false);
      }
    };

    fetchDoctors();

    if (user) {
      setForm((prev) => ({
        ...prev,
        patientName: user.name,
        patientEmail: user.email,
      }));
    }
  }, [doctorId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "doctorId") {
      const doc = doctors.find((d) => d._id === value);
      setSelectedDoctorName(
        doc ? `${doc.name} — ${doc.specialization || doc.specialty || ""}` : ""
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patientName || !form.patientEmail || !form.doctorId || !form.date || !form.time) {
      alert("Please fill all required fields.");
      return;
    }

    if (!validateDateTimeIst(form.date, form.time)) {
      alert("Selected date/time is in the past (IST). Please choose a future slot.");
      return;
    }

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token || !user) {
      alert("Please login first.");
      navigate("/login");
      return;
    }

    // ✅ Convert form.time ("HH:mm") to human label ("hh:mm A")
    const timeLabel = dayjs(form.time, "HH:mm").format("hh:mm A");

    try {
      const payload = {
        patientId: user.id,
        patientName: form.patientName,
        patientEmail: form.patientEmail,
        date: form.date,
        time: form.time,
        timeLabel, // <-- NEW FIELD
        reason: form.reason,
      };

      const res = await axios.post(
        `${API_BASE}/appointments/doctors/book/${form.doctorId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Appointment booked successfully!");
      navigate(`/receipt/${res.data.appointment._id}`);
    } catch (err) {
      console.error("Booking error:", err);
      const msg =
        err.response?.data?.message ||
        JSON.stringify(err.response?.data) ||
        err.message;
      alert("Booking failed: " + msg);
    }
  };

  // ---- IST-based min values ----
  const nowIst = nowIstDate();
  const minDateIst = toDateInputValueFromIst(nowIst);
  const minTimeForToday = toTimeInputValueFromIst(
    roundUpToNextInterval(nowIst, SLOT_INTERVAL)
  );

  if (loading) return <div className="booking-card">Loading...</div>;

  return (
    <div className="booking-card">
      <button
        type="button"
        className="back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        ← 
      </button>
      <h3>Book Appointment</h3>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Patient Full Name *</label>
          <input
            name="patientName"
            value={form.patientName}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Patient Email *</label>
          <input
            name="patientEmail"
            type="email"
            value={form.patientEmail}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Select Doctor *</label>
          <select
            name="doctorId"
            value={form.doctorId}
            onChange={handleChange}
          >
            <option value="">-- choose doctor --</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} — {d.specialization || d.specialty || ""}
              </option>
            ))}
          </select>
        </div>

        {selectedDoctorName && (
          <p>
            Selected Doctor: <strong>{selectedDoctorName}</strong>
          </p>
        )}

        <div className="flex-row date-time">
          <div className="field">
            <label>Date *</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              min={minDateIst}
            />
          </div>
          <div className="field">
            <label>Time *</label>
            <select
              name="time"
              value={form.time}
              onChange={handleChange}
            >
              <option value="">-- choose time --</option>
              {timeSlots.map((slot) => {
                const disablePast =
                  form.date === minDateIst && slot.value < minTimeForToday;
                return (
                  <option
                    key={slot.value}
                    value={slot.value}
                    disabled={disablePast}
                  >
                    {slot.label}
                  </option>
                );
              })}
            </select>
            {form.date === minDateIst && (
              <small style={{ color: "#004c80" }}>
                Current India Time:{" "}
                {nowIst.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                  timeZone: "Asia/Kolkata",
                })}
              </small>
            )}
          </div>
        </div>

        <div className="field">
          <label>Reason / Notes</label>
          <textarea
            name="reason"
            rows="3"
            value={form.reason}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="flex-row buttons">
          <button type="submit">Confirm Booking</button>
          <button
            type="button"
            onClick={() => {
              const user = JSON.parse(localStorage.getItem("user"));
              setForm({
                patientName: user?.name || "",
                patientEmail: user?.email || "",
                doctorId: doctorId || "",
                date: "",
                time: "",
                reason: "",
              });
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <p className="small">
        Tip: after booking, you’ll be redirected to a receipt page you can save or print.
      </p>
    </div>
  );
}
