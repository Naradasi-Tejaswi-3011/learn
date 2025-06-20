const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createDemoUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Clear existing demo users
    await User.deleteMany({ 
      email: { 
        $in: ['student@demo.com', 'instructor@demo.com', 'admin@demo.com'] 
      } 
    });

    // Create demo users
    const demoUsers = [
      {
        name: 'Demo Student',
        email: 'student@demo.com',
        password: 'password123',
        role: 'student',
        emailVerified: true,
        isActive: true,
        xp: 150,
        level: 2
      },
      {
        name: 'Demo Instructor',
        email: 'instructor@demo.com',
        password: 'password123',
        role: 'instructor',
        emailVerified: true,
        isActive: true,
        xp: 500,
        level: 6
      },
      {
        name: 'John Student',
        email: 'john@student.com',
        password: 'password123',
        role: 'student',
        emailVerified: true,
        isActive: true,
        xp: 75,
        level: 1
      },
      {
        name: 'Sarah Instructor',
        email: 'sarah@instructor.com',
        password: 'password123',
        role: 'instructor',
        emailVerified: true,
        isActive: true,
        xp: 300,
        level: 4
      }
    ];

    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${user.email} (${user.role})`);
    }

    console.log('Demo users created successfully!');
    console.log('\nLogin credentials:');
    console.log('Student: student@demo.com / password123');
    console.log('Instructor: instructor@demo.com / password123');
    console.log('John: john@student.com / password123');
    console.log('Sarah: sarah@instructor.com / password123');

  } catch (error) {
    console.error('Error creating demo users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createDemoUsers();
