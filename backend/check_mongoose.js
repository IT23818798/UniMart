require('dotenv').config();
const mongoose = require('mongoose');

// Load models
require('./models/Buyer');
require('./models/Seller');
require('./models/Product');
const Order = require('./models/Order');

async function checkWithMongoose() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('Connected');

    // 1. Get Yasintha's Order via Email to avoid ID issues
    const Buyer = mongoose.model('Buyer');
    const yasintha = await Buyer.findOne({ email: 'wele@gmail.com' });
    if(!yasintha) throw new Error('Yasintha not found');
    
    console.log('Yasintha ObjectId:', yasintha._id);
    console.log('Fetching orders...');

    // 2. Query Orders Using Mongoose
    let orders = await Order.find({ buyer: yasintha._id });
    console.log(`Found ${orders.length} orders by ObjectId`);
    
    // Check if the order was somehow saved as a string by doing a loose raw query
    if (orders.length === 0) {
       console.log('Trying raw query with string ID...');
       const rawOrders = await mongoose.connection.db.collection('orders').find({ buyer: yasintha._id.toString() }).toArray();
       console.log(`Found ${rawOrders.length} orders by String ID`);
       
       if (rawOrders.length > 0) {
           console.log('Order found with String ID! Fixing it to ObjectId...');
           for(let ro of rawOrders) {
               await mongoose.connection.db.collection('orders').updateOne(
                   { _id: ro._id },
                   { $set: { buyer: new mongoose.Types.ObjectId(yasintha._id.toString()) } }
               );
           }
           console.log('Fixed DB. Orders should now be visible.');
       } else {
           console.log('Orders not found. Maybe the order was placed by someone else?');
           // Let's print the last 3 orders in the DB just to see
           const allOrders = await Order.find().sort({ createdAt: -1 }).limit(3);
           for(let o of allOrders) {
               console.log('Recent Order ID:', o._id, 'Buyer:', o.buyer);
           }
       }
    } else {
        console.log('Order exists properly in DB. Checking if it loads...');
    }

  } catch (err) {
    console.error('Script Error:', err);
  } finally {
    mongoose.disconnect();
  }
}

checkWithMongoose();
