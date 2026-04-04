const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function updatePermissionsOnly() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    const allPermissions = [
      'manage_users',
      'manage_sellers', 
      'manage_products',
      'manage_orders',
      'view_analytics',
      'manage_settings',
      'manage_content'
    ];
    
    // Just update permissions using updateMany - safer approach
    const result = await Admin.updateMany(
      {},
      { 
        $addToSet: { 
          permissions: { 
            $each: allPermissions 
          } 
        } 
      }
    );
    
    console.log('Updated permissions for', result.modifiedCount, 'admins');
    
    // Show current state
    const admins = await Admin.find({}, 'email role permissions');
    console.log('\nCurrent admin permissions:');
    admins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.role}): [${admin.permissions.join(', ')}]`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Admin permissions updated successfully!');
  } catch (error) {
    console.error('❌ Error updating admin permissions:', error);
    process.exit(1);
  }
}

updatePermissionsOnly();