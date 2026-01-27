const { Client } = require('pg');

async function createDb() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        password: 'Shiva@123', // User might need to change this if it's different
        port: 5432,
    });

    try {
        await client.connect();
        // Check if db exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname='courier_db'");
        if (res.rowCount === 0) {
            await client.query("CREATE DATABASE courier_db");
            console.log("DATABASE_CREATED");
        } else {
            console.log("DATABASE_ALREADY_EXISTS");
        }
        await client.end();
    } catch (err) {
        console.log("ERROR: " + err.message);
    }
}

createDb();
