const mongoose = require('mongoose');

const uri = 'mongodb+srv://admin:admin123@cluster0.fe0uowu.mongodb.net/?appName=Cluster0';

async function test() {
  console.time('connect');
  await mongoose.connect(uri);
  console.timeEnd('connect');
  
  console.log('connected!');
  
  console.time('query');
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const docs = await Product.find({}).limit(1);
  console.timeEnd('query');
  
  console.log('docs found:', docs.length);
  process.exit(0);
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
