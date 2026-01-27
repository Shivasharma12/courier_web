const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const API_URL = 'http://localhost:3001/api';

async function createAdminUser() {
    console.log('\n=== Create Admin User ===\n');

    const adminData = {
        name: await question('Enter admin name: '),
        email: await question('Enter admin email: '),
        password: await question('Enter admin password: '),
        phone: await question('Enter admin phone: '),
        role: 'admin'
    };

    try {
        const response = await axios.post(`${API_URL}/auth/register`, adminData);
        console.log('\n✅ Admin user created successfully!');
        console.log('User ID:', response.data.id);
        console.log('Email:', response.data.email);
        console.log('Role:', response.data.role);
        console.log('\nYou can now login at: http://localhost:3003/admin-login');
    } catch (error) {
        console.error('\n❌ Error creating admin user:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message || error.response.data);
        } else {
            console.error(error.message);
        }
    }

    rl.close();
}

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

createAdminUser();
