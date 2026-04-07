require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to mongoose...');
    await mongoose.connect(uri);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const buyers = await db.collection('buyers').find({}).toArray();
    console.log('Found buyers:', buyers.length);
    
    // Find Yasintha
    const yasintha = buyers.find(b => b.email === 'wele@gmail.com' || b.firstName.toLowerCase().includes('yasintha'));
    if (!yasintha) {
      console.log('User yasintha not found');
      return;
    }
    const yIdStr = yasintha._id.toString();
    console.log('Yasintha ID:', yIdStr);

    const orders = await db.collection('orders').find({}).toArray();
    console.log('Found orders:', orders.length);

    let matchCount = 0;
    for (let order of orders) {
      const buyerId = order.buyer ? order.buyer.toString() : 'null';
      console.log(`Order ${order._id}: buyer -> ${buyerId}`);
      if (buyerId === yIdStr) {
        matchCount++;
      }
      
      // FIX logic: if buyer is stored as exactly a 24 char hex string rather than ObjectId
      if (typeof order.buyer === 'string' && buyerId === yIdStr) {
         console.log('Fixing order buyer from String to ObjectId for order:', order._id);
         await db.collection('orders').updateOne(
           { _id: order._id },
           { $set: { buyer: new mongoose.Types.ObjectId(yIdStr) } }
         );
      }
    }

    console.log(`Matched orders for Yasintha: ${matchCount}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    console.log('Disconnecting...');
    mongoose.disconnect();
    setTimeout(() => process.exit(0), 1000);
  }
}

run();
