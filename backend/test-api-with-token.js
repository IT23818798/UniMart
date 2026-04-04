const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function getValidToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Get an admin and generate a token
    const admin = await Admin.findOne({ email: 'yppinidiya@gmail.com' });
    if (admin) {
      const token = admin.generateAuthToken();
      console.log('Admin found:', admin.email);
      console.log('Generated token:', token);
      
      // Test the sellers API with this token
      console.log('\nTesting sellers API...');
      const fetch = (await import('node-fetch')).default;
      
      try {
        const response = await fetch('http://localhost:5000/api/admin/sellers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers));
        
        const data = await response.text();
        console.log('Response data:', data);
        
        if (response.ok) {
          try {
            const jsonData = JSON.parse(data);
            console.log('Parsed JSON:', jsonData);
          } catch (parseError) {
            console.log('Failed to parse as JSON:', parseError.message);
          }
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
      }
      
    } else {
      console.log('Admin not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

getValidToken();