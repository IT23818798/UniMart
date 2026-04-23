const { MongoClient } = require('mongodb');
const fs = require('fs');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected');
    const db = client.db();
    
    console.log('Fetching orders...');
    const orders = await db.collection('orders').find({}).limit(10).toArray();
    console.log('Got orders, writing to file...');
    
    fs.writeFileSync('orders_dump.json', JSON.stringify(orders, null, 2));
    console.log('Done!');
  } finally {
    await client.close();
  }
}

run().catch(console.error);
