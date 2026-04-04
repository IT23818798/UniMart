const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function fixAdminPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Normalize role case and add all missing permissions
    const allPermissions = [
      'manage_users',
      'manage_sellers', 
      'manage_products',
      'manage_orders',
      'view_analytics',
      'manage_settings',
      'manage_content'
    ];
    
    // Fix role casing and add missing permissions
    const admins = await Admin.find({});
    
    for (let admin of admins) {
      let updated = false;
      
      // Normalize role case
      if (admin.role === 'ADMIN' || admin.role === 'SUPER_ADMIN') {
        admin.role = admin.role.toLowerCase().replace('_', '_');
        if (admin.role === 'super_admin') {
          admin.role = 'super_admin';
        } else {
          admin.role = 'admin';
        }
        updated = true;
      }
      
      // Add missing permissions
      for (let permission of allPermissions) {
        if (!admin.permissions.includes(permission)) {
          admin.permissions.push(permission);
          updated = true;
        }
      }
      
      if (updated) {
        await admin.save();
        console.log(`Updated admin: ${admin.email}`);
      }
    }
    
    // Show final state
    const updatedAdmins = await Admin.find({}, 'email role permissions');
    console.log('\nFinal admin state:');
    updatedAdmins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.role}): [${admin.permissions.join(', ')}]`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ All admin permissions fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing admin permissions:', error);
    process.exit(1);
  }
}

fixAdminPermissions();