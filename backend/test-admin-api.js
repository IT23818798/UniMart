const fetch = require('node-fetch');

async function testAdminAPI() {
  try {
    console.log('🔑 Testing admin login...');
    
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'gayan@gmail.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed, creating admin first...');
      
      // Try to register admin
      const registerResponse = await fetch('http://localhost:5000/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@test.com',
          password: 'Admin123!',
          permissions: ['manage_users', 'manage_sellers', 'manage_products']
        })
      });
      
      if (registerResponse.ok) {
        console.log('✅ Admin registered');
        // Try login again
        const retryLogin = await fetch('http://localhost:5000/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'admin@test.com',
            password: 'Admin123!'
          })
        });
        
        if (retryLogin.ok) {
          const loginData = await retryLogin.json();
          const token = loginData.token;
          console.log('✅ Login successful after registration');
          
          // Test sellers API
          await testSellersAPI(token);
        }
      }
    } else {
      const loginData = await loginResponse.json();
      const token = loginData.token;
      console.log('✅ Login successful');
      
      // Test sellers API
      await testSellersAPI(token);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testSellersAPI(token) {
  try {
    console.log('\n📊 Testing sellers API...');
    
    const response = await fetch('http://localhost:5000/api/admin/sellers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sellers API working!');
      console.log(`📈 Found ${data.data?.sellers?.length || 0} sellers`);
      
      if (data.data?.sellers?.length > 0) {
        const seller = data.data.sellers[0];
        console.log('\n👤 First seller:');
        console.log(`Name: ${seller.fullName}`);
        console.log(`Email: ${seller.email}`);
        console.log(`Business: ${seller.businessName}`);
        console.log(`Active: ${seller.isActive}`);
        console.log(`Verification: ${seller.verificationStatus}`);
        console.log(`Created: ${new Date(seller.createdAt).toLocaleDateString()}`);
      }
    } else {
      const errorData = await response.json();
      console.log('❌ Sellers API failed:', errorData.message);
    }
  } catch (error) {
    console.error('❌ Sellers API error:', error);
  }
}

testAdminAPI();