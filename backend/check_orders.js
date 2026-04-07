require('dotenv').config();
const mongoose = require('mongoose');

async function testMongo() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to:', uri);
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name).join(', '));
    
    // Find yasintha in buyers
    const buyersCol = db.collection('buyers');
    const buyers = await buyersCol.find({}).toArray();
    console.log(`Found ${buyers.length} buyers`);
    let yasinthaId = null;
    buyers.forEach(b => {
      console.log('Buyer:', b.firstName, b.lastName, b._id.toString(), b.email);
      if((b.firstName && b.firstName.toLowerCase().includes('yasintha')) || 
         (b.lastName && b.lastName.toLowerCase().includes('yasintha'))) {
           yasinthaId = b._id;
      }
    });

    // Find orders
    const ordersCol = db.collection('orders');
    const orders = await ordersCol.find({}).toArray();
    console.log(`Found ${orders.length} total orders`);
    if(orders.length > 0) {
      console.log('Order buyers:', orders.map(o => o.buyer?.toString() || JSON.stringify(o.buyer)));
      if (yasinthaId) {
        console.log(`Checking orders for Yasintha (${yasinthaId.toString()})`);
        const myOrders = orders.filter(o => o.buyer.toString() === yasinthaId.toString());
        console.log(`Yasintha has ${myOrders.length} orders.`);
        if(myOrders.length > 0) {
          console.log('First order status:', myOrders[0].orderStatus);
        }
      }
    }
  } catch (err) {
    console.error('Mongo Error:', err);
  } finally {
    mongoose.disconnect();
  }
}

testMongo();
