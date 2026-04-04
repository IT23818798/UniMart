const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('✅ Connected to MongoDB');
  updateBuyerStatus();
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function updateBuyerStatus() {
  try {
    const Buyer = require('./models/Buyer');
    
    console.log('\n🔧 Adding status field to buyers...');
    
    // Update all buyers to have active status by default
    const result = await Buyer.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'active' } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} buyers with status field`);
    
    // Set one buyer to inactive for testing
    await Buyer.updateOne(
      { email: 'mike.davis@email.com' },
      { $set: { status: 'inactive' } }
    );
    
    console.log('✅ Set Mike Davis to inactive status for testing');
    
    // Show all buyers with status
    const buyers = await Buyer.find({});
    console.log(`\n📋 All buyers with status (${buyers.length}):`);
    
    buyers.forEach((buyer, index) => {
      console.log(`${index + 1}. ${buyer.firstName} ${buyer.lastName} - ${buyer.email} - Status: ${buyer.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating buyer status:', error);
  } finally {
    process.exit(0);
  }
}