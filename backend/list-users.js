
const { DataSource } = require('typeorm');
const path = require('path');

async function listUsers() {
    const dataSource = new DataSource({
        type: 'sqlite',
        database: 'database.sqlite', // Assuming sqlite based on typical project profile
        synchronize: false,
        entities: [],
    });

    try {
        await dataSource.initialize();
        const users = await dataSource.query('SELECT id, email, role FROM users LIMIT 10');
        console.log(JSON.stringify(users, null, 2));
        await dataSource.destroy();
    } catch (err) {
        console.error('Error connecting to DB:', err.message);
    }
}

listUsers();
