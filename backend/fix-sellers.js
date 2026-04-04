const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('✅ Connected to MongoDB');
  fixSellerStatus();
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function fixSellerStatus() {
  try {
    const Seller = require('./models/Seller');
    
    console.log('\n🔧 Fixing seller status...');
    
    // Update all sellers without status to have 'active' status
    const result = await Seller.updateMany(
      { status: { $in: [null, undefined] } },
      { $set: { status: 'active' } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} sellers`);
    
    // Show all sellers
    const sellers = await Seller.find({});
    console.log(`\n📋 All sellers (${sellers.length}):`);
    
    sellers.forEach((seller, index) => {
      console.log(`${index + 1}. ${seller.fullName} - ${seller.email} - Status: ${seller.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing sellers:', error);
  } finally {
    process.exit(0);
  }
}