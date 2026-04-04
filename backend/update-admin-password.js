const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  const Admin = require('./models/Admin');
  
  // Find the gayan admin
  const admin = await Admin.findOne({ email: 'gayan@gmail.com' });
  
  if (admin) {
    console.log('🔧 Updating admin password...');
    
    // Set a known password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    await Admin.findByIdAndUpdate(admin._id, { password: hashedPassword });
    console.log('✅ Password updated to: admin123');
    
    // Test the password
    const updatedAdmin = await Admin.findOne({ email: 'gayan@gmail.com' }).select('+password');
    const isMatch = await bcrypt.compare('admin123', updatedAdmin.password);
    console.log('🧪 Password test:', isMatch ? 'PASS' : 'FAIL');
  } else {
    console.log('❌ Admin not found');
  }
  
  process.exit(0);
})
.catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});