const API_URL = 'https://courier-web.onrender.com/api';

async function seed() {
    console.log('\n🌱 SEEDING PRODUCTION DATABASE...');
    console.log(`Target: ${API_URL}\n`);

    try {
        // 1. Create Admin User
        console.log('1. Creating Admin User...');
        const adminData = {
            name: 'System Admin',
            email: 'admin@courier.com',
            password: 'AdminPassword123!',
            phone: '1234567890',
            role: 'admin'
        };

        let adminToken;

        try {
            // Try to register
            const regResponse = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adminData)
            });

            if (regResponse.status === 201) {
                console.log('   ✅ Admin created successfully!');
            } else if (regResponse.status === 409) {
                console.log('   ℹ️ Admin already exists, skipping creation...');
            } else {
                const err = await regResponse.json();
                throw new Error(`Registration failed: ${err.message || regResponse.statusText}`);
            }

            // Login to get token
            console.log('   Logging in to get access token...');
            const loginResponse = await fetch(`${API_URL}/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: adminData.email,
                    password: adminData.password
                })
            });

            if (!loginResponse.ok) {
                const err = await loginResponse.json();
                throw new Error(`Login failed: ${err.message || loginResponse.statusText}`);
            }

            const loginData = await loginResponse.json();
            adminToken = loginData.accessToken;
            console.log('   ✅ Got Admin Token');

        } catch (e) {
            throw new Error(`Auth step failed: ${e.message}`);
        }

        // 2. Seed Transport Modes
        console.log('\n2. Seeding Transport Modes...');
        const seedResponse = await fetch(`${API_URL}/transport-modes/seed`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (seedResponse.ok) {
            const seedData = await seedResponse.json();
            console.log(`   ✅ ${seedData.message || 'Transport modes seeded'}`);
        } else {
            console.log(`   ℹ️  Transport modes might already exist or failed: ${seedResponse.status}`);
        }

        console.log('\n✨ SEEDING COMPLETE! ✨');
        console.log('------------------------------------------------');
        console.log('Admin Login Credentials:');
        console.log('Email:    admin@courier.com');
        console.log('Password: AdminPassword123!');
        console.log('------------------------------------------------');
        console.log('You can now login at: https://courier-web.onrender.com/admin-login');

    } catch (error) {
        console.error('\n❌ SEEDING FAILED:', error.message);
        process.exit(1);
    }
}

seed();
