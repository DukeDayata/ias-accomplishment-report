const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for large JSON arrays from Excel

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/regions', require('./routes/regions'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/indicators', require('./routes/indicators'));
app.use('/api/accomplishments', require('./routes/accomplishments'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/auditlogs', require('./routes/auditLogs'));

// Serve uploads statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Database Connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    if (process.env.MONGODB_URI.includes('ondigitalocean')) {
      console.log("Successfully connected to DigitalOcean MongoDB");
    } else if (process.env.MONGODB_URI.includes('localhost')) {
      console.log("Successfully connected to Local MongoDB");
    } else {
      console.log("Successfully connected to MongoDB");
    }
  } catch (error) {
    console.error(`Failed to connect to MongoDB (${error.message}).`);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

connectDB();
