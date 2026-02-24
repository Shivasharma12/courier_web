async function testLogin() {
    const url = 'http://localhost:3001/api/auth/login';
    const credentials = {
        email: 'admin@courier.com',
        password: 'AdminPassword123!'
    };

    console.log(`Testing login at ${url}...`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Login successful!');
            console.log('User:', data.user.email);
            console.log('Roles:', data.user.roles);
        } else {
            const err = await response.json();
            console.log(`❌ Login failed (${response.status}):`, err.message);
        }
    } catch (e) {
        console.error('❌ Request error:', e.message);
        console.log('Note: Ensure the backend is running (npm run dev)');
    }
}

testLogin();
