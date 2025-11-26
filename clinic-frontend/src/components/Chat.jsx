// src/components/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_BASE, SOCKET_URL } from '../config';
import './Chat.css';

const Chat = ({ isOpen, onClose, otherUserId, otherUserName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const userStr = localStorage.getItem('user');
  // const currentUserId = userStr ? JSON.parse(userStr).id : null ||userStr ? JSON.parse(userStr)._id : null;
  const parsedUser = userStr ? JSON.parse(userStr) : null;
  const currentUserId = parsedUser?.id || parsedUser?._id || null;

  const token = localStorage.getItem('token');

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, isOpen]);

  // Initialize socket connection
  useEffect(() => {
    if (isOpen && currentUserId) {
      socketRef.current = io(SOCKET_URL, {
        auth: { token }
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to chat server');
        socketRef.current.emit('join', currentUserId);
      });

      socketRef.current.on('receiveMessage', (messageData) => {
        setMessages(prev => [...prev, {
          ...messageData,
          id: Date.now(),
          sender: { _id: messageData.senderId },
          createdAt: messageData.timestamp
        }]);
      });

      socketRef.current.on('userTyping', (data) => {
        if (data.senderId === otherUserId) {
          setOtherUserTyping(data.isTyping);
        }
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [isOpen, currentUserId, otherUserId, token]);

  // Load chat history when modal opens
  useEffect(() => {
    if (isOpen && otherUserId && token) {
      loadChatHistory();
    }
  }, [isOpen, otherUserId, token]);

  // Autofocus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Prevent background scrolling when chat is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/chat/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);

      // Mark messages as read
      await axios.put(`${API_BASE}/chat/${otherUserId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Dispatch custom event to notify navbar to update chat count
      window.dispatchEvent(new CustomEvent('chat-read', { detail: { userId: otherUserId } }));
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post(`${API_BASE}/chat/send`, {
        receiverId: otherUserId,
        message: newMessage.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add message to local state
      setMessages(prev => [...prev, response.data.chatMessage]);
      console.log(currentUserId);
      console.log(otherUserId);
      console.log(newMessage.trim());

      // Emit via socket for real-time
      socketRef.current?.emit('sendMessage', {
        senderId: currentUserId,
        receiverId: otherUserId,
        message: newMessage.trim()
      });

      setNewMessage('');
      setIsTyping(false);
      socketRef.current?.emit('typing', {
        senderId: currentUserId,
        receiverId: otherUserId,
        isTyping: false
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current?.emit('typing', {
        senderId: currentUserId,
        receiverId: otherUserId,
        isTyping: true
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit('typing', {
        senderId: currentUserId,
        receiverId: otherUserId,
        isTyping: false
      });
    }, 1000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      weekday: 'long'
    });
  };

  const getDateKey = (timestamp) => {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  };

  const getSenderName = (msg) => {
    if (msg.sender._id === currentUserId) {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr).name : 'You';
    }
    return otherUserName;
  };

  const shouldShowSenderName = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    return currentMsg.sender._id !== previousMsg.sender._id;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="chat-modal-overlay" onClick={onClose}>
        <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
          <div className="chat-header">
            <h3>Chat with {otherUserName}</h3>
            <button className="chat-close-btn" onClick={onClose}>×</button>
          </div>

          <div className="chat-messages">
            {loading ? (
              <div className="chat-loading">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">No messages yet. Start the conversation!</div>
            ) : (
              messages.reduce((acc, msg, index) => {
                const currentDateKey = getDateKey(msg.createdAt);
                const previousDateKey = index > 0 ? getDateKey(messages[index - 1].createdAt) : null;
                const previousMsg = index > 0 ? messages[index - 1] : null;

                if (currentDateKey !== previousDateKey) {
                  acc.push(
                    <div key={`date-${currentDateKey}`} className="chat-date-separator">
                      <div className="date-line"></div>
                      <span className="date-text">{formatDate(msg.createdAt)}</span>
                      <div className="date-line"></div>
                    </div>
                  );
                }

                const showName = shouldShowSenderName(msg, previousMsg);
                const messageGroup = (
                  <div
                    key={msg._id || msg.id}
                    className={`chat-message ${msg.sender._id === currentUserId ? 'own' : 'other'}`}
                  >
                    {showName && (
                      <div className={`sender-name ${msg.sender._id === currentUserId ? 'own' : 'other'}`}>
                        {getSenderName(msg)}
                      </div>
                    )}
                    <div className="message-content">{msg.message}</div>
                    <div className="message-time">{formatTime(msg.createdAt)}</div>
                  </div>
                );

                acc.push(messageGroup);
                return acc;
              }, [])
            )}
            {otherUserTyping && (
              <div className="chat-typing">
                {otherUserName} is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="chat-input"
              maxLength={500}
            />
            <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Chat;