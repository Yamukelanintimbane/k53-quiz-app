const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');

dotenv.config();
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET);

const app = express();

// Set Mongoose strictQuery
mongoose.set('strictQuery', true);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'http://localhost:5173' : 'https://k53-quiz-app.netlify.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Log requests and response headers for debugging
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  res.on('finish', () => console.log('Response Headers:', res.getHeaders()));
  next();
});

// Handle preflight requests
app.options('*', cors());

// Routes
app.use('/api', apiRoutes);

// MongoDB connection
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

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));