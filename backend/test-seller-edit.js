const fetch = require('node-fetch');

async function testSellerEdit() {
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

    // Get sellers to find one to edit
    console.log('\n📊 Getting sellers...');
    const sellersResponse = await fetch('http://localhost:5000/api/admin/sellers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!sellersResponse.ok) {
      console.log('❌ Failed to get sellers');
      return;
    }

    const sellersData = await sellersResponse.json();
    const sellers = sellersData.data?.sellers || [];
    
    if (sellers.length === 0) {
      console.log('❌ No sellers found to edit');
      return;
    }

    const sellerToEdit = sellers[0];
    console.log(`📝 Found seller to edit: ${sellerToEdit.fullName} (${sellerToEdit.email})`);

    // Test updating seller
    console.log('\n🔧 Testing seller update...');
    const updateData = {
      firstName: sellerToEdit.firstName || 'Updated',
      lastName: sellerToEdit.lastName || 'Seller',
      phone: '+1234567890',
      businessName: 'Updated Business Name',
      businessLicense: 'UPD123456',
      verificationStatus: 'approved',
      isActive: true
    };

    const updateResponse = await fetch(`http://localhost:5000/api/admin/sellers/${sellerToEdit._id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (updateResponse.ok) {
      const updatedData = await updateResponse.json();
      console.log('✅ Seller updated successfully!');
      console.log('📋 Updated seller:', {
        name: updatedData.data.seller.fullName,
        email: updatedData.data.seller.email,
        phone: updatedData.data.seller.phone,
        business: updatedData.data.seller.businessName,
        license: updatedData.data.seller.businessLicense,
        verification: updatedData.data.seller.verificationStatus,
        active: updatedData.data.seller.isActive
      });
    } else {
      const errorData = await updateResponse.json();
      console.log('❌ Update failed:', errorData.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSellerEdit();