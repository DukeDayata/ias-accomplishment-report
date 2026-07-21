const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (adminExists) {
      console.log('Admin user already exists. Skipping seed.');
      process.exit(0);
    }

    console.log('Seeding initial Admin User...');
    const adminUser = new User({
      email: 'admin@example.com',
      password: 'password123', // Make sure to change this after first login!
      role: 'ADMIN',
      name: 'System Admin'
    });
    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: password123');
    console.log('Please log in and change this password immediately.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
