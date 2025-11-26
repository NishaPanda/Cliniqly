const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./db');
const authRoutes = require('./Routers/authRouter');
const doctorRoutes = require('./Routers/doctRouter');
const appointmentRoutes = require('./Routers/appointmentRouter');
const userRoutes = require('./Routers/userRouter');
const chatRoutes = require('./Routers/chatRouter');
const testimonialRoutes = require('./Routers/testimonialRouter');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "https://cliniqlyyy.vercel.app"
];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Handle preflight OPTIONS requests

app.use(express.json()); // To accept JSON data in the body

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/testimonials', testimonialRoutes);

// Simple route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user-specific room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Handle sending messages
  socket.on('sendMessage', async (data) => {
    try {
      const { senderId, receiverId, message } = data;

      // Save message to database (this will be handled by the controller)
      // For real-time, we'll emit to the receiver's room
      io.to(receiverId).emit('receiveMessage', {
        senderId,
        receiverId,
        message,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Socket message error:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { senderId, receiverId, isTyping } = data;
    socket.to(receiverId).emit('userTyping', { senderId, isTyping });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8080;

server.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);