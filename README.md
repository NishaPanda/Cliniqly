# CLINIQLY - Clinic Appointment Scheduler

A comprehensive web application designed to streamline the process of booking doctor appointments and facilitating communication between patients and doctors.

## 🚀 Features

### For Patients
- **User Authentication**: Secure registration and login.
- **Find Doctors**: Browse through a list of available doctors.
- **Book Appointments**: Schedule appointments with doctors at convenient times.
- **Real-time Chat**: Chat directly with doctors for consultations or queries.
- **Appointment History**: View past and upcoming appointments.
- **Testimonials**: Leave feedback and ratings for doctors.

### For Doctors
- **Dashboard**: Manage appointments and view patient details.
- **Chat**: Communicate with patients in real-time.
- **Profile Management**: Update professional details and availability.

## 🛠️ Tech Stack

### Frontend
- **React**: UI library for building interactive interfaces.
- **Vite**: Next-generation frontend tooling for fast builds.
- **CSS**: Custom styling for a responsive design.
- **Axios**: For making HTTP requests to the backend.
- **Socket.io-client**: For real-time communication.

### Backend
- **Node.js**: JavaScript runtime environment.
- **Express**: Web framework for Node.js.
- **MongoDB**: NoSQL database for storing user and appointment data.
- **Mongoose**: ODM library for MongoDB.
- **Socket.io**: Enables real-time, bidirectional communication.
- **JWT**: JSON Web Tokens for secure authentication.

## 📦 Installation & Setup

Follow these steps to get the project running locally.

### Prerequisites
- [Node.js](https://nodejs.org/) installed.
- [MongoDB](https://www.mongodb.com/) installed and running locally or a cloud instance (Atlas).

### 1. Clone the Repository
```bash
git clone <repository-url>
cd clinic-appointment-scheduler/clinic-appointment
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies.

```bash
cd clinic-backend
npm install
```

Create a `.env` file in the `clinic-backend` directory with the following variables:
```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

Start the backend server:
```bash
npm run dev
# or
npm start
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies.

```bash
cd ../clinic-frontend
npm install
```

Create a `.env` file in the `clinic-frontend` directory (if required for API URL):
```env
VITE_API_URL=http://localhost:4000
```

Start the frontend development server:
```bash
npm run dev
```

### 4. Access the Application
Open your browser and navigate to the URL shown in the frontend terminal (usually `http://localhost:5173`).

## 📂 Project Structure

```
clinic-appointment/
├── clinic-backend/     # Node.js/Express Backend
│   ├── Controller/     # Route controllers
│   ├── Models/         # Mongoose models
│   ├── Routers/        # API routes
│   └── server.js       # Entry point
│
└── clinic-frontend/    # React Frontend
    ├── src/
    │   ├── components/ # Reusable components
    │   ├── pages/      # Application pages
    │   └── assets/     # Static assets
    └── vite.config.js  # Vite configuration
```

## 🔗 API Endpoints (Overview)

- **/api/auth**: Authentication routes (register, login).
- **/api/doctors**: Doctor management and retrieval.
- **/api/users**: User profile management.
- **/api/appointments**: Booking and managing appointments.
- **/api/chat**: Chat history and messaging.
- **/api/testimonials**: Managing doctor reviews.


