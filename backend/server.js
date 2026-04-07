const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database.js');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
  ].filter(Boolean), // Remove any undefined values
  credentials: true
})); // Enable CORS with credentials
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/seller', require('./routes/sellerRoutes'));
app.use('/api/buyer', require('./routes/buyerRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'unimart API - Agriculture Business Management System',
    version: '1.0.0',
    status: 'Server is running successfully!',
    description: 'Complete agricultural management platform API',
    features: [
      'Crop Management',
      'Financial Tracking',
      'Equipment Management',
      'Weather Integration',
      'Inventory Control',
      'Mobile Access'
    ],
    database: 'MongoDB Connected',
    environment: process.env.NODE_ENV
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'unimart API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'Connected to MongoDB',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Debug endpoint for checking orders and users directly from active DB connection
app.get('/api/debug-orders', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    // Fix orders with string IDs implicitly
    const rawOrders = await db.collection('orders').find({}).toArray();
    let yasinthaId = null;
    
    // Attempt to string fix
    const buyers = await db.collection('buyers').find({}).toArray();
    const yasintha = buyers.find(b => b.email === 'wele@gmail.com' || (b.firstName && b.firstName.toLowerCase().includes('yasintha')));
    
    if (yasintha) {
        yasinthaId = yasintha._id.toString();
        // check if any order has buyer as string that equals yasinthaId
        for (let ro of rawOrders) {
            if (typeof ro.buyer === 'string' && ro.buyer === yasinthaId) {
                await db.collection('orders').updateOne(
                    { _id: ro._id },
                    { $set: { buyer: new mongoose.Types.ObjectId(yasinthaId) } }
                );
                ro.buyer = new mongoose.Types.ObjectId(yasinthaId); // update local copy too
            }
        }
    }
    
    const orders = await mongoose.model('Order').find().lean() || rawOrders;
    
    res.json({ yasintha, orders, status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});


// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});

module.exports = app;