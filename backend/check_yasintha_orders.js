require('dotenv').config();
const mongoose = require('mongoose');

async function checkSpecificUser() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    
    // Find yasintha in buyers
    const buyersCol = db.collection('buyers');
    const yasintha = await buyersCol.findOne({ $or: [{firstName: /yasintha/i}, {lastName: /yasintha/i}] });
    
    if (yasintha) {
        console.log('--- FOUND YASINTHA ---');
        console.log('ID:', yasintha._id.toString());
        console.log('Email:', yasintha.email);
        
        const ordersCol = db.collection('orders');
        const orders = await ordersCol.find({ buyer: yasintha._id }).toArray();
        console.log(`\n--- YASINTHA ORDERS: ${orders.length} ---`);
        if (orders.length > 0) {
            console.log(JSON.stringify(orders[0], null, 2).substring(0, 500));
        } else {
            // Also check if any order has string match for buyer
            const allOrders = await ordersCol.find({}).toArray();
            console.log(`\nTotal orders in DB: ${allOrders.length}`);
            if(allOrders.length > 0) {
               console.log('Sample order buyer ID:', allOrders[0].buyer.toString());
               console.log('Yasintha ID for comparison:', yasintha._id.toString());
            }
        }
    } else {
        console.log('Yasintha not found in buyers collection');
        const count = await buyersCol.countDocuments();
        console.log(`Total buyers in DB: ${count}`);
    }
  } catch (err) {
    console.error('Mongo Error:', err);
  } finally {
    mongoose.disconnect();
  }
}

checkSpecificUser();
