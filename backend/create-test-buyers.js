const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('✅ Connected to MongoDB');
  createTestBuyers();
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function createTestBuyers() {
  try {
    const Buyer = require('./models/Buyer');
    
    console.log('\n📊 Checking existing buyers...');
    const existingBuyers = await Buyer.find({});
    console.log(`Found ${existingBuyers.length} existing buyers`);
    
    if (existingBuyers.length < 3) {
      console.log('\n🔨 Creating test buyers...');
      
      const testBuyers = [
        {
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@email.com',
          password: await bcrypt.hash('buyer123', 12),
          phone: '+1234567890',
          address: '123 Main St, City, State 12345',
          dateOfBirth: new Date('1990-01-15'),
          status: 'active'
        },
        {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@email.com',
          password: await bcrypt.hash('buyer123', 12),
          phone: '+1234567891',
          address: '456 Oak Ave, City, State 12345',
          dateOfBirth: new Date('1985-05-22'),
          status: 'active'
        },
        {
          firstName: 'Mike',
          lastName: 'Davis',
          email: 'mike.davis@email.com',
          password: await bcrypt.hash('buyer123', 12),
          phone: '+1234567892',
          address: '789 Pine St, City, State 12345',
          dateOfBirth: new Date('1992-09-10'),
          status: 'inactive'
        }
      ];
      
      for (const buyerData of testBuyers) {
        // Check if buyer already exists
        const existingBuyer = await Buyer.findOne({ email: buyerData.email });
        if (!existingBuyer) {
          const buyer = new Buyer(buyerData);
          await buyer.save();
          console.log(`✅ Created buyer: ${buyer.firstName} ${buyer.lastName} (${buyer.email})`);
        } else {
          console.log(`⚠️  Buyer already exists: ${buyerData.email}`);
        }
      }
    }
    
    // Show all buyers
    const allBuyers = await Buyer.find({}).select('-password');
    console.log(`\n📋 All buyers (${allBuyers.length}):`);
    
    allBuyers.forEach((buyer, index) => {
      console.log(`${index + 1}. ${buyer.firstName} ${buyer.lastName} - ${buyer.email} - Status: ${buyer.status || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test buyers:', error);
  } finally {
    process.exit(0);
  }
}