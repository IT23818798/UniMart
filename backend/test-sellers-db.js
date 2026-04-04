const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('✅ Connected to MongoDB');
  testSellers();
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function testSellers() {
  try {
    const Seller = require('./models/Seller');
    
    console.log('\n📊 Checking sellers in database...');
    const sellers = await Seller.find({});
    console.log(`Found ${sellers.length} sellers`);
    
    if (sellers.length === 0) {
      console.log('\n🔨 Creating test seller...');
      const testSeller = new Seller({
        fullName: 'Test Seller',
        email: 'testseller@example.com',
        password: 'TestPassword123!',
        phone: '+1234567890',
        businessName: 'Test Business',
        businessAddress: '123 Test St, Test City, TC 12345',
        businessLicense: 'LIC123456',
        status: 'active'
      });
      
      await testSeller.save();
      console.log('✅ Test seller created successfully');
      
      // Fetch again
      const updatedSellers = await Seller.find({});
      console.log(`Now have ${updatedSellers.length} sellers`);
    }
    
    // Show first seller
    const firstSeller = await Seller.findOne({});
    if (firstSeller) {
      console.log('\n📋 First seller details:');
      console.log(`Name: ${firstSeller.fullName}`);
      console.log(`Email: ${firstSeller.email}`);
      console.log(`Business: ${firstSeller.businessName}`);
      console.log(`Status: ${firstSeller.status}`);
      console.log(`ID: ${firstSeller._id}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing sellers:', error);
  } finally {
    process.exit(0);
  }
}