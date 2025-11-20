import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';
import Chat from '../components/Chat';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import './DoctorChat.css';

dayjs.extend(relativeTime);

export default function DoctorChat() {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [chatModal, setChatModal] = useState({ isOpen: false, patientId: null, patientName: '' });

    const location = useLocation();
    const token = localStorage.getItem('token');

    // Fetch participants on mount
    useEffect(() => {
        fetchParticipants();
    }, []);

    // Handle initial selection from navigation state (e.g. from dropdown)
    useEffect(() => {
        if (location.state?.selectedPatientId && participants.length > 0) {
            const patient = participants.find(p => p._id === location.state.selectedPatientId);
            if (patient) {
                handleOpenChat(patient._id, patient.name);
            }
        }
    }, [location.state, participants]);

    const fetchParticipants = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE}/chat/participants`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setParticipants(response.data.participants || []);
        } catch (error) {
            console.error('Error fetching participants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChat = (patientId, patientName) => {
        setChatModal({ isOpen: true, patientId, patientName });
    };

    const handleCloseChat = () => {
        setChatModal({ isOpen: false, patientId: null, patientName: '' });
        // Refresh participants when chat closes to update last message time
        fetchParticipants();
    };

    return (
        <div className="doctor-chat-page">
            <div className="chat-page-header">
                <h2>My Chats</h2>
                <p>Select a patient to start chatting</p>
            </div>

            <div className="chat-participants-list">
                {loading && participants.length === 0 ? (
                    <div className="loading-state">Loading chats...</div>
                ) : participants.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">💬</div>
                        <h3>No chats yet</h3>
                        <p>Chats will appear here when you communicate with patients.</p>
                    </div>
                ) : (
                    <div className="participants-grid">
                        {participants.map(p => (
                            <div
                                key={p._id}
                                className="participant-card"
                                onClick={() => handleOpenChat(p._id, p.name)}
                            >
                                <div className="participant-avatar">
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="participant-info">
                                    <div className="participant-name">
                                        {p.name}
                                        {p.unreadCount > 0 && (
                                            <span className="unread-badge">{p.unreadCount}</span>
                                        )}
                                    </div>
                                    <div className="participant-role">{p.role || 'Patient'}</div>
                                    <div className="last-active">
                                        {p.lastMessageTime ? `Last active ${dayjs(p.lastMessageTime).fromNow()}` : ''}
                                    </div>
                                </div>
                                <button className="chat-action-btn">Chat</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reuse the existing Chat Modal component */}
            <Chat
                isOpen={chatModal.isOpen}
                onClose={handleCloseChat}
                otherUserId={chatModal.patientId}
                otherUserName={chatModal.patientName}
            />
        </div>
    );
}
