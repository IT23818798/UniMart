// Test script to verify admin registration and login
// You can run this in the browser console or as a Node.js script

const testAdminRegistration = async () => {
  const testAdmin = {
    firstName: 'John',
    lastName: 'Admin',
    email: 'admin@agrimanager.com',
    password: 'admin123',
    phone: '+1234567890',
    address: '123 Admin Street, City'
  };

  try {
    console.log('Testing admin registration...');
    
    const registerResponse = await fetch('http://localhost:5000/api/admin/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(testAdmin)
    });

    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);

    if (registerResponse.ok) {
      console.log('✅ Admin registration successful!');
      
      // Test login
      console.log('Testing admin login...');
      
      const loginResponse = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: testAdmin.email,
          password: testAdmin.password
        })
      });

      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);

      if (loginResponse.ok) {
        console.log('✅ Admin login successful!');
        
        // Test dashboard access
        console.log('Testing dashboard access...');
        
        const dashboardResponse = await fetch('http://localhost:5000/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        const dashboardData = await dashboardResponse.json();
        console.log('Dashboard response:', dashboardData);

        if (dashboardResponse.ok) {
          console.log('✅ Admin dashboard access successful!');
          console.log('🎉 All tests passed! Admin system is working correctly.');
        } else {
          console.log('❌ Dashboard access failed:', dashboardData.message);
        }
      } else {
        console.log('❌ Admin login failed:', loginData.message);
      }
    } else {
      console.log('❌ Admin registration failed:', registerData.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Uncomment the line below to run the test
// testAdminRegistration();

console.log('Admin API Test Script Loaded');
console.log('Run testAdminRegistration() to test the admin system');

// Manual test steps for browser:
console.log(`
🧪 Manual Testing Steps:
1. Open http://localhost:3002
2. Click on Login dropdown → Admin Login
3. Try registering with:
   - Email: admin@test.com
   - Password: admin123
   - Fill other required fields
4. After registration, try logging in
5. Access should redirect to /admin-dashboard route
6. Dashboard should load with admin panel

🔧 API Endpoints:
- Registration: POST http://localhost:5000/api/admin/register
- Login: POST http://localhost:5000/api/admin/login
- Dashboard: GET http://localhost:5000/api/admin/dashboard
- Profile: GET http://localhost:5000/api/admin/profile
`);

export { testAdminRegistration };