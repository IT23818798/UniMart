const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAndFixAdminCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Check existing admins
    const admins = await Admin.find({}, 'email firstName lastName isActive');
    console.log('\n=== EXISTING ADMINS ===');
    admins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.firstName} ${admin.lastName}) - Active: ${admin.isActive}`);
    });
    
    // Test password for a known admin
    const testAdmin = await Admin.findOne({ email: 'yppinidiya@gmail.com' }).select('+password');
    if (testAdmin) {
      console.log('\n=== TESTING ADMIN CREDENTIALS ===');
      console.log('Testing admin:', testAdmin.email);
      
      // Test common passwords
      const testPasswords = ['123456', 'admin123', 'password', 'admin', 'yppinidiya123'];
      
      for (let testPassword of testPasswords) {
        const isMatch = await bcrypt.compare(testPassword, testAdmin.password);
        if (isMatch) {
          console.log(`✅ Password found: "${testPassword}"`);
          break;
        } else {
          console.log(`❌ "${testPassword}" - incorrect`);
        }
      }
      
      console.log('\n=== CREATING TEST ADMIN ===');
      // Create a new test admin with known credentials
      const existingTestAdmin = await Admin.findOne({ email: 'test@admin.com' });
      if (!existingTestAdmin) {
        const testAdminData = {
          firstName: 'Test',
          lastName: 'Admin',
          email: 'test@admin.com',
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
        console.log('✅ Test admin created: test@admin.com / admin123');
      } else {
        console.log('✅ Test admin already exists: test@admin.com / admin123');
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Admin credentials check complete!');
  } catch (error) {
    console.error('❌ Error checking admin credentials:', error);
    process.exit(1);
  }
}

checkAndFixAdminCredentials();