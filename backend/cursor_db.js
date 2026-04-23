require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  let matched = 0;
  try {
    console.log('Connecting...');
    await mongoose.connect(process.env.MONGODB_URI, { connectTimeoutMS: 5000, socketTimeoutMS: 10000 });
    console.log('Connected');

    const db = mongoose.connection.db;

    // Get Yasintha ID
    const buyers = await db.collection('buyers').find({}).toArray();
    const yasintha = buyers.find(b => b.email === 'wele@gmail.com' || b.firstName.toLowerCase().includes('yasintha'));
    const yId = yasintha ? yasintha._id.toString() : null;
    console.log('Yasintha ID:', yId);

    if (!yId) return;

    console.log('Iterating orders with cursor...');
    const cursor = db.collection('orders').find({});
    
    while(await cursor.hasNext()) {
        const order = await cursor.next();
        console.log('Processing order ID:', order._id);
        const buyerId = order.buyer ? order.buyer.toString() : 'null';
        
        if (typeof order.buyer === 'string' && buyerId === yId) {
           console.log('Found manual string entry. Fixing...');
           await db.collection('orders').updateOne(
             { _id: order._id },
             { $set: { buyer: new mongoose.Types.ObjectId(yId) } }
           );
           matched++;
        } else if (buyerId === yId) {
           console.log('Order already correct format.');
           matched++;
        }
    }
    console.log('Done iterating orders.');
  } catch(e) {
    console.error('Mongo Error:', e);
  } finally {
    mongoose.disconnect();
    setTimeout(() => process.exit(0), 1000);
  }
}

run();
