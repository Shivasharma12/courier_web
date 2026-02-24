const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env' });

async function checkDb() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'Shiva@123',
        database: process.env.DB_DATABASE || 'courier_db',
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');
        const res = await client.query('SELECT current_database(), current_user');
        console.log('Database Info:', res.rows[0]);

        const tableRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', tableRes.rows.map(r => r.table_name));

        if (tableRes.rows.some(r => r.table_name === 'users')) {
            const userRes = await client.query('SELECT count(*) FROM users');
            console.log('User count:', userRes.rows[0].count);
        } else {
            console.log('❌ "users" table not found');
        }

    } catch (err) {
        console.error('❌ Database connection error:', err.message);
    } finally {
        await client.end();
    }
}

checkDb();
