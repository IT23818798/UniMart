const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function createTestAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Delete existing test admin if any
    await Admin.deleteOne({ email: 'admin@test.com' });
    
    // Create a new test admin with known credentials
    const testAdminData = {
      firstName: 'Test',
      lastName: 'Admin',
      email: 'admin@test.com',
      password: 'admin123',
      phone: '1234567890',
      address: 'Test Address',
      role: 'admin',
      permissions: [
        'manage_users',
        'manage_sellers', 
        'manage_products',
        'manage_orders',
        'view_analytics',
        'manage_settings',
        'manage_content'
      ]
    };
    
    const newAdmin = new Admin(testAdminData);
    await newAdmin.save();
    
    console.log('✅ Test admin created successfully!');
    console.log('📧 Email: admin@test.com');
    console.log('🔐 Password: admin123');
    console.log('🛡️  Role: admin');
    console.log('📋 Permissions:', testAdminData.permissions.join(', '));
    
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error creating test admin:', error);
    process.exit(1);
  }
}

createTestAdmin();