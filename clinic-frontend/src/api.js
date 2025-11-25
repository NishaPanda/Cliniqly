// src/api.js
import { API_BASE, USE_MOCK } from './config';
import axios from 'axios';

// axios instance for API calls (will include Authorization header automatically)
const axiosInstance = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Simple mock storage using localStorage
const mock = {
  getDoctors: async () => {
    // some sample doctors
    const sample = [
      { _id: 'd1', name: 'Dr. Asha Sharma', specialization: 'General Physician', specialty: 'General Physician' },
      { _id: 'd2', name: 'Dr. Rohit Kumar', specialization: 'Pediatrician', specialty: 'Pediatrician' },
      { _id: 'd3', name: 'Dr. Meera Patel', specialization: 'Dermatologist', specialty: 'Dermatologist' },
    ];
    return sample;
  },
  getAppointments: async () => {
    const raw = localStorage.getItem('clinic_appointments');
    return raw ? JSON.parse(raw) : [];
  },
  createAppointment: async (appointment) => {
    const arr = (await mock.getAppointments());
    appointment._id = String(Date.now());
    arr.push(appointment);
    localStorage.setItem('clinic_appointments', JSON.stringify(arr));
    return appointment;
  },
  getAppointmentById: async (id) => {
    const arr = await mock.getAppointments();
    return arr.find(a => a._id === id);
  }
  ,
  // Profile mocks
  getProfile: async () => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },
  updateProfile: async (data) => {
    const raw = localStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : {};
    const updated = { ...user, ...data };
    // keep role unchanged unless provided
    if (!data.role) updated.role = user.role || updated.role;
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  }
};

async function safeFetch(url, opts = {}) {
  // Attach Authorization header if token present
  const token = localStorage.getItem('token');
  const headers = opts.headers || {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  opts.headers = headers;

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchChatParticipants() {
  if (USE_MOCK) return { participants: [] };
  return safeFetch(`${API_BASE}/chat/participants`);
}

export async function fetchDoctors() {
  if (USE_MOCK) return mock.getDoctors();
  return safeFetch(`${API_BASE}/doctors`);
}

export async function fetchAppointments() {
  if (USE_MOCK) return mock.getAppointments();
  return safeFetch(`${API_BASE}/appointments`);
}

export async function fetchDoctorAppointments() {
  if (USE_MOCK) return mock.getAppointments();
  return safeFetch(`${API_BASE}/appointments/doctor/list`);
}

export async function createAppointment(data) {
  if (USE_MOCK) return mock.createAppointment(data);
  return safeFetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function fetchAppointmentById(id) {
  if (USE_MOCK) return mock.getAppointmentById(id);
  return safeFetch(`${API_BASE}/appointments/${id}`);
}

export async function cancelAppointment(id) {
  if (USE_MOCK) return { message: 'mock cancelled' };
  return safeFetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
}

export async function acceptAppointment(id) {
  if (USE_MOCK) return { message: 'mock accepted', appointment: { _id: id, status: 'confirmed' } };
  return safeFetch(`${API_BASE}/appointments/${id}/accept`, { method: 'POST' });
}

export async function rejectAppointment(id) {
  if (USE_MOCK) return { message: 'mock rejected', appointment: { _id: id, status: 'rejected' } };
  return safeFetch(`${API_BASE}/appointments/${id}/reject`, { method: 'POST' });
}

export async function updateAppointmentStatus(id, status) {
  if (USE_MOCK) return { message: 'mock updated', appointment: { _id: id, status } };
  return safeFetch(`${API_BASE}/appointments/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
}

// Profile APIs (current logged-in user)
export async function fetchProfile() {
  if (USE_MOCK) return mock.getProfile();
  // use axios for profile endpoints
  const res = await axiosInstance.get('/users/me');
  return res.data;
}

export async function updateProfile(data) {
  if (USE_MOCK) return mock.updateProfile(data);
  const res = await axiosInstance.put('/users/me', data);
  return res.data;
}

export async function fetchTestimonials() {
  if (USE_MOCK) return [
    { _id: '1', patientName: 'John Doe', rating: 5, feedback: 'Excellent service and professional doctors!', createdAt: new Date().toISOString() },
    { _id: '2', patientName: 'Jane Smith', rating: 5, feedback: 'Very smooth appointment booking process.', createdAt: new Date().toISOString() },
    { _id: '3', patientName: 'Mike Wilson', rating: 4, feedback: 'Great experience, would recommend!', createdAt: new Date().toISOString() }
  ];
  return safeFetch(`${API_BASE}/testimonials`);
}

export async function fetchDoctorTestimonials(doctorId) {
  if (USE_MOCK) return [
    { _id: '1', patientName: 'John Doe', rating: 5, feedback: 'Excellent doctor!', createdAt: new Date().toISOString() }
  ];
  return safeFetch(`${API_BASE}/testimonials?doctorId=${doctorId}`);
}

export async function createTestimonial(data) {
  if (USE_MOCK) {
    const testimonial = { ...data, _id: String(Date.now()), patientName: 'You', createdAt: new Date().toISOString() };
    return testimonial;
  }
  return safeFetch(`${API_BASE}/testimonials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
