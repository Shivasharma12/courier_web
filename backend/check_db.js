const { Client } = require('pg');

async function checkDb() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        password: 'Shiva@123',
        port: 5432,
    });

    try {
        await client.connect();
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname='courier_db'");
        if (res.rowCount === 0) {
            console.log("DATABASE_MISSING");
        } else {
            console.log("DATABASE_EXISTS");
        }
        await client.end();
    } catch (err) {
        console.log("CONNECTION_ERROR: " + err.message);
    }
}

checkDb();
