require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting...');
    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    
    const buyers = await db.collection('buyers').find({}).toArray();
    const yasintha = buyers.find(b => b.email === 'wele@gmail.com' || b.firstName.toLowerCase().includes('yasintha'));
    if (!yasintha) return console.log('Yasintha not found');
    
    const yIdStr = yasintha._id.toString();
    console.log('Yasintha ID:', yIdStr);

    console.log('Fetching orders with projection to avoid huge documents...');
    // Use projection to avoid downloading massive base64 images if they exist
    const orders = await db.collection('orders').find({}, { projection: { buyer: 1, _id: 1 } }).toArray();
    console.log('Found orders:', orders.length);

    let matchCount = 0;
    for (let order of orders) {
      const buyerId = order.buyer ? order.buyer.toString() : 'null';
      
      if (buyerId === yIdStr) matchCount++;
      if (typeof order.buyer === 'string' && buyerId === yIdStr) {
         console.log('Fixing order buyer from String to ObjectId for order:', order._id);
         await db.collection('orders').updateOne(
           { _id: order._id },
           { $set: { buyer: new mongoose.Types.ObjectId(yIdStr) } }
         );
      } else if (buyerId !== yIdStr) {
          console.log(`Order ${order._id}: buyer -> ${buyerId} (Not matching ${yIdStr})`);
      } else {
          console.log(`Order ${order._id} already has a valid ObjectId matching Yasintha`);
      }
    }

    console.log(`Matched orders for Yasintha: ${matchCount}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.disconnect();
    setTimeout(() => process.exit(0), 1000);
  }
}

run();
