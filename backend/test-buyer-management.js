const fetch = require('node-fetch');

async function testBuyerManagement() {
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
      console.log('❌ Login failed');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Test buyers API
    console.log('\n📊 Testing buyers API...');
    const buyersResponse = await fetch('http://localhost:5000/api/admin/buyers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!buyersResponse.ok) {
      console.log('❌ Failed to get buyers');
      const error = await buyersResponse.json();
      console.log('Error:', error.message);
      return;
    }

    const buyersData = await buyersResponse.json();
    const buyers = buyersData.data?.buyers || [];
    console.log(`✅ Found ${buyers.length} buyers`);

    if (buyers.length > 0) {
      const buyer = buyers[0];
      console.log(`\n👤 Testing buyer edit for: ${buyer.firstName} ${buyer.lastName}`);
      
      // Test updating buyer
      const updateData = {
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        phone: '+1234567999',
        status: 'active'
      };

      const updateResponse = await fetch(`http://localhost:5000/api/admin/buyers/${buyer._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (updateResponse.ok) {
        const updatedData = await updateResponse.json();
        console.log('✅ Buyer update successful!');
        console.log(`📱 Updated phone: ${updatedData.data.buyer.phone}`);
      } else {
        const errorData = await updateResponse.json();
        console.log('❌ Update failed:', errorData.message);
      }
    }

    console.log('\n🎉 Buyer management API tests completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBuyerManagement();