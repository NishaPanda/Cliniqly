import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./NavBar.css";
import { fetchDoctorAppointments, fetchChatParticipants } from '../api';

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [patientsOpen, setPatientsOpen] = useState(false);
  const [nextAppointments, setNextAppointments] = useState([]);
  const [chatDropdownOpen, setChatDropdownOpen] = useState(false);
  const [chatParticipants, setChatParticipants] = useState([]);
  const navigate = useNavigate();

  // refs for focus management
  const dropdownRef = useRef(null);
  const patientsRef = useRef(null);
  const chatDropdownRef = useRef(null);

  // ✅ Check login status from localStorage
  useEffect(() => {
    const checkUser = () => {
      const loggedInUser = localStorage.getItem("user");
      setUser(loggedInUser ? JSON.parse(loggedInUser) : null);
    };

    checkUser(); // Initial check
    window.addEventListener("storage", checkUser);
    window.addEventListener("focus", checkUser);
    window.addEventListener("user-profile-updated", checkUser);

    return () => {
      window.removeEventListener("storage", checkUser);
      window.removeEventListener("focus", checkUser);
      window.removeEventListener("user-profile-updated", checkUser);
    };
  }, []);

  // ✅ If logged in as doctor, fetch upcoming appointments for quick access
  useEffect(() => {
    let mounted = true;
    const userObj = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);
    const isDoctor = userObj && userObj.role && String(userObj.role).toLowerCase() === 'doctor';

    const loadChatParticipants = () => {
      if (isDoctor) {
        fetchChatParticipants()
          .then(data => {
            if (!mounted) return;
            setChatParticipants((data.participants || []).slice(0, 5));
          })
          .catch(err => console.error('Failed to load chat participants', err));
      }
    };

    if (isDoctor) {
      fetchDoctorAppointments()
        .then(list => {
          if (!mounted) return;
          // Pick next 5 upcoming
          setNextAppointments((list || []).slice(0, 5));
        })
        .catch(err => console.error('Failed to load doctor appointments', err));

      loadChatParticipants();

      // Listen for chat-read events to update the count
      const handleChatRead = () => {
        loadChatParticipants();
      };

      window.addEventListener('chat-read', handleChatRead);

      return () => {
        mounted = false;
        window.removeEventListener('chat-read', handleChatRead);
      };
    } else {
      setNextAppointments([]);
    }
    return () => { mounted = false; };
  }, [user]);

  // ===============================
  // Lock body scroll when menus are open
  // ===============================
  useEffect(() => {
    const body = document.body;
    if (patientsOpen || dropdownOpen || chatDropdownOpen) {
      body.classList.add("no-scroll");
    } else {
      body.classList.remove("no-scroll");
    }
    return () => body.classList.remove("no-scroll");
  }, [patientsOpen, dropdownOpen, chatDropdownOpen]);

  // ===============================
  // Focus first element inside menu when it opens
  // ===============================
  useEffect(() => {
    if (dropdownOpen && dropdownRef.current) {
      const first = dropdownRef.current.querySelector("button, [tabindex='0'], a, input, [role='menuitem']");
      if (first && typeof first.focus === "function") first.focus();
    }
  }, [dropdownOpen]);

  useEffect(() => {
    if (patientsOpen && patientsRef.current) {
      const first = patientsRef.current.querySelector("button, [tabindex='0'], a, .patient-item");
      if (first && typeof first.focus === "function") first.focus();
    }
  }, [patientsOpen]);

  // ===============================
  // Close menus when clicking outside (single handler)
  // ===============================
  useEffect(() => {
    const handleClickOutside = (e) => {
      // if click is outside profile-dropdown, close profile dropdown
      if (!e.target.closest('.profile-dropdown')) {
        setDropdownOpen(false);
      }
      // if click is outside patients-dropdown, close patients menu
      if (!e.target.closest('.patients-dropdown')) {
        setPatientsOpen(false);
      }
      // if click is outside chat-dropdown, close chat menu
      if (!e.target.closest('.chat-dropdown')) {
        setChatDropdownOpen(false);
      }
    };

    // use mousedown so it fires before other click handlers (helps prevent race)
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  };

  // ✅ Navigate to profile
  const goToProfile = () => {
    navigate("/profile");
  };

  // ✅ Track seen appointments locally
  const [seenAppointmentIds, setSeenAppointmentIds] = useState(() => {
    const saved = localStorage.getItem('seen_appointments');
    return saved ? JSON.parse(saved) : [];
  });

  // Calculate unseen count
  const unseenAppointments = nextAppointments.filter(a => !seenAppointmentIds.includes(a._id));
  const unseenCount = unseenAppointments.length;

  const handlePatientsClick = (e) => {
    e.stopPropagation();
    if (!patientsOpen) {
      // Opening the dropdown: mark current list as seen
      const newSeenIds = [...seenAppointmentIds];
      let changed = false;
      nextAppointments.forEach(a => {
        if (!newSeenIds.includes(a._id)) {
          newSeenIds.push(a._id);
          changed = true;
        }
      });
      if (changed) {
        setSeenAppointmentIds(newSeenIds);
        localStorage.setItem('seen_appointments', JSON.stringify(newSeenIds));
      }
    }
    setPatientsOpen(!patientsOpen);
  };

  return (
    <nav className="navbar">
      {/* Left Side - Brand */}
      <div className="navbar-brand" onClick={() => navigate("/")}>
        <span className="brand-health">Cliniqly</span>
      </div>

      {/* Hamburger menu for mobile */}
      <div className="hamburger" onClick={() => setIsOpen(!isOpen)}>
        <div className={`line ${isOpen ? "open" : ""}`}></div>
        <div className={`line ${isOpen ? "open" : ""}`}></div>
        <div className={`line ${isOpen ? "open" : ""}`}></div>
      </div>

      {/* Center - Main Links */}
      <div className={`navbar-links ${isOpen ? "active" : ""}`}>
        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
          Home
        </NavLink>
        {user && user.role && String(user.role).toLowerCase() === 'doctor' ? (
          <NavLink to="/patients" className={({ isActive }) => (isActive ? "active" : "")}>
            My Patients
          </NavLink>
        ) : (
          <NavLink to="/doctors" className={({ isActive }) => (isActive ? "active" : "")}>
            Doctors
          </NavLink>
        )}
        <NavLink to="/appointments" className={({ isActive }) => (isActive ? "active" : "")}>
          My Appointments
        </NavLink>
      </div>

      {/* Right Side - Auth / Profile */}
      <div className={`navbar-auth ${isOpen ? "active" : ""}`}>
        {!user ? (
          <>
            <NavLink to="/login" className={({ isActive }) => (isActive ? "active" : "")}>
              Login
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => (isActive ? "active" : "")}>
              Register
            </NavLink>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            {user?.role === 'doctor' && (
              <div
                className="patients-dropdown"
                onClick={handlePatientsClick}
              >
                <div className="patients-icon" style={{ cursor: 'pointer' }}>👥</div>
                {unseenCount > 0 && <div className="patients-badge">{unseenCount}</div>}

                {patientsOpen && (
                  <div className="patients-menu" ref={patientsRef} style={{ color: "black" }}>
                    <div className="patients-header">Upcoming Patients</div>

                    {nextAppointments.length === 0 ? (
                      <div className="patient-item" tabIndex={0}>No upcoming appointments</div>
                    ) : (
                      nextAppointments.map(a => (
                        <div
                          key={a._id}
                          className="patient-item"
                          tabIndex={0}
                          onClick={() => { navigate(`/receipt/${a._id}`); setPatientsOpen(false); }}
                        >
                          <div className="patient-name">{a.patientName || 'Unknown'}</div>
                          <div className="patient-time">{a.date ? a.date.split('T')[0] : ''} {a.time || ''}</div>
                        </div>
                      ))
                    )}

                    <div className="patients-footer">
                      <button onClick={() => { navigate('/appointments'); setPatientsOpen(false); }}>View all</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {user?.role === 'doctor' && (
              <div
                className="chat-dropdown"
                onClick={(e) => { e.stopPropagation(); setChatDropdownOpen(!chatDropdownOpen); }}
              >
                <div className="chat-icon" style={{ cursor: 'pointer', fontSize: '20px' }}>💬</div>
                {(() => {
                  const unreadCount = chatParticipants.filter(p => p.unreadCount > 0).length;
                  return unreadCount > 0 && <div className="patients-badge">{unreadCount}</div>;
                })()}

                {chatDropdownOpen && (
                  <div className="patients-menu" ref={chatDropdownRef} style={{ color: "black", right: "60px" }}>
                    <div className="patients-header">Recent Chats</div>

                    {chatParticipants.length === 0 ? (
                      <div className="patient-item" tabIndex={0}>No recent chats</div>
                    ) : (
                      chatParticipants.map(p => (
                        <div
                          key={p._id}
                          className="patient-item"
                          tabIndex={0}
                          onClick={() => { navigate('/doctor-chat', { state: { selectedPatientId: p._id } }); setChatDropdownOpen(false); }}
                        >
                          <div className="patient-name">{p.name || 'Unknown'}</div>
                          <div className="patient-time">
                            {p.lastMessageTime ? new Date(p.lastMessageTime).toLocaleDateString() : ''}
                          </div>
                        </div>
                      ))
                    )}

                    <div className="patients-footer">
                      <button onClick={() => { navigate('/doctor-chat'); setChatDropdownOpen(false); }}>View All</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="profile-dropdown">
              <div
                className="profile-icon"
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
              >
                👤 {user && user.name ? user.name.split(" ")[0] : "User"}
              </div>

              {dropdownOpen && (
                <div className="dropdown-menu" ref={dropdownRef}>
                  <button onClick={goToProfile}>Profile</button>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
