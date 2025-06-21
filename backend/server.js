const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per minute (very generous for dev)
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for development
    return process.env.NODE_ENV === 'development';
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-frontend-domain.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection with proper options
const mongoOptions = {
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5, // Maintain a minimum of 5 socket connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
  retryWrites: true,
  retryReads: true,
  tls: true, // Use TLS instead of ssl
  tlsInsecure: true, // Allow insecure TLS for development
};

mongoose.connect(process.env.MONGO_URL, mongoOptions)
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Connection state:', mongoose.connection.readyState);
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  console.error('🔧 Trying to reconnect in 5 seconds...');
  setTimeout(() => {
    mongoose.connect(process.env.MONGO_URL, mongoOptions);
  }, 5000);
});

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/users', require('./routes/users'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/study-sessions', require('./routes/studySessions'));
app.use('/api/questions', require('./routes/questions'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
