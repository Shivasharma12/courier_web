const axios = require('axios');

async function testAdminLogin() {
    console.log('🧪 Testing Admin Login...\n');

    try {
        // Test admin login
        const response = await axios.post('http://localhost:3001/api/auth/admin/login', {
            email: 'admin@courier.com',
            password: 'admin123'
        });

        console.log('✅ Admin login successful!\n');
        console.log('📧 User:', response.data.user.name);
        console.log('🔐 Role:', response.data.user.role);
        console.log('🎫 Token received:', response.data.access_token.substring(0, 20) + '...\n');

        // Test getting user stats
        const statsResponse = await axios.get('http://localhost:3001/api/users/stats', {
            headers: {
                'Authorization': `Bearer ${response.data.access_token}`
            }
        });

        console.log('📊 User Statistics:');
        console.log('   Total Users:', statsResponse.data.total);
        console.log('   By Role:');
        console.log('     - Admin:', statsResponse.data.byRole.admin);
        console.log('     - Customer:', statsResponse.data.byRole.customer);
        console.log('     - Delivery Partner:', statsResponse.data.byRole.delivery_partner);
        console.log('     - Hub Manager:', statsResponse.data.byRole.hub_manager);
        console.log('     - Traveler:', statsResponse.data.byRole.traveler);
        console.log('\n✅ All tests passed!');
        console.log('\n🌐 You can now login at: http://localhost:3003/admin-login');
        console.log('   Email: admin@courier.com');
        console.log('   Password: admin123\n');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);

        if (error.response?.status === 401) {
            console.error('\n⚠️  Authentication failed. Please check:');
            console.error('   1. The admin user exists in the database');
            console.error('   2. The password is correct');
            console.error('   3. Run: node setup-database.js to create/check admin user\n');
        }
    }
}

testAdminLogin();
