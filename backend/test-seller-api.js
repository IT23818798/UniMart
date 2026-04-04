const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Seller = require('./models/Seller');
require('dotenv').config();

async function testSellerAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Check sellers count
    const sellersCount = await Seller.countDocuments();
    console.log('Total sellers in database:', sellersCount);
    
    // Get a few sellers to see the data structure
    const sellers = await Seller.find({}).limit(3).select('-password');
    console.log('Sample sellers:');
    sellers.forEach(seller => {
      console.log(`- ${seller.email} (${seller.businessName}) - Status: ${seller.status || 'N/A'}`);
    });
    
    // Check if there are any admins with proper tokens
    const admins = await Admin.find({}, 'email role permissions');
    console.log('\nAdmins with permissions:');
    admins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.role}): ${admin.permissions.includes('manage_sellers') ? 'CAN' : 'CANNOT'} manage sellers`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

testSellerAPI();