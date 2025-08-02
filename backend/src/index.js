const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const apiRoutes = require('./routes/api');

dotenv.config();
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI:', process.env.MONGO_URI); // Debug MongoDB URI
console.log('JWT_SECRET:', process.env.JWT_SECRET); // Debug JWT_SECRET

const app = express();

// Set Mongoose strictQuery to suppress deprecation warning
mongoose.set('strictQuery', true);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === "development" ? "http://localhost:5173" : "https://k53-quiz-app.netlify.app/",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../frontend")));

// Serve static files
const staticPath = path.join(__dirname, '../frontend');
app.use(express.static(staticPath));
console.log(`Serving static files from: ${staticPath}`);

// Routes
app.use('/api', apiRoutes);

// Serve frontend in production
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).json({ error: 'Server error' }); // Return JSON
    }
  });
});

// MongoDB connection with reconnection logic
const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10
      });
      console.log('Connected to MongoDB Atlas');
      break;
    } catch (err) {
      console.error(`MongoDB connection error (attempt ${6 - retries}):`, err.message);
      retries -= 1;
      if (retries === 0) {
        console.error('MongoDB connection failed after retries. Exiting...');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

connectDB();

// Handle MongoDB disconnection
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));