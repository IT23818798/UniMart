const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function updateAdminPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Update all admins to include manage_sellers permission
    const result = await Admin.updateMany(
      { permissions: { $nin: ['manage_sellers'] } },
      { $addToSet: { permissions: 'manage_sellers' } }
    );
    
    console.log('Updated permissions for', result.modifiedCount, 'admins');
    
    // Check current admins
    const admins = await Admin.find({}, 'email role permissions');
    console.log('Current admins:');
    admins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.role}): [${admin.permissions.join(', ')}]`);
    });
    
    await mongoose.disconnect();
    console.log('✅ Admin permissions updated successfully!');
  } catch (error) {
    console.error('❌ Error updating admin permissions:', error);
    process.exit(1);
  }
}

updateAdminPermissions();